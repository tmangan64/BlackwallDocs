# Architecture

This page details the architecture rules for the Blackwall server and all hosts involved.

#### Updates:
All software should ideally report software/security updates and blog posts to a sorted RSS feed.
All software should be up to date, within 14 days of an update's release. NixOS is rather static so this is a big focus.

#### Perimeter:
Nothing is exposed to the Internet, no service opens a port, every service binds loopback and is only reachable through a reverse proxy.
Tailnet membership is first layer of security as a device can only reach services if it was added manually.

#### VPS:
A rented VPS acts as a secondary proxy and is least trusted machine in the network.
It has a tailnet tag with a grant to exactly the upstream ports it forwards and nothing else.
It never terminates TLS for an internal service and cannot read the bytes it forwards.
If a public hostname for internal service is required, connection is passed via SNI and decrypted at home.

#### Identity:
Kanidm is the designated identity manager for the Blackwall. All users, groups and applications are declared in the NixOS config and is source of truth.
Passwordless login via FIDO2 hardware key is intended login method with VaultWarden password + MFA as a backup.

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

#### Exceptions:
VaultWarden - Account password derives the encryption key and keep unique passwords with said key.
Home Assistant - Companion app isn't a browser so a redirect-based gate breaks it. Better to stick with companion app.
AdGuard Home - Login that depends on name resolution can lock out of repairing name resolution. Credential is instead declared as a hash from sops.

#### DNS:
Tailscale MagicDNS currently handles domain names.
One canonical hostname per service as passkeys are bound to the hostname that created it so a service reachable under two hosts would need two passkeys.
Internal services use the flat namespace of the root domain (service.blackwall.cam). Public services live on a separate domain so that session cookies are never sent to the public VPS.
Internal hostnames are not published in public DNS as the internal zone is served by AdGuard Home to the tailnet only.
Certificates come from caddy-tailscale.

#### Secrets:
All secrets are encrypted in the repository via sops-nis and decrypted during activation using each host's SSH key. 
Internal services
Service to service authentication is performed via tokens in sops, not identity provider.

#### Durability:
Kanidm's database cannot be lost at all costs and should have backups. 
Ensure every service has a recovery path and method.

#### Storage:
The device has 3x NVMe slots and 2x HDD slots, in reality I only need 1 NVMe drive for OS as that data needs to be quick but also can be entirely recovered with a NixOS rebuild.
Blackwall v3 will involve the installation and commissioning of an enterprise style server (Izanagi) for dedicated computing. Many services like Nextcloud and Jellyfin will be migrated here in future.

#### Architecture:
There are multiple types of content stored on the Blackwall
- Media - Anything that a NixOS rebuild would *not* recover (Nextcloud files, Jellyfin content)
- Appdata - Anything generated and maintained by the services and applications (User accounts, databases)
- OS - Anything generated during a NixOS rebuild and maintained by the config (OS, binaries, configurations)
The goal is to logically separate these via ZFS datasets.

#### Datasets:
The overall dataset structure segregates data that will be migrated in future vs data that's here to stay. It also separates software into stacks such as the Arr* suite containing software like Jellyfin, Seerr etc.
```bash
tank/
  ├── local/            stays on Cynosure permanently
  │   ├── monitoring/   prometheus, grafana, uptime-kuma
  │   ├── net/          adguard, crowdsec, caddy state
  │   └── vault/        vaultwarden
  │
  └── portable/         to be migrated to izanagi
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
#### Mountpoints:
Once `mountpoint=legacy`, dataset paths and mountpoints become independent. This prevents a service starting before its data exists as each mount is now a systemd unit. With native mountpoints, the layout lives on the disc.
Most NixOS service modules expose a 'path' option, allowing custom placement of the service's data (`services.jellyfin.dataDir   = "/data/appdata/arr/jellyfin";` etc)
However, it doesn't work for all services; `StateDirectory=` is relative to `/var/lib` by design and many modules don't define a path at all, they instead tell systemd `StateDirectory=sonarr` and systemd creates `/var/lib/sonarr`. 
Hardened units block writes outside their allowed paths. A service with `ProtectSystem=strict` plus `ReadWritePaths=/var/lib/foo` will be denied when pointed elsewhere.
`DynamicUser=true` services keep their real state in `/var/lib/private/<service>` with `/var/lib/<service>` as a symlink into it.
As a result, the path option must be used where it exists and where it doesn't, mount the dataset directly at the path the service already uses.

```nix
fileSystems."/var/lib/prometheus2" = {
    device = "tank/local/monitoring/appdata/prometheus";
    fsType = "zfs";
  };
```

#### ZFS and RAIDZ:
This machine only has 2 HDD slots so the appropriate config would be 2x 4TB hard drives, creating a 4TB ZFS mirror.
This will be sufficient for monitoring/control/networking software as well as temporarily housing media and data before Izanagi's been commissioned.
Izanagi will host multiple large HDD drives for the purpose of long-term resistant storage.

#### Users:
Upon rebuild, `services.kanidm.provision.persons` will read the user list and automatically create a record for that user within Kanidm which now has that person and their memberships.
A one-time enrollement link is then generated with `kanidm person credential create-reset-token someone`, they open it, connect their hardware keys and now use that to access each service from now on.
To remove someone set `present=false` so that it leaves a record in git log.
User also needs a VaultWarden login ideally.

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

