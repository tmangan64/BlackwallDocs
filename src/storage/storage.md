# Storage Structure

## Appdata vs Content

Content is data such as films or shows used by Jellyfin. Appdata is data such as watch history and user accounts. Neither of these data types are recoverable by a NixOS rebuild and thus must be protected in a way that OS data does not need to be.

## Stacks

The Blackwall network groups data by the stack. This means that anything Arr* suite related (Jellyfin, Sonarr, Jellyseerr) is grouped together. Should the stack be moved from one host to another, data such as movies *and\* user accounts would be migrated together.

## Directory Structure

```
/data/
├── appdata/                    # ZFS dataset: frequent snapshots
│   ├── arr/                    # Media management stack
│   │   ├── jellyfin/
│   │   ├── radarr/
│   │   ├── sonarr/
│   │   ├── prowlarr/
│   │   └── transmission/
│   ├── git/                    # Development stack
│   │   ├── forgejo/
│   │   └── code-server/
│   └── games/
│       └── minecraft/
│
└── media/                      # ZFS dataset: infrequent snapshots
    ├── library/
    │   ├── movies/
    │   ├── tv/
    │   ├── music/
    │   └── books/
    └── downloads/
        ├── complete/
        ├── incomplete/
        └── torrents/
```

## Classification Rules

| Type      | Location                           | Examples                                                   |
| --------- | ---------------------------------- | ---------------------------------------------------------- |
| Appdata   | `/data/appdata/<stack>/<service>/` | SQLite DBs, user accounts, watch history, indexer settings |
| Media     | `/data/media/library/`             | Movies, TV shows, music files                              |
| Transient | `/data/media/downloads/`           | In-progress downloads, seeding torrents                    |
