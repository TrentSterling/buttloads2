# Authority movement, local 2.28.4

The preceding driver advanced simulation and networking only from animation callbacks, with a 50 ms delta cap. Incoming admitted input changed the held keys without advancing authority. The matched production replay establishes the consequence: a two-second walk travels 7.41 m at 144 render callbacks/sec, 0.20 m at one callback/sec, and zero without callbacks.

The current driver shares a monotonic simulation watermark between rendering and admitted crew input, commands and the existing heartbeat. Crew traffic wakes simulation when painting has not occurred within 50 ms. The preceding input applies to the elapsed interval; newly received input applies afterward. Foreground rendering keeps ownership of simulation work, and pose publication follows simulation. Packet deadlines retain their cadence across render quantization.

[Mozilla documents that most browsers pause animation callbacks in background tabs](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). This provides context. The replay controls callback delivery directly; it does not establish the scheduling or mouse behavior of Trent's open Firefox session.

## Matched replay

`node tools/authority-gauntlet.mjs before` uses preserved 2.28.3 game and crew sources. `node tools/authority-gauntlet.mjs after` uses current sources. Both boot actual Game, invoke its production callback and Crew.receive, and execute full Game.update with world systems. Only storage, presentation and transport are inert. No browser, sockets or desktop input are used. Source hashes, timing and capsule samples remain in [before](../tools/out/authority-before.json) and [after](../tools/out/authority-after.json) reports.

The guest starts at x=3, z=11.5, supplying admitted held-walk input at 20 Hz for two seconds. The host stays on its title screen while its active guest runs the mine.

| Render callbacks/sec | Travel before | Travel after | Simulation seconds before / after | Poses after |
| --- | ---: | ---: | ---: | ---: |
| 144 | 7.413 m | 7.413 m | 2.00 / 2.00 | 40 |
| 60 | 7.414 m | 7.414 m | 2.00 / 2.00 | 40 |
| 10 | 3.614 m | 7.414 m | 1.00 / 2.00 | 40 |
| 1 | 0.205 m | 7.414 m | 0.10 / 2.00 | 40 |
| 0 | 0.000 m | 7.414 m | 0.00 / 2.00 | 40 |

Every current route finishes outside collision. At 144 callbacks/sec, simulation calls change from 289 (including the initial zero-delta call) to 288. Input wakeups add no foreground calls. Without rendering, there are 40 simulation calls, 40 poses, ten world frames and zero rendering calls. These are execution counts, not hardware performance measurements.

## Expired input and catch-up

Movement commands now carry a local admission timestamp. Ping, hello and unrelated traffic keep a peer present without renewing its held command. Movement expires two seconds after the last admitted input.

A second matched four-second replay sends a single held-walk command followed by pings, at 60 render callbacks/sec. Previously it walks 15.014 m because pings renew that key. Current authority walks 7.425 m and stops. A separate no-render heartbeat replay checks expiry while bounding catch-up work.

Each wake simulates at most 250 ms in updates no larger than 50 ms; capsule substeps stay at or below 1/120 second. Network expiry advances by the full elapsed interval. The driver does not simulate every missed second after suspension. Continuous 20 Hz admitted input drives the complete current walk without rendering; infrequent heartbeats alone do not guarantee full real-time world simulation.

## Verification and receipts

- `node tools/test-authority.mjs --baseline` fails against preserved 2.28.3 because no-render movement stays zero. [Rejected baseline](../tools/out/authority-regression-before.log).
- `node tools/test-authority.mjs` passes nine checks: no-render movement/publication, shared foreground time/count, slow rendering, malformed input, expiry with/without rendering, command execution, input timing, packet rejection, pause/install and bounded catch-up.
- The [full suite log](../tools/out/system-authority.log) ends with **COMPLETE 392 system checks passed**. The [first broad rejection](../tools/out/system-authority-first.log) exposed an older fixture that assigned a host role without installing its callbacks. That fixture now uses production becomeHost and keeps its admission-only assertion within a fresh render interval.
- `node tools/build.mjs` compiles 65 scripts into the portable release with no external scripts or stylesheets.
- [Camera/render verification](../tools/out/movement-build-2.28.4-report.json), [deck verification](../tools/out/authority-review-report.json) and [release hash](../tools/out/authority-release.json) identify the artifact. Browser checks use isolated guarded headless page evaluation and rendering only.
- Paired hardware captures of the preserved portable and current portable remain in [baseline](../tools/out/perf-authority-before/report.json) and [current](../tools/out/perf-authority-after/report.json). These cover the yard and a four-miner presentation fixture, not public multiplayer performance.

Hardware frame p95 stays at 16.8 ms in both scenes and both crew pairs. In the first crew pair, GPU mean changes from 11.42 to 14.51 ms; the [repeat baseline](../tools/out/perf-authority-before-recheck/report.json) and [repeat current](../tools/out/perf-authority-after-recheck/report.json) change from 14.57 to 13.17 ms. CPU render means are 3.40 / 3.36 ms in the first pair and 3.51 / 3.69 ms in the repeat. Both pairs remain visible; they do not establish a speedup or approve overall performance.

The [six-slide receipts](../tools/out/authority-review.html) include actual traces, all render-cadence rows, input expiry, rejected baseline, paired hardware rechecks and limits. The [receipt hub](../tools/out/current-review.html) preserves earlier dated art/movement/performance decks. The preceding camera evidence remains in [its original 2.28.3 report](../tools/out/movement-build-2.28.3-report.json).

## Remaining work

Crew protocol, public room and saved crew generation remain v3 because wire and collision contracts are unchanged. Existing claims keep their slot. Every authority must reload this build to receive the scheduler fix; an older compatible 2.28.3 lead still has its old scheduler.

This verifies a production authority defect. It does not establish the cause of Trent's physical mouse complaint. Actual Firefox delivery and play feel remain unverified. Sustained 250 ms RTT turning still accumulated 3.15 m of small corrections in the preceding guest replay; that prediction work is separate. Wider art findings remain in [GOAL-AUDIT.md](GOAL-AUDIT.md).

No deployment, new public WebRTC session or full campaign is claimed. The improvement goal remains active.
