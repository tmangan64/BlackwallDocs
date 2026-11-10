# Notes

- [x] List all services from blackwall.cam software list
- [ ] List any maintenance routines
- [ ] Security hardening
- [ ] Decide font scheme for all systems

## Jellyfin worklist

- [ ] Re-configure with declarable accounts, settings etc
- [ ] Add more indexers
- [ ] Double check encoding is optimal
- [ ] Fonts
- [ ] F1/Sports streams? mybunny.tv?

## Glance

- [ ] RSS Feed
- [ ] DNS widget
- [ ] Hardware stat widget
- [ ] Todo widget

***

# Claude Q&A

1. For the storage, which RAID array are we using with ZFS and how many drives should I get? 
You can see I'll clearly want to logically separate my data and would like the ability to easily expand. Since I'm hosting passwords etc, I'll probably want at least single parity.

**A:** One pool, one `raidz2` vdev of 6 identical drives — survives any two failures, ~66% usable. Get the logical separation from datasets on that one pool, not from separate pools; two pools pays for parity twice. Expand later either one disk at a time (OpenZFS 2.3+) or by adding a second vdev. Note that parity isn't what protects Vaultwarden — that needs `zfs send` replication offsite, since RAID doesn't survive deletion or a bad rebuild.

2. For the #izanagi host, how do I pick parts and design that machine? Do I buy stuff while I'm travelling? I know it will have to be maximum 19" in a 18U cabinet.

**A:** Work backwards from bay count, since that's the spec you can't change cheaply: 8–12 bays puts you at 2U–4U, then HBA (IT mode, never hardware RAID) → PSU → ECC board/CPU. 19" is automatic from EIA-310; check *depth* instead, as enterprise chassis run 700–800 mm and many 18U cabinets are shallower. Pick the CPU for the ~30-service list and use QuickSync or a cheap Arc card for Jellyfin. While travelling, buy only small high-value parts (HBA, SAS cables, ECC RAM, NVMe) — chassis, PSU and drives aren't worth the weight, the customs or the dead warranty.

3. I will probably want an array of 6 identical 4TB drives. I will also want to be able to make the best usage out of random hard drives I've salvaged from other computers and external drives. How can I best utilise those drives?

**A:** 6×4 TB is fine — ~16 TB usable, and small drives resilver faster, which is a real safety gain. Keep the salvaged drives out of that pool: a vdev is capped by its smallest member, and the pool dies with any one vdev, so old disks would hand their failure rate to your irreplaceable data. Use them instead as a separate `zfs send` target (the missing offsite leg), a disposable pool for `/data/media/downloads`, and cold offline copies for the USB externals. Check `smartctl` first — any reallocated or pending sectors means scratch duty only.

4. I am going down a rabbit-hole relating to server chassis types such as tower, rack or blade and I'm a rather large fan of blade servers. How could this server plan (specifically the izanagi host) work with a blade server? What about a multi-node server like Dell PowerEdge FC630?

**A:** Blades can't be Izanagi: a blade is diskless by design (an FC630 gives you two 2.5" bays) because blade storage is assumed to sit on a fabric — so six 3.5" drives have nowhere to go, and the LUN you'd get instead is exactly the layer ZFS shouldn't sit on. FX2 + FD332 comes closest but is 2.5"-only, which kills the 4 TB plan. A c7000/M1000e also eats 10U of your 18U empty and draws more than one UK socket provides. Multi-node *is* a good fit for the compute tier though — a 2U four-node box is a natural home for Cynosure, Sapphire and Kabuki; Mikoshi still needs a conventional 4U for the GPU.

5. Are there any modular chassis that could work like this? A rack-style server is large, flat and wide and not practical for a home server.

**A:** This contradicts your Hosts page, which lists 18U and 19" as hard requirements — if the rack is out, update that table first. Best option is a tower/rack convertible 4U (Supermicro SC743/745): 8 hot-swap bays, full ATX, quiet, tower now and rackable later. Compact alternative is a NAS cube (Jonsbo N3, Fractal Node 304), but ITX means the HBA takes your only slot, so no transcode GPU. Mostly though, your modularity already lives at the host layer — Cynosure is a mini-PC — so one quiet drive box plus mini-PCs gives you what a modular chassis would.

6. My desktop computer uses a Coolermaster NR200P v3 with a 4070ti, 32GB of RAM and 2TB NVMe. What about a single server cabinet containing not only the full Blackwall network but also my desktop computer, then I situate the cabinet near my desk. Are there benefits to 