# Storage Structure

### Logical Segmentation

Content is data such as films or shows used by Jellyfin. Appdata is data such as watch history and user accounts. Neither of these data types are recoverable by a NixOS rebuild and thus must be protected in a way that OS data (reconstructable during NixOS rebuild) does not need to be.

The Blackwall network groups data by the stack. This means that anything Arr* suite related (Jellyfin, Sonarr, Jellyseerr) is grouped together. Should the stack be moved from one host to another, data such as movies *and* user accounts would be migrated together — one `zfs send` of one subtree.

### Directory Structure

```
tank/
  ├── local/                        stays on Cynosure permanently
  │   ├── identity/appdata/         kanidm, oauth2-proxy
  │   ├── vault/appdata/            vaultwarden
  │   ├── net/appdata/              adguard, crowdsec, caddy state
  │   └── monitoring/appdata/       prometheus, grafana, uptime-kuma
  │
  └── portable/                     moves to the enterprise box
      ├── arr/
      │   ├── appdata/              jellyfin, radarr, sonarr, prowlarr,
      │   │                         jellyseerr, transmission
      │   └── media                 library + downloads, ONE dataset (hardlinks)
      ├── cloud/
      │   ├── appdata/              nextcloud, its postgres
      │   └── media                 user files
      ├── books/
      │   ├── appdata/              calibre-web-automated, shelfmark
      │   └── media                 calibre library
      ├── music/
      │   ├── appdata/              navidrome
      │   └── media                 music library
      ├── git/appdata/              forgejo, code-server
      └── games/appdata/            minecraft
```

`books` and `music` are their own stacks rather than living under `arr`. Navidrome's library sits inside the Arr* media tree today, which couples two stacks that have no reason to migrate together — separating them is the entire point of grouping by stack.

The library and the downloads deliberately share one dataset. Hardlinks cannot cross a dataset boundary, so splitting them would turn every import into a full copy and double the space every file occupies. The cost is that snapshots of the library also capture download churn.

### Classification Rules

| Type      | Dataset                             | Mounted at                    | Examples                               |
| --------- | ----------------------------------- | ----------------------------- | -------------------------------------- |
| Appdata   | `tank/<tier>/<stack>/appdata/<svc>` | `/var/lib/<svc>`              | User accounts, watch history           |
| Media     | `tank/portable/<stack>/media`       | `/data/media/<stack>/`        | Movies, TV shows, books, music         |
| Transient | `tank/portable/arr/media`           | `/data/media/arr/downloads/`  | In-progress torrents                   |
| OS        | —                                   | `/`                           | Rebuildable, doesn't need backups      |

Appdata is **not** placed under `/data`. It is mounted at whatever path the service already writes to, because that is the only approach that leaves systemd hardening intact — a unit with `ProtectSystem=strict` and `ReadWritePaths=/var/lib/foo` is denied when pointed somewhere else. `DynamicUser=true` units keep their real state in `/var/lib/private/<service>`, so that is where their dataset mounts. See the Mountpoints section of [Architecture](../architecture/index.md).

### Redundancy is not backup

The mirror survives a dead disk. It does not survive a mistaken `rm`, a bad restore, a corrupted application database, or a pool that will not import. Nightly dumps written to the same pool as their source — which is what `/media/backups/vaultwarden` and `/media/backups/navidrome` currently are — protect against none of those either.

The second leg is a `zfs send` to a target outside the pool. The salvaged drives and USB externals are the right home for it: check them with `smartctl` first and treat any reallocated or pending sectors as grounds for scratch duty only. `tank/local/vault` and `tank/local/identity` are the two datasets where this matters most, because neither Vaultwarden nor Kanidm can be reconstructed from anything else.

### Storage Drives

Current and planned drives are listed in [Drives](./drives.md). Vdev choice and the expansion path are in [RAID1](./raid.md).
