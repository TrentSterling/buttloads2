# HUD model writes, local 2.43.2

The hidden HTML HUD model ran on every simulation update and repeatedly replaced text nodes or rewrote attributes, even though the visible canvas HUD paints at its existing 20 Hz schedule. The model now compares live values before setting them. Browser-normalized HTML and CSS retain their accepted values, while external DOM edits are repaired on the next update. Sling contact/tool hints and freight aim prompts resolve their final value before writing.

This preserves immediate state computation, guide observation, equipment controls and prompt updates. It adds no model throttle or mouse smoothing. Only the DOM writer in `core.js`, `Game.updateCombatHUD`, `Game.updateHUD` and `FieldKit.sync` change. All executable code outside that scope, HTML/styles except version metadata, controller/camera, art/rendering, co-op and persistence sources remain exact against frozen 2.43.1.

Actual guarded static observations use the standalone builds, seed 260923 and 120 repeated model updates per state:

| State | Before mutations | After mutations |
|---|---:|---:|
| Fresh | 13,680 | 0 |
| Partial cargo | 13,920 | 0 |
| Visible field tip | 13,920 | 0 |
| Full cargo | 13,680 | 0 |
| Workshop | 13,560 | 0 |
| Unlocks | 10,080 | 0 |
| Charge/combat/recall | 9,720 | 0 |
| Sling | 10,080 | 0 |
| Freight aiming | 10,440 | 0 |

All nine native DOM snapshots and guide states match before/after. The matched native depot frames retain exactly equal decoded pixels across 1,440,000 pixels. No browser input, focus or pointer lock is used. These are mutation counts and static output comparisons, not CPU timings, FPS, traversal or physical mouse-feel evidence.

`COMPLETE 488 system checks passed`. Four new checks compare 17 evolving state transitions with frozen production methods, count zero setters across unchanged states, repair external model edits, and verify HTML entity/CSS normalization. One old inert-DOM assertion expected numeric `textContent`; it now expects the browser's string representation. Its failed first suite log is retained.

The [four-slide review](../tools/out/hud-writes-review.html) includes operation tables, the native before/after pair and explicit limits. Raw receipts: [before](../tools/out/hud-writes-before/report.json), [after](../tools/out/hud-writes-after/report.json), [source scope](../tools/out/hud-writes-build-diff.json), [pixel comparison](../tools/out/hud-writes-pixels.json), [full suite](../tools/out/hud-writes-suite.log) and [first failed suite](../tools/out/hud-writes-suite-first.log).

The cutter's drill remains faceted, broad building faces and regular ground marks remain visible, and the unlocked mouse-look prompt overlays the workbench. Quiet-machine frame time, physical Firefox turning/strafing and separate-network co-op remain unverified. This eliminates proven redundant work without establishing the cause of Trent's mouse-jitter complaint. The broader art, movement and performance goal remains active.
