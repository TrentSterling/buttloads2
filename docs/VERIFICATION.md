# Remake verification

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
