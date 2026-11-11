# Hosts

This page outlines the hosts within the Blackwall network. Each host serves a different purpose which allows for the most value to be extracted from a device.

A multi-host modular NixOS config can cordinate multiple completely separate machines, allowing for the best use of their hardware. This means a GPU-heavy device could host LLM software while an enterprise Proliant-style device could hold most the network's storage capacities and user services. Other future requirements might include a Home Assistant hub and a VM host for security experiments, all inter-connected via a Tailnet and coordinated via a NixOS config.

Names have already been reserved for hosts. Currently, the Beelink's hostname is `blackwall` as it follows the earlier mentioned original plan for the server. When there are finally multiple devices on the network, the device will be recommissioned as `cynosure`.

The rename therefore belongs to `v3`, alongside Izanagi — `v2` leaves the hostname alone. It is referred to as Cynosure throughout these pages regardless, since that is its role.

| Hostname | Purpose                       | Hardware             |
| -------- | ----------------------------- | -------------------- |
| cynosure | Control and monitoring node   | Beelink ME Pro N150  |
| izanagi  | Data fortress                 | Enterprise server    |
| mikoshi  | AI and automation node        | TBD (Likely £££ GPU) |
| sapphire | Reserved name                 | TBD                  |
| kabuki   | Reserved name                 | TBD                  |

## Blackwall v2 - Rework

`v2` of the project involves an overhaul of the current Cynosure host. The step-by-step
sequence, with prerequisites and verification for each stage, is in [Plan](../plan.md).

The Cynosure host will take use FOSS software such as Prometheus, Uptime Kuma and Grafana for  monitoring the overall status and health of systems and services. 

I've read about Colmena which supposedly lets you declare the state of multiple machines from a single config instead of having to remote into each node to rebuild. I'm not sure how it works yet but Cynosure is likely the device that would control the deployments of other nodes. It is adopted in `v2` while there is still only one host, so that `v3` adds a machine to a working pipeline rather than building both at once.

The following software has been designated as likely to benefit from running on this host.

| Software      | Purpose                                                   |
|---------------|-----------------------------------------------------------|
| Prometheus    | Metrics scraping, storage and PromQL query engine         |
| Grafana       | Dashboards and unified alerting                           |
| Uptime Kuma   | Service, endpoint and TLS certificate availability checks |
| CrowdSec      | Host intrusion detection with shared threat intelligence  |
| Kanidm        | Single sign-on and identity provider                      |
| oauth2-proxy  | Front-door gate for services with no OIDC support         |
| Caddy         | Reverse proxy, TLS termination, single ingress point      |
| Tailscale     | Remote access without exposed ports                       |
| sops-nix      | Encrypted secrets management                              |
| Colmena       | Fleet configuration and deployment                        |
| Vaultwarden   | Self-hosted password manager and secret vault             |
| AdGuard Home  | Local DNS filtering and adblocking                        |
| OpenZFS       | Mirrored pool, datasets, snapshots, compression           |

Kanidm rather than Authentik: it provisions persons, groups and OAuth2 clients
declaratively from the NixOS config, which is what the
[architecture rule](../architecture/index.md) requiring the config to be the source of
truth actually demands. Authentik's users and applications are configured through its
web UI, which is state no rebuild reconstructs.

## Blackwall v3 - Izanagi

With the arrival of a second host, we can begin to split software between control and services. This release will be immense in terms of cost, size, time and patience. This will be the mass storage and service node and will likely be the largest/heaviest node in the system. Actual specific makes/models shouldn't be selected until I have the funds to puchase all together.

In order to process so much information at once and store it all safely, I'll first likely need an server rack with enough space for all hosts. 19" servers are commong so 18U should be sufficient.

This server will host critical irreplacable data such as passwords and personal information. The goal is to reliably maintain important data in an economy where storage drives are increasingly expensive.

The intended layout is one pool with a single `raidz2` vdev of 6 identical drives: any two can fail, and roughly two thirds of raw capacity is usable. Double parity rather than single because resilvering a large drive takes long enough that a second failure during the rebuild is a real risk, not a theoretical one. Logical separation comes from datasets on that one pool, not from multiple pools — a second pool pays for parity twice. Note that `raidz1` is single-parity striping, not "mirror plus parity"; mirrors and RAIDZ are different vdev types, covered in [RAID1](../storage/raid.md).

| Hardware          | Requirements                 |
|-------------------|------------------------------|
| Chassis           | 18 Rack Units (EIA-310)      |
| Server            | 19 Inches                    |
| Hard Drives       | ≥4 TB                        |

The following software has been designated as likely to benefit from running on this host.

| Software | Purpose |
| ---------- | --------- |
| OpenZFS | Pool, mirror vdevs, checksums, snapshots, compression |
| ZED (ZFS Event Daemon) | Fault reaction and alerting on degraded or faulted vdevs |
| pad.ws | Lightweight personal wiki and note-taking workspace |
| Nextcloud / Ente | Privacy-focused file sync, photos, and shared document storage |
| StirlingPDF | PDF manipulation and document conversion tools |
| LocalSend | Local file sharing between devices on the same network |
| Syncthing | Continuous file sync between trusted devices |
| code-server | Browser-based VS Code environment for remote development |
| Forgejo | Self-hosted Git hosting and code collaboration |
| mdBook | Local documentation site generation and publishing |
| Actual Budget | Personal finance tracking and budgeting |
| Memos | Lightweight notes and bookmarks with Markdown support |
| AppWrite | Backend-as-a-service for user auth, database, and storage apps |
| Vikunja | Task and project management with self-hosted Kanban and todo workflows |
| cobalt | Media download and archiving utility |
| IT Tools | Collection of useful system administration and productivity utilities |
| Arr* suite | Media automation stack for downloading, organizing, and managing content |
| Glance | Dashboard for quick status overview and home lab shortcuts |
| ArchiveBox | Web page archiving and offline browsing |
| MeTube | Local YouTube download and media archiving tool |
| Home Assistant | Home automation and smart-device control |
| Ganymede8 | Twitch VOD Archiver |
| AFFiNE | Collaberative documents |
| DocuSeal | Document signing |
| Floppy | Media tracking |

## Blackwall v4 - Unnamed AI node

This is for a hypothetical machine running LLM technology.

The following software has been designated as likely to benefit from running on this host.

| Software | Purpose |
|----------|---------|
| OpenClaw (maybe) | Local or experimental AI agent platform for autonomous tasks and tooling |
| n8n | Workflow automation and AI task orchestration |
| OpenWebUI | Web interface for local LLM chat and model management |
