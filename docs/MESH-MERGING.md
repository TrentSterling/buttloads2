# Rigid assembly merging, 2.35.1

Trent requested a mesh-merging audit while confirming that another Claude workload still hammers the GPU. This pass measures structural savings and preserves native art. It does not claim a quiet-machine FPS gain.

The [eight-slide review](../tools/out/merge-review.html) retains matched before/afters, raw inventories and the rejected camera and shadow rounds. [Before](../tools/out/mesh-merge-before/report.json) is frozen 2.35.0; [after](../tools/out/mesh-merge-after/report.json) is 2.35.1. Both use seed 260923 and direct rendering fixtures with no gameplay, input, focus or pointer lock.

| Assembly | Mesh objects before | After | Model triangles, unchanged |
| --- | ---: | ---: | ---: |
| Fossil and lantern cart | 183 | 21 | 5,528 |
| Parcel markers and deed board | 64 | 10 | 768 |
| Cave assemblies | 466 | 312 | 83,519 |
| Stonewright workshop | 29 | 15 | 1,722 |
| Complete mechanical tool hierarchy | 36 | 32 | 19,310 |

These five nonoverlapping hierarchies contain 388 fewer mesh objects. Retaining indexed vertices in the merger removes 157,474 duplicated vertex entries across these assemblies and the mechanical tool hierarchy. Bounds differ by at most 4.56e-7 m. Depot, landscape, vegetation, residents and miners already have substantial merging; editable terrain chunks and separately moving miner joints keep their existing granularity.

The merger preserves local transforms, normals, UVs, colors, indices and computed bounds. It groups compatible material, shadow, layer, sorting and visibility states. Callers explicitly exclude study plates, ember, independently glowing lanterns, parcel cap, animated cores, gauge needles and other moving parts. Cave fan geometry merges inside each individual support-controlled formation. Excavating its support still removes that formation independently. Fossil, cart and workshop roots retain their movement and visibility control.

| Static capture | Draws before | After | Submitted triangles before / after |
| --- | ---: | ---: | ---: |
| Fossil fixture | 116 | 7 | 3,656 / 3,656 |
| Lantern cart fixture | 126 | 25 | 3,164 / 3,164 |
| Cave fan fixture | 34 | 6 | 744 / 744 |
| Workshop fixture | 49 | 21 | 1,266 / 1,266 |
| Remote cutter fixture | 130 | 128 | 75,236 / 75,236 |
| Remote resonator fixture | 136 | 130 | 80,492 / 80,492 |
| Yard, cached shadows | 99 | 88 | 709,636 / 710,128 |
| Parcel, cached shadows | 97 | 63 | 599,514 / 599,766 |

Fixture draws include their shadow passes. Refreshing native yard shadows drops draws from 795 to 576; parcel refresh drops 793 to 551. Merged bounds admit slightly more existing geometry: 492 additional submitted triangles in the yard and 252 in the parcel view. Model inventories remain exact. These are particular camera/state observations, not universal frame costs or FPS measurements.

All 26 final native images were individually inspected, including all seven equipped miners. The [pixel comparison](../tools/out/mesh-merge-pixel-comparison.json) records a maximum whole-image difference of 0.04844%. Scoop, lance, axe and sling match pixel-for-pixel. Other images retain small edge/shadow differences; no broad silhouette, material or equipped-weapon loss was observed.

Two capture rounds remain rejected. Initial camera fitting used transformed object boxes, which changed framing after geometry merged; the final harness fits actual vertex bounds, with a maximum camera difference of 1.90e-7 m. The next comparison caught changed scoop/lance shadows. The final tool assembly explicitly preserves the previous combined-part shadow behavior before the merger groups render states. The rejected media remain in the receipt links.

Visual preservation does not approve the existing artwork. The skeleton still reads as joined pipes; the cart and workshop remain boxy; crystals have simple shafts and hard cap transitions. The landscape retains bare slopes, repeated cover and uneven rock/foliage detail. These remain art criticism under the broader goal.

Final verification runs `node tools/test.mjs`: [COMPLETE 426 system checks passed](../tools/out/system-mesh-merge.log). Three new contracts cover transformed indexed geometry and attributes, excluded animation/visibility, and render-state boundaries. Separate `node tools/test-art.mjs` verifies 21 grip poses and 26 grounding checks. The portable compiles 65 scripts and has no external scripts/styles. Matched captures have zero exceptions and no held input or pointer lock. The current deck/camera verification remains in [the render report](../tools/out/merge-review-report.json) and [camera report](../tools/out/mesh-merge-camera-report.json).

Before this merge, a focused 30-second 2.35.0 outcrop capture without GPU queries records 1,797 frames, three above 25 ms, and a 33.5 ms maximum. The [separate trace summary](../tools/out/outcrop-trace-summary.json) records a later 50 ms interval alongside a 70.879 ms GPU command task (18.735 ms thread time), while adjacent JS frame callbacks take 2.264 and 2.873 ms. Initial trace delivery includes setup disturbance and records 133.4 ms. This does not reproduce or establish the cause of the earlier 76 ms stall. GPU blocking, descheduling, tracing overhead and competing work remain uncertain. Raw [plain](../tools/out/outcrop-current-plain/report.json) and [traced](../tools/out/outcrop-current-trace/report.json) reports retain those distinctions.

The earlier seven public-room observations remain dated 2.35.0. Static equipped-miner fixtures do not certify new public gameplay, separate-network NAT traversal or physical Firefox mouse feel. The user has not tried the movement changes. No commit, push or deployment is part of this pass. The broader improvement goal stays active.

Final release SHA-256: `a78d97802aae0a3624b51a5c775a4fbe7115c7180fa23045aaad0d7f7eb424f7`.
