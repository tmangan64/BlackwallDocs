# Introduction

The Blackwall is a multi-host modular NixOS network. It utilises multiple physical hosts to spread processing power, storage capabilities as well as logical segmentation[^1].

The original idea was a single device running everything, however I've since discovered NixOS' multi-host systems. By managing multiple hosts on a single nix configuration, it becomes infinitely easier to treat all hosts as if they're part of a single system and brings the NixOS experience much closer to hypervisors like Proxmox, without virtualisation.

The thematic goal of the Blackwall is similar to its namesake. In the world of Cyberpunk 2077, a hacker called Rache Bartmoss releases a virus that causes AI to go rampant and destroy the old Internet. Netwatch, in response, creates a large firewall , the Blackwall, designed to seal the rampant AIs in the Old Internet. Much like how the Internet today is run rampant with AI[^2], this Blackwall will serve to carve out my own region of cyberspace as a self-hosted network. It hosts data, content and media with the goal of preservation and piracy.

[^1]: Logical segmentation, in this instance means that different hosts are designed for different purposes. This could be a small desktop running networking software while an enterprise device runs NAS software.

[^2]: [Dead Internet Theory](https://en.wikipedia.org/wiki/Dead_Internet_theory).
