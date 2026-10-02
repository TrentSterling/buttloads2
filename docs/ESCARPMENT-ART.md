# Distant cliff construction, local 2.34.0

The five distant ridges now have separate crests, steep faces, ledges and feet rather than rounded mounds. Their actual vertices follow those bed boundaries; gullies vary in position, width and depth. The native strata texture has irregular bed spacing. Camera, sunlight and exposure stay matched. This is a local art checkpoint with outstanding criticism, not acceptance of the whole environment.

[The nine-slide review](../tools/out/escarpment-review.html) contains six matched views, two rejected revisions and native cost. Each comparison uses seed 260923, the same walking-height camera and 1440 x 1000 native game frames. The frozen builds, sources and reports are linked from its raw receipts.

## Harsh review and revisions

- Baseline 2.33.0: soft rounded crests, shallow erosion and repetitive continuous bands. The northern foreground hill hides much of the cliff, so that view judges its skyline.
- Rejected review camera: the initial southern position at 34,62 was inside a nearby rock. All six initial captures remain in [the rejected-camera report](../tools/out/escarpment-camera-reject/report.json). Both southern comparison frames use the corrected clear position at 26,59. This is a capture correction, not a gameplay controller fix.
- Rejected round 1: steeper walls helped, but the same two deep clefts made several cliffs resemble three rounded organ pipes. Its six actual frames, source and build remain [frozen](../tools/out/escarpment-round-1/report.json).
- Rejected round 2: varied gullies and a ledge still exposed thin vertical ribs when angle-based creasing split the steep heightfield grid. Its six actual frames, source and build remain [frozen](../tools/out/escarpment-round-2/report.json).
- Final candidate: a mesh arranged around the actual crest, ledge and foot removes the false grid stripes. Normals crease at those boundaries and remain smooth within each surface. Its six frames remain [frozen separately](../tools/out/escarpment-candidate/report.json); the release has the same native source and geometry with 2.34.0 metadata.
- Remaining criticism: the bright ledge runs too continuously and has a wavy profile; the rubble slope is too smooth. Some slender peaks and broad face sections remain regular. The bright southern face needs stronger material variation. Wider views still expose sparse composition, angular meadow tips, oversized leaves, radial twigs, rectangular garden soil and uneven facade/interior quality.

All 36 native frames were visually inspected: six initial camera captures, six corrected baselines, six from each rejected round, six final candidates and six release frames. Thirty use the corrected matched cameras. The improvement is clearer cliff construction; the remaining shelf and talus findings require further work.

## Native cost and preserved state

| Measured inventory | 2.33.0 baseline | 2.34.0 release |
| --- | ---: | ---: |
| Distant ridge triangles | 8,640 | 7,920 |
| Distant ridge material batches | 1 | 1 |
| Common scene triangles | 380,184 | 380,184 |
| Common material batches | 21 | 21 |
| Lights in these groups | 0 | 0 |
| Collision tuples | 154 | 154 |

The ridge removes 720 triangles. The five original decorative footprints, tree/garden/rock records, 64 tree positions, contact tuples and terrain fingerprint 695863042 compare exactly. The existing 128 x 256 texture allocation and single ridge material remain. There are no new ridge colliders. These are geometry inventory measurements, not measured frame-time gains.

The [geometry diagnostic](../tools/out/escarpment-geometry-report.json) examines all 7,920 ridge triangles for outward face orientation, unit normals and vertices within the original five footprints. All three conditions pass. Its source SHA matches the frozen candidate and release. Mapped UVs, colours and normals are complete and finite; all native capture reports record zero runtime errors and no pointer lock.

## Verification and limits

The final standalone build compiles 65 executable scripts and contains no external scripts or styles. The complete final suite reports `COMPLETE 423 system checks passed` in [system-escarpment.log](../tools/out/system-escarpment.log). The current art pass changes distant native geometry and its existing texture; it adds no input, simulation or networking behavior.

Release SHA-256: `79f40494c2871a092f48978fbd2df7bdf31013eea87bc3cecb486853613a0d0c`.

Baseline SHA-256: `bd74a2796f68e77693c9ce772888fd672ed47b9dee25e829e888dd76ba3f6834`.

All nine slide layouts, the current receipt hub and portable camera frame were visually inspected. The [deck report](../tools/out/escarpment-review-report.json) records decoded images, zero runtime errors and no pointer lock. The [dated portable check](../tools/out/movement-build-2.34.0-report.json) verifies direct camera rotation and interpolated translation through page evaluation, without input events. [The inspection record](../tools/out/escarpment-inspection.json) retains the counts and remaining criticism. Standard new-tab opening succeeded for the build and standalone deck in Firefox; foreground visibility was not observed.

Physical Firefox mouse delivery and feel remain untried. Trent reports competing Qwen audio generation; no new timing sweep is claimed here. The actual public WebRTC audit remains dated 2.29.2 and uses browsers on this computer; separate-network NAT traversal is unverified. The broader art, movement and performance objective remains active. Nothing has been pushed or deployed.
