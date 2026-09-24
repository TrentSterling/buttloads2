# BUTTLOADS 2: The Deepening

**Field Kit update, 2.8.0.** A first-person excavation game about turning a backyard hole into a mine, recovering oversized machinery, and finding something alive underneath it.

This is the September 24 stopping build. Remaining review and future ideas are saved in [docs/NEXT-SESSION.md](docs/NEXT-SESSION.md); current test evidence is in [docs/VERIFICATION.md](docs/VERIFICATION.md).

Play at **https://tront.xyz/buttloads2/**, or open **index.html** or the portable **dist/index.html** locally. No install, CDN, server or runtime build tool is required. GitHub Pages publishes the repository root from `main`; the portable file is generated with `node tools/build.mjs`.

## What is in this build

- A compact equipment HUD shows owned tools and current supplies. I opens a paused field kit with tool illustrations, descriptions, charge selection and the next stratum unlock. Select with the buttons or 1?5, X and N; I or Escape returns to digging. Opening the kit cancels any held charge or crane placement.
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
- A deformable 28 m wide claim, 73 m deep. Five strata unlock new capabilities. Longer mineral seams descend toward recoveries and branch into richer pockets.
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
| Equip / cycle tool | 1-5 / X |
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
| Recall to surface / pause | Hold R / Esc or Tab |

Touch controls include the new actions. Lift, recall and the survey anchor consume no fuel. There are no oxygen or durability timers.

## Source and verification

`src/core.js` holds economy and deposits; `mesher.js` and `world.js` implement incremental terrain; `player.js` handles movement and mechanical tools; `ore.js` provides support and swept collision. `expedition.js` owns recoveries and progression, `gadgets.js` owns charges and lights, `thunderstone.js` owns physical reactive seams, `mysteries.js` owns optional discoveries and rewards, `freight.js` owns the crane and its cargo, `survey.js` records and charts exploration, and `persistence.js` validates snapshots. `feedback.js` owns cosmetic particle motion, `audio.js` owns procedural samples and audio routing, and `feedback-view.js` renders those effects. `thunderstone-view.js` renders the reactive crystals. `render.js`, `scenery.js`, `ruins.js` and `crane.js` build the Three.js scene; `fieldkit.js` manages the paused kit and optional guidance; `fieldkit.css` styles the equipment HUD and kit. `game.js` connects input, audio, UI and simulation.

```text
node tools/test.mjs
node tools/simulate-journey.mjs
node tools/simulate-journey.mjs --demolition
node tools/simulate-journey.mjs --mysteries
node tools/simulate-journey.mjs --freight
node tools/simulate-journey.mjs --thunderstone
node tools/build.mjs
```

The Node suite includes the ore, depths, fieldwork, explosives, mysteries, freight, feedback, thunderstone and field kit suites. The feedback checks exercise particle contact, bounded pools, inert rendering, motion settings, palette continuity, sound samples and a device-free WebAudio adapter. Field kit checks exercise real input cancellation, paused equipment selection, unlock visibility, guide priorities and portable tip preferences. It tests actual simulation, hauling, blasts, lamps, magic, surveys, saves, original-save migration, scene geometry and real Game update/UI bindings. The separate journey mines from a fresh claim, earns its equipment, excavates both hauling routes and reaches the final magical recoveries. Its demolition variant spends earned money on supplies and uses both remote and bore charges. The mysteries variant also excavates both optional sites, synchronizes real charges, rotates prisms through the E interaction and continues through the ending with both rewards. The freight variant earns and places the crane, sends collected ore, receives payment at the hopper, and continues to the ending. The thunderstone variant recovers a natural crystal for supplies, plants and fires a remote into the remaining seam, then completes the campaign. It uses no fixture shafts or direct teleports; it knows objective coordinates and uses the game's recall. Its renderer and DOM are inert adapters: these runs do **not** certify pixels, WebGL, audio playback, browser layout or campaign balance. No browser or OS input automation is used.

`tools/verify-remake.mjs` and its underground alias are historical browser tests of the previous campaign. They have not been updated or rerun for this release. Browser interaction testing is prohibited in this session following cursor interference; see AGENTS.md. `docs/VERIFICATION.md` separates current results from historical browser results.

`node tools/build.mjs` embeds local Three.js, scripts and CSS in **dist/index.html**. `docs/REMAKE.md` describes the design. `HANDOFF.md` is the superseded prototype handoff.

Game code, procedural art and sound: MIT, Trent Sterling. Three.js r140: MIT, Three.js authors. See `THIRD_PARTY.md`.
