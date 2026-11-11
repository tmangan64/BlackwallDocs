# Notes

- [x] List all services from blackwall.cam software list
- [ ] List any maintenance routines
- [ ] Security hardening
- [ ] Decide font scheme for all systems

## Jellyfin worklist

- [ ] Re-configure with declarable accounts, settings etc
- [ ] Add more indexers
- [ ] Double check encoding is optimal
- [ ] Fonts
- [ ] F1/Sports streams? mybunny.tv?

## Glance

- [ ] RSS Feed
- [ ] DNS widget
- [ ] Hardware stat widget
- [ ] Todo widget

***

# Claude Q&A

1. For the storage, which RAID array are we using with ZFS and how many drives should I get? 
You can see I'll clearly want to logically separate my data and would like the ability to easily expand. Since I'm hosting passwords etc, I'll probably want at least single parity.

**A:** One pool, one `raidz2` vdev of 6 identical drives — survives any two failures, ~66% usable. Get the logical separation from datasets on that one pool, not from separate pools; two pools pays for parity twice. Expand later either one disk at a time (OpenZFS 2.3+) or by adding a second vdev. Note that parity isn't what protects Vaultwarden — that needs `zfs send` replication offsite, since RAID doesn't survive deletion or a bad rebuild.

2. For the #izanagi host, how do I pick parts and design that machine? Do I buy stuff while I'm travelling? I know it will have to be maximum 19" in a 18U cabinet.

**A:** Work backwards from bay count, since that's the spec you can't change cheaply: 8–12 bays puts you at 2U–4U, then HBA (IT mode, never hardware RAID) → PSU → ECC board/CPU. 19" is automatic from EIA-310; check *depth* instead, as enterprise chassis run 700–800 mm and many 18U cabinets are shallower. Pick the CPU for the ~30-service list and use QuickSync or a cheap Arc card for Jellyfin. While travelling, buy only small high-value parts (HBA, SAS cables, ECC RAM, NVMe) — chassis, PSU and drives aren't worth the weight, the customs or the dead warranty.

3. I will probably want an array of 6 identical 4TB drives. I will also want to be able to make the best usage out of random hard drives I've salvaged from other computers and external drives. How can I best utilise those drives?

**A:** 6×4 TB is fine — ~16 TB usable, and small drives resilver faster, which is a real safety gain. Keep the salvaged drives out of that pool: a vdev is capped by its smallest member, and the pool dies with any one vdev, so old disks would hand their failure rate to your irreplaceable data. Use them instead as a separate `zfs send` target (the missing offsite leg), a disposable pool for `/data/media/downloads`, and cold offline copies for the USB externals. Check `smartctl` first — any reallocated or pending sectors means scratch duty only.

4. I am going down a rabbit-hole relating to server chassis types such as tower, rack or blade and I'm a rather large fan of blade servers. How could this server plan (specifically the izanagi host) work with a blade server? What about a multi-node server like Dell PowerEdge FC630?

**A:** Blades can't be Izanagi: a blade is diskless by design (an FC630 gives you two 2.5" bays) because blade storage is assumed to sit on a fabric — so six 3.5" drives have nowhere to go, and the LUN you'd get instead is exactly the layer ZFS shouldn't sit on. FX2 + FD332 comes closest but is 2.5"-only, which kills the 4 TB plan. A c7000/M1000e also eats 10U of your 18U empty and draws more than one UK socket provides. Multi-node *is* a good fit for the compute tier though — a 2U four-node box is a natural home for Cynosure, Sapphire and Kabuki; Mikoshi still needs a conventional 4U for the GPU.

5. Are there any modular chassis that could work like this? A rack-style server is large, flat and wide and not practical for a home server.

**A:** This contradicts your Hosts page, which lists 18U and 19" as hard requirements — if the rack is out, update that table first. Best option is a tower/rack convertible 4U (Supermicro SC743/745): 8 hot-swap bays, full ATX, quiet, tower now and rackable later. Compact alternative is a NAS cube (Jonsbo N3, Fractal Node 304), but ITX means the HBA takes your only slot, so no transcode GPU. Mostly though, your modularity already lives at the host layer — Cynosure is a mini-PC — so one quiet drive box plus mini-PCs gives you what a modular chassis would.

6. My desktop computer uses a Coolermaster NR200P v3 with a 4070ti, 32GB of RAM and 2TB NVMe. What about a single server cabinet containing not only the full Blackwall network but also my desktop computer, then I situate the cabinet near my desk. Are there benefits to

***

AI-Assisted Game Development Workflow
Objective

Build a model-agnostic AI development system to develop and maintain a Godot 4 multiplayer game.

The system should accept human instructions, investigate the existing project, plan and implement changes, run tests, diagnose failures and iteratively correct its work until all acceptance criteria are met.

The human retains control over game design, architectural decisions and final approval.

1. Core Architecture

The system consists of five components:

Orchestrator (Python): Controls the development workflow, manages tasks, agents, iterations and completion criteria.
Knowledge Base (Markdown): Stores project instructions, architecture, coding standards, game design and development constraints.
Context Retrieval: Retrieves relevant source code, documentation, dependencies and previous decisions. Graphify will provide codebase relationship analysis.
Model / Agent Layer: Uses interchangeable LLMs for planning, implementation, debugging and code review.
Development Tools: Provides Git, Godot, MCP integrations, automated testing and build validation.
2. Development Workflow
text
Human Input
    |
    v
Load Markdown Instructions
    |
    v
Gather Relevant Context
    |
    v
Planning Agent
    |
    v
Human Feedback / Approval
    |
    v
Implementation Agent
    |
    v
Godot + Automated Tests
    |
    v
Review Results
    |
    +---- Failed ---> Diagnose / Correct / Retest
    |                              |
    |                              v
    +-------------------------- Repeat
    |
    v
All Criteria Satisfied
    |
    v
Human Final Approval
    |
    v
Merge Changes / Update Documentation


The orchestrator controls the loop. Models perform specialised tasks but do not independently control the development lifecycle.

3. Model Independence

All LLM communication must pass through a standardised model interface.

Potential technologies:

LiteLLM: Unified API and model routing.
Ollama / llama.cpp: Local model inference.
Cloud providers: Access to more capable models when required.
llmfit: Evaluate local models against available hardware.

Models should be selectable by task complexity and capability. Replacing a model must not require changing project instructions, agent definitions or workflow logic.

4. Agents

Initially, use four logical roles:

Planner: Investigates requirements, retrieves context and produces implementation plans.
Implementer: Writes and modifies code according to approved plans.
Reviewer: Independently evaluates code quality, architecture and security.
Debugger: Analyses test failures and proposes corrections.

These do not initially need to be separate autonomous processes. The orchestrator can assign different models and instructions to each role.

5. Development Infrastructure
Component	Proposed technology
Orchestrator	Python
Model abstraction	LiteLLM
Local inference	Ollama / llama.cpp
Instructions	Markdown
Codebase intelligence	Graphify
Editor integration	Godot AI / MCP
Game engine	Godot 4
Version control	Git
Testing	Godot headless + GUT
CI/CD	GitHub Actions
6. Essential Principles
Model and provider independence.
Human-directed development and approval.
Context retrieval rather than loading the entire codebase.
Explicit implementation plans and acceptance criteria.
Isolated Git branches or worktrees for AI changes.
Automated testing and regression detection.
Bounded correction loops with human escalation.
Persistent task state independent of model conversations.
Documentation and architectural decisions maintained in version control.
No merging or publishing without human approval.
7. Initial Implementation Priority

Build the system incrementally:

Python orchestrator and model abstraction.
Markdown instruction and knowledge system.
Single-agent implementation workflow.
Godot/MCP integration and automated testing.
Iterative debugging and correction loop.
Graphify and contextual retrieval.
Independent review and multiple agent roles.
Model routing, cost tracking and local inference optimisation.

End goal: A persistent, model-independent development pipeline where human input determines what to build, AI handles investigation and implementation, and deterministic tooling verifies the result.
