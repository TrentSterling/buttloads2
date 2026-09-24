# Remake verification

## Eastcut, local 2.17.0

Adds a purchasable neighboring claim with separate persistent terrain, three connected caves, 348 appended minerals, ownership boundaries, an extended freight route and wider equipment/chart/save support. Surface throws now stay inside reachable bounds and save correctly above the old coordinate limits. The published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 248 system checks passed
COMPLETE 14 parcel checks passed

node tools/simulate-journey.mjs --parcel
Upper campaign completed: 253.3 simulated seconds
Deed earned and purchased: 265.3
Town equipment purchased: 281.1
Eastcut mineral collected: 300.0
Cave, lamp and anchor reloaded: 302.1
Freight shipment reloaded: 302.3
Freight delivered: 313.3
Haul sold and return anchor used: 325.2
COMPLETE Eastcut journey
COMPLETE fresh-claim journey

node tools/build.mjs
Standalone build: dist/index.html (1101 KiB)
PASS standalone: 45 scripts compile; no external scripts or stylesheets.
```

The suite and fresh journey passed against the final gameplay code. The portable package was then built and its version checked. Logs: `tools/out/verification-2.17-final.log`, `tools/out/journey-parcel-final.log` and `tools/out/journey-parcel.json`. The new focused suite covers preservation, concurrency, rollback, full-body connected cave routes across three seeds, incremental/cold mesh parity across the join, protected roads/rim/floor, ore gravity and sale identity, equipment and survey reloads, corrupt fields, freight, recovery caches, legacy imports, purchase during a shipment and outward/upward throws.

The complete journey earns all cash and equipment through production gameplay. It walks into both shops, buys the deed and machinery, excavates the new mine and crane shaft, saves physical equipment and a shipment, sells once and returns to its anchor. No fixture cuts, free resources or direct teleports are used. Coordinate knowledge makes the duration unsuitable as a human completion-time estimate.

The first freight fixture did not clear enough floor around its dock; a properly excavated bay passed without weakening clearance rules. Review also found that resuming during asynchronous purchase could permit stale transactions. Purchase now suspends readiness until construction finishes, and the suite checks Escape and a stale supply callback. A throw beyond the original save-coordinate envelope is covered by the reachable-surface bounds and reload/collect regression.

An offline projection inspected 23,597 actual scene triangles for the surface layout. It omits shader grain, shadows, texture text and WebGL behavior. No browser or OS input automation was used. Human appearance, audio, aiming and pacing remain unverified. EASTCUT.md records the implementation and limits.

## Stonewright Sling, local 2.16.0

Adds a physical buried workshop, two resonator-operated field coils and a recoverable mineral sling. The tool lifts and throws existing loose ore through the terrain, equipment and creature collision systems. Fast impacts fracture armor; thrown minerals retain their identity and value. The published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 16 kinetic checks passed (inert scene and DOM; no browser or OS input)
COMPLETE 234 system checks passed

node tools/simulate-journey.mjs --kinetics --foreman
Stonewright coils reached: 348.4 simulated seconds
Sling earned and reloaded with exact terrain: 353.3 simulated seconds
Mineral reloaded in flight: 387.3 simulated seconds
Saved projectile damaged a crawler: 387.4 simulated seconds
Furnace approach restored: 461.0 simulated seconds
Foreman defeated, foundry bore used and reward reloaded: 501.0 simulated seconds
Powered Ridge Common reached: 519.7 simulated seconds
COMPLETE Stonewright journey: excavated and resonated both workshop coils, recovered the sling, reloaded a thrown mineral in flight and damaged a crawler.
COMPLETE crawler journey: earned the rootway, fought a lower-mine crawler, recovered its tooth, bought/reloaded the impact head and used Otis return travel.
COMPLETE furnace journey: excavated pressure locks, fought the physical furnace, earned and used foundry bore, reloaded the reward and returned to the powered common.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/test-kinetics.mjs
COMPLETE 16 kinetic checks passed (inert scene and DOM; no browser or OS input)

node tools/build.mjs
Standalone build: dist/index.html (1090 KiB)
PASS standalone: 43 scripts compile; no external scripts or stylesheets.
```

The focused suite passed again after adding an explicit corrupt-save case with two flights referencing the same loose mineral. No gameplay changed after the aggregate suite passed. Coverage includes physical workshop recovery, buried coils, swept cover, one-hit damage, armor, furnace locks, collectible mineral identity, frame-rate equivalence, interrupted holds, real pause/tool/touch paths, blast interruption, midflight saves, falling geometry and exact older terrain.

Earlier pilots exposed an ore-clearance problem in the input guidance: a mineral seated on a ledge could not follow the hold target toward a low enemy. The solver correctly stopped it, but the UI still offered a normal release prompt. It now shows an amber field and a clearance hint. A focused replay lifted the mineral above the ledge and broke armor. A subsequent pilot waited beneath a ceiling for an impossible hover height; it now begins pulling after reaching that ceiling. The final fresh run earns and operates everything through production interactions, with no fixture shafts, free resources or direct teleports. The pilot has coordinate knowledge, so elapsed time is not human campaign length.

Evidence: `tools/out/verification-2.16-final.log`, `tools/out/journey-kinetics.json` and the inspected actual-geometry projection `tools/out/kinetic-projection.png`. Browser pixels, rendered lighting, sound, layout and human combat feel remain unverified. No browser or OS input automation was used. The larger expansion goal remains active; STONEWRIGHT.md and BEAUTY-DEPTH-COMBAT-PLAN.md retain its remaining work.

## Shale Crawlers, local 2.15.0

Adds three persistent armored ground creatures, terrain-supported navigation, shell/rear damage, a committed claw attack, excavation-induced falls and corpse supplies. A recovered tooth unlocks Otis's paid impact axe head. The previous town, rescue, deeper mine and furnace remain included. The published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 12 crawler checks passed (inert scene and DOM; no browser or OS input)
COMPLETE 218 system checks passed

node tools/simulate-journey.mjs --crawlers --foreman
First basalt tooth recovered: 313.1 simulated seconds
Impact head installed, reloaded and Otis return used: 326.1 simulated seconds
Second and third teeth recovered: 387.1 and 428.4 simulated seconds
Furnace approach restored: 452.6 simulated seconds
Foreman defeated, foundry bore used and reward reloaded: 492.6 simulated seconds
Powered Ridge Common reached: 511.3 simulated seconds
COMPLETE crawler journey: earned the rootway, fought a lower-mine crawler, recovered its tooth, bought/reloaded the impact head and used Otis return travel.
COMPLETE furnace journey: excavated pressure locks, fought the physical furnace, earned and used foundry bore, reloaded the reward and returned to the powered common.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/test-crawlers.mjs
COMPLETE 12 crawler checks passed (inert scene and DOM; no browser or OS input)

node tools/build.mjs
Standalone build: dist/index.html (1067 KiB)
PASS standalone: 41 scripts compile; no external scripts or stylesheets.
```

The aggregate and journey passed before one final save-validation correction: a crawler's remembered sighting now accepts the player's narrower clearance near the claim boundary. The focused suite passed again with a regression proving x=13.4 survives and an out-of-bounds sighting rejects. Gameplay movement and damage were unchanged. CRAWLERS.md records mechanics, coverage, the landing-damage fix and pilot corrections.

Evidence is in tools/out/verification-2.15.log and tools/out/journey-crawlers.json. An actual-mesh projection was inspected. These use inert rendering/DOM and coordinate-aware navigation; they do not certify human pacing, WebGL pixels, layout or audio. No browser or OS input was used. This is progress toward the broader expansion plan, not its completion.

## Bring Inez Home, local 2.14.0

Adds a physical survey-bell rescue, a third friendly resident, an occupied survey office and services that mark real uncollected minerals or optional structure leads. Existing mine terrain and inventories are preserved; the published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 11 rescue checks passed (inert renderer and DOM; no browser or OS input)
COMPLETE 206 system checks passed

node tools/simulate-journey.mjs --rescue
Inez raised to surface: 25.6 simulated seconds
Inez rescued and survey office chart reloaded: 48.2 simulated seconds
All original recoveries complete: 326.5 simulated seconds
COMPLETE rescue journey: excavated the survey bell, powered its winch, cleared its ascent, met Inez at the office, bought a real mineral chart and reloaded it.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (1043 KiB)
PASS standalone: 39 scripts compile; no external scripts or stylesheets.
```

All 206 checks passed together on the final gameplay source. The 11 focused rescue checks then passed with added model-bound assertions. Generated evidence: tools/out/verification-2.14.log and tools/out/journey-rescue.json. The new signal required extending an older scanner whitelist; town checks now distinguish two present residents from the third, initially hidden rig. No old behavior assertion was removed.

The rescue suite covers actual controls, pausing/input cancellation, supplies, full-body contact, rock/player/equipment obstruction, frame-rate equivalence, mid-lift save, the office's doorway and interactions, chart economy, old-world retention and corrupt-state rejection. RESCUE.md describes the mechanics and pilot navigation fixes. Simulation uses coordinate knowledge and does not certify human pacing. An actual-mesh projection was inspected, but WebGL appearance, sound, layout and human feel remain unreviewed. No browser, OS input or live sound device was used.


## The Foreman Below, local 2.13.0

Adds a physical furnace boss at the lower chamber, three partly buried damageable pressure locks, segmented core armor, cutting-jet and ground-shock attacks, persistent damage/rescue, an earned 12 m foundry bore and a powered-town transformation. Mining tools and real blast records use the shared target system. The published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 12 furnace checks passed (inert scene and DOM; no browser or OS input)
COMPLETE 195 system checks passed

node tools/simulate-journey.mjs --foreman
Furnace approach restored: 441.8 simulated seconds
Otis return route used; furnace encounter started: 460.3 simulated seconds
Foreman defeated, foundry bore used and reward reloaded: 477.5 simulated seconds
Returned to powered Ridge Common: 496.2 simulated seconds
COMPLETE furnace journey: excavated pressure locks, fought the physical furnace, earned and used foundry bore, reloaded the reward and returned to the powered common.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (1023 KiB)
PASS standalone: 37 scripts compile; no external scripts or stylesheets.
```

All 195 checks passed together on the final gameplay source. The final build additionally includes the About/controls paragraph. Generated evidence is in tools/out/verification-2.13-final.log and tools/out/journey-foreman.json. The journey passed before the final recorded-impact visual/save field; the final focused and aggregate checks validate that field and prove a loaded fired jet cannot deal its damage again.

Furnace tests exercise dormant/locked behavior, real drill/axe/blast damage and armor limits, dodging, wall protection before impact carving, lifting above shock, attack timing at 30/60/120 Hz, windup and fired-shot saves, real player rescue and mineral conservation, undermined wide machinery, one-time reward and town state, usable bore clearance, ownership protection, cooldown persistence, rejected corrupt snapshots and old-save terrain retention. Model bounds and finite geometry are checked. The older lower-mine equipment fixture now excavates a loading bay beside the furnace because its previous central position is occupied by the new physical boss.

This is a coordinate-aware reachability simulation, not a human difficulty or pacing verdict. It uses the actual game loop and production actions without fixture tunnels, direct player teleports or unearned supplies. Isolated system tests use fixtures for controlled conditions. No browser, real sound device or OS input was used. WebGL appearance, audio, layout and human feel remain unreviewed. The broader expansion goal remains active for further enemies, structures, residents, parcels and review; see FOREMAN.md and BEAUTY-DEPTH-COMBAT-PLAN.md.

## Lower workings, local 2.12.0

Extends the mine to 297 m through an earned heart breakthrough, with four lower strata, five additional cave networks, 588 appended deposits, three physical repairable stations, equipment rewards and town return routes. The original upper terrain and ore prefix remain intact. The published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 11 lower mine checks passed (no browser or input automation)
COMPLETE 183 system checks passed

node tools/simulate-journey.mjs --deep
Rootworks pump house restored: 316.1 simulated seconds
Ashfall exchange restored: 378.9 simulated seconds
Furnace approach restored: 441.8 simulated seconds
Saved/reloaded at 279.1 m, then used Otis's return service: 460.5 simulated seconds
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (999 KiB)
PASS standalone: 35 scripts compile; no external scripts or stylesheets.
```

All 183 checks passed together on the final gameplay source. Evidence: tools/out/verification-2.12.log and tools/out/journey-deep.json (generated, ignored). The journey uses earned supplies, production Game interactions, mining and magic, ordinary recall, exact terrain save/reload and the real town service callback. It uses coordinate knowledge and does not measure human pacing. Isolated tests also prove bit-exact legacy field copying, stable ore prefixes, locked/open gate behavior, full player clearance through the breakthrough, deep seam/cold-remesh parity, repair atomicity, moving station support, rejected obstructed travel, bounded deep survey profiles, actual drill/lift/scanner rewards, and deep mineral/light/anchor/freight persistence.

The old survey-range and five-palette assertions were updated to the versioned world extent and nine strata. Legacy cave tests compare the preserved upper projection and then the entire migrated field on round-trip. Early failures in the new isolated checks were fixture bookkeeping/API assumptions (collected salvage, fixed-step sample count, floor aim reach and empty-string placement status); the full fresh journey passed without a gameplay bypass. No browser, OS input or real sound device was used. The Node adapter explicitly replaces play() to prevent browser input acquisition.

The boss and final underground transformation remain unfinished; this checkpoint does not complete the active goal. Actual WebGL appearance, layout, sound and human feel remain unreviewed under AGENTS.md. Architecture and constraints are in DEEP-WORKINGS.md and remaining scope is in BEAUTY-DEPTH-COMBAT-PLAN.md.

## Cinder moths and mining weapons, local 2.11.0

Adds shared excavation/damage targeting, a timed mining axe on key 6, three persistent cinder moths with collision-checked flight and telegraphed attacks, defensive work lights, health, recoverable mineral cargo and physical supply rewards. Original moth/axe models, hit/health/threat feedback, field notes and town dialogue connect the encounter to the rest of the game. The site remains on 2.8.0.

```text
node tools/test.mjs
COMPLETE 14 combat checks passed (inert renderer and DOM; no browser or OS input)
COMPLETE 172 system checks passed

node tools/test-combat.mjs
COMPLETE 14 combat checks passed (inert renderer and DOM; no browser or OS input)

node tools/simulate-combat.mjs
COMPLETE fresh encounter: excavated from spawn, damaged with starter drill, won axe duel, recovered two charges, rested at surface and reloaded persistent cleared encounter.

node tools/simulate-journey.mjs --thunderstone --freight --mysteries
COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (974 KiB)
PASS standalone: 32 scripts compile; no external scripts or stylesheets.
```

The full suite passed before final axe cadence and renderer resource cleanup. All 14 focused combat checks then passed on the final source. Their added assertions include sustained five-second axe damage at 30/60/120 Hz, model containment, real open-air resonance targeting and gravity drain/pull. The tests exercise navigation around a remaining rock wall, full-body swept movement, telegraphs and dodges, light/rock shielding, unique blast records, physical and partial loot, exact mineral conservation through rescue/reload and legacy encounter initialization. COMBAT.md describes the boundaries.

The encounter pilot won with the starter drill and newly unlocked axe while taking one hit, recovered two charges, returned by recall, healed and reloaded the cleared encounter. Its initial underfoot-digging fallback walked diagonally away while cutting; correcting its aim to vertical with neutral movement completed the intended route without a production bypass. Report: tools/out/journey-combat.json. The complete campaign with thunderstone, freight and both mysteries finished in 379.5 simulated seconds with combat enabled; report: tools/out/journey-thunderstone.json.

These are coordinate-aware pilots using actual simulation and Game actions. They do not estimate human pacing or difficulty. No browser, sound device or OS input was used. Render/DOM adapters are inert; WebGL appearance, sound, browser layout and human combat feel are unverified. Greater depth, additional enemies and the boss remain unfinished under the active expansion goal.

## Natural workings, local 2.10.0

Three versioned natural cave networks, physical repairable survey cabinets, local charts, cave formations, chamber names and townsfolk reactions. Old claims retain their exact density field and receive cabinets in existing rooms. The expanded surface and town from 2.9.0 are included. This build is local; the published site remains 2.8.0.

```text
node tools/test.mjs
COMPLETE 12 cavern checks passed (inert renderer; no browser or OS input)
COMPLETE 158 system checks passed

node tools/test-caverns.mjs
COMPLETE 12 cavern checks passed (inert renderer; no browser or OS input)

node tools/simulate-journey.mjs --thunderstone --freight --mysteries
COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/simulate-journey.mjs --refuges
COMPLETE survey refuge: excavated cabinet, spent one light, charted passages, reloaded exact terrain and completed the campaign.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/simulate-journey.mjs --legacy --refuges
COMPLETE survey refuge: excavated cabinet, spent one light, charted passages, reloaded exact terrain and completed the campaign.
COMPLETE legacy-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (941 KiB)
PASS standalone: 29 scripts compile; no external scripts or stylesheets.
```

The complete suite passed before the final cabinet face adjustment. The focused cavern suite then passed on the final source, including mesh containment within physical support and persistent NPC responses to repair. The older isolated Game fixture now admits an absent refuge system, consistent with its other absent systems. The scanner regression admits actual refuge IDs while retaining the prohibition on early geode detection.

The combined campaign completed in 379.3 simulated seconds. The fresh refuge route completed in 316.8 s; the old-format refuge route completed in 301.9 s. These pilots use actual movement, cutting, purchases, E interactions, recall and save installation. They know coordinates and are not pacing estimates. Reports: tools/out/journey-thunderstone.json, journey-refuges.json and journey-legacy.json.

The focused checks verify all loop junctions and side chambers are reachable by a full player across three seeds, original yard/rim/objective shells remain unchanged, unsupported ore/cabinets fall, repair consumes a light once, hidden caves stay off the survey, unsupported formations disappear, physical models stay inside their collision boxes, and portable saves retain generation, exact terrain and cabinet motion. See CAVERNS.md.

No browser or OS input was used. Renderer and DOM adapters are inert. WebGL appearance, lighting, browser layout, sound and human gameplay quality remain unverified. The 73 m floor is unchanged; deeper regions, combat, enemies and the boss remain planned work under the active expansion goal.

## Ridge Common, local 2.9.0

Adds an expanded walkable surface, two enterable shops, two friendly residents with reactive dialogue and existing economy services, shared building collision, procedural town art, a service panel and additive saved conversation history. The published site remains 2.8.0; this is a local checkpoint of the active expansion goal.

```text
node tools/test.mjs
COMPLETE 12 town checks passed (inert renderer and DOM; no browser or OS input)
COMPLETE 146 system checks passed

node tools/test-town.mjs
COMPLETE 12 town checks passed (inert renderer and DOM; no browser or OS input)

node tools/simulate-journey.mjs --thunderstone --freight --mysteries
COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (925 KiB)
PASS standalone: 26 scripts compile; no external scripts or stylesheets.
```

The full suite passed before the final conversation portrait and keyboard polish. The focused town suite then passed again with the final source, including the real E binding, native Tab navigation and direct Escape return. These checks cover actual movement into both shops and back to the claim, physical gate openings and walls, protection of unowned soil, aimed/occluded conversation, cancelled throws, real stock/sales/upgrades, freight gates, stale callbacks, persistent dialogue, expanded saved positions and exact old-claim terrain retention. See TOWN.md for details.

The combined original campaign still completes in 386.7 simulated seconds with the town installed. This pilot has coordinate knowledge and does not estimate human pacing. Its report is tools/out/journey-thunderstone.json.

One old assertion called all horizontal concrete faces top faces. It was updated to check upward normals, retaining its ground-flicker test while admitting the downward-facing underside of the new well. No production terrain workaround was introduced for that assertion.

Offline projected-geometry images were inspected for character proportions and town placement. They do not reproduce textures, clipping, shadows or WebGL shading. No browser or OS input was used. Actual browser layout, lighting, sound and human usability remain unverified. Caves, greater depth, combat and the remaining planned expansion are not complete.

## Field Kit stopping build, 2.8.0

The expanded equipment HUD is compacted around owned tools and current supplies. I opens a paused field kit; buttons and 1-5/X/N change equipment without resuming. Opening it cancels held throws, placement, firing and movement. Optional contextual tips retire after successful use or Y dismissal, yield to active interactions and hazards, and retain preferences in saves. Touch actions reveal with progression.

```text
node tools/test.mjs
COMPLETE 10 field kit checks passed (inert DOM; no browser or input automation)
COMPLETE 134 system checks passed

node tools/simulate-journey.mjs --thunderstone --freight --mysteries
COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (898 KiB)
PASS standalone: 23 scripts compile; no external scripts or stylesheets.
```

The field kit checks cover fresh and unlocked visibility, real selection and aria state, keyboard repeat/modifier handling, paused selection, held-input cancellation, tip priorities, dismissal while firing, rejected throws, successful learning, touch labels, old-save initialization and malformed-history rejection before mutation.

The combined scripted route completed in 386.7 simulated seconds. Its initial freight attempt aimed at a fixed location after the pilot had descended past it. The pilot now maintains its approach height and searches real placement directions for an available floor. This was a pilot correction, not a production terrain or placement bypass. It still earns equipment, cuts routes, places the dock through normal controls, ships real cargo and solves both discoveries before finishing the campaign. Report: tools/out/journey-thunderstone.json. The pilot knows coordinates; its duration is not a human pacing estimate.

No browser, sound device or OS input was used. DOM, renderer and audio adapters are inert. Rendered layout, WebGL output, sound balance and human gameplay quality remain unverified. See HUD-AUDIT.md for the source audit and layout review targets.

At Trent's request, the current goal ends with this local build. Remaining review and candidate additions are recorded in NEXT-SESSION.md. No commit, push or deployment is part of this closeout. Historical statements below about the goal remaining active describe their earlier checkpoints.

## Thunderstone Seams update, 2.7.0

Four physical crystal seams connect mineral prospecting with demolition. Expose and recover a crystal for a spare charge, or ignite it with a blast/resonance pulse to open a delayed chain through the surrounding mineral pocket. Removing a link can break the chain. The scanner, survey, journal, interaction prompt, ignition warning, sound and blast feedback are connected to production Game state. The rift can now widen an opening whose center is clear but whose rim blocks the player.

```text
node tools/test.mjs
COMPLETE 13 thunderstone checks passed (no browser or input automation)
COMPLETE 124 system checks passed

node tools/simulate-journey.mjs --thunderstone
COMPLETE thunderstone choice: excavated and recovered one crystal, planted a real remote, opened the remaining seam and finished the campaign.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/simulate-journey.mjs --freight --mysteries
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (876 KiB)
PASS standalone: 22 scripts compile; no external scripts or stylesheets.
```

The thirteen new checks verify stable old mineral IDs and 48 appended deposits; scan discovery without terrain changes; detachment, swept contact and support removal; delayed propagation without duplicate blasts or destroyed valuables; range/rock shielding; single-use harvesting and chain interruption; interaction constraints; bore and resonance ignition; identical craters, consumed links and blast records at 30/60/120 Hz; real throw/E/scan/journal/HUD bindings; finite scene transforms and geometry matching physical support points; scanner marker removal; portable mid-chain installation; older-save migration; malformed state rejection; and clearing a body-blocking cleft with a rift when the center ray misses.

The thunderstone pilot uses ordinary excavation, earned money, a real remote and the existing recall action. It recovers the first crystal for supplies and blows the remaining seam, then completes both heavy recoveries, the seal, heart and geodes. Its first run found a rift contact failure in the final descent. After the production rim-contact fix and a focused regression, the complete route passed in 226.2 simulated seconds. The combined freight/mysteries route passed in 288 seconds. These are scripted pilots with exact coordinate knowledge, not human campaign-length estimates. Reports are in `tools/out/journey-thunderstone.json` and `tools/out/journey-freight.json`.

The older scanner assertion was expanded to admit the new thunderstone signal type while explicitly retaining the prohibition on early geode reveals. No browser, audio device or OS input was used. The renderer and DOM remain inert adapters, so pixels, WebGL output, visual clarity and human balance remain unverified. Existing user save files were not modified. The broad goal remains active.

## Excavation Feedback update, 2.6.0

Adds stratum-colored fragments, soft dust, mineral glints, short blast lights and rings, continuous underground color transitions, and procedural spatial audio. Effects are cosmetic and do not enter the save ledger. The tool motion setting now covers the rotor, pressure needle and magical tool animation. Existing loops mute when sound is disabled and fade on pause.

```text
node tools/test.mjs
COMPLETE 11 feedback checks passed (inert renderer and audio; no browser or input automation)
COMPLETE 111 system checks passed

node tools/simulate-journey.mjs --freight
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (863 KiB)
PASS standalone: 20 scripts compile; no external scripts or stylesheets.
```

The feedback suite covers real-density contact, finite and bounded particles, matching movement at 30/60/120 Hz, expiry, one emission per blast, gameplay-state isolation, edited-terrain gating, geological/mineral colors, render-state stability, finite Three.js instance transforms/fades, texture data, shader injection points, occluded flash lights, disabled tool motion, unchanged player look and continuous depth palettes. It generates actual samples at 44.1 and 48 kHz and checks finite amplitudes, signal energy, mean offset and endpoints. Listener rotation, distance attenuation and rock filtering are checked separately.

A device-free WebAudio adapter runs production AudioEngine initialization, routing through its limiter, voice and buffer caps, event disconnection, live mute, loop silence, repeated initialization and unavailable-device handling. Actual Game updates exercise cutter/ambient loops and single playback per blast. This adapter verifies behavior and parameter values, not the sound heard by a listener.

The fresh freight journey still completes in 247 simulated seconds, shipping real minerals and finishing both heavy recoveries, the seal, heart and geodes with the feedback simulation enabled. This is a scripted pilot with coordinate knowledge, not a human pacing result. The portable file was rebuilt; no browser, OS input or sound device was used. WebGL compilation, pixels, audible balance and human play review remain unverified. The broad game-improvement goal remains active.

## Freight Works update, 2.5.0

Adds a purchased, reusable crane with an underground loading dock, physical freight cage, surface gantry, travelling trolley and yard depot. Cargo is conserved across pack, cage, delivered stock and sales. Placement, automatic return, recall, take-back, packing, upgrades, save/load, obstruction markers and chart markers are integrated with the real Game and Three.js geometry.

```text
node tools/test.mjs
COMPLETE 14 freight checks passed (no browser or input automation)
COMPLETE 100 system checks passed

node tools/build.mjs
Standalone build: dist/index.html (847 KiB)
PASS standalone: 17 scripts compile; no external scripts or stylesheets.

node tools/simulate-journey.mjs --freight
COMPLETE freight loop: earned crane, placed dock, shipped real cargo, collected yard payment and continued the campaign.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/simulate-journey.mjs --mysteries
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.
```

The freight suite verifies progression and spending; non-mutating placement; full-cage terrain contact; blocked narrow shafts; delivery-only sale eligibility; single payment; safe recall and take-back; capacity overflow; repeated shipments and preserved stock after packing; player/salvage obstruction; matching movement at 30/60/120 Hz; actual T/E and touch-cancellation callbacks; survey and finite scene geometry; portable mid-shipment installs; old-claim initialization; and malformed or duplicated inventory rejection.

The freight pilot uses normal digging, earned money, actual placement and loading controls, and the existing recall action. It ships 24 minerals and collects 10 more while the shipment travels. The resulting 34-mineral sale adds $672. It then finishes the main campaign and validates the save. `tools/out/journey-freight.json` records the run. The full route took 247 simulated seconds with precise coordinate knowledge; this is not a human pacing estimate. The mystery route still completes without owning freight equipment.

All checks use an inert DOM and renderer. They do not establish WebGL pixels, browser layout, audible output, human usability or balance. No browser or OS input automation was used. User save files and browser state were left untouched. The broad game-improvement goal remains open for visual review, play feedback and further iteration.


## Strange Machines update, 2.4.0

Two optional discoveries connect exploration to the explosive kit and mineral prospecting. The journal reveals main discoveries gradually. A tracked mystery changes the scanner bearing; unsolved known sites appear on the existing survey. The optical apparatus, impact seals, opening vault, beam endpoints and upgraded charge guides use procedural Three.js geometry.

```text
node tools/test.mjs
COMPLETE 11 mystery checks passed (no browser or input automation)
COMPLETE 86 system checks passed

node tools/build.mjs
Standalone build: dist/index.html (824 KiB)
PASS standalone: 15 scripts compile; no external scripts or stylesheets.

node tools/simulate-journey.mjs --demolition
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/simulate-journey.mjs --mysteries
COMPLETE optional discoveries: excavated both sites, synchronized real charges, reconnected prisms and earned both rewards.
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.
```

The new suite covers discovery boundaries, concealed virgin caves, optional tracking, slow versus simultaneous blasts, actual planted remote bodies, reward idempotence, upgraded bore excavation, buried-seal rejection, continuous beam connection, rotation reach/aim/occlusion, real E input, mineral filtering and extended scan range, real survey controls, finite ruin geometry, blocked beam endpoints, nine-meter preview transforms, old-save migration and malformed progress rejection.

The mysteries journey earns both rewards through actual excavation and gadget/prism actions, then finishes the main campaign. No cash injection, prepared shafts or direct teleports are used. `tools/out/journey-mysteries.json` records the route; its approximately 235 simulated seconds are a pilot with exact coordinate knowledge, not a human completion estimate. The ordinary demolition route still completes without solving either optional site.

Rendering and DOM adapters are inert. These checks do not certify pixels, WebGL shaders, layout, audio playback, puzzle readability, human balance or enjoyment. No browser was launched, focused or automated, and no OS mouse or keyboard input was sent. Existing user claims were not modified.


## Demolition update, 2.3.0

Adds depth-unlocked remote satchels and directional bore charges, a charge selector, shape previews, remote detonation, disarming, persistent attachments/orientation, and armed-charge survey markers. Ordinary charges remain compatible with older saves. Equipment can now be thrown from a lift hover above the marked claim.

```text
node tools/test.mjs
COMPLETE 15 ore checks passed (no browser or input automation)
COMPLETE 22 depth checks passed (no browser or input automation)
COMPLETE 12 fieldwork checks passed (no browser or input automation)
COMPLETE 14 explosive checks passed (no browser or input automation)
COMPLETE 75 system checks passed

node tools/simulate-journey.mjs --demolition
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (806 KiB)
PASS standalone: 13 scripts compile; no external scripts or stylesheets.
```

The new tests use actual editable density and the production collision solver. They cover depth gates and atomic two-charge spending; attachment to a ceiling; indefinite remote arming; falling after support removal; multiple remotes firing once; disarm refunds; bore direction held after looking elsewhere; a passable player-sized tunnel with untouched adjacent rock; protected borders; released ore without destruction; old and new save/load behavior; malformed mode/direction/attachment rejection; real N/H/E callback integration; directed Three.js preview geometry; and matching bore craters at 30, 60 and 120 Hz.

The demolition journey starts with a fresh claim, earns the flywheel payment, spends $224 on supplies at the workshop, and uses remote satchels during engine extraction and bore charges during the deeper descent. The final run opened all three stones, awakened the heart, recovered the geodes, showed the ending and validated its save. `tools/out/journey-demolition.json` records its purchases, charge deployments and milestones. It completed in 184.3 simulated seconds with perfect coordinate knowledge; this is not evidence of human campaign length or balance. The pilot had to use its normal lift after the new charges opened the chamber floor beneath it.

No browser or OS input automation was used. Three.js geometry was constructed through the inert renderer, so this is not a visual, shader, browser-layout or audio approval. The portable release was rebuilt without changing user saves or browser state.

## Fieldwork update, 2.2.0

Adds a saved exploration chart, scanned signals and ore, charge trajectory/blast previews, recoverable work lights, and a marker at snagged salvage contacts. Fixes wider brushes missing narrow tunnel walls, saturated rim contacts stopping excavation, and blast impulses passing through remaining rock.

```text
node tools/test.mjs
COMPLETE 15 ore checks passed (no browser or input automation)
COMPLETE 22 depth checks passed (no browser or input automation)
COMPLETE 12 fieldwork checks passed (no browser or input automation)
COMPLETE 61 system checks passed

node tools/simulate-journey.mjs
COMPLETE fresh-claim journey: earned upgrades, hauled both machines, opened seal, awakened heart, recovered all geodes, validated save.

node tools/build.mjs
Standalone build: dist/index.html (792 KiB)
PASS standalone: 13 scripts compile; no external scripts or stylesheets.
```

The fieldwork suite exercises real keyboard and touch-button callback bindings against inert elements, preview non-mutation, predicted versus actual detonation on static terrain, cancellation without spending, light refunds and spatial/render removal, blast occlusion, unexplored-cave concealment, old-claim reconstruction, survey corruption rejection, map control output, and Three.js trajectory geometry. It writes `tools/out/survey-plan.svg` and `survey-profile.svg`; these are generated chart artifacts, not screenshots of browser layout.

The separate journey runs the actual Game update and editable world from a fresh claim. It mines and sells its first haul, buys its cutter and cargo upgrades, excavates and hauls both machines, opens the seal, awakens the heart, and uses Q to recover the three geodes. It asserts that the ending appeared and validates the final save. It does not inject money, dig fixture shafts, bypass salvage delivery, or teleport outside the game's normal recall action. The pilot knows target coordinates and uses precise aim, including the same obstruction point exposed to the player. This proves one complete route is reachable; its 329.4 simulated seconds are not a human completion-time estimate. `tools/out/journey.json` records the milestones.

The journey reproduced two genuine cutter stalls that the earlier prepared-shaft checks missed. The final run clears them with the production cutter changes. The hauling pilot also needed to aim at the corner contacting rock instead of repeatedly cutting above the engine. The new obstruction marker makes that information available in normal play.

No browser was launched, focused, captured or controlled for this pass. The user's mouse was not used. The renderer and DOM remain inert adapters: pixels, shaders, browser layout, audio and human pacing still need normal-play review. Historical browser results below do not validate these additions. The existing portable build was regenerated; existing user saves were not modified.

## The Depths Update, 2.1.0

Current pass adds layer/tool unlocks, branching seams, physical salvage and tethering, recall-safe heavy loads, a return anchor, resonance stones, the magical heart, return geodes, thrown charges, persistent physical lights, and scene/UI integration. Concrete apron geometry is raised above the ground plane.

```text
node tools/test.mjs
COMPLETE 15 ore checks passed (no browser or input automation)
COMPLETE 21 depth checks passed (no browser or input automation)
COMPLETE 48 system checks passed

node tools/build.mjs
Standalone build: dist/index.html (770 KiB)
PASS standalone: 12 scripts compile; no external scripts or stylesheets.
```

The depths suite includes actual Game boot, update, HUD, workshop bindings, tool switching, chapter announcements, recall, paced hauling through real density, delivery, snapshot validation and install. Three.js constructs the real geometry and transforms. A narrow shaft blocks a load until widened; rewards do not repeat. Tests cover blast fuse timing, impulses, support removal below lights, sparse device IDs after bomb destruction, saved fuses and velocity, gravity line-of-sight, seal/heart/geode gates, corruption rejection and older v2 migration. The apron test checks that no horizontal concrete triangle is coplanar with y=0.

The scene integration tests use an inert renderer and DOM adapter. These checks do not render pixels, compile WebGL shaders, exercise a real browser layout, audition audio or certify pacing. No browser was launched, focused or automated for this pass. The user's mouse was not used. The older browser suite below is historical and is not evidence for this update.

## Floating-ore follow-up

The initial rewrite still left exposed ore at its generated coordinates. This was a missed bug, not covered by the original test run. The follow-up adds terrain-driven detachment, falling and terrain collision, rest/wake behavior, moving pickup/scanner indexing, instance-buffer updates, and persistent loose-body positions and velocities.

```text
node tools/test.mjs
COMPLETE 15 ore checks passed (no browser or input automation)
COMPLETE 27 system checks passed
```

Tests exercise actual editable density and the actual Game.update loop. The opening simulation cut the seam, walked into the excavation, sold 9 minerals and bought the first cutter upgrade. Ore tests also cover fast falls onto a thin shelf, shaft-wall collision, removing settled ore's support, cargo-full behavior, pickup through rock rejection, 30/60/120 Hz equivalence, exact support vertices versus Three.js geometry, and visible/scanner matrix updates. Falling velocity and position survive portable-save round trips; earlier v2 saves acquire the new physics on load.

This follow-up was tested entirely in Node, including Three.js buffer calculations. No browser was launched and no mouse or keyboard automation was used. The browser results below describe the earlier remake, before the ore fix.

## Original remake browser run

Local validation on Windows with Node 24 and headless Chrome. The browser harness uses SwiftShader, so this is not an RTX performance claim.

The browser run below completed before Trent reported cursor interference. Browser testing was stopped and no matching test Chrome processes remained. The CDP helper now disables pointer-lock requests before navigation and no longer foregrounds test pages. That guard was syntax-checked without launching another browser; the gameplay results below are from the completed run before this automation-only change.

```text
node tools/test.mjs
COMPLETE 12 system checks passed

node tools/build.mjs
Standalone build: dist/index.html (712 KiB)

node tools/verify-remake.mjs
COMPLETE 29 browser checks passed
```

The first automated haul filled the starting 12-slot rack by using the real cutter and collection code. Keyboard E sold the minerals and paid the first delivery contract; the workshop button purchased the first cutter upgrade. Mouse-down remained armed across an air miss and after releasing the right mouse button. No second left click was necessary to resume excavation.

System checks compared 1,308 shared active cells across chunk seams after shaft and border edits. Shared positions and normals matched exactly. Every incremental mesh also matched a fresh remesh of the current field. No triangles referenced inactive cells; triangle winding and packed face ownership passed.

The controller was tested standing on the surface, falling down an excavated shaft, lifting back out, and lifting against an uncut cave ceiling. Deep browser tests used fixture shafts and positions, then the real proximity interaction, discovery and delivery code. Full campaign pacing has not been certified by a human playthrough.

Save tests round-tripped the complete density field, inventory, gear, discoveries and ending through portable JSON and IndexedDB reload. Foreign, non-finite, out-of-range and inconsistent saves were rejected without changing the active claim. Concurrent saves retained the latest settings; an injected write failure left a playable, exportable claim.

Touch was tested with Chrome touch emulation at 390 × 844, including actual touch-start and touch-end events on the movement stick. The release cleared movement. Modal layout stayed inside the viewport. The standalone build booted from a file URL, and the workerless construction fallback booted successfully. No browser exceptions or shader errors were reported during the gameplay checks.

`tools/out/browser-results.json` contains the current structured result. `tools/out/remake-*.png` contains the visual evidence. `tools/visual-review.mjs` captures yard, workshop and shaft views without changing saved state.

The two pre-existing untracked files (the scratch diff and `tools/play-shots.mjs`) were left untouched. The latter targets the original prototype's API. Current entry points are documented in README.md; `verify-underground.mjs` forwards to the remake suite.
