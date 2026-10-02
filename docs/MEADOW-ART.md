# Native grass construction, local 2.35.0

Common clumps, meadow patches, yard tufts and the older wind layer now use tapered bent blades. Shared vertices provide continuous normals along the curves. Taller leaves get an extra curve station; the meadow clumps have four taller blades and two shorter leaves. Baked root/tip colour and the existing dry/damp samples vary the finish. The wind layer uses explicit zero root weights and unit tip weights. Camera, sunlight, exposure, terrain and simulation remain matched.

This is an art checkpoint with remaining criticism. [The nine-slide review](../tools/out/meadow-review.html) contains six matched native views, two rejected revisions and geometry cost. Captures use seed 260923, 1440 x 1000 and walking-height cameras. Frozen builds, three native sources and hashes accompany every modeling round.

## Critic record

- Baseline 2.34.0: broad shard-like clumps, bright individual triangle spikes, repeated radial silhouettes and hard facets. The older wind code moved whole triangles, including their bases.
- Rejected review cameras: the initial yard view was obscured by a depot sign, and the wide view by its wall. All six initial frames remain in [the rejected-camera report](../tools/out/meadow-camera-reject/report.json). Both baseline and release use the corrected cameras; this is a review correction, not a controller fix.
- Rejected round 1: thinner blades removed the shards, but several tips had visible elbows and the slopes looked emptier. All six frames, source and build remain [frozen](../tools/out/meadow-round-1/report.json).
- Rejected round 2: smoother curves helped, but tiny low leaves were barely visible for their added geometry. It also left the old bright wind triangles untouched. All six frames, source and build remain [frozen](../tools/out/meadow-round-2/report.json).
- Round 3: taller secondary leaves and the fourth grass layer improve the shape. Its six frames remain [frozen](../tools/out/meadow-round-3/report.json). The final candidate then makes root weights explicit and simplifies the sparse wind blades, removing 4,258 triangles relative to that round.
- Remaining criticism: broad bare slopes, regular clump placement, dark rear-facing blades and dry grass blending into the soil. Thin blades lose detail at distance. The same views show rounded background boulders, oversized canopy leaves, radial twigs, continuous cliff shelves, simple fences and uneven facade/interior quality. The whole environment has not passed acceptance.

All 42 native frames were visually inspected: six initial camera captures, six corrected baselines, six from each of three revisions, six final candidates and six release frames. The latter 36 use the corrected comparison cameras. [The final candidate](../tools/out/meadow-candidate/report.json) and [release](../tools/out/meadow-release/report.json) have matching native source and geometry; their version metadata differs.

## Native cost and invariants

| Geometry inventory | 2.34.0 baseline | 2.35.0 release |
| --- | ---: | ---: |
| Verge and meadow triangles | 46,207 | 79,635 |
| Yard tuft triangles | 1,725 | 2,224 |
| Wind grass triangles | 1,559 | 4,677 |
| Grass material batches | 7 | 7 |
| Common scene triangles | 380,184 | 380,184 |
| Distant ridge triangles | 7,920 | 7,920 |
| Collision tuples | 154 | 154 |

The pass adds 37,045 triangles with the same batches, lights and texture allocations. These are native geometry counts, not frame-time gains. The original wind count comes from [the separately recorded unchanged wind source](../tools/out/meadow-wind-before.json); its SHA matches the frozen baseline and first two rounds. Earlier capture reports did not include that mesh in their group inventory.

The native browser baseline/release records compare exactly for all 2,449 meadow centres, tree/garden/rock/understory records, cliff footprints, collision tuples and terrain fingerprint 695863042. The construction preserves the original random-stream consumption, including skipped blades. No grass adds collision or changes excavation.

[The geometry diagnostic](../tools/out/meadow-geometry-report.json), reproduced with `node tools/inspect-meadow.mjs`, verifies finite attributes, complete colours/normals, unit normals and nondegenerate triangles across the grass groups. It independently replays all 1,559 old wind placements and checks root weights zero, tip weights one and weights within [0,1]. Maximum Float32 root-centre error is 0.00000384 m within its 0.00001 m tolerance.

The initial diagnostic wrongly required strict equality between Node and Chrome floating-point records. The measured maximum difference is 0.0000000000000143; the diagnostic now uses its stated 0.0000000001 tolerance. Browser-to-browser comparisons retain exact equality. Collision capture JSON records the six numeric tuple elements; array metadata is outside that serialized comparison and retains existing system coverage.

## Validation and limits

The final standalone build compiles 65 executable scripts with no external scripts or styles. Native release captures record complete finite attributes, zero runtime errors and no test pointer lock. The full run ends with `COMPLETE 423 system checks passed`, retained in [system-meadow.log](../tools/out/system-meadow.log). The guarded deck run verifies nine slides, decoded images, unclipped navigation, zero errors and no pointer lock in [its report](../tools/out/meadow-review-report.json). The portable camera fixture verifies direct look transforms and interpolated translation on the actual 2.35.0 bundle in [its dated report](../tools/out/movement-build-2.35.0-report.json); this does not establish physical mouse delivery.

All nine slide layouts, the twenty-section receipt hub and the portable camera capture were visually inspected. The two rejection slides open on their actual failed frames and offer the final release for comparison. The 2.35.0 build and standalone meadow deck were sent as new tabs through the existing Firefox process. No foreground visibility or human play result is claimed. [The inspection record](../tools/out/meadow-inspection.json) retains the scope and remaining criticism.

Release SHA-256: `e0df890c1c0385bbcc37da8c80091e1d853a596fc035e601b18dec6a6f1ae6b4`.

Baseline SHA-256: `79f40494c2871a092f48978fbd2df7bdf31013eea87bc3cecb486853613a0d0c`.

Physical Firefox mouse delivery and feel remain untried. The native grass checkpoint included no timing sweep. A subsequent [2.35.0 runtime audit](RUNTIME-AUDIT.md) records seven current public-room observations and repeated surface profiles under observed competing GPU load, including a 76 ms current frame and a 66.6 ms baseline frame. Those samples do not certify quiet-machine performance. Public WebRTC browsers remain on this computer; separate-network NAT traversal is unverified. No push or deployment is part of this checkpoint. The broader goal remains active.
