# The Foreman Below, local 2.13.0

Local 2.25 adds rebuilt furnace machinery and terrain-aware attack warnings. See [FOREMAN-ART.md](FOREMAN-ART.md). The gameplay rules below remain applicable.

The chamber beneath Furnace approach now contains a complete encounter. Three partly buried pressure locks feed an armored furnace. Expose a lock on every side, then break it with a mining tool, resonance, rift or explosives. Each broken lock allows another 140 points of damage to the 420-health core. Locks have 80 health; the precision lance deals 40% extra damage to them. Locks may be broken in any order, including all three before attacking the core.

The encounter wakes when the player sees the furnace at close range below 264 m or damages an exposed part after opening the rootway. F can discover it through rock and records the remaining parts on M without starting attacks. Its HUD distinguishes pressure-lock armor from an exposed core and gives attack-specific instructions.

## Attacks and terrain

The furnace alternates a cutting jet and ground shock. Its jet fixes the player's position at the beginning of a 1.65-second warning (1.25 seconds with all locks broken). The player can move off the visible line or shelter behind rock. The jet deals 24 damage once, stops at the first terrain contact and then cuts a small impact crater. The displayed impact remains at the recorded contact after the crater opens. Loading an already fired shot does not replay its damage.

Ground shock warns before a ring expands at 5.5 m/s for 2.4 seconds. It deals 20 damage to grounded players near the furnace's support level, along an unobstructed route. Lifting, moving out of the ring or remaining behind terrain avoids it. The existing grace period prevents continuous contact damage. Breaking a lock interrupts the current attack and provides a 2.4-second opening. Between attacks the furnace rests, with a shorter recovery after its final lock breaks.

All four machines use the full-volume ore/support solver and swept motion. The furnace can be undermined and fall into the player's excavations; the pressure locks and energy connections follow their actual bodies. Its large support radius extends terrain-edit notifications so cutting a far corner wakes the body. The bodies remain solid wreckage after defeat. Original procedural geometry fits within those physical boundaries; there are no static floating ore or machinery decorations substituting for the bodies.

Tool targeting resolves the physical furnace parts through the same path as cinder moths. Each blast record can damage a part once, including bore charges across their full line. Rock blocks targeting and blast propagation. Friendly townspeople remain outside the damage-target list.

## Reward and continuation

Defeating the furnace pays $5,000 once, cancels its attacks and unlocks the **foundry bore**. Press Z underground to melt a 12 m, 2 m radius passage with a six-second recharge. The ability spends no supplies, preserves minerals, damages reachable creatures along its opened path and respects property boundaries and the protected floor. A touch button and field-kit entry appear only after earning it. Its recharge persists through saves.

Ridge Common's well becomes a glowing beacon, powered strips appear along the road and both shopkeepers acknowledge the restored power. The furnace remains cleared, all prior gear and discoveries remain available, and the town/station return loop remains usable. The final reward panel offers continued mining. This adds an ability and changes the existing world; it does not make terrain infinite or add another lower region.

Player defeat uses the existing rescue system: broken locks, core damage, money and equipment persist, while carried minerals move to the recovery cache. Returning from town resumes the damaged encounter. Leaving the area delays the next attack, without healing its parts.

## Persistence and evidence

`expedition.foreman` stores part health, discovery, activity, phase, timer, aim, recorded impact, attack cycle, reward state, bore cooldown and detached bodies. Snapshots validate phase/health consistency, the pressure-lock damage cap, prerequisite progression, body extents and terrain clearance. Earlier saves initialize the machinery without rewriting any terrain or inventory. Rendering does not advance the simulation.

`foreman.js` owns the encounter and earned ability; `foreman-view.js` owns its original art, tells, lighting and town transformation. Combat exposes a shared target list so continuous tools, timed axe hits, pulses and explosive records all reach it. Attack state advances at 120 Hz. Focused tests cover real tool damage, damage caps, actual blast records, dodging and cover, lifting, 30/60/120 Hz agreement, windup/fired-shot saves, rescue accounting, physical undermining, one-time rewards, ability clearance and invalid snapshots.

`node tools/simulate-journey.mjs --foreman` completes the entire fresh-claim progression using actual Game actions. It earns the upper recoveries and supplies, restores the lower stations, reaches the chamber, uses Otis's return route, excavates the locks, fights the furnace with the lance and rift, uses the earned bore, saves/reloads, then walks to the powered common. The successful run took 496.2 simulated seconds, with the encounter/reward reload at 477.5 seconds. Its coordinate knowledge and perfect recognition of tells mean this is a reachability check, not a human difficulty estimate.

The tests use inert DOM, renderer and audio adapters. No browser or OS input was used. Actual pixels, sound, layout, pacing and human feel remain unreviewed under the session restriction. See VERIFICATION.md for commands and final counts, and BEAUTY-DEPTH-COMBAT-PLAN.md for further creatures, structures, residents and parcels.
