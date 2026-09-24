# Lantern Leviathan and Nell Wick

Local 2.18.0 adds an excavation discovery around 220 m and a fourth resident with an earned lighting upgrade. The published site remains 2.8.0.

## Playing the discovery

After opening the rootway, follow the lower workings toward the old foundry chamber. Inez offers a free lead, "The pale ribs," if she has returned to her office. F and the M survey can locate the fossil without that conversation. The field notes describe the discovery after the lower mine opens.

The skeleton has three marked regions: Tail fan, Rib vault and Lantern skull. Excavate the bones around each marking, place a work light within 3.5 m with a clear light path, then aim and scan with F from within 5.5 m. Covered, dark or distant markings do not count. Recorded markings turn mint green. The hollow rib cage has physical bones; use the open space around it when ascending from below.

When all three regions are studied, E near the skull recovers its warm ember once. Nell Wick arrives with her lantern cart west of Ridge Common's well. Talk to her with E and pay $350 to fit living lenses. Her shop also sells six work lights for $24. Mara, Otis and Inez react to her arrival.

The lenses retrofit every placed and future work light. Light reach grows from 16 to 24 m, intensity increases from 2.6 to 3.4 and moth refuge radius increases from 3 to 5 m. Intervening rock still blocks the refuge. Only the existing six nearest lamps emit rendered point lights. There is no new fuel or maintenance system; lamps remain recoverable physical equipment.

## World and persistence

`src/fossil.js` owns the study, recovery, purchase and support physics. `src/fossil-view.js` constructs the original curved skeleton, marked bone sites, skull ember and traveling lantern cart. The cart and Nell appear only after recovering the ember. Her custom hood, scarf, portrait and handheld lantern distinguish her from the other residents.

The fossil is placed relative to lower cave room 3, near 220 m. It does not carve new voids into existing saves, reset terrain or append mineral IDs. Its spine, ribs and skull form one supported body. Removing the remaining rock detaches the assembly through the same terrain-contact solver as loose minerals. Bones, study points, scan marker, map marker and small ember light follow that body. The cage uses individual bone collision bounds so its interior remains hollow.

Progress is an additive `expedition.fossil` object: version, known flag, unique recorded region IDs, recovered flag, lenses flag and detached-body state. Validation rejects inconsistent study/reward prerequisites, duplicate regions, impossible body positions and premature Nell conversation history. Old claims without the field acquire an unstudied fossil without losing terrain or obtaining a free reward.

Nell's services use the existing town counter and funds. The light upgrade is paid once; stale actions outside the shop fail. The upgrade applies to both light rendering and actual moth avoidance. A new resident does not become a tool-damage target.

## Verification

`node tools/test-fossil.mjs` exercises discovery gates, real scan/use callbacks, one-time recovery and purchase, Nell's supply counter, upgraded existing lamps, rock occlusion, skeleton support removal, moving scene/map positions, portable saves, corrupt state rejection, rendering isolation and old claims. It uses the production systems with an inert renderer and DOM.

`node tools/simulate-journey.mjs --fossil` starts a fresh claim, earns its equipment and opens the lower mine before excavating the fossil, deploying lamps, recording all three regions, recovering the ember, visiting Nell, purchasing lenses, reloading and returning to upgraded lamps. The route uses normal input and services; it has coordinate knowledge, so simulated time is not a human pacing estimate.

An earlier pilot climbed into the skeleton's underside. The revised approach moves outside the ribs before lifting. A resumed-save diagnostic completed the entire fossil-to-lantern loop. The final fresh run also completed: ember recovered and reloaded at 515.9 simulated seconds, lenses purchased and reloaded at 528.4, and upgraded lamps checked after returning underground. See VERIFICATION.md for release evidence.

An offline projection of actual mesh triangles was inspected for skeleton and cart silhouettes. This does not verify WebGL illumination, browser layout, audio or human play feel. No browser interaction, OS input or automated pointer lock is used.
