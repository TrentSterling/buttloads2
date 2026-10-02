# Hard art review, 2.27.0

Trent rejected the previous visual pass. Its passing simulation and networking results did not justify accepting its artwork. The previous character and depot are retained in `tools/out/hard-art-before/build.html` and recaptured with the same inspection cameras in `tools/out/art-before/`.

## Rejection rules

The render harness captures evidence and reports runtime failures. It cannot award an art pass. Each scene needs a separate visual verdict. A front screenshot alone is insufficient for a character or equipment model.

Reject a character for rectangular anatomy without shaped shoulders, waist, knees and footwear; pasted-on face components; disconnected clothing; floating feet; or hands missing their weapon. Inspect front, quarter, profile, rear and close face views under neutral lighting, plus normal gameplay lighting. Inspect upward and downward aim. The glove must contact the handle, and articulated joints must retain their volume.

Reject equipment for an unreadable working end, floating attachments, disconnected cables, hidden gauges, blown-out materials, or a silhouette cropped by the normal viewmodel. Inspect all seven tools both on a remote body and in first person. Reuse the actual game geometry in multiplayer.

Reject an environment for unsupported construction, contradictory roof slopes, blank service cubes, blocked interaction landmarks, visibly stretched materials, shadow interference or incidental detail masking the main structure. Inspect the depot at walking height and from above, the work bay, hopper and headframe separately.

Functional success does not override any of these failures. Counts of meshes, textures, triangles or screenshots do not prove visual quality. A corrected defect earns a reinspection; it does not automatically approve the entire game.

## Recorded failed passes

| Evidence | Verdict | Defect and correction |
|---|---|---|
| Rejected build | FAIL | Box torso and limbs, crude face, cube hopper and bench, large flat canopy. New authored worker volumes and constructed service equipment replace them. |
| `art-01/miner-face.png` | FAIL | Cheeks looked glued on; nose was a box. Cheek shaping is integrated into the head mesh and the nose has a tapered profile. |
| `art-01/miner-profile.png` | FAIL | Glove rested on top of the cutter. A two-joint arm now reaches the actual grip. |
| `art-02/depot.png` | FAIL | Cutter gauge was inside its backing cylinder and cable ended in space. Dial depth and cable anchors corrected. |
| `art-06/yard-wide.png` | FAIL | Roof panels and rafters had opposing slopes. Panel direction corrected and the complete roof recaptured from above. |
| `art-06/hopper.png` | FAIL | Front column blocked the hopper and its sign. Structural supports moved between the service bays. |
| `art-06/local-axe.png` | FAIL | Axe head cropped by the viewport. Viewmodel scale and lateral position corrected. |
| `art-07/hopper.png` | FAIL | Paving showed diagonal shadow bands. Ground slabs receive shadows without casting nearly coincident shadows against the base apron. |
| Grip regression | FAIL | Gravity glove missed its handle by 34.7 mm. Equipment anchor corrected; all 21 tool/aim combinations now satisfy the 25 mm contact limit. |

## Current implementation and evidence

`miner-art.js` provides shaped body, skull and clothing meshes, articulated shoulders/elbows/hips/knees, stitched bib and pockets, molded hardhat, sealed goggles, gloves, laced work boots, knee pads, leather pack and lamp battery. Private geometry is consolidated within each rigid body part; articulation stays independent. Remote bodies project grounded feet onto the rendered surface without changing the authoritative player. Airborne bodies preserve their vertical position.

`tool-art.js` constructs the cutter housing, side vents, dial, trigger guard, battery and broad cutting flutes; an actual glove and sleeve replace the old viewmodel boxes. The scoop gains ribs and fasteners, the lance retains its moving striker, the resonator gains a supported coil assembly, and the axe, sling and heart cage have distinct constructed silhouettes. First-person hands are excluded from remote clones, whose articulated glove grips the same model.

`yard-art.js` constructs a sheeted lean-to roof with rafters, fascia, gutter and downpipe; timber posts with feet and braces; weatherboards; an open stocked work bay with pegboard, drawers, vice and spare cutters; a tapered hopper with grate, supports and mineral pile; pallets, banded barrels and sacks; a braced headframe with ladder, pulley, cable, hook and winch. The paved apron, nearby outcrops and grasses support the setting. Existing town and distant landscape art remain weaker than the rebuilt foreground and stay on the critic list.

The portable review includes matching neutral inspection views, matching gameplay cameras, all seven tools, actual public Trystero peers, and rejected intermediate rounds. Studio views are explicitly labeled fixtures. The art fixture unlocks tools for inspection. Seed 260923, 1280 by 900, isolated headless D3D11; networking captures use 1280 by 800 isolated browsers. Outdoor sunlight direction changed, so outdoor comparisons include lighting as well as geometry. No OS input, foreground automation or pointer lock is used by the harnesses.

Current visual status: **ready for Trent's review**, with the failed defects above corrected and reinspected. The distant landscape and unmodified town assets do not receive a blanket art approval.

```powershell
node tools/art-gauntlet.mjs final
node tools/test-art.mjs
node tools/test-multiplayer.mjs
node tools/test.mjs
node tools/build.mjs
node tools/network-gauntlet.mjs --public --standalone --capture
node tools/make-hard-art-review.mjs
node tools/test-polish-review.mjs
```
