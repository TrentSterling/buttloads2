# Digging crew: local 2.26.0

**Visual status: rejected by Trent.** The subsequent geometry and material rebuild, failed critic rounds and new review are recorded in [HARD-ART.md](HARD-ART.md). The technical results below do not approve the former artwork.

**Current crew, 2.28.3:** the default public room is `ridge-common-v3`, using protocol 3 and save slot `crew-global-v3`. Timestamped poses are required; prior v2/v1 crew saves carry forward when the new slot is empty. See [GUEST-MOVEMENT.md](GUEST-MOVEMENT.md). The preceding [compatibility checkpoint](CREW-COMPATIBILITY.md) introduced v2 for changed contact. The v1 names below describe the original checkpoint.

The browser automatically joins `ridge-common-v1` under Trystero app ID `xyz.tront.buttloads2.crew`. There is no room-code step. A fresh guest downloads the current mine and enters play; the first miner opens the common crew while the title is visible. `?offline` keeps play local. The Crew screen edits your name and uniform color and returns to your personal claim.

The oldest connected miner owns simulation. Guests send movement input, aim, tool selection and guarded commands, rather than accepting client coordinates, excavation or purchases. Movement predicts locally. Poses update at 20 Hz, terrain changes at 10 Hz and shared progress at 5 Hz. Binary terrain packets preserve the exact Float32 density samples; replicated chunks use the existing cold mesh builder. Initial saves use bounded gzip transfer and the existing save validator. Sequence gaps request a fresh snapshot.

Cargo, cash, upgrades, progression, placed equipment and the excavated mine belong to the crew. Movement, health, tool selection, charge state, tether and sling grip belong to each miner. Creatures target active crew members. Defeat returns either the lead or a guest to the yard without discarding shared cargo; solo play retains its recovery cache. Guests receive damage feedback once and the flash fades locally. Mining, lights, charges, town services, freight, anchor, recall and the sling route through authority. Deeds remain a lead action. Freight and the survey bell wait for remote miners. Refuge, station and fossil discoveries include nearby guests while their physics still advances once. Simultaneous pulses reach both workshop coils and thunderstone seams; simultaneous sling releases share the six-projectile limit. When the lead leaves, a survivor inherits the mine and rebuilds physical indexes. Crew saves use `crew-global-v1`; the original `current` slot is preserved.

Miners have hardhats, goggles, headlamps, gloves, packs, belt details, knee pads and animated limbs. Equipped weapons reuse the game's actual cutter, scoop, lance, resonator, heart, axe and sling geometry. Tool heads, arm pitch, charge fields and firing state follow the remote miner. Up to three nearby miners illuminate underground workings with directional lamps. Name tags and the selection of nearby lamps respect intervening terrain. Removing a miner disposes their private assets and preserves shared tool geometry.

The movement pass changes acceleration and braking while keeping normal walk and sprint limits at 3.8 and 6 m/s. The HUD moves the tool rail off the weapon, reduces duplicated text and provides crew access. Tool stride, look lag, equip and landing motion affect presentation without changing aim. Reduced motion and the existing settings still apply. Headlamp color is less saturated, and the common gains cloud wisps and hillside grass.

## Review and receipts

The generated [offline slideshow](../tools/out/polish-review.html) embeds original screenshots, a draggable before/after divider, every remote weapon and test receipts. Arrow keys navigate; Present hides supporting text. Raw captures and reports remain in `tools/out`. This folder is ignored by Git, so the review is a local artifact.

Before shots were captured from `94f120d` before editing. Final shots use the same scripted positions, seed 260923 and 1280 × 800 viewport. The baseline renderer is SwiftShader; the final standalone capture reports the NVIDIA RTX 5070 Ti through D3D11. The underground shaft is an explicit visual fixture. All-tool multiplayer shots unlock equipment after the gameplay assertions, then use actual guest input and WebRTC replication. Phone shots are 390 × 844 narrow-viewport renders. A separate coarse-input capture checks all seven slots, full touch labels and the spacing above the action controls. Headless tests never acquire pointer lock or use OS input.

Visual iterations caught an overwritten tool pose, a tool-rail overlap, washed-out miner materials, a reversed holding arm and a charge field orbiting away from the weapon. These were corrected and recaptured. Narrow-viewport inspection found an actual compositor bug: Three.js r140 retained the uploaded canvas at its old size. Resize now recreates the texture. The browser test compares canvas and WebGL pixels directly; both return RGBA `[24,41,45,255]` at the sampled location. The review keeps charging-field and compositor iterations as direct before/after comparisons. Viewport dimensions are recorded, the narrow HUD instruments occupy a separate row, and crew text no longer runs under the name button.

The movement fixture measures 2.255 m/s before and 3.399 m/s after at 100 ms, or 59% and 89% of normal speed; after 200 ms braking the revised capsule stops completely. The real browser gauntlet verifies automatic join, remote excavation, bit-identical fields, supply consumption, three simultaneous miners, play while the lead opens a menu, authority migration and late join. Public Trystero weapon captures assert the received tool matches the rendered model and that three miners remain connected throughout every weapon and the underground inspection. The portable build has its own nine-check public lobby run. The earned fossil campaign journey reaches the ending and validates its save. Full-frame rendering counters include world, weapon and HUD; initial baseline counters were HUD-only and cannot support a performance comparison. Capture timings include explicit fixture carving and are not a sustained performance benchmark. The slideshow reads its system-check count directly from the completed aggregate log.

Final results: `COMPLETE 336 system checks passed`, including 22 multiplayer and movement checks. Public Trystero passed 17 gameplay, weapon and underground assertions; the portable build passed nine global multiplayer checks. The 20-slide review loads every image, supports navigation and its comparison slider, and reports zero exceptions. Its receipts read the current passing system log and network reports.

Commands:

```powershell
npm ci
node tools/test.mjs
node tools/build.mjs
node tools/network-gauntlet.mjs --public --standalone
node tools/network-gauntlet.mjs --public --capture
node tools/polish-gauntlet.mjs final --standalone --gpu
node tools/inspect-ui-resize.mjs
git show 94f120d:src/player.js | Set-Content tools/out/before-player.js -Encoding utf8
node tools/polish-feel.mjs
node tools/simulate-journey.mjs --fossil
node tools/polish-gauntlet.mjs standalone --standalone
node tools/make-polish-review.mjs
node tools/test-polish-review.mjs
```

## Trystero connections and session lifetime

The build pins the modular `@trystero-p2p/torrent` package at 0.24.0. It passed public three-player discovery and migration; the 0.25.4 trial stalled on the same public-tracker test. Public signaling uses `tracker.webtorrent.dev` and `tracker.openwebtorrent.com`. STUN uses Google and Cloudflare. The browser joins the global room directly with Trystero; there is no credential fetch, account setup or hosted service in the release.

Campfire, Gems Together and Voxel Heroes were inspected for the existing networking pattern. Their game configs also use Trystero without a configured TURN service or credentials endpoint.

The final weapon and underground captures use public Trystero connections. All three miners remain connected, with two transport peers on the lead during the underground inspection. The portable build is tested independently. The release contains bundled Trystero and no custom relay service or relay-test dependency.

The npm audit reports zero vulnerabilities after updating the development dependencies.

These are peer-hosted sessions. One participating browser must remain open; closing every browser ends the active session, with the saved crew mine remaining on the lead's device. Background browser throttling can slow a lead's simulation. Internet-tracker tests use separate browsers on the same machine and do not certify cross-network connectivity. Voice chat, a permanent hosted mine and cheat-proof public moderation are outside this local build.
