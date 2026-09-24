# Lower workings, local 2.12.0

The living heart now opens a passage through the former 73 m floor. Aim at the ring beneath its pedestal and press E after awakening it. The shaft leads into a mine with a protected floor at 297 m. The existing three-geode celebration is an upper-mine milestone; it no longer describes the entire mine as complete.

## Places and useful discoveries

Four strata continue below the garden: rootworks from 80 m, Ashfall from 128 m, the old foundry from 208 m, and furnace roots from 266 m. Five seeded cave networks add loops, side passages and vertical spaces. Dense intervals between networks still require excavation. Original procedural formations, terrain colors and fog/lamp palettes distinguish the lower regions. The first landing and three station chambers have authored clearances. A large chamber at 278 m now houses the Foreman Below encounter in local 2.13.0; see FOREMAN.md for its mechanics and rewards.

Three physical station housings can be exposed and restored with E. Each repair consumes two work lights and three charges once. The Rootworks pump house (about 103 m) doubles mechanical excavation below 80 m. Ashfall exchange (about 182 m) raises untethered lift speed below 80 m to at least 16 m/s. Furnace approach (about 259 m) adds 12 m to scans below 80 m. These rewards stack with existing equipment and discovery rewards. The pump reward changes excavation, not weapon damage.

Restoration also records the player's actual position as a return landing. Otis offers free travel to restored stations from Bell Works. E at a restored housing updates the landing without spending supplies. Travel requires surface departure, no attached salvage and an unobstructed destination, including current moving obstacles. The arrival stays where it was recorded when its station falls; it can be reset beside the station. Station housings use full-volume support samples and swept gravity. Their models, scanner ghosts, map markers and lamps follow their physical positions.

The continuation adds 588 deposits in 42 seams, using the existing gold/prism inventory kinds and ledger. Upper ore IDs, positions, mineral types and radii retain their original prefix. F follows the next station, M charts the extended mine and J records restoration instructions. Mara and Otis react to the opening and repairs.

## Save and world contract

Depth version is independent of cave generation and the additive v2 save format. Missing `depthVersion` means the original 65 x 165 x 65 field from -80 to +2 m. Depth version 1 has 65 x 613 x 65 samples from -304 to +2 m. The new lower field is generated first; every old z-plane is then copied at its exact vertical offset. Existing upper density values are copied as Float32 samples with no resampling or rerolling. The original upper cave-generation version is retained.

`World.floor` is the physical lower limit. `World.digFloor` stays at -73 until the saved breakthrough is open. All excavation methods go through the same protected floor and property boundary. Meshing and sample addressing use the instance extent. Worker code retains its self-contained terrain palette. Only chunks containing surfaces allocate meshes.

Survey cell IDs remain x + 32*z + 1024*depth; their valid range grows with the world extent. The vertical profile scales to the full depth and records only surveyed passages. Ore, player, deployed device, anchor, salvage, refuge, combat-cache and freight validators use the saved extent. Station repairs, bodies and arrival poses validate before installation. Exported terrain now contains 2,589,925 floats, about 9.9 MiB before base64.

New modules: `deep-terrain.js` generates lower regions and appended ore; `deep.js` owns breakthrough, station physics and rewards; `deep-view.js` builds their original procedural models and formations. `tools/test-deep.mjs` tests migration, gate/shaft clearance, mesh seams, repairs and supply atomicity, moving stations, return travel, survey, actual rewards, deep equipment and portable persistence.

## Evidence and remaining work

The coordinate-aware `node tools/simulate-journey.mjs --deep` pilot earned all upper recoveries, bought supplies with earned money, opened the rootway, restored every station, reached 279.1 m, saved/reloaded the exact field and used Otis's real service button to return to Furnace approach. It completed in 460.5 simulated seconds. No fixture tunnels, free cash or direct player teleports were used in that journey; ordinary recall and earned station travel are production actions. Focused system tests separately use fixtures for isolated collision and corrupt-save cases.

This is not a human pacing estimate or WebGL visual verdict. No browser or OS input was used. The boss and its powered-town reward were added in 2.13.0. A deeper enemy roster, further residents and parcel expansion remain in BEAUTY-DEPTH-COMBAT-PLAN.md. The active goal is not complete and this local build has not been published.
