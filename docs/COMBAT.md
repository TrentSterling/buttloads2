# Cinder moths and mining weapons, local 2.11.0

This document records the 2.11.0 cinder-moth checkpoint. Later local builds add the 297 m continuation (DEEP-WORKINGS.md), furnace boss (FOREMAN.md), and armored ground creatures plus an earned axe modification (CRAWLERS.md). The published site remains 2.8.0.

## What plays differently

Three cinder moths occupy cave side chambers. Older claims receive them in existing rooms without changing terrain. A moth stays dormant if its body is still buried, wakes when exposed, and pursues a nearby visible player within its territory. Cleared moths do not respawn. They are optional threats rather than gates on the machinery campaign.

Moths fly through actual open space. Their complete collision box is checked during movement. When a straight route is blocked, a bounded local A* search finds a passage around the rock. Path attachment searches neighboring cells rather than snapping into an obstructed cell. Every movement step remains collision-checked even after planning. Terrain edits invalidate route data, while moving cabinets, salvage and freight remain obstacles. Moths cannot fly to the surface town.

A moth flares for 0.85 seconds before a committed 0.42-second lunge, then recovers. Move sideways or lift to dodge its stored attack direction. The attack causes 18 damage with a one-second player damage grace period. Bright eyes, a shrinking ring, a HUD warning and an audio cue communicate the windup. The first creature has 60 health.

Work lights protect a three-metre neighborhood; restored survey lamps protect 4.2 m. A moth retreats from light and will not begin a lunge at a sheltered player. Intervening rock blocks this effect. The player's ordinary headlamp does not provide this protection, so placing lamps is an actual choice.

The cutter, scoop and lance deal continuous damage to a reachable creature. The mining axe unlocks at 9 m on key 6 and in the field kit. It has a 0.19-second windup, 0.68-second swing interval, 34 damage and a 2.35 m reach to the creature's collision envelope. It also chips rock and staggers a moth. Swing timing carries elapsed time through events, avoiding frame-rate-dependent cadence. Aim and reach are checked at impact. Pausing or switching equipment cancels a pending swing without bypassing its cooldown.

The resonator can target a creature in open air and stagger it. The heart drains and draws creatures toward the player; Q deals area damage. Charges, bore charges and thunderstone blasts damage nearby creatures after excavation, with remaining rock providing cover. Bore damage follows the blast's full line and hits a creature once per explosion. Friendly townsfolk are not damage targets.

Defeated moths leave physical husks worth two charges. Husks fall onto the current terrain, can be collected with E and retain unclaimed supplies when the pouch is full. Their remaining contents persist, and collecting them cannot duplicate rewards. Townsfolk discuss encountered moths; field notes explain the fight and recovery loop.

## Recovery and persistence

Health restores at 12 points per second on the surface. Defeat returns the player to the yard with full health, equipment and money intact, releases the salvage tether and moves carried minerals into a physical recovery cache. M marks the cache; E transfers minerals back into available pack space. Overflow stays below. Further defeats merge dropped minerals into the existing cache at its original location, preserving earlier contents. Freight inventories are independent.

The mineral invariant now includes carried, sold, freight load, freight stock and recovery-cache contents. Collected deposit IDs still account for every mineral. Recovery transfers existing minerals; it does not increment mined counts or create new deposits.

`combat.js` owns enemy behavior, health, light deterrence, damage records, physical drops and validated encounter state. `actions.js` resolves one target for tool use and routes it to excavation or damage. `Cutter.trace` retains the existing wide-brush terrain probes, while creature hits require a clear line to the body. `combat-view.js` supplies original moth and axe meshes, windup rings and drop models; `combat.css` styles health and threat feedback. The existing Game, expedition, gadgets, survey, town and saves connect these systems.

Snapshots retain creature position, health, phase, remaining windup/recovery time, direction, discovery and unclaimed rewards; player health and rescue count; weapon cooldown; and exact recovery-cache/loot contents and motion. Validation rejects impossible values, bodies in solid terrain, inconsistent defeat/reward records and inventory duplication before installation. Old saves initialize encounters without resetting their density fields.

## Evidence and limitations

The full suite passed 172 checks. After final axe timing and renderer resource cleanup, all 14 focused combat checks passed again, including sustained five-second axe use at 30/60/120 Hz, model containment, open-air resonance targeting and the heart's pull. Tests also cover alternate paths around rock, telegraph timing, dodging, occluded damage/light, one-time blast records, partial loot pickup, rescue conservation, exact save/reload and legacy saves.

A fresh-start pilot excavated from spawn using the starter drill, switched to the axe after damaging the moth, won the duel while taking one hit, recovered both charges, healed at the surface and reloaded the cleared encounter. No fixture tunnels, free upgrades or direct teleports were used. The combined thunderstone/freight/mysteries campaign also completed with combat enabled in 379.5 simulated seconds. These pilots know coordinates and do not estimate human pacing or fun.

The first encounter pilot's attempt to dig below its feet also held forward input toward a small offset, walking away from the moth. Its correction aims vertically down with neutral movement. This was a pilot correction; no production teleport or terrain bypass was added.

No browser or OS input was used. Render/DOM adapters are inert. Mesh and state tests do not establish WebGL appearance, sound quality, readability or human combat feel. Real visual and human play review remains outstanding under AGENTS.md. The 73 m floor described by this checkpoint is now an earned passage into the lower workings. Further enemy variety and thrown-object combat remain future work in BEAUTY-DEPTH-COMBAT-PLAN.md.
