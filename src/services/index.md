# Services

### Documents

There are many documents in life so document management software is required. This must either be easily interfaced with or connected to the chosen email client for usability. 
Documents also require signing so will need document signing software. Should likely purchase digital scanner and begin keeping receipts etc for later categorising. 
Adjacent to this is finance where 'ActualBudget' can supposedly connect to Monzo and receive transaction data.

Furthermore, will need to develop infrastructure for the kobo reader caduceus project. This includes some way to obtain comics, manga and books and send them to a physical kobo reader.
Similar to this is 'hammer.ink' which works for literature writing.

### Documentation

The Blackwall is documented via mdBook. This was briefly moved to Docusaurus before being switched back for ease of development.

### Tools

I might need a virtual browser at some point so neko could be worth installing. I also wish to eventually expose services from beyond the tailnet so security tools like BunkerWeb could help 
harden any exposed software. SonarQube could also be helpful for improving code quality. 'IT Tools' and SnapOtter could also be useful as well as Uptime Kuma if not already mentioned. 

### Arr* Suite

Here are some Jellyfin-related software to add to the /arr stack:
- Jellystat - statistics
- Jellyfin rewind - music stats
- Lidarr - music
- Bazarr - subtitles
- Watcharr - watchlist

### Nextsuite

For Nextcloud-adjacent apps, there's:
- Talk
- News
- Office
- Tables

***

# Non-server

This is not for server-based services accessed via a browser but instead for actual software to be run on the client device (elysia, canto etc)
It should be noted there is a commitment to adwaita gnome.

### Gnome Extensions:
- Dash to dock
- Blur my shell
- Vitals
- App menu maybe
- GSConnect
- OpenWeather
- Clipboard Indicator
- Just Perfection
- Removable Drive menu

### Shell:
Chosen shell is fish and chosen terminal is kitty
- cbonsai
- Aliases
- arttime
- broot
- 

***

# Software Register

### Cynosure

| Software               | Purpose                                                             |
|------------------------|---------------------------------------------------------------------|
| Prometheus             | Metrics scraping, storage and PromQL query engine                   |
| Grafana                | Dashboards and unified alerting                                     |
| Uptime Kuma            | Service, endpoint and TLS certificate availability checks           |
| CrowdSec               | Host intrusion detection with shared threat intelligence            |
| Authentik              | Single sign-on and identity provider                                |
| Caddy                  | Reverse proxy, TLS termination, single ingress point                |
| Tailscale or Headscale | Remote access without exposed ports                                 |
| sops-nix               | Encrypted secrets management                                        |
| Colmena                | Fleet configuration and deployment. Colmena if blackwall runs NixOS |
| Vaultwarden            | Self-hosted password manager and secret vault                       |
| AdGuard Home           | Local DNS filtering and adblocking                                  |

### Izanagi

| Software | Purpose |
|----------|---------|
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



## Future LLM Host

| Software | Purpose |
|----------|---------|
| OpenClaw (maybe) | Local or experimental AI agent platform for autonomous tasks and tooling |
| n8n | Workflow automation and AI task orchestration |
| OpenWebUI | Web interface for local LLM chat and model management |
