# Introduction

The Blackwall is a multi-host modular NixOS network. It utilises multiple physical hosts to spread processing power, storage capabilities as well as logical segmentation[^note].

The original idea was a single device running everything, however I've since discovered NixOS' multi-host systems. By managing multiple hosts on a single nix configuration, it becomes infinitely easier to treat all hosts as if they're part of a single system and brings the NixOS experience much closer to hypervisors like Proxmox, without virtualisation.

[^note]: Logical segmentation, in this instance means that different hosts are designed for different purposes. This could be a small desktop running networking software while an enterprise device runs NAS software.
