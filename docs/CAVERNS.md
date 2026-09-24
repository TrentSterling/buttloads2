# Natural workings and survey refuges, local 2.10.0

The town now has an underground counterpart: three seeded cave networks and old survey cabinets that can be restored with a work light. The existing 73 m campaign remains intact. Greater depth, combat and the boss are still planned in BEAUTY-DEPTH-COMBAT-PLAN.md. The published site remains 2.8.0.

## Exploration and restoration

Fresh claims contain the lantern workings around 14 m, chalk galleries around 32 m and violet undercroft around 50 m. Each network has a central chamber, a loop with seven junctions, three spokes, a descending side chamber and a vertical chimney. These are connected spaces within each stratum; digging still connects the separated strata. Seeded shape variation changes passages while retaining broad clearance. Mineral generation keeps its stable IDs. Ore in the generated air detaches and falls using the existing swept physics.

Each network has a physical survey cabinet. Expose the cabinet, aim and press E to fit one work light. It lights the chamber and copies nearby open passages onto the M survey. Reusing it opens the survey without spending another light. Buried, occluded, distant and misaimed cabinets reject the action. Cabinets are optional infrastructure; they grant no cash or minerals and do not gate the existing recoveries.

Cabinets use full box support and the same falling-body solver as ore. Removing their support makes them fall; their collision, model, lamp and survey/scanner marker follow. The model fits inside its physical box. A restored cabinet stays restored when moved or saved. Cave formations attach to generated floor/ceiling support and disappear when that support is excavated. There are no detached floating formations.

Exploration and scans reveal the cabinets. Untouched cave passages remain concealed until visited or charted. The HUD names central chambers, field notes explain discovered cabinets, and Mara and Otis react to a restored survey light.

## Generation and saves

`caverns.js` builds original capsule/ellipsoid shapes, indexed in spatial bins. `world.js` combines that density with the original terrain. Version 1 generates the new passages; version 0 is the original claim. Player-sized route searches across three seeds cover every loop junction and side chamber. The yard, owned rim, deepest rock and existing relic shells remain unchanged. The default seed adds approximately 800 cubic metres of air.

Actual new games explicitly choose the current generation. Snapshots save the generation alongside the complete density field. Missing generation means version 0. Loading always installs the saved field, so new cave carving never crosses an existing excavation. The generation version also supplies the correct original baseline when reconstructing older survey data.

Old claims receive cabinets in their existing authored rooms. They retain their exact terrain and cannot acquire the new natural networks without starting a fresh claim. Cabinet placement is calculated from the unedited baseline, then saved loose-body positions take precedence. Reloading an excavated room therefore cannot respawn a cabinet onto a newly exposed shelf. Formations likewise use original support coordinates and current terrain visibility.

`refuges.js` owns repair, discovery, collision and saved state. `cavern-view.js` owns procedural cabinet meshes, formations and a bounded pool of two nearby refuge lights. `persistence.js` validates generation, unique IDs, repair/discovery consistency and physical poses before installation. Existing supplies, inventories and campaign unlocks remain separate.

## Evidence and limits

The complete suite passed 158 checks. After the final cabinet face adjustment, all 12 focused cavern checks passed again, including mesh containment and town dialogue about restoration. The combined thunderstone/freight/mysteries campaign completed on new caves in 379.3 simulated seconds. Dedicated refuge routes completed on both new generation (316.8 s) and old-format generation (301.9 s), excavating a cabinet, consuming a light, charting passages and reloading the exact mine before the main campaign.

These pilots use real movement, excavation, purchases, interactions and recall, with known objective coordinates. They do not estimate human pacing. Rendering and DOM adapters are inert. No browser or OS input was used; WebGL lighting, browser layout, sound and human gameplay quality remain unverified. Commands and build output are recorded in VERIFICATION.md.
