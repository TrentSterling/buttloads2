# Buttloads 2: stopping point and next session

Historical 2.8.0 closeout. Trent subsequently reopened expansion work. The current local build is 2.16.0; read README.md, STONEWRIGHT.md, VERIFICATION.md and BEAUTY-DEPTH-COMBAT-PLAN.md for its features, evidence and outstanding work. The published build remains 2.8.0. The old closeout below does not cancel the newer expansion request.

Recorded September 24, 2026. Trent asked to finish a build with the current content, save remaining work here, and consider the current goal complete. This is a handoff, not an instruction to keep adding features unattended.

## Ready for the next playthrough

Version 2.8.0, Field Kit. Open `dist/index.html` for the portable build. `index.html` is the unbundled source entry. The initial closeout was local. After playing it, Trent approved publishing this same build to https://tront.xyz/buttloads2/. GitHub Pages serves the repository root from `main`. Preserve unrelated working-tree files.

The current game includes timed blasts, sticky remote satchels, directional bore charges, recoverable lights, physical loose minerals and heavy salvage, depth-specific tools, a survey and return anchor, an earned freight crane, two optional underground puzzles, resonance and gravity abilities, reactive thunderstone seams, procedural audiovisual feedback, and the new paused field kit and optional contextual tips. I opens the kit; Y dismisses a field tip.

Validation at this stopping point: 134 system checks passed. The combined thunderstone, freight and mysteries scripted journey finished the campaign and validated its save in 386.7 simulated seconds. The portable build contains 23 compiling scripts with no external scripts or stylesheets. See VERIFICATION.md for evidence and limits. Scripted completion time is not human playtime.

## First priority when Trent resumes

Play the existing build before expanding it. Human pacing, visual clarity, sound balance and enjoyment remain unverified. No more browser interaction tests are allowed in this session; read AGENTS.md before testing later. Never control Trent's OS mouse or keyboard, steal focus or allow an automated page to acquire pointer lock.

1. Review the first haul, 9 m tool unlock, engine recovery and magical awakening. Check whether the player understands available actions without opening every menu. Verify tips yield to interactions and do not cover the thing being examined.
2. Review the HUD/kit at 1440x900, 1280x720, narrow desktop and coarse-input portrait/landscape. Check text size, touch overlap, scroll access, contrast underground and the new compact equipment readout. Source rules and inert DOM tests do not verify pixels.
3. Listen to digging, overlapping explosions, loose minerals, freight and magic. Check volumes, fatigue and spatial cues. Automated sample checks do not verify audible quality.
4. Revisit the reported concrete flicker and floating ore in an actual playthrough. Geometry, support removal and collision have regression coverage; visual confirmation remains useful. Check lamps and attached satchels after removing their support too.
5. Play both a fresh claim and a continued older remake save. Check the economy, supply prices, unlock spacing, hauling friction, optional puzzle legibility and whether the finale arrives before the systems have time to matter. Do not use the coordinate-aware journey to estimate balance.

## Parked design directions

These are candidates for discussion and future iteration, not promised or implemented additions. Keep relaxed digging and useful discoveries at the center; do not add oxygen, fuel or durability chores by default.

- **Explosive toys and terrain shaping, Trent's first choice.** Build on the existing remote/bore/thunderstone interactions. Consider configurable blast shapes, staged detonations or a precision carving mode only where they introduce a distinct excavation choice. Preserve valuables and reliable support physics.
- **Underground mysteries and magic.** Expand discoveries that change play: surprising chambers, interconnected mechanisms and optional magical capabilities. Prefer environmental clues and equipment rewards over repetitive collection quotas. Let the early mine hint at the strange things below without exposing the entire ending in the journal.
- **A mine you build up.** Extend the crane, lighting and return routes if the playthrough shows demand. Candidate additions include permanent lighting arrangements, additional useful transport routes and more visible surface improvements. Keep every machine's purpose and its interaction with the excavated terrain clear.
- **Progression and presentation.** Tune the existing strata, upgrades and recoveries based on Trent's feedback. Strengthen each layer's identity and discovery payoff. Further content should solve a specific gap found while playing, not just lengthen the feature list.

## Resume safely

Read root AGENTS.md and CLAUDE.md, then this project's AGENTS.md, README.md and docs/REMAKE.md. Acquire the repository coordination lease before writing. Current architecture is modular under src/; HANDOFF.md describes the superseded prototype. Do not overwrite the current implementation using that older handoff.

Run `node tools/test.mjs` after meaningful simulation/input changes. Use `node tools/simulate-journey.mjs --thunderstone --freight --mysteries` when the combined progression route needs validation. Run `node tools/build.mjs` for the portable artifact. Further testing should follow the change and respect the input restriction. Publishing the user-approved 2.8.0 build does not reopen the feature backlog.
