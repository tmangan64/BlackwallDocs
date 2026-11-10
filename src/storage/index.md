# Storage Structure

### Logical Segmentation

Content is data such as films or shows used by Jellyfin. Appdata is data such as watch history and user accounts. Neither of these data types are recoverable by a NixOS rebuild and thus must be protected in a way that OS data (reconstructable during NixOS rebuild) does not need to be.

The Blackwall network groups data by the stack. This means that anything Arr* suite related (Jellyfin, Sonarr, Jellyseerr) is grouped together. Should the stack be moved from one host to another, data such as movies *and\* user accounts would be migrated together.

### Directory Structure

```
tank/
  ├── local/            stays on Cynosure permanently
  │   ├── monitoring/   prometheus, grafana, uptime-kuma
  │   ├── net/          adguard, crowdsec, caddy state
  │   └── vault/        vaultwarden
  │
  └── portable/         moves to the enterprise box
      ├── arr/
      │   ├── appdata/  jellyfin, radarr, sonarr, prowlarr, transmission
      │   └── media/    library + downloads, ONE dataset (hardlinks)
      ├── cloud/
      │   ├── appdata/  nextcloud, its postgres
      │   └── media/    user files
      ├── git/
      │   └── appdata/  forgejo, code-server
      └── games/
          └── appdata/  minecraft
```

### Classification Rules

| Type      | Location                           | Examples                              |
| --------- | ---------------------------------- | --------------------------------------|
| Appdata   | `/data/appdata/<stack>/<service>/` | User accounts, watch history          |
| Media     | `/data/media/library/`             | Movies, TV shows                      |
| Transient | `/data/media/downloads/`           | In-progress torrents                  |
| OS        | `/`                                | Rebuildable that doesn't need backups |

### Storage Drives

Realistically these will be the cheapest to get these is while I'm travelling early 2027.