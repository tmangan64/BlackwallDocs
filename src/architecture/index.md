# Architecture

This page details the architecture rules for the Blackwall server and all hosts involved.

## Rules

1. Every host will have a single NVMe drive reserved for the OS.
2. Every password, API key or secret is to be stored via sops-nix.
3. Endpoints are kept to the minimum and user access is only via a tailnet [^note].
4. All software is managed and configured decleratively via the NixOS Blackwall config.
5. Changing which host runs what should be decided by which modules it inherits.
6. Deny by default.
7. Every host will broadcast logs and metrics to the Cynosure host.

[^note]: A tailnet is a type of mesh VPN created by Tailscale or Headscale (the self-hosted Tailscale alternative).
