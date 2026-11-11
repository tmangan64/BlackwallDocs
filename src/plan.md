# Plan

This page is the implementation plan for taking the Blackwall from `v1` to `v2`.

`v1` is what is deployed today: a single host, `blackwall`, running roughly twenty
services off one unmirrored NVMe and one unmirrored SATA HDD, with Tailscale as the
only access control. It works, but almost nothing in [Architecture](./architecture/index.md)
is actually true of it yet.

`v2` closes that gap. It is deliberately **not** the full target architecture — the
custom domain, public certificates and the VPS proxy are all held back to `v3`, where
they land alongside Izanagi. What `v2` delivers is the part that is expensive to retrofit:
redundant storage with a real dataset layout, a closed perimeter, declarative identity
with hardware keys, and monitoring that proves the rest of it works.

## Scope

| Decision | `v2` resolution |
|----------|-----------------|
| Identity provider | Kanidm. Declaratively provisioned, native passkey support |
| Service naming | Unchanged — `<service>.tail222568.ts.net` via MagicDNS and `caddy-tailscale` |
| Certificates | Unchanged — issued by `caddy-tailscale` from the tailnet |
| Hostname | Unchanged — stays `blackwall`; recommissioned as `cynosure` in `v3` |
| Perimeter | Every service bound to loopback, every `openFirewall` removed |
| Storage | One `tank` pool, two-disk mirror, `mountpoint=legacy`, per-service datasets |
| Deployment | Colmena, adopted while there is still only one host to break |
| Users | `blackwall.identity.people` as the single source of truth |

Explicitly deferred to `v3`:

- The flat `<service>.blackwall.cam` namespace, and the ACME DNS-01 wildcard
  certificate it requires
- AdGuard Home as an authoritative internal zone (it still appears in `v2`, but as a
  DNS *filter* only)
- The rented VPS second proxy
- The `cynosure` rename

### The cost of deferring the domain

Keeping MagicDNS is the right call for `v2` — it removes a zone delegation, a custom
Caddy build with a DNS provider plugin, a wildcard certificate and a split-horizon
internal zone from the critical path, none of which make the data any safer. It is not
free, though, and the bill arrives in `v3`:

- **WebAuthn credentials are bound to the hostname that created them.** Every passkey
  enrolled in `v2` against a `*.ts.net` hostname is void the moment that service moves
  to `blackwall.cam`. Kanidm and Nextcloud both need re-enrolment, and Vaultwarden's
  TOTP entries keep working but show a stale issuer. This is recoverable — Kanidm
  issues reset tokens — but it is a known, scheduled piece of rework, not a surprise.
- **Tailscale becomes load-bearing.** With no domain, no public certificates and no
  VPS, Tailscale is the *only* naming, certificate and transport layer in the system.
  The hardening in [Phase 9](#phase-9--operational-posture) is therefore not
  housekeeping; it is the perimeter. In particular `modules/networking/tailscale.nix`
  sets `--ssh`, which means tailnet ACLs — not `authorized_keys` — decide who gets a
  shell, bypassing the hardware-key policy entirely.
- **Kanidm does not fit the `caddy-tailscale` pattern.** It refuses to serve plain
  HTTP, so unlike every other service it cannot simply listen on loopback and be
  proxied. See [Phase 4](#phase-4--identity) for the two ways out.

## Phase order

The order is forced by one rule: **nothing creates state until its final home exists,
and nothing enrols a credential until its hostname is final.** That puts storage ahead
of identity, because Kanidm's database — the one thing the
[durability rule](./architecture/index.md) says cannot be lost — should be *born* on a
mirrored dataset rather than moved onto one afterwards.

| # | Phase | Depends on |
|---|-------|------------|
| 0 | [Recovery inventory](#phase-0--recovery-inventory) | — |
| 1 | [Repository refactor](#phase-1--repository-refactor) | — |
| 2 | [Perimeter and secrets](#phase-2--perimeter-and-secrets) | 1 |
| 3 | [Storage](#phase-3--storage) | 0 |
| 4 | [Identity](#phase-4--identity) | 3 |
| 5 | [DNS filtering](#phase-5--dns-filtering) | 3 |
| 6 | [Monitoring and detection](#phase-6--monitoring-and-detection) | 3, 4 |
| 7 | [Documentation self-hosting](#phase-7--documentation-self-hosting) | 2 |
| 8 | [Colmena](#phase-8--colmena) | 1 |
| 9 | [Operational posture](#phase-9--operational-posture) | 6 |
| 10 | [Branding](#phase-10--branding) | — |

---

## Phase 0 — Recovery inventory

**Goal:** know what is on the machine and how to get it back, before anything
destructive happens in Phase 3.

Nothing here changes the running system. It exists because Phase 3 wipes a disk, and
because the architecture page asserts *"ensure every service has a recovery path and
method"* without that path having been written down for a single service.

### Steps

1. Enumerate the real state directory of every enabled service. Do not assume
   `/var/lib/<name>`:

   ```bash
   systemctl show -p StateDirectory -p RootDirectory -p DynamicUser <unit>
   ```

   `DynamicUser=true` units keep their state in `/var/lib/private/<service>` with
   `/var/lib/<service>` as a symlink into it, which changes where a dataset has to be
   mounted in Phase 3.
2. For each service, record: state path, size, whether a NixOS rebuild reconstructs it,
   the restore procedure, and the credential needed to perform the restore.
3. Take a full off-machine copy of everything a rebuild cannot reconstruct. At minimum:
   Vaultwarden's SQLite database and `rsa_key*`, Nextcloud's data directory and its
   Postgres dump, Forgejo's repositories and database, the arr suite's configuration
   databases, and `/etc/ssh/ssh_host_ed25519_key`.
4. Verify the age private key behind `admin_mizutani` in `.sops.yaml` exists somewhere
   other than this machine. If `blackwall` dies and that key is only on `blackwall`,
   every secret in the repository is unrecoverable.
5. Publish the result as a recovery table in [Services](./services/index.md).

### Verification

- A restore of one non-trivial service — Vaultwarden is the right choice — rehearsed
  from the off-machine copy onto a throwaway target.
- `ssh_host_ed25519_key` confirmed present in the off-machine copy, because without it
  `sops` cannot decrypt on a reinstalled host.

### Notes

The `/media/backups/{vaultwarden,navidrome}` directories are **not** backups for this
purpose. They are nightly dumps written to the same physical disk as plenty of the data
they protect, and after Phase 3 they will sit on the same pool as their own sources.
They survive an accidental delete; they do not survive the disk failure that parity
exists for. Phase 3 addresses this properly.

> A mermaid diagram of access and recovery paths was requested in the to-do list.
> `book.toml` declares no preprocessors, so a ` ```mermaid ` fence renders as a code
> block — adding `mdbook-mermaid` to `devenv.nix` and `book.toml` is a prerequisite.

---

## Phase 1 — Repository refactor

**Goal:** make the configuration tree discoverable and multi-host shaped, with a
provably identical system closure.

Every later phase lands on this, so it goes first. It is also the only phase that can be
verified absolutely: if the closure changes, the refactor is wrong.

### Steps

1. Replace the hand-written import list in `hosts/blackwall/default.nix` with automatic
   discovery of `modules/**/*.nix`. Modules are already written as
   `options`/`config = mkIf cfg.enable` pairs, so importing all of them is inert —
   nothing activates without its `enable` flag. This is what makes the closure-identity
   check below possible.
2. Restructure `hosts/` so a second host can be added without touching the first, and
   split `hosts/blackwall/default.nix` — it currently mixes hardware facts, host policy
   and per-service tuning in one file.
3. Move the per-service settings that are currently inline in the host file
   (`blackwall.minecraft`, `blackwall.nextcloud`, the `caddy-tailscale` service list)
   into their owning modules or into a clearly-named host policy file.
4. Introduce one option for the tailnet domain — `blackwall.net.tailnetDomain`,
   defaulting to `tail222568.ts.net` — and use it in place of the hardcoded strings in
   `vikunja.nix`, `vaultwarden.nix`, `nextcloud.nix` and the fourteen URLs in
   `glance.nix`. Same resolved hostnames today; a one-line change in `v3` instead of a
   hunt through five modules.
5. Delete `modules/service/homepage.nix`. It is a complete, themed Homepage dashboard
   configuration that no host imports — `glance.nix` replaced it. Under automatic
   discovery a dead module is worse than clutter, because it is now evaluated.
6. Add `flake.nix` plumbing for multiple hosts, with `nixosConfigurations` still
   exposing `blackwall`.

### Verification

```bash
nixos-rebuild build --flake .#blackwall          # before, keep ./result
nixos-rebuild build --flake .#blackwall          # after
nix store diff-closures ./result-before ./result-after
```

The diff must be empty. A non-empty diff after step 5 is expected only if
`homepage-dashboard` was somehow reachable; confirm that is the cause before accepting
it.

### Notes

Deleting the Homepage module is a judgement call — it holds the only written-down
version of the Blackwall colour scheme and IBM Plex typography. Lift that CSS into
[Phase 10](#phase-10--branding) before removing the file.

---

## Phase 2 — Perimeter and secrets

**Goal:** make the stated perimeter rule true, and stop generated credentials living
outside sops.

The architecture page says *"nothing is exposed to the Internet, no service opens a
port, every service binds loopback"*. The configuration contradicts this in six places.

### Current exposure

| Where | What | Reachable from |
|-------|------|----------------|
| `arr.nix` | `openFirewall = true` on jellyfin, radarr, sonarr, prowlarr, jellyseerr | The whole LAN |
| `arr.nix` | FlareSolverr publishes `8191:8191` with no bind address | The whole LAN |
| `arr.nix` | transmission RPC on `0.0.0.0` with `rpc-whitelist-enabled = false` and no password | Loopback and `podman0` |
| `glance.nix` | `openFirewall = true` | The whole LAN |
| `tailscale.nix` | `--ssh` | Anyone a tailnet ACL permits, without a key |
| `playit.nix` | Minecraft tunnel | The public Internet |

transmission is the sharpest of these. The firewall does not open `9091` — upstream
makes `openFirewall` an alias for `openPeerPorts`, as `books.nix` documents — so it is
not LAN-reachable. But `caddy-tailscale` publishes it as a tailnet node with no
authentication in front, so anything on the tailnet has unauthenticated control of the
download client.

### Steps

1. Remove every `openFirewall = true`. Bind each service explicitly to `127.0.0.1`
   where its module allows it; `caddy-tailscale` already reaches all of them over
   loopback, so no proxy configuration changes.
2. Bind FlareSolverr's published port to `127.0.0.1:8191:8191`.
3. Fix transmission: set `rpc-bind-address = "127.0.0.1"`, enable
   `rpc-whitelist-enabled`, and set an RPC credential from sops.
4. **Re-home Shelfmark's path to transmission first.** `books.nix` opens transmission's
   RPC port on the `podman0` interface because the container needs the RPC API. Binding
   transmission to loopback breaks that. Either give the Shelfmark container host
   networking, or bind transmission to the `podman0` gateway address as well as
   loopback. Do this in the same commit as step 3 or the books stack silently stops
   importing.
5. Audit the remaining firewall surface. `6622` (SSH) and `2222` (Forgejo SSH) are the
   only intended LAN listeners; Forgejo's SSH is reachable over the tailnet and does not
   need a LAN hole.
6. Decide on Tailscale SSH. Leaving `--ssh` enabled means tailnet ACLs are the real
   access control for shell access, which is defensible — but it has to be an explicit
   choice written into the architecture page, with ACLs to match, not a flag nobody
   revisited. The alternative is dropping it and relying on `6622` with hardware-backed
   keys from [Phase 4](#phase-4--identity).
7. Secrets hygiene: move the arr suite's generated API keys into sops and seed them
   declaratively, rather than leaving them in each service's config database. Phase 6
   needs them for exporters and Glance widgets, so this is a prerequisite rather than
   tidying.
8. Add a `vaultwarden_admin_token` secret and set `allowSignups = false`. Registration
   is currently open on both Vaultwarden and Vikunja; the tailnet is a small blast
   radius but not an empty one.

### Verification

```bash
ss -ltnp                                  # on the host: only 6622, 2222, loopback
nmap -p- <lan-ip>                         # from another LAN machine: 6622, 2222 only
```

- Shelfmark completes a download into CWA's ingest folder and CWA imports it.
- Every service still loads through its tailnet URL.

### Notes

Removing `openFirewall` from Jellyfin means LAN clients that cannot join the tailnet —
televisions, mostly — lose direct access. That is the accepted consequence of the
perimeter rule; the exception list below is the place to revisit it if a specific device
forces the issue.

Minecraft and playit.gg stay, as the one sanctioned inbound path from the public
Internet. That belongs in the Exceptions section of
[Architecture](./architecture/index.md) as a deliberate carve-out, isolated from
everything else, rather than as an undocumented hole.

---

## Phase 3 — Storage

**Goal:** one ZFS pool, mirrored, with a dataset layout that survives the migration of
whole stacks to Izanagi.

This is the phase that cannot be retrofitted cheaply, and the reason identity and
monitoring wait behind it.

### Hardware

| Slot | Today | After `v2` |
|------|-------|------------|
| NVMe ×3 | 1 × 1 TB, ext4, OS | Unchanged — one disk, ext4, rebuildable |
| SATA ×2 | 1 × 1 TB, ext4, `/media` | 2 × 1 TB, ZFS mirror, `tank` |

The root filesystem stays ext4 on a single NVMe. This is consistent with the
architecture page's own reasoning — OS state is fully reconstructed by a rebuild, so
redundancy there buys uptime, not durability — and it avoids a reinstall. Larger drives
are a straight swap later: replace one mirror member, resilver, replace the other,
`zpool online -e`.

### Dataset layout

Single pool `tank`, `mountpoint=legacy` throughout. The top-level split is by
*portability*, so that migrating a stack to Izanagi is one `zfs send` of one subtree:

```
tank/
  ├── local/                        stays on this host permanently
  │   ├── identity/appdata/         kanidm, oauth2-proxy
  │   ├── vault/appdata/            vaultwarden
  │   ├── net/appdata/              adguard, crowdsec, caddy
  │   └── monitoring/appdata/       prometheus, grafana, uptime-kuma
  │
  └── portable/                     migrates to izanagi
      ├── arr/
      │   ├── appdata/              jellyfin, radarr, sonarr, prowlarr,
      │   │                         jellyseerr, transmission
      │   └── media                 library + downloads, ONE dataset
      ├── cloud/
      │   ├── appdata/              nextcloud, postgres
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

Three corrections against the layout previously documented:

- **`books` and `music` were missing entirely.** The tree predates `books.nix` and
  `navidrome.nix`. Navidrome's library is currently `/media/library/music`, inside the
  *arr* media tree — which couples two stacks that should migrate independently.
  Separating them is the point of grouping by stack.
- **Nextcloud's data directory appeared nowhere.** It is `/media/nextcloud` today.
- **`identity/` is new**, because Kanidm did not exist when the tree was written. It is
  the single most important dataset in the pool.

`arr/media` holds the library *and* the downloads in one dataset, deliberately:
hardlinks cannot cross a dataset boundary, and breaking them turns every import into a
full copy. The cost is that snapshots of the library include download churn.

### Mountpoint doctrine

The existing architecture page suggests using each service's `path` option where one
exists and mounting the dataset directly where one does not. In practice the mixed
approach is what makes the layout hard to reason about. The rule for `v2`:

- **Appdata datasets mount at the path the service already uses** — normally
  `/var/lib/<service>`, or `/var/lib/private/<service>` for `DynamicUser=true` units.
  Never move appdata with a `path` option. This keeps systemd hardening
  (`ProtectSystem=strict`, `ReadWritePaths=`) working untouched, which is exactly where
  the `path` approach fails.
- **Media datasets mount under `/data`** and are pointed at with the service's own
  option (`services.navidrome.settings.MusicFolder`, `blackwall.books.libraryPath`).

This replaces `/media` with `/data` and makes the paths in
[Storage](./storage/index.md) true. `blackwall.storage.basePath` already parameterises
it, so the media side is nearly a one-line change.

### Steps

1. **Prerequisite:** the second 1 TB SATA drive must be emptied and installed.
2. Add ZFS support: `boot.supportedFilesystems`, and `networking.hostId` — ZFS refuses
   to import a pool without one, and NixOS will not build without it. Confirm the
   configured kernel is one the packaged ZFS supports before rebuilding; nixpkgs will
   refuse to build the module against an unsupported kernel rather than fail at boot.
3. Create a **single-disk** pool on the newly installed drive. A mirror cannot be built
   directly, because the other drive still holds the live `/media` data.
4. Create the datasets, with per-class properties: `compression=zstd` and `atime=off`
   throughout; `recordsize=1M` on media datasets; `recordsize=16K` on the Postgres
   dataset.
5. Migrate stack by stack, never all at once. For each: stop the units, copy with
   `rsync -aHAX` (`-H` matters for `arr/media`), mount the dataset at the target path,
   start, verify, and only then move on. Nextcloud is the exception — its
   `datadirectory` is fixed in `config.php` at install time, so moving it means editing
   that file by hand as well.
6. Once every stack is verified on the pool, wipe the old `/media` drive and attach it:

   ```bash
   zpool attach tank <existing-member> <old-media-disk>
   ```

   Wait for the resilver to complete before treating the pool as redundant.
7. Add `RequiresMountsFor` for the new paths. The existing guards in `arr.nix`,
   `books.nix`, `navidrome.nix`, `nextcloud.nix` and `vaultwarden.nix` reference
   `/media` paths and must be re-pointed, not merely kept — they exist because
   transmission silently wrote completed torrents onto the root SSD when a mount lost a
   race, and the same failure mode applies to every dataset here.
8. Remove the `x-systemd.before=systemd-tmpfiles-setup.service` workaround in
   `storage.nix`. It exists because `/media` is a `nofail` mount, which drops its
   ordering before `local-fs.target`; legacy ZFS mounts are real systemd units with
   proper ordering, so the hack becomes both unnecessary and misleading.
9. Enable `services.zfs.autoScrub`, `services.zfs.trim` and `services.zfs.zed` with
   alerting. ZED with no configured notification target is the default, and it is
   indistinguishable from a healthy pool.
10. Set up `zfs-auto-snapshot` on appdata datasets. Media does not need it; `identity`
    and `vault` need it most.

### The second leg

A mirror protects against a disk dying. It does nothing about a bad delete, a bad
restore, ransomware, or a pool that fails to import — and the nightly dumps in
`tank/.../backups` are on the same pool as their sources, so they protect against none
of those either.

The second leg is `zfs send` to a target that is not this pool. The salvaged drives and
USB externals are the natural home: check them with `smartctl` first, and treat any
reallocated or pending sectors as grounds for scratch duty only. This is the one item in
`v2` that protects Vaultwarden and Kanidm against anything other than hardware failure,
and it should not slip to `v3`.

### Verification

- `zpool status` reports a mirror, `ONLINE`, resilver complete, zero errors.
- `zpool list` and `zfs list` match the layout above.
- A scrub completes clean.
- `findmnt` inside each service's namespace resolves to the pool, not the root disk —
  the check that caught the transmission shadow-mount:

  ```bash
  nsenter -t $(systemctl show -p MainPID --value transmission) -m -- \
    findmnt /data/media/downloads/complete
  ```
- Hardlink count preserved across the arr library: compare `find … -links +1 | wc -l`
  before and after.
- A ZED alert arrives when a pool fault is simulated with `zinject`.
- A `zfs send` of `tank/local/vault` restores onto the offline target and the restored
  Vaultwarden database opens.

### Notes

Between steps 3 and 6 the pool is a single disk with no redundancy. During that window
the old `/media` drive is still intact and still holds the previous copy, which is the
safety net — do not wipe it early, and do not start step 6 until step 5 is verified for
every stack.

---

## Phase 4 — Identity

**Goal:** one declarative source of truth for people, with hardware keys as the login
method.

Depends on Phase 3: Kanidm's database is the one thing that must never be lost, so it
is created directly on `tank/local/identity/appdata/kanidm` rather than moved there
later.

### Steps

1. Implement `blackwall.identity.people` as specified in
   [Architecture](./architecture/index.md): one attribute set driving Kanidm persons and
   groups, Unix accounts, and SSH keys together. Replaces the single hand-written
   `users.users.mizutani` block.
2. Switch SSH to hardware-backed keys. Generate `sk-ssh-ed25519@openssh.com` keys on the
   Token2, add them alongside the existing software key, confirm login, and only then
   remove `ssh-ed25519 …AdVvCW mizutani@canto`. Enrol **two** keys — a single FIDO2
   token is a single point of lockout.
3. Stand up Kanidm on `tank/local/identity`, provisioned through
   `services.kanidm.provision` so persons, groups and OAuth2 clients are all declared.
4. **Solve Kanidm's TLS requirement.** Kanidm will not serve plain HTTP, so it cannot
   simply listen on loopback behind `caddy-tailscale` like everything else. Two options:
   - `tailscale cert` to write a real tailnet certificate to disk for Kanidm's own
     hostname, renewed on a timer, and point `serverSettings.tls_chain`/`tls_key` at it.
   - A self-signed internal certificate, with Caddy proxying to `https://` upstream and
     skipping verification on that one hop.

   The first is cleaner and keeps the browser-facing identity consistent. Either way
   this is the piece of Phase 4 most likely to consume a day.
5. Enrol credentials: `kanidm person credential create-reset-token`, then register the
   Token2 keys.
6. Deploy `oauth2-proxy` and gate services per the four classifications already defined:
   - **Delegated** — Nextcloud, Vikunja, Forgejo, Grafana talk OIDC to Kanidm directly.
   - **Front-door** — code-server, the arr suite, transmission, Glance sit behind
     `forward_auth` to `oauth2-proxy`. `code-server` currently runs `auth = "none"` and
     relies entirely on tailnet membership; this is what fixes it.
   - **Own login** — Vaultwarden keeps its master password, because that password
     derives the encryption key. Add FIDO2 as second factor.
   - **Machine identity** — Prometheus scrape credentials and service-to-service tokens
     come from sops, never from Kanidm.
7. Configure Caddy to strip client-supplied identity headers before setting its own.
   Without this, identity can be asserted by typing a header.
8. Enrol the hardware key as Nextcloud's second factor via `twofactor_webauthn`, which
   is already in `extraApps`. Do not enforce 2FA before a key is enrolled and tested.

### Verification

- One sign-in reaches a front-door service; confirm whether the session then covers a
  second front-door service without re-authenticating. **This needs testing rather than
  assuming:** the single-cookie-spans-everything property depends on a cookie scoped to
  the parent tailnet domain being accepted, and whether `tail222568.ts.net` is a
  cookie-settable registrable domain depends on how `ts.net` appears on the Public
  Suffix List. If it is not settable, the result is one sign-in per service — workable,
  but it changes the design and should be found out here, not in `v3`.
- `curl -H 'X-Forwarded-User: admin'` against a gated service does not authenticate.
- A revoked person loses access to every delegated and front-door service.
- Removing a person with `present = false` leaves the record in `git log`.
- Vaultwarden still opens with master password plus FIDO2, independently of Kanidm —
  verify this works with Kanidm *stopped*, since the vault is the recovery path when
  the identity provider is down.

### Notes

Every credential enrolled here is bound to a `*.ts.net` hostname and will need
re-enrolling in `v3`. Keep the Nextcloud admin password secret in sops afterwards; it is
the fallback when a key is lost, and the only alternative is `nextcloud-occ` over SSH.

---

## Phase 5 — DNS filtering

**Goal:** network-level filtering for the tailnet, without taking on an authoritative
internal zone.

With MagicDNS retained, AdGuard Home's `v2` role is narrower than the architecture page
describes: it filters, it does not serve `blackwall.cam`. Tailscale resolves `*.ts.net`
itself and forwards everything else to the configured global nameserver, so AdGuard
slots in as that nameserver without competing with MagicDNS.

### Steps

1. Deploy AdGuard Home with state on `tank/local/net/appdata/adguard`.
2. Add the host's tailnet address as a global nameserver in the tailnet DNS settings.
3. Declare the admin credential as a bcrypt hash from sops. Note that
   `services.adguardhome.settings` is rendered into the world-readable Nix store, so the
   hash must be injected through a sops template with `mutableSettings`, not written
   into the settings attribute set.

### Verification

- A known-blocked domain fails to resolve from a tailnet client.
- `*.ts.net` names still resolve — confirming AdGuard has not displaced MagicDNS.
- Repairing DNS does not require logging in to AdGuard, per the lockout exception in
  [Architecture](./architecture/index.md).

---

## Phase 6 — Monitoring and detection

**Goal:** know the state of the system without logging in to check.

### Steps

1. Prometheus with the node exporter, plus per-service exporters where they exist. Needs
   the API keys moved into sops in Phase 2.
2. Grafana, with datasources and dashboards provisioned declaratively — a dashboard
   built in the web UI is state that no rebuild reconstructs.
3. Uptime Kuma for endpoint and certificate expiry checks.
4. CrowdSec for host intrusion detection. Confirm whether a `services.crowdsec` module
   is available in the pinned nixpkgs before planning around it; if not, it runs as a
   container like FlareSolverr.
5. Alerting that leaves the machine. An alert delivered only to a dashboard on the
   machine being monitored is not an alert.
6. Wire the ZFS and ZED metrics from Phase 3 into the same alerting path.

### Verification

- Stopping a service produces an alert through the external path within its window.
- A simulated pool fault surfaces in Grafana *and* in the alert channel.
- A Grafana rebuild from scratch reproduces every dashboard.

### Notes

The to-do list names both Prometheus and Zabbix. Running both means maintaining two
collection stacks over one host for no additional coverage — `v2` takes Prometheus and
drops Zabbix.

---

## Phase 7 — Documentation self-hosting

**Goal:** this book served from the Blackwall, on the tailnet only.

`modules/development/mdbook.nix` already clones, builds and serves the book at
`docs.tail222568.ts.net` on an hourly timer, so most of this phase is already done.

### Steps

1. Confirm the self-hosted copy is current and complete.
2. Retire the GitHub Pages deployment: remove `src/CNAME`, drop the Pages workflow, and
   release `docs.blackwall.cam`. The docs become tailnet-only, accepted in exchange for
   consistency with the perimeter rule.
3. Re-point `blackwall.mdbook.repo` at Forgejo rather than GitHub. Without this the book
   is self-*served* but not self-*hosted* — an outage or a lost GitHub account still
   stops the hourly rebuild.
4. Add `mdbook-mermaid` if the recovery diagrams from Phase 0 are wanted.
5. Replace the `python -m http.server` process with a `file_server` block in Caddy. One
   fewer long-running Python process, and it moves the static serving into the component
   already terminating TLS.

### Verification

- The book builds and serves from Forgejo as its source with GitHub unreachable.
- The hourly timer picks up a commit pushed to Forgejo.

---

## Phase 8 — Colmena

**Goal:** declare and deploy the fleet from one place, adopted while there is one host
to break.

Colmena's value arrives with Izanagi, but adopting it now means `v3` adds a host to a
working deployment pipeline rather than building the pipeline and the host at once.

### Steps

1. Add the `colmena` flake output alongside `nixosConfigurations`, so `nixos-rebuild`
   keeps working as the fallback path.
2. Set `deployment.targetHost`, `targetPort = 6622` and `targetUser`, with the tags
   needed to address hosts selectively later.
3. Deploy a trivial change with `colmena apply` and compare against a local
   `nixos-rebuild switch`.

### Verification

- `colmena build` produces a closure identical to `nixos-rebuild build`.
- `colmena apply --on blackwall` deploys successfully over SSH with a hardware-backed
  key from Phase 4.
- `nixos-rebuild switch` still works locally, as the recovery path when a deploy breaks
  networking.

---

## Phase 9 — Operational posture

**Goal:** the standing rules that keep `v2` true after it is built.

Because the domain and VPS are deferred, Tailscale is the entire perimeter — this phase
is load-bearing, not polish.

### Steps

1. **Tailscale hardening.** ACLs written as grants rather than a flat allow, device tags
   per role, tailnet lock enabled, key expiry reviewed, webhook alerts on device join,
   and `--ssh` access governed by an ACL that reflects the Phase 2 decision. Replace the
   reusable auth key behind `caddy_ts_authkey` with an OAuth client secret — it occupies
   the same `TS_AUTHKEY` slot and does not expire at 90 days.
2. **Update policy.** The architecture page commits to every component being within 14
   days of a release. Make that measurable: a scheduled flake update, a visible report
   of input age, and an alert when the commitment is breached.
3. **Security RSS.** A single aggregated feed of security bulletins, release notes and
   relevant blogs, surfaced in Glance.
4. **SSH session recording**, via a Tailscale recorder node — only meaningful if
   Tailscale SSH stays enabled.
5. **Maintenance routines**, written down: scrub cadence, snapshot retention, backup
   verification, secret rotation, and the Nix store garbage collection that nothing
   currently performs.
6. Fill out the Glance widgets already noted as missing — RSS, DNS, hardware stats,
   todo.

### Verification

- Tailnet lock is on and a new device cannot join unsigned.
- A deliberately stale input triggers the age alert.
- A restore from the Phase 3 offsite leg is rehearsed on a schedule, not once.

---

## Phase 10 — Branding

**Goal:** one visual identity across every service.

Lowest priority, and independent of everything else. The Blackwall palette and IBM Plex
typography currently exist only inside the `homepage.nix` that Phase 1 deletes — lift
them out first.

### Steps

1. Write the style guide: palette, typography, iconography.
2. Settle the font scheme across services and client systems.
3. Apply it to Glance, Grafana, Forgejo, Jellyfin and Vaultwarden.

---

## Exit criteria

`v2` is complete when all of the following hold:

1. `zpool status` shows a healthy, scrubbed mirror, and every service's state lives on a
   dataset whose placement is documented.
2. A `zfs send` restore of `tank/local/vault` and `tank/local/identity` has been
   performed onto a target that is not this pool.
3. `nmap -p-` from the LAN returns only `6622` and `2222`.
4. No service accepts a login that is not Kanidm, Vaultwarden's own master password, or
   a sops-held machine token.
5. Two hardware keys are enrolled and either alone grants access.
6. An alert for a stopped service and for a degraded pool both arrive off-machine.
7. Every service has a written recovery path, and one has been rehearsed.
8. `colmena apply` is the normal deployment path.
9. The book is served from the Blackwall, sourced from Forgejo.

## To-do traceability

Every item from the `v1` to-do lists, mapped to where it lands:

| To-do item | Phase |
|------------|-------|
| Define access and recovery path for each service | 0 |
| Discoverable `.nix` modules (`import.nix`) | 1 |
| Endpoints are reduced | 2 |
| Move API keys into sops-nix | 2 |
| Security hardening | 2 |
| Token2 PIN+ hardware key | 4 |
| Declarative, extendable user accounts | 4 |
| Monitoring software (Prometheus, Grafana, Uptime Kuma, CrowdSec) | 6 |
| Zabbix | Dropped — redundant with Prometheus |
| NixOS deployment (Colmena) | 1, 8 |
| Tailscale security (auto-update, grants, tags, webhooks, tailnet lock) | 9 |
| RSS feed for security bulletins | 9 |
| SSH session recording | 9 |
| List maintenance routines | 9 |
| Glance widgets (RSS, DNS, hardware, todo) | 9 |
| Custom and aligned branding, style guide | 10 |
| Decide font scheme | 10 |
| Jellyfin worklist (declarative accounts, indexers, encoding) | Service-level, after 4 |
