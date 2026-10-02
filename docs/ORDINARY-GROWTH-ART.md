# Ordinary mineral growth, local 2.41.0

Repeated cone spikes in ordinary upper caves, the lower workings and expedition chambers now use native closed mineral solids. Floor growth has faceted prism bodies, unequal end planes and smaller crystals; ceiling growth has a thick shoulder, fluting and a seeded curve. The original lantern caps, chalk roots and expedition ribs retain their geometry. Baked mineral colours also tint the growth's emissive output, preventing the glow from washing out the root-to-tip variation.

The [eighteen-slide review](../tools/out/growth-pass-review.html) preserves twelve matched native cameras, two rejected art revisions and an obstructed camera fixture. All twelve baseline and twelve final frames, plus both twelve-frame revision sets, were visually inspected. Eight views isolate actual production batch sources; four use the mine renderer. Deep fixtures directly build nearby production terrain chunks, with simulation frozen. These are static art observations, not gameplay travel or physical input tests.

## Cost and preservation

| Native scene | Before triangles | After triangles | Render meshes |
| --- | ---: | ---: | ---: |
| Upper caves | 92,693 | 97,214 | 114 unchanged |
| Lower workings | 17,000 | 25,364 | 51 unchanged |
| Discoveries | 33,655 | 45,640 | 125 unchanged |

The art adds 24,870 model triangles and zero render meshes. All 45 supported cells remain: 16 upper, 19 deep, 10 expedition. Each reconstructed deep or expedition cluster remains one source mesh before batching. The four native mine views retain cached draw counts of 88, 274, 692 and 43. Their submitted triangles increase by 4,731, 8,085, 20,637 and 6,045 respectively. Broader geometry bounds and batched visibility contribute to submissions.

No lights or textures are added. [The conservation comparison](../tools/out/growth-pass-conservation.json) verifies all other common/cavern/deep/discovery native attributes, indices, transforms, materials and shadow flags byte-for-byte. Original support anchors, root poses, batch membership and masks, terrain, contacts, accent sites, ore and economy remain exact. Unmodified supported caps, stems, chalk roots and ribs retain their original attributes and indices; white colour attributes allow them to retain the same material cells. All placement random draws remain unchanged.

The preceding [prop merge](PROP-MERGING.md) and [furnace merge](FOREMAN-MERGING.md) savings survive. This art pass is an explicit added triangle cost, not a measured speedup. The other reported GPU workload prevents quiet-machine frame-time attribution.

## Rejected revisions and criticism

The first revision has pristine pencil-like shafts, a nearly straight ceiling silhouette and adds 33,578 triangles. Fewer rings on smaller crystals, simpler caps and seven-sided drops remove 8,708 triangles. The second revision has mineral colours, but untinted emissive output washes them out. The final shader uses the same colours for the glow, with identical geometry and scene light values to round two.

The initial deep-floor camera sits outside the air volume and looks through the floor at spike bases. Both before and after fixtures are corrected to the native room center; the original baseline camera remains on a separate rejection slide.

The remaining shapes still deserve criticism. Long crystals resemble pencils, short ones can read as cut blocks, and the repeated three-shaft recipe is obvious. Broad faces are clean and mostly unmarked. Drops are angular, particularly when viewed directly beneath their roots. Retained vertical mounting leaves awkward contact on steep terrain. Those contacts need a separate terrain-conformance pass; they are not fixed here. Earlier cap, chalk, hero-landmark and surface-art limitations remain.

## Verification

`node tools/test.mjs` finishes with `COMPLETE 463 system checks passed`; the [complete release log](../tools/out/system-growth-pass.log) retains the result. New checks exercise closed topology, outward winding, finite attributes, opposite-side visibility and mounting extents across the production scale range. Existing excavation/reload, material batching, repair, moving-machinery, multiplayer, movement and campaign contracts remain included.

`node tools/build.mjs` compiles all 70 executable scripts into the portable release. [The build comparison](../tools/out/growth-pass-build-diff.json) limits production changes to five growth scripts and the version marker. Guarded native captures report zero exceptions, no pointer lock and no held input. Slides, the thirty-four-section hub and the current camera are separately rendered before Firefox delivery.

Physical Firefox mouse feel, quiet-machine performance and separate-network multiplayer remain unverified. Public Trystero proof retains its 2.35.0 date. This is a local art checkpoint; no push or deployment is part of it, and the full improvement goal remains active.
