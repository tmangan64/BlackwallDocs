# Hosts

This page outlines the hosts within the Blackwall network. Each host serves a different purpose which allows for the most value to be extracted from a device.

### Original idea (Cynosure - v1.0)

My original plan was to house all my services and data within a single Beelink ME Pro N150. Utilising the 2x 3.5" HDD trays, I could mirror my drives allowing for easy-ish expansion and maintance of data. It also housed 3x NVMe slots which would work well for services. 

However, since purchasing that device and adding a few services already, I've been exposed to new technologies and older overlooked concepts that were worth reconsidering.

### New idea

A multi-host modular NixOS config can cordinate multiple completely separate machines, allowing for the best use of their hardware. This means a GPU-heavy device could host LLM software while an enterprise Proliant-style device could hold most the network's storage capacities and user services. Other future requirements might include a Home Assistant hub and a VM host for security experiments.

Names have already been reserved for these conceptual hosts. Currently, the Beelink's hostname is `blackwall` as it follows the afformentioned edition of the config. When there are finally multiple devices on the network, I'll rename the Beelink to `cynosure` as planned.

| Hostname | Purpose                       | Hardware             |
| -------- | ----------------------------- | -------------------- |
| cynosure | Control and monitoring node   | Beelink ME Pro N150  |
| izanagi  | Data fortress                 | Enterprise server    |
| mikoshi  | AI and automation node        | TBD (Likely £££ GPU) |
| sapphire | Reserved name                 | TBD                  |
| kabuki   | Reserved name                 | TBD                  |

### Izanagi - v2.0

With the arrival of a second host, we can begin to split software between control and services. This release will be immense in terms of cost, size, time and patience.

#### Cynosure

The Cynosure host will take use FOSS software such as Prometheus, Uptime Kuma and Grafana for  monitoring the overall status and health of systems and services. 

I've read about Colmena which supposedly lets you declare the state of multiple machines from a single config instead of having to remote into each node to rebuild. I'm not sure how it works yet but Cynosure is likely the device that would control the deployments of other nodes.

#### Izanagi

This will be the mass storage and service node and will likely be the largest/heaviest node in the system. Actual specific makes/models shouldn't be selected until I have the funds to puchase all together.

In order to process so much information at once and store it all safely, I'll first likely need an rack-style server with enough space for all types of nodes I might have such as a desktop chassis or 19" server. 18U should be sufficient.

This server will host critical irreplacable data such as passwords and personal information. The minimum launchable node should run some form of RAIDZ (mirror + parity + ZFS pooling). The goal is to reliably maintain important data in an economy where storage drives are increasingly expensive which means double parity may be required. 

| Hardware          | Requirements                 |
|-------------------|------------------------------|
| Chassis           | 18 Rack Units (EIA-310)      |
| Server            | 19 Inches                    |
| Hard Drives       | ≥4 TB                        |



> **Tip**
>
> Each hostname comes from the world of Cyberpunk 2077. Mikoshi is a data fortress owned by Arasaka and Cynosure was Miltech's direct response. Izanagi is an access point to Mikoshi while the Black Sapphire is skyscraper within Dogtown.
