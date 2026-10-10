# NixOS

Each node in the network is running NixOS to allow for easier control, admin and deployment over systems and services.

```nix
├── flake.lock
├── flake.nix
├── hosts
│   └── blackwall
│       ├── default.nix
│       └── hardware.nix
├── modules
│   ├── core
│   │   ├── secrets.nix
│   │   └── storage.nix
│   ├── development
│   │   ├── code-server.nix
│   │   ├── forgejo.nix
│   │   └── mdbook.nix
│   ├── gaming
│   │   ├── minecraft.nix
│   │   └── playit.nix
│   ├── networking
│   │   ├── caddy-tailscale.nix
│   │   └── tailscale.nix
│   └── service
│       ├── arr.nix
│       ├── books.nix
│       ├── glance.nix
│       ├── homepage.nix
│       ├── navidrome.nix
│       ├── vaultwarden.nix
│       └── vikunja.nix
├── README.md
└── secrets
    └── secrets.yaml
```