# Architecture

This page details the architecture rules for the Blackwall server and all hosts involved.

These are target rules, not a description of the deployed system. Where `v1` does not
yet satisfy a rule, the gap is marked and the fix is sequenced in [Plan](../plan.md).

#### Updates:
All software should ideally report software/security updates and blog posts to a sorted RSS feed.
All software should be up to date, within 14 days of an update's release. NixOS is rather static so this is a big focus.

> Not yet enforced. [Phase 9](../plan.md#phase-9--operational-posture) makes the 14-day
> commitment measurable rather than aspirational.

#### Perimeter:
Nothing is exposed to the Internet, no service opens a port, every service binds loopback and is only reachable through a reverse proxy.
Tailnet membership is first layer of security as a device can only reach services if it was added manually.

> Contradicted in six places today — five services set `openFirewall`, FlareSolverr
> publishes on all interfaces, and transmission's RPC is unauthenticated behind the
> proxy. [Phase 2](../plan.md#phase-2--perimeter-and-secrets) closes all of them.

#### VPS:
A rented VPS acts as a secondary proxy and is least trusted machine in the network.
It has a tailnet tag with a grant to exactly the upstream ports it forwards and nothing else.
It never terminates TLS for an internal service and cannot read the bytes it forwards.
If a public hostname for internal service is required, connection is passed via SNI and decrypted at home.

> Deferred to `v3`. Nothing is public in `v2`, so there is nothing for a second proxy to
> forward.

#### Identity:
Kanidm is the designated identity manager for the Blackwall. All users, groups and applications are declared in the NixOS config and is source of truth.
Passwordless login via FIDO2 hardware key is intended login method with VaultWarden password + MFA as a backup.

Kanidm will not serve plain HTTP, so unlike every other service it cannot simply bind
loopback and sit behind the proxy — it needs a certificate of its own. See
[Phase 4](../plan.md#phase-4--identity).

#### Service Authentication:
The service hands the browser to Kanidm, the hardware key is presented, the service receives confirmation of identity and group membership (OpenID Connect); the service keeps its own user record and maps groups to users.
Reverse proxy refuses a request until oauth2-proxy confirms a session and forwards it. One session cookie on the internal parent domain spans every gated service so one key covers all.
Ideally would hash session cookie against the hostname so cookie-stealing can't be performed.

Login classifications can be defined as such:

| Classification   | Example Services   | Mechanism               |
|------------------|--------------------|-------------------------|
| Delegated        | NextCloud, Vikunja | Kanidm                  |
| Front-door       | code-server, Arr*  | oauth2-proxy -> Kanidm  |
| Own login        | VaultWarden        | Master password + FIDO2 |
| Machine identity | Prometheus, sops   | Tokens or keys          |

The proxy must strip client-supplied identity headers before setting its own otherwise identity can be asserted by typing a header.
Authorisation is group-based, not per-user.

> The one-cookie-covers-all property assumes a cookie can be set on the parent domain.
> While services live on the tailnet that depends on how `ts.net` appears on the Public
> Suffix List, so it has to be tested rather than assumed — if the cookie is rejected,
> the result is one sign-in per service.

#### Exceptions:
VaultWarden - Account password derives the encryption key and keep unique passwords with said key.
Home Assistant - Companion app isn't a browser so a redirect-based gate breaks it. Better to stick with companion app.
AdGuard Home - Login that depends on name resolution can lock out of repairing name resolution. Credential is instead declared as a hash from sops.
Minecraft - The only sanctioned inbound path from the public Internet. Reached through a playit.gg tunnel rather than the proxy, with no identity gate, because the game client is not a browser. Accepted deliberately: it carries no personal data, shares no credentials with any other service, and is the single exception to the perimeter rule.
Tailscale SSH - `--ssh` places shell access under tailnet ACLs rather than `authorized_keys`, which bypasses the hardware-key policy. Either governed by an explicit ACL or disabled; not left as an unreviewed default.

#### DNS:
One canonical hostname per service, as passkeys are bound to the hostname that created it — a service reachable under two hostnames would need two passkeys.

`v2` keeps Tailscale MagicDNS and `caddy-tailscale`: each service is its own tailnet node
at `<service>.tail222568.ts.net`, with certificates issued from the tailnet. AdGuard Home
is present as a DNS *filter*, configured as the tailnet's global nameserver, and does not
serve a zone of its own.

`v3` moves every service onto a flat `<service>.blackwall.cam` namespace. That requires a
wildcard certificate by ACME DNS-01 — `caddy-tailscale` can only issue for tailnet names —
with the zone delegated to a DNS provider offering scoped API tokens, and AdGuard serving
the internal records to the tailnet only so no internal address appears in public DNS.

The two are mutually exclusive, and `v2` chooses the first: the custom domain makes no
data safer, and a hostname change voids every enrolled passkey. The cost of deferring is
that credentials enrolled in `v2` must be re-enrolled in `v3`.

#### Secrets:
All secrets are encrypted in the repository via sops-nix and decrypted during activation using each host's SSH key.
Service to service authentication is performed via tokens in sops, not the identity provider.
Credentials that a service generates for itself — the Arr* suite's API keys being the
clear case — are seeded from sops rather than left in each service's own database, so that
a rebuild reproduces them.

#### Durability:
Kanidm's database cannot be lost at all costs and should have backups.
Ensure every service has a recovery path and method.

A mirror is not a backup. It survives a dead disk and nothing else — not a bad delete, not
a bad restore, not a pool that fails to import. The second leg is a `zfs send` to a target
outside the pool, and it is what actually protects Kanidm and VaultWarden. A nightly dump
written to the same pool as its source protects against neither.

#### Storage:
The device has 3x NVMe slots and 2x HDD slots. In reality only 1 NVMe is needed for the OS: that data needs to be quick, but it is also entirely recovered by a NixOS rebuild, so redundancy there buys uptime rather than durability. The root filesystem therefore stays on a single NVMe.
Blackwall v3 will involve the installation and commissioning of an enterprise style server (Izanagi) for dedicated computing. Many services like Nextcloud and Jellyfin will be migrated here in future.

#### Architecture:
There are multiple types of content stored on the Blackwall
- Media - Anything that a NixOS rebuild would *not* recover (Nextcloud files, Jellyfin content)
- Appdata - Anything generated and maintained by the services and applications (User accounts, databases)
- OS - Anything generated during a NixOS rebuild and maintained by the config (OS, binaries, configurations)
The goal is to logically separate these via ZFS datasets.

#### Datasets:
The overall dataset structure segregates data that will be migrated in future vs data that's here to stay. It also separates software into stacks such as the Arr* suite containing software like Jellyfin, Seerr etc. Migrating a stack to Izanagi is then one `zfs send` of one subtree.

```bash
tank/
  ├── local/                        stays on Cynosure permanently
  │   ├── identity/appdata/         kanidm, oauth2-proxy
  │   ├── vault/appdata/            vaultwarden
  │   ├── net/appdata/              adguard, crowdsec, caddy state
  │   └── monitoring/appdata/       prometheus, grafana, uptime-kuma
  │
  └── portable/                     to be migrated to izanagi
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

The library and the downloads share one dataset deliberately: hardlinks cannot cross a dataset boundary, and breaking them turns every import into a full copy.

#### Mountpoints:
Once `mountpoint=legacy`, dataset paths and mountpoints become independent. This prevents a service starting before its data exists as each mount is now a systemd unit. With native mountpoints, the layout lives on the disc.

Most NixOS service modules expose a 'path' option, allowing custom placement of the service's data (`services.jellyfin.dataDir = "/data/media/library"` etc). However, it doesn't work for all services; `StateDirectory=` is relative to `/var/lib` by design and many modules don't define a path at all, they instead tell systemd `StateDirectory=sonarr` and systemd creates `/var/lib/sonarr`.
Hardened units block writes outside their allowed paths. A service with `ProtectSystem=strict` plus `ReadWritePaths=/var/lib/foo` will be denied when pointed elsewhere.
`DynamicUser=true` services keep their real state in `/var/lib/private/<service>` with `/var/lib/<service>` as a symlink into it.

The resulting rule splits by data class rather than by service:

- **Appdata** is mounted at the path the service already uses — `/var/lib/<service>`, or
  `/var/lib/private/<service>` for `DynamicUser=true` units. The `path` option is never
  used to relocate appdata, because that is precisely where systemd hardening fights
  back.
- **Media** is mounted under `/data` and pointed at with the service's own option.

```nix
fileSystems."/var/lib/prometheus2" = {
    device = "tank/local/monitoring/appdata/prometheus";
    fsType = "zfs";
  };
```

#### ZFS and RAIDZ:
This machine only has 2 HDD slots, so the configuration is a two-disk mirror: one vdev, surviving one failure, with usable capacity equal to one disk. See [RAID1](../storage/raid.md) for why a mirror rather than RAIDZ, and for the expansion path.
This will be sufficient for monitoring/control/networking software as well as temporarily housing media and data before Izanagi's been commissioned.
Izanagi will host multiple large HDD drives for the purpose of long-term resistant storage.

#### Users:
Upon rebuild, `services.kanidm.provision.persons` will read the user list and automatically create a record for that user within Kanidm which now has that person and their memberships.
A one-time enrolment link is then generated with `kanidm person credential create-reset-token someone`, they open it, connect their hardware keys and now use that to access each service from now on.
To remove someone set `present=false` so that it leaves a record in git log.
User also needs a VaultWarden login ideally.

Two keys per person, not one. A single FIDO2 token is a single point of lockout.

```nix
blackwall.identity.people = {
    mizutani = {
      displayName = "Teague Mangan";
      groups = [ "admins" "media" "dev" "finance" ];
      sshKeys = [ "sk-ssh-ed25519@openssh.com AAAA… yubikey-1"
                  "sk-ssh-ed25519@openssh.com AAAA… yubikey-2" ];
    };

    someone = {
      displayName = "Someone Else";
      groups = [ "media" ];
    };
  };
```
