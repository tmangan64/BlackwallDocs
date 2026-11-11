# BlackwallDocs

## mdbook Documentation

Documentation for Blackwall and adjacent projects, built with [mdBook](https://rust-lang.github.io/mdBook/). Published to <https://docs.blackwall.cam> via GitHub pages.

For NixOS systems, the repo ships a [devenv](https://devenv.sh/) shell with mdbook already on
PATH. With direnv installed, `cd` into the repo; otherwise run `devenv shell`. Without devenv, install [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html)
and run `mdbook serve`.

# Blackwall v1 - Cynosure

This is the current stage of the project's development. It is a Beelink ME N150 Pro (known as Cynosure hereon) with a 1TB NVMe and 1TB SATA HDD. It hosts multiple services from Arr* suite to Nextcloud and other typical self-hosted services.

The problem is it's a 'jack of all trades, master of none' device and I'm unable to run dedicated long-term storage on a single device in this way. I can't replace parts as easy and can't install that many hard drives total.

# Blackwall v2 - Rework

The current goal is to align the architecture of the Cynosure host with that of a more permanent, modular, sustainable system that can be easily expanded upon in future. It involves installing additional drives and 'maxxing' out the device, buying time until I need to expand to more devices. I will also want to host the network stack and perhaps connect an Access Point to the device, allowing it to host it's own more secure network but this is a future endeavour.

The device has 3x NVMe slots, 2x 3.5" SATA HDD slots, 1x 2.5 GHz Ethernet port and 1x 5 Ghz Ethernet port, running NixOS.

The phased implementation plan lives in [`src/plan.md`](./src/plan.md), published at
<https://docs.blackwall.cam/plan.html>. It supersedes the to-do list that used to sit
here — every item from it is mapped to a phase in the traceability table at the bottom of
that page.

In short, `v2` delivers the parts that are expensive to retrofit: a mirrored ZFS pool with
a real dataset layout, a closed perimeter, Kanidm with hardware keys, and monitoring that
proves the rest works. The custom domain, public certificates and the VPS proxy are held
back to `v3`, where they land alongside Izanagi.

