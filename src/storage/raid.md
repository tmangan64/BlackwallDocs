# RAID1

ZFS does not use RAID levels as such. A pool is built from one or more *vdevs*, and the
vdev type is what determines redundancy. The pool stripes across its vdevs with no
redundancy between them, which produces the single most important rule here: **the pool
dies with any one vdev.** Redundancy is a property of each vdev, never of the pool.

## Vdev types in use

| Type      | Where      | Disks | Survives     | Usable            |
| --------- | ---------- | ----- | ------------ | ----------------- |
| `mirror`  | Cynosure   | 2     | 1 failure    | 1 disk            |
| `raidz2`  | Izanagi    | 6     | 2 failures   | ~4 disks (⅔ raw)  |

## Why a mirror on Cynosure

The choice is forced: the chassis has 2 SATA bays. RAIDZ needs at least 3 disks for single
parity, so a 2-disk mirror is the only redundant option available.

It is a good one regardless. A mirror resilvers by copying one disk to the other, which is
sequential, fast and puts no parity computation in the path. RAIDZ resilvers by
recalculating parity across every surviving member, which is slower and stresses all of
them at once — precisely when one has already failed.

The cost is capacity: a 2-disk mirror gives 50% usable, against 67% for a 6-disk `raidz2`.
At this scale that is the right trade.

## Why `raidz2` on Izanagi

With 6 bays, both `raidz1` and `raidz2` fit. `raidz2` wins because of resilver duration:
rebuilding a 4 TB member reads every other member in full, and for as long as that takes a
single-parity vdev has no redundancy left at all. A second failure — or one unreadable
sector on a surviving disk — loses the pool. Double parity means the rebuild is merely
degraded rather than fatal.

Logical separation comes from datasets, not from more pools. Splitting Izanagi into two
pools would pay for parity twice and double the number of things that can fail
independently.

## Expansion

Three paths, in rough order of preference:

1. **Replace members in place.** Swap one disk for a larger one, wait for the resilver,
   repeat. Once every member is larger, `zpool online -e` claims the new space. Works on
   both a mirror and a RAIDZ vdev, and is how Cynosure grows past 1 TB.
2. **Add a vdev.** Appending a second vdev to the pool stripes across both. Capacity is
   additive, but so is risk — the new vdev needs its own redundancy, because the pool
   still dies with any one vdev.
3. **RAIDZ expansion.** OpenZFS 2.3 and later can add a single disk to an existing RAIDZ
   vdev. Useful, but it does not rewrite existing data, so blocks written before the
   expansion keep their old parity ratio until they are rewritten.

Growing a mirror into a RAIDZ vdev is not possible. The vdev type is fixed at creation.

## Maintenance

| Task        | Mechanism                        | Why                                                          |
| ----------- | -------------------------------- | ------------------------------------------------------------ |
| Scrub       | `services.zfs.autoScrub`         | Reads every block and repairs checksum mismatches from the redundant copy. An unscrubbed pool hides rot until a resilver needs the bad block |
| TRIM        | `services.zfs.trim`              | SSD members only; harmless to leave enabled                  |
| Fault alert | `services.zfs.zed`               | Reacts to degraded or faulted vdevs                          |
| Snapshots   | `zfs-auto-snapshot` on appdata   | Protects against mistakes, which parity does not             |

ZED with no configured notification target is the default state, and a silent ZED is
indistinguishable from a healthy pool. Configure where its alerts go, then verify with
`zinject` that a simulated fault actually produces one.

A degraded mirror still serves every read and write without complaint. Nothing about day
to day use reveals that redundancy is gone, which is why the alerting matters more than
the parity does.
