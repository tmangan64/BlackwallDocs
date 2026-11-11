# Drives

## Cynosure

The Beelink ME Pro N150 has 3x M.2 NVMe slots and 2x 3.5" SATA bays.

| Slot   | `v1` (now)              | `v2` (target)                  |
| ------ | ----------------------- | ------------------------------ |
| NVMe 1 | 1 TB, ext4, OS          | Unchanged                      |
| NVMe 2 | Empty                   | Empty                          |
| NVMe 3 | Empty                   | Empty                          |
| SATA 1 | 1 TB, ext4, `/media`    | 1 TB, ZFS mirror member        |
| SATA 2 | Empty                   | 1 TB, ZFS mirror member        |

### OS drive

One NVMe, no redundancy, ext4. This is deliberate rather than an omission: everything on
it is reconstructed by a NixOS rebuild, so mirroring it would buy uptime, not durability,
and the machine is not carrying a workload where a few hours of downtime costs anything.
The only files on the root disk that cannot be rebuilt are `/etc/ssh/ssh_host_ed25519_key`
— which is what `sops` decrypts with, so losing it means re-encrypting every secret to a
new host key — and any service state not yet moved onto the pool.

The two spare NVMe slots stay empty in `v2`. A mirrored NVMe pool for appdata is the
obvious future use if Postgres or Kanidm ever feel slow on spinning rust, but at a few
hundred megabytes each they will not.

### Pool drives

The second SATA bay takes an identical 1 TB drive already on hand, which has to be emptied
before it can be installed. Two matched drives, one mirror vdev, 1 TB usable, surviving one
failure.

1 TB usable is tight for a media library, and that is accepted: Cynosure's pool is sized
for the control and monitoring workload plus temporary custody of media until Izanagi is
commissioned. Larger drives are a straight swap when they are worth buying — replace one
member, let it resilver, replace the other, then `zpool online -e` to claim the new
capacity.

## Izanagi

6 identical drives of ≥4 TB in one `raidz2` vdev, giving roughly 16 TB usable at 4 TB each
and surviving any two failures. 4 TB rather than larger is a safety decision as much as a
cost one — smaller drives resilver faster, which shortens the window in which a second
failure takes the pool with it.

Drives for this are bought together, so that the vdev is genuinely matched. A vdev's
capacity is capped by its smallest member, so a mismatched set wastes whatever the
difference is.

## Salvaged drives

Drives pulled from old machines and USB externals are useful, but not in the main pool. A
vdev is capped by its smallest member and the pool dies with any one vdev, so an old disk
would hand its failure rate to irreplaceable data. Run `smartctl -a` on each first; any
reallocated or pending sectors means scratch duty only.

Three jobs they are suited to:

| Use                                 | Why it fits                                                   |
| ----------------------------------- | ------------------------------------------------------------- |
| `zfs send` target                   | The missing second leg. Does not need to be fast or reliable, only separate |
| Disposable pool for downloads       | Transient data that can be re-acquired; failure costs nothing |
| Cold offline copies on USB external | Unplugged media is immune to anything happening on the host   |
