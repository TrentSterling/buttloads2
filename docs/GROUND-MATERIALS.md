# Ground materials, 2.52.0

The previous native frames had smooth pale grass, blank paths and soil, and a hard straight colour seam where the common ground met the mine. This pass reconstructs the surface material and repairs that seam. It does not award the entire game an art pass. The [eight-slide native review](../tools/out/ground-material-review.html) leads the 54-section [receipt selector](../tools/out/current-review.html).

One deterministic packed 512 by 512 texture carries curved grass fibres, earth grains, aggregate height and cover variation. Thirteen finishes share it. World-space projection keeps the detail on excavated walls and arbitrary rock faces. Shallow derivative relief fades with view distance and underground depth; the original deep mineral shader remains below 13 metres. Paths now receive aggregate detail. The common ground and mine use the same colour field at their actual join, fading into the outer terrain over four metres. Terrain density, collision, player movement, lights, foliage and models are unchanged.

## Harsh inspection

All twelve final before/after pairs were opened as native PNGs, with exact cameras, capsules, field hashes, draw counts and triangles. Ten main views cover the yard, depot, slope, grove, outcrop, close grass, path, claim, shallow wall and chalk wall. Two extra views cover the unobstructed soil wall and common/mine boundary. The shafts are fixed inspection fixtures, not earned gameplay. All eight before/after performance frames were also opened directly.

| Candidate | Verdict | Evidence and correction |
| --- | --- | --- |
| Round one | Technical failure | Reserved GLSL identifier prevented native shader compilation. Corrected before visual judgment. The failed portable and images remain in ground-material-round-1. |
| Round two | Rejected | Deep relief made the grass look embossed and the boulders noisy; repeated colour patches distracted at distance. All ten raw frames were inspected. The rejected shader and frames remain in ground-material-round-2. |
| Round three | Needs revision | Reduced relief and path finish improved the candidate, but the grass/soil distinction still needed more deliberate colour variation. All ten raw frames were inspected. |
| Detailed candidate before seam repair | Rejected | Boundary inspection revealed a hard straight brown/green strip. The raw main and extra captures remain in ground-material-after-seam-rejected and ground-material-after-extra-seam-rejected. |
| Original soil-wall fixture | Rejected inspection | Ore obscured the wall. The raw pair is retained; an opposite-facing soil-side pair supplies the unobstructed inspection. |
| Final 2.52.0 | Ready for review | Surface grain, grass fibres, worn patches, path aggregate and continuous join colour are visible in the native comparisons. This is a material improvement with broader art criticism still open. |

Grass still reads as a flat carpet at some angles. Boulders retain broad low-poly planes. Distant hills are bare and smooth; broad dark leaves and repeated crowns remain weak. Character anatomy is repeated, clothing and leather are pristine, and the empty-hand curl is rigid. This surface pass cannot resolve those forms.

## Exact cost and conservation

The [production-scene audit](../tools/out/ground-material-conservation.json) preserves all 1,159 mesh buffers and transforms, terrain bits, trees, contact records, ore and economy. Sixty-nine executable scripts match the frozen 2.51.1 portable exactly. Only beauty.js and common-view.js change executable behaviour. Markup and styles match apart from version metadata.

The new texture adds 1,048,576 base bytes and 1,398,100 bytes including the complete mip chain. Thirteen finishes share the same texture object. No meshes, draw calls, triangles, lights or material objects are added. Its isolated CPU creation observation was 32.0 ms at startup. The shader adds texture samples and shallow relief; unchanged draw counts do not imply unchanged shader cost.

## Performance evidence and limits

The dated hardware [baseline](../tools/out/perf-ground-material-before/report.json) and [final capture](../tools/out/perf-ground-material-after/report.json) use the RTX 5070 Ti at 1920 by 1080, pixel ratio one and a 60 Hz cap. Each scene has 100 completed warm frames and a six-second sample. The four miners are moving render fixtures, not measured network gameplay.

| Scene | Mean simulation plus render submission before / after | GPU query mean before / after | Final frame p95 |
| --- | --- | --- | --- |
| Yard | 2.65 / 2.72 ms | 9.56 / 14.24 ms | 16.8 ms |
| Four miners | 3.65 / 3.84 ms | 11.07 / 14.60 ms | 16.8 ms |
| North slope | 2.72 / 2.70 ms | 9.28 / 7.48 ms | 16.8 ms |
| Outcrop | 2.59 / 2.56 ms | 7.94 / 8.27 ms | 16.8 ms |

The final four windows have no frames above 25 ms. This does not establish a hitch-free game or quiet-machine FPS. Competing GPU work makes the sequential query means inconsistent.

The additional [same-browser counterbalanced comparison](../tools/out/ground-material-cost/report.json) alternates original and final material hooks in before/after/after/before order. Each block has forty warm frames and ninety completed query samples; camera, wind, simulation and cached shadows are fixed. Submitted draws and triangles match across all four blocks in each scene. GPU medians in that order are:

| Scene | Before / after / after / before GPU medians |
| --- | --- |
| Yard | 1.050 / 0.763 / 0.758 / 0.798 ms |
| North slope | 0.641 / 0.617 / 0.617 / 0.639 ms |
| Outcrop | 0.826 / 0.797 / 0.796 / 0.784 ms |

There is no consistent penalty in these three static views. The first yard block has substantial outliers. Cached static drawing and the full moving-scene profile have different costs; this comparison is not a new FPS claim or proof of quiet-machine performance.

## Validation and release scope

```text
node tools/test.mjs
COMPLETE 567 system checks passed

node tools/build.mjs
PASS standalone: 71 scripts compile; no external scripts or stylesheets.

node tools/verify-ground-material.mjs
COMPLETE ground material conservation: 1159 exact mesh buffers/transforms; mine, contacts and economy exact; 69 unchanged scripts; 13 finishes share one 1 MiB texture.

node tools/ground-material-cost.mjs
COMPLETE twelve counterbalanced material-cost blocks; exact draws/triangles, no held input or runtime errors.
```

The release records bind the portable SHA256 to the final captures, conservation, performance and system log. The last actual public global-lobby audit is dated 2.51.1, with eight observations; the multiplayer and controller scripts remain exact. No new separate-network, physical Firefox input or live all-seven-weapon gameplay run is claimed. Automated observation used fixed page evaluation with the pre-navigation pointer-lock guard, no OS input and no browser activation. Firefox delivery records opening requests in the existing session, not observed foreground visibility or physical acceptance.
