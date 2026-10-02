# Native lantern fungi, local 2.43.0

The ordinary lantern fungi used an open hemisphere above a separate flat cylinder. The enlarged native baseline exposes a gap at the rim; the original headlamp reduces the caps to white polygons. This pass rebuilds the three existing source pieces as a closed asymmetric dome, a bent stem with flared ends and twenty closed tapered gills. The second art revision bends the gills and adds darker mottled pigment and a lighter lip. All geometry is native, with complete finite position, normal, UV and colour attributes.

[Fourteen slides](../tools/out/fungal-art-review.html) retain nine matched native pairs, the rejected straight-fin candidate and explicit criticism. Six enlarged studies reconstruct actual source geometry from the supported batch under unchanged study lights. Three actual portable mine views use the original headlamp, terrain, cameras and support positions. These are frozen static poses, not gameplay traversal or physical input evidence. The central mouse-look prompt remains visible. Nine baseline, nine rejected and nine final frames were inspected.

The [full suite](../tools/out/system-fungal-art.log) ends with `COMPLETE 480 system checks passed`. Four new checks cover closed outward solids across production scales, single-sided visibility, stem and gill attachment to the actual closed cap, bounded cost, sampled rock contacts, excavation masking and portable reload. Inward winding on the revised gills failed the solid test before rendering and was corrected. The visible first candidate passed its geometry checks but was rejected for straight mechanical fins and an overly uniform cap.

The [native conservation report](../tools/out/fungal-art-conservation.json) compares frozen 2.42.1 construction with the final code. All other common, cavern, deep and discovery geometry, supported sources, lights, original growth anchors/root poses/source transforms, masks, collision, terrain, ore and economy remain exact. The former 322 stem vertex records and new 140 root records both meet rock; this is not a new contact defect fix. The fungal solids are rigidly seated during construction. There is no new per-frame work.

| Cost | Before 2.42.1 | After 2.43.0 |
| --- | --- | --- |
| Ordinary fungi | 14 | 14 |
| Sources/material roles per specimen | 3 / 2 | 3 / 2 |
| Model triangles per specimen | 158 | 876 |
| Cavern scene meshes | 114 | 114 |
| Cavern scene triangles | 97,214 | 107,266 |
| Supported cells: upper/deep/expedition | 16 / 19 / 10 | 16 / 19 / 10 |

This adds 10,052 model triangles and saves zero draws. Cached and refreshed draw counts stay equal in all three matched mine views. The existing mesh merging and controller scan reductions survive. No material or light is added. These operation and submission counts do not establish an FPS benefit or measured frame-time cost under the competing GPU workload.

The [portable comparison](../tools/out/fungal-art-build-diff.json) verifies all 71 executable scripts. Only `beauty.js`, `cave-form-art.js` and version metadata change; other scripts, shaders, styles and markup remain exact. Protocol, default global room and save slot remain v3. No push or deployment is part of this checkpoint.

The critic pass remains open: the same radial anatomy repeats, some gills are angular, upper faces are broad and the underside has large plain areas. The root flare can resemble a socket. The native headlamp suppresses colour variation; the original clustered placement, slope alignment and mouse-look prompt limit presentation. Enlarged studies show more detail than normal mine views. Physical Firefox feel, quiet-machine frame time, separate-network co-op and the wider art/movement/performance goal remain unverified.
