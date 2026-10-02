# Local controller obstacle scans, 2.42.1

The controller now selects nearby obstacle boxes once per physics tick instead of repeatedly scanning all 280 production boxes during contact queries. The selection preserves list order and includes the capsule radius, the maximum 35 cm overlap recovery and the full horizontal travel bound. Vertical contact, roof profiles, terrain sampling, step heights, sliding and velocity response keep their existing code. A reusable array holds the selected boxes; `finally` clears the active selection so external collision queries always see the full current list.

Eight matched two-second native replays compare against frozen 2.42.0 Player code, using the production world and obstacle list. Every sampled position, velocity, support flag, lift time, aim, interpolation endpoint and camera offset agrees exactly. Occupancy-query and terrain-density-query counts also agree. The measurement counts reads of numeric box coordinates through a proxy, including the new selection pass; it is not CPU time or GPU time.

| Native replay, 240 ticks | Numeric box reads before | After | Reduction | Maximum boxes per query after |
| --- | ---: | ---: | ---: | ---: |
| Depot strafe | 449,703 | 126,416 | 71.9% | 0 |
| Yard diagonal | 364,361 | 115,932 | 68.2% | 21 |
| Well approach | 741,174 | 158,616 | 78.6% | 6 |
| Western slope | 579,072 | 86,611 | 85.0% | 1 |
| Upper mine | 2,699,816 | 124,776 | 95.4% | 1 |
| Deep mine | 2,113,809 | 122,950 | 94.2% | 2 |
| Lift | 564,287 | 124,375 | 78.0% | 0 |
| Sprint and turn | 353,793 | 96,147 | 72.8% | 2 |

All baseline queries receive the complete 280-box list. Zero selected boxes on a route means terrain still supplies its original contacts. The initial well fixture intersected a bench; the accepted start is on clear ground at z=49. Cave starts come from downward rays against the existing native floor, with no terrain carving. These are direct controller replays, not a complete gameplay traversal or physical mouse test.

Five new checks cover exact ramp/tread/ceiling/wall traces, 25 high-speed and overlap combinations, moving and replaced obstacle lists, external collision/recovery calls, array reuse and exception cleanup. Their frozen controller fixture lives in `tools/fixtures/player-contact-2.42.0.js`, outside ignored receipt output. `node tools/test.mjs` finishes with **COMPLETE 476 system checks passed** in [the retained system log](../tools/out/system-contact-scan.log).

The [portable comparison](../tools/out/contact-scan-build-diff.json) changes only Player code and version metadata. All other executable scripts, styles and markup remain exact, retaining native art, earlier mesh savings and the current global Trystero protocol/room/save sources. Three actual portable replay poses at tick 48 preserve camera, cutter transform, wind state, cached and refreshed-shadow draws, and submitted triangles. They retain the held cutter and native HUD. The first browser captures had unequal boot-time sway history and were rejected; final fixtures reset and compare the presentation values explicitly. The rejected captures remain in `tools/out/contact-scan-rejected-feel/`.

The [six-slide receipts](../tools/out/contact-scan-review.html) retain eight operation-count comparisons and three matched native pairs. The review hub keeps 37 dated sections. The [inspection manifest](../tools/out/contact-scan-inspection.json) records all six inspected native frames, six slide layouts, the hub and portable screenshot. All three final PNG pairs are byte-identical. The [Firefox delivery receipt](../tools/out/contact-scan-firefox.json) records the tested build and review URLs sent to the existing session on October 1, 2026, without activation or input automation.

This checkpoint removes unnecessary controller work while preserving travel behavior. It does not establish that the reported mouse jitter is resolved, or that FPS improves during another GPU workload. Quiet-machine frame timing, physical Firefox mouse/strafe feel, separate-network co-op and the broader hard art request remain open. The native frames still show broad cave facets, circular fungal plates, plain machine sides, repeated town forms and the look prompt. Earlier public Trystero evidence retains its 2.35.0 date. No push or deployment is part of this checkpoint; the broader improvement goal stays active.

Raw evidence: [controller replay](../tools/out/contact-scan-report.json), [baseline cameras](../tools/out/contact-scan-before/capture.json), [release cameras](../tools/out/contact-scan-after/capture.json), and [release manifest](../tools/out/contact-scan-release.json).
