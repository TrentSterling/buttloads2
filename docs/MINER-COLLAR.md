# Connected miner shirt collar, 2.61.0

Trent pointed out that the two unchanged triangular collar blocks still read as a bowtie after the nose correction. This pass removes those blocks and reconstructs a connected folded band over a matching cream upper shirt, with a fitted placket and two buttons. The lower overalls and bib remain. The complete improved face, goggles and helmet preserve exact released geometry and skin colours.

The collar is a closed hollow shell with an open front. Thirty-three neck-band anchors intersect the actual shirt volume used by the merged production mesh. Fold creases have separate normals; the front surface stands clear of the shirt instead of exposing thin intersecting slits. The placket follows the chest profile.

The accepted native construction removes the bowtie silhouette. Its straight graphic edges and fairly flat folds remain criticism. The face is still smooth and toy-like; primitive ears, broad shoulders, fixed glove curl, clean leather, repeated anatomy, exposed flat boot tops and wide crouched strafe are unchanged. This is a specific clothing correction, not certification of a finished character.

## Verification and costs

`node tools/test.mjs` covers the existing gameplay, controller, co-op, carry, grips, material sharing and joint deformation checks plus five new collar checks. The suite receipt records the completed run. All 71 standalone scripts compile; only `src/miner-art.js` changes executable source relative to 2.60.0. Forty-six other body meshes and all rig anchors remain exact. Legacy conservation checks exclude the two changed torso material groups; the new collar tests check those groups and preserve the entire head against the 2.60 fixture.

| Worker resource | 2.60.0 | 2.61.0 | Delta |
| --- | ---: | ---: | ---: |
| Body meshes | 48 | 48 | 0 |
| Model triangles | 28,572 | 28,934 | +362 |
| Geometry bytes | 1,504,088 | 1,495,764 | -8,324 |
| Main body materials | 25 | 25 | 0 |
| Owned rig materials | 45 | 45 | 0 |
| Existing fabric textures | 1 | 1 | 0 |

The actual four-miner front-facing GPU fixture submits 1,194 native calls versus 840 instanced calls, with 1,881,672 triangles in both. Ten joint groups and both shoulder attributes survive refreshed shadows. Native versus instanced PNGs differ at 180 pixels out of 1,152,000, with maximum channel difference 36. Instance and quaternion storage stays 13,056 bytes; owned cloned joint geometry stays 248,688 bytes. This is a fixed rendering comparison, not a frame-rate measurement or four new network clients.

First-person cutter and resonator PNG pairs are identical. Scoop differs at 13 pixels; lance, heart and axe at 12 each; sling at one. All differences are one channel level. Local geometry, cameras and submissions remain exact. The existing 256 x 256 atlas PNG bytes are identical.

## Native receipts and rejections

The [ten-slide review](../tools/out/miner-collar-review.html) leads the [63-section hub](../tools/out/current-review.html). Thirty-one matched camera pairs cover front, side, underneath, back, two head yaw studies, the full native pitch range, three travel views and all seven carried and local tools. All 62 final images are individually inspected. The yaw studies are fixed +/-0.65 radian stress poses, not a new controller. Full downward aim hides the neckline; full upward aim partly blocks it with equipment, so both require the close views alongside them.

Retained rejected close studies show the buried first band, the flared neck-brace second version and the fourth version's thin intersecting edges and raised straight placket. Their geometry failures and inspection limits remain in the output records. Native lighting, renderer settings, input and networking are unchanged in the shipped game.

The [conservation proof](../tools/out/miner-collar-conservation.json), [actual geometry checks](../tools/out/miner-collar-math.json), [pixel records](../tools/out/miner-collar-pixels.json) and [suite log](../tools/out/miner-collar-suite.log) bind evidence to the portable hash. The package and shipment records bind actual ZIP entries, the successful Pages head, all 72 public assets, public idle observation and Firefox tab requests after deployment.

Human Firefox turning/strafing, quiet-machine timing and separate-network co-op remain unverified. The last actual global-lobby audit retains its 2.51.1 date; networking source stays exact. The broader polish goal remains active.
