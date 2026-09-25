# BUTTLOADS 2: The Deepening

**Cutting response, local 2.21.0.** A first-person excavation game about turning a backyard hole into a mine, recovering oversized machinery, and finding something alive underneath it.

The local build adds a small town, friendly merchants, natural caves, creatures and a continuation through the old floor into a 297 m mine. Restored stations grant equipment and return routes through Otis. The published site remains 2.8.0. Current expansion scope is in [docs/BEAUTY-DEPTH-COMBAT-PLAN.md](docs/BEAUTY-DEPTH-COMBAT-PLAN.md), town details in [docs/TOWN.md](docs/TOWN.md), cave details in [docs/CAVERNS.md](docs/CAVERNS.md), combat details in [docs/COMBAT.md](docs/COMBAT.md), the continuation in [docs/DEEP-WORKINGS.md](docs/DEEP-WORKINGS.md), the furnace encounter in [docs/FOREMAN.md](docs/FOREMAN.md), the surveyor rescue in [docs/RESCUE.md](docs/RESCUE.md), the lantern discovery in [docs/LANTERN-LEVIATHAN.md](docs/LANTERN-LEVIATHAN.md), and test evidence in [docs/VERIFICATION.md](docs/VERIFICATION.md).

Play at **https://tront.xyz/buttloads2/**, or open **index.html** or the portable **dist/index.html** locally. No install, CDN, server or runtime build tool is required. GitHub Pages publishes the repository root from `main`; the portable file is generated with `node tools/build.mjs`.

## What is in this build

- The scoop now cuts a broad, shallow volume; the lance makes a longer oriented bore. Corrected edge probes follow sloping cuts. Formed scoop and reciprocating lance heads, load-dependent tool motion and audio, distinct debris and depth-tested rock-contact ticks make their jobs more visible. Existing excavations remain intact. See [docs/DIGGING-RESPONSE.md](docs/DIGGING-RESPONSE.md). All 287 system checks and the fresh fossil campaign pass.

- Visible UI now renders inside the game through Three.js: analog depth/cargo instruments, an illustrated tool case, ruled merchant ledgers, field notes, survey plan/profile and every menu. Mouse, keyboard and touch controls use the game canvas. See [docs/GAME-INTERFACE.md](docs/GAME-INTERFACE.md) for the implementation, actual paint studies and limits.
- Fixed the quarter-metre opening between the mine mesh and common land. Full-depth save exports now pass the import button's size limit. All 276 system checks pass. The wider visual and digging-feel pass remains unfinished; this is a local UI checkpoint.

- A visual pass replaces the coarse terrain checker grain with mineral variation, sediment bands and surface relief. A warm horizon, broader town shadows, varied tree canopies and common-land plants give the surface more character. Shops have full weatherboards, corner trim and side windows.
- The cutter has a beveled casing, helical bit, gauge ticks and worn paint. Cave formations vary between lantern caps, chalk roots and mineral clusters, with the existing support-removal behavior. The pass preserves terrain, ore and progression. See [docs/BEAUTY-PASS.md](docs/BEAUTY-PASS.md) for changes and labeled offline visual studies.

- Uncover the Lantern Leviathan around 220 m. Excavate three marked bone regions, illuminate each with a placed work light, then aim and scan with F. E recovers the ember from its skull after the study. Its curved ribs, spine and skull fall together when their support is removed. Inez offers a lead; scans, map and journal track the discovery.
- The ember brings Nell Wick and her lantern cart to Ridge Common, west of the well. Her $350 living lenses upgrade all placed and future work lights to 24 m reach and a 5 m moth refuge along clear light paths. Nell also sells supplies; the other residents react to her arrival. Discovery, support physics, purchases and the resident persist without resetting older mines. See [docs/LANTERN-LEVIATHAN.md](docs/LANTERN-LEVIATHAN.md).

- Recover the resonance engine, then buy Mara's Eastcut deed for $1,500. Claim 03 adds 384 square metres beside the eastern road, three connected caves and 348 minerals. Its markers and board show ownership. Walk there before buying; excavation requires the deed and leaves the common road intact.
- Use your lamps, bombs, anchor, survey and freight in the new ground. The crane extends to an eastern depot, including shipments already moving when you buy. Both excavations and every old mineral ID survive saves. Loose surface throws remain reachable and save correctly above the old coordinate limits. See [docs/EASTCUT.md](docs/EASTCUT.md).

- Find the Stonewright workshop around 134 m. Expose its two field coils, wake each with the resonator, then clear the frame and recover its sling with E. Otis offers a lead; F and M track the physical workshop. Its frame, coils and lamp fall together when undermined.
- Tool 7 lifts existing loose minerals while you hold the trigger, then throws them on release. Fast impacts break armor and hurt creatures. Rock and machinery block movement; an amber field warns when the mineral catches. The same mineral remains collectible and valuable afterward. Grip cancellation, blast interruption and midflight saves preserve it. See [docs/STONEWRIGHT.md](docs/STONEWRIGHT.md).

- Armored shale crawlers inhabit three lower-mine chambers. Lance or blast their shells, circle behind to hit the exposed body, dodge their committed claw charge, or excavate their footing to cause a damaging fall. Their bodies follow supported routes around rock and cannot walk across an excavated gap. Cleared encounters stay cleared.
- E recovers a basalt tooth and up to three charges from each shell. Take a tooth to Otis for a $240 impact axe head: 52 damage per swing and double rock-cutting power, with the same reach and cadence. Armor, injuries, attacks, physical corpses, remaining supplies and the upgrade survive saves. See [docs/CRAWLERS.md](docs/CRAWLERS.md).

- Rescue Inez Rook from a stranded survey bell at 23 m. Mara can mark her location. E at the intercom starts the rescue: excavate the whole housing, fit one work-light cell, then cut a clear shaft for the winch. The capsule stops against real rock, the player and machinery. It saves its height and resumes after reload.
- Inez reopens the survey office in Ridge Common. Her $40 charts mark untouched mineral seams near your reached depth, and her old survey gives leads on optional discoveries. Her arrival changes the office, conversations and available services without resetting the mine. The empty bell remains at the surface.

- The awakened heart opens a rootway through the former floor. Four lower strata, five seeded cave networks and 588 appended minerals extend the mine to 297 m while preserving every upper terrain sample and ore ID from existing claims.
- Restore three physical stations with two lights and three charges each. Earn double deep drilling torque, a faster deep lift and a longer-range deep scanner. Otis offers free return travel to repaired stations. Their bodies and lights fall when undermined, and return landings recheck collision.
- The three-geode celebration is an upper-mine milestone. The Foreman Below waits in the lower chamber: excavate and break its three pressure locks to expose the core, dodge its cutting jet, and lift above ground shocks. The machinery falls if undermined. Defeat preserves damage and leaves your lost cargo in a recovery cache.
- Defeating the furnace pays $5,000 once and unlocks Z, a reusable 12 m foundry bore with a six-second recharge. The common's well and road gain power, the shopkeepers react, and the mine remains yours to develop. All existing terrain and ore persist.

- Cinder moths inhabit underground pockets, fly around real rock and telegraph a dodgeable lunge. Drills deal contact damage; a mining axe unlocks at 9 m on key 6 for short, heavy swings. Resonance staggers creatures, the heart drains and pulls them, and explosives damage them through actual opened terrain. Cleared moths stay cleared and leave recoverable husks worth two charges.
- Placed lights and repaired refuge lamps keep moths back along clear sight lines. Surface rest restores health. Defeat returns you to the yard with equipment and money intact; lost minerals wait in a persistent physical cache marked on M. E recovers its contents, leaving overflow safely below. Townsfolk and field notes explain encounters.

- Fresh claims contain three seeded natural workings with looped passages, side chambers and vertical spaces at roughly 14, 32 and 50 m. Existing claims keep their exact terrain. Ore exposed by generation falls onto real support.
- Discover a survey cabinet, expose it and press E to fit one work light. Its lamp lights the chamber and its chart records nearby passages on M. Cabinets fall if undermined, carrying their light and map marker with them; repairs and movement persist. Older claims receive cabinets in existing chambers. Cave formations disappear when excavated support is removed, and Mara and Otis react to repaired cabinets.

- Walk beyond the original yard into Ridge Common, with roads, gate openings, two enterable shops, a well, a survey office and neighboring property. Walking is allowed on common land; digging remains inside your marked claim.
- Meet Mara Vale at Vale Supply and Otis Bell at Bell Works. Aim and E starts a conversation. Mara sells charges/lights and buys ore; Otis sells upgrades and freight equipment. Their dialogue reacts to your recoveries, and introductions and conversation history persist. The shops sit beyond the headframe, along the road south of the claim.
- Buildings, counters, residents and nearby trees have physical boundaries. Shops include stocked shelves, warm lights, framed windows, weatherboards and original procedural characters. The existing mine and save ledger remain intact. The new service panel has character portraits, advice, live funds and explicit upgrade/stock states.

- A compact equipment HUD shows owned tools and current supplies. I opens a paused field kit with tool illustrations, descriptions, charge selection and the next stratum unlock. Select with the buttons or 1-7, X and N; I or Escape returns to digging. Opening the kit releases a held mineral and cancels any held charge or crane placement.
- Optional field tips appear when an action becomes useful and stop after it is used or dismissed with Y. They yield to interactions, aiming, scans, full cargo and nearby chain reactions. The Menu's Field tips setting disables them; both the setting and dismissed tips survive saves. Touch controls hide unavailable actions, and the use button reads Cut, Pulse or Draw for the equipped tool.

- Four natural thunderstone seams make explosives part of prospecting. Dig a pink crystal completely free and recover one charge with E, or hit it with a charge or resonance pulse to ignite a delayed chain reaction. Recovering a middle link can stop the chain. Forty-eight added minerals run alongside the seams; blasts preserve them.
- Thunderstone falls when excavated, reacts from its current physical position, appears on scans and the mine survey, and retains remaining ignition time in saves. Drilling alone does not ignite it. Field notes explain the choice after discovery, and nearby ignition produces a HUD warning.
- Rift and resonance pulses can widen the edges of an existing opening when the center ray is clear. This fixes a narrow cleft trapping the player while Q found no target.

- Digging throws fragments colored by the current rock, with soft dust, terrain contact and mineral pickup glints. Blasts produce short local light and expanding rings; bore effects follow the cut tunnel. Five underground palettes blend across depth boundaries. Tool motion can be disabled consistently.
- Original procedural audio gives the cutter, different rock layers, loose ore impacts, pickups, blasts and magic distinct sounds. Distance, stereo placement and intervening rock affect spatial events. Surface air, roof drips and the freight motor add ambient cues. Sound remains optional; pausing fades continuous sounds.

- A reusable freight crane turns an excavated shaft into a supply route. Recover the flywheel, then buy the rig for $180. Hold T over an open underground floor and release to place the loading dock; E opens its controls. The cage lifts up the shaft, crosses a surface gantry, delivers to a yard depot and returns automatically. Keep mining while it travels.
- Freight stops at real rock, the player or heavy salvage. An orange marker identifies obstructing terrain. The dock can recall a shipment, return its cargo to your pack, or pack the empty crane for reuse. The suspended dock is held from a gantry supported on the protected surface rim.
- The cage holds 24 minerals. Recovering the engine offers a $420 upgrade to 64. Cargo remains separate in your pack, in transit and at the yard; only delivered stock is included when selling at the hopper. Partially loaded trips, return trips, packing and saving mid-shipment preserve the mineral ledger.

- Two optional underground discoveries with equipment rewards. The echo vault responds to coordinated explosions across three seals. The blackglass array needs excavated light paths and two aimed, E-operated prisms. Scan to discover them, or recover machinery for leads; J lets you track one.
- The vault's Aftershock core increases remote blast radius from 3.2 to 3.6 m and bore length from 6 to 9 m without increasing supply costs. The array's prism lens adds a mineral filter to the M survey; focused scans reach 8 m farther. Notes reveal the main descent gradually.
- A deformable 28 m wide claim, now reaching 297 m. Nine strata guide the descent and new capabilities. Longer mineral seams descend toward recoveries and branch into richer pockets.
- Cutter, broad soft-ground scoop, narrow hard-rock lance, charged resonator, and the heart's gravity field. Four equipment upgrade tracks remain at the workshop.
- Three explosive tools share charge supplies. Blast charges make a broad pocket after 2.6 seconds. At 9 m, remote satchels stick to rock and wait for H; disarm and recover one with E. At 25 m, bore charges cut a 6 m line along your throw's aim after 3.2 seconds and use two charges. N cycles unlocked types. Hold C to preview the trajectory and excavation shape; release to throw. Up to six charges can be deployed together. Restock three for $32.
- Blasts preserve valuables, release supported ore, and push loose minerals, machinery and the player. Remaining rock blocks impulses. Attached charges fall if their support is removed. Charges can be dropped while hovering above the claim.
- Deployable work lights. They illuminate nearby tunnels, fall when their support is excavated, and survive saves. Aim at one and press E to retrieve it. Restock six for $24. Up to 48 can be placed; the six nearest provide dynamic lighting.
- Physical flywheel and engine recoveries. Expose them, attach a tether, and cut a route wide enough to lift them above ground. A caught load marks its obstruction in orange. Tethers catch on rock and release at their length limit. Recall leaves heavy loads below.
- A persistent mine survey with depth slices, a combined vertical profile, scanned deposits, discovered signals, work lights and your return anchor. Untouched caves remain hidden; old claims reconstruct their excavated passages.
- Recovering the flywheel unlocks a reusable survey anchor. Recovering the engine unlocks resonance. New strata add the scoop at 9 m, lance at 25 m, +10 m scan range at 43 m, and sealed-geode detection at 59 m.
- Three wall stones must be exposed and struck with resonance before the heart will awaken. The heart unlocks attraction of loose ore and a rift burst. Three optional geodes provide a return expedition and a final recovery milestone.
- Mineral gravity, swept terrain collision, support removal, full-cargo behavior and line-of-sight pickup. No collecting ore through rock.
- Procedural machinery, crystal chambers, animated seals, tether line, different tool heads, magical viewmodel, blast effects and underground lighting. Raised concrete apron fixes the coplanar flicker reported in the previous build.
- Portable JSON and IndexedDB saves. Existing remake v2 claims retain terrain, money, equipment and ore IDs, and receive the new expedition. A new claim gives the intended progression from the start. Original prototype storage remains separate.

## Controls

| Action | Control |
| --- | --- |
| Move / run / look | WASD / Shift / mouse or right-drag |
| Use equipped tool | Hold left mouse |
| Equip / cycle tool | 1-7 / X |
| Field kit / dismiss field tip | I / Y |
| Lift | Hold Space |
| Interact / attach or release tether | E |
| Scan / field notes | F / J |
| Mine survey | M |
| Aim charge / throw | Hold C / release C |
| Cycle charge type / detonate remote satchels | N / H |
| Disarm and recover aimed remote satchel | E |
| Deploy light / retrieve aimed light | V / E |
| Aim freight dock / place it | Hold T / release T |
| Open loading dock controls | E near the dock |
| Plant survey anchor / return to it from surface | B / G |
| Rift burst, after awakening | Q |
| Foundry bore, after defeating the furnace | Z |
| Recall to surface / pause | Hold R / Esc or Tab |

Touch controls include the new actions. Lift, recall and the survey anchor consume no fuel. There are no oxygen or durability timers.

## Source and verification

`src/core.js` holds economy and deposits; `mesher.js` and `world.js` implement incremental terrain; `player.js` handles movement and mechanical tools; `ore.js` provides support and swept collision. `expedition.js` owns recoveries and progression, `gadgets.js` owns charges and lights, `thunderstone.js` owns physical reactive seams, `mysteries.js` owns optional discoveries and rewards, `freight.js` owns the crane and its cargo, `survey.js` records and charts exploration, and `persistence.js` validates snapshots. `feedback.js` owns cosmetic particle motion, `audio.js` owns procedural samples and audio routing, and `feedback-view.js` renders those effects. `thunderstone-view.js` renders the reactive crystals. `render.js`, `scenery.js`, `ruins.js` and `crane.js` build the Three.js scene; `fieldkit.js` manages the paused kit and optional guidance; `fieldkit.css` styles the equipment HUD and kit. `town.js` owns surface bounds, residents, physical building definitions and saved conversations; `town-view.js` builds the settlement and characters; `town-ui.js` and `town.css` provide conversation and trading. `foreman.js` and `foreman-view.js` own the furnace encounter, earned bore and powered common. `game.js` connects input, audio, UI and simulation.

```text
node tools/test.mjs
node tools/simulate-journey.mjs
node tools/simulate-journey.mjs --demolition
node tools/simulate-journey.mjs --mysteries
node tools/simulate-journey.mjs --freight
node tools/simulate-journey.mjs --thunderstone
node tools/simulate-journey.mjs --refuges
node tools/simulate-journey.mjs --legacy --refuges
node tools/simulate-combat.mjs
node tools/simulate-journey.mjs --rescue
node tools/simulate-journey.mjs --crawlers --foreman
node tools/simulate-journey.mjs --kinetics --foreman
node tools/simulate-journey.mjs --parcel
node tools/build.mjs
```

The combat suite checks shared tool targeting, frame-rate-independent damage, full-body navigation, telegraphs and dodging, light/rock occlusion, explosive damage, physical loot, defeat recovery and persistent encounter saves. Its separate pilot digs from spawn, fights with the starter drill and axe, collects a husk, heals and reloads. The crawler suite extends this with supported ground navigation, shell/rear damage, undermining and the earned impact head. The fresh crawler/furnace journey earns equipment, clears all three crawlers, buys and reloads the head, restores all lower stations and returns from the furnace to the powered common. `crawlers.js` owns these encounters and `crawler-view.js` renders the shell, claws, attack cue and axe addition. Details and limits are in COMBAT.md and CRAWLERS.md.

The kinetic suite checks workshop acquisition, physical cover, once-only projectile hits, collectible mineral identity, crawler armor, furnace locks, frame-rate equivalence, saved flights, interrupted grips and older terrain. `kinetics.js` owns the system and `kinetic-view.js` renders the workshop and tool. The fresh `--kinetics --foreman` journey adds workshop recovery and a saved projectile hit to the crawler/furnace route. See STONEWRIGHT.md and VERIFICATION.md for evidence and limits.

The cavern suite additionally checks connected routes with a full player body across three seeds, concealed exploration, falling cabinets and ore, chart repair, model/collision containment, exact saved terrain and old-generation compatibility. The refuge journey excavates a cabinet, spends a light, charts passages and reloads before completing the campaign; `--legacy` starts from an old-format claim. `caverns.js` owns seeded generation, `refuges.js` owns cabinet state and physics, and `cavern-view.js` renders the structures, formations and lights.

The Node suite includes the ore, depths, fieldwork, explosives, mysteries, freight, feedback, thunderstone, field kit and town suites. The feedback checks exercise particle contact, bounded pools, inert rendering, motion settings, palette continuity, sound samples and a device-free WebAudio adapter. Field kit checks exercise real input cancellation, paused equipment selection, unlock visibility, guide priorities and portable tip preferences. It tests actual simulation, hauling, blasts, lamps, magic, surveys, saves, original-save migration, scene geometry and real Game update/UI bindings. The separate journey mines from a fresh claim, earns its equipment, excavates both hauling routes and reaches the final magical recoveries. Its demolition variant spends earned money on supplies and uses both remote and bore charges. The mysteries variant also excavates both optional sites, synchronizes real charges, rotates prisms through the E interaction and continues through the ending with both rewards. The freight variant earns and places the crane, sends collected ore, receives payment at the hopper, and continues to the ending. The thunderstone variant recovers a natural crystal for supplies, plants and fires a remote into the remaining seam, then completes the campaign. It uses no fixture shafts or direct teleports; it knows objective coordinates and uses the game's recall. Its renderer and DOM are inert adapters: these runs do **not** certify pixels, WebGL, audio playback, browser layout or campaign balance. No browser or OS input automation is used.

`tools/verify-remake.mjs` and its underground alias are historical browser tests of the previous campaign. They have not been updated or rerun for this release. Browser interaction testing is prohibited in this session following cursor interference; see AGENTS.md. `docs/VERIFICATION.md` separates current results from historical browser results.

`node tools/build.mjs` embeds local Three.js, scripts and CSS in **dist/index.html**. `docs/REMAKE.md` describes the design. `HANDOFF.md` is the superseded prototype handoff.

Game code, procedural art and sound: MIT, Trent Sterling. Three.js r140: MIT, Three.js authors. See `THIRD_PARTY.md`.
