# Introduction

The Blackwall is a multi-host modular NixOS network. It utilises a single NixOS configuration to manage multiple physical interconnected hosts to distribute processing power, storage capabilities as well as enforce logical segmentation.


### Multi-host

The original idea was a single device running everything [^1]; having now looked into raid arrays and ZFS configs, I've decided it'd probably be better to utilise multiple types of devices to their own strengths

### NixOS

I've also since become far more profficient with NixOS and believe it is the 'end-game' of home server OS options. By managing multiple hosts on a single modular nix configuration, it becomes infinitely easier to treat all hosts as if they're part of a single interconnected system and brings the logical segmentation much closer to hypervisors like Proxmox, without virtualisation.

### Theme

The aesthetic design of the Blackwall network is similar to its namesake. In Cyberpunk 2077, shortly after completing one of your first quests and receiving a new 'ping' hack, you can also find a lore book describing how a hacker named Rache Bartemoss released viruses upon the internet causing AI to go rampant and render the internet generally unusable. 

In the present-day game, the Blackwall is a 'firewall' that protects the new state Intranets from the AIs in the old web.

Today we face a similar problem where due to AI, the general Internet has become unusable due to mass-produced low-effort content [^2]. This server project serves as my efforts to create a closed-off space for my personal info and my data as well as work on my projects in peace.

### Myself

I am a British/Irish computer scientist with a BSc (Honours) in Cyber Security from MMU, UK. I have experience working in:

- Web development
- Service Desk
- National CSIRT Analyst

My interests range from motorsports to bikes; I own a Honda Grom and a Mazda MX-5 NB '03.

[^1]: The original plan was to build everything in a Beelink ME Pro N150. This device is now Cynosure.

[^2]: [Dead Internet Theory](https://en.wikipedia.org/wiki/Dead_Internet_theory).
