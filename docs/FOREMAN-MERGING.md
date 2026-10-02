# Furnace mesh merging, local 2.40.1

The furnace encounter now has 104 render meshes instead of 137. Fixed ribs and gauge panel parts share their machine's existing material meshes; ram bands share meshes inside the moving ram, and each pressure lock's four damage fragments share one mesh inside its independently hidden group.

The eight armor shutters, three indicator needles and individually coloured lamps, aim head, extensible barrel, ram, shock tell, lock valves, pressure fills and lock needles retain their own transforms and state. Hot material references still receive encounter damage and charge updates. Transparent beams and dynamic shock geometry retain their existing render paths. No model triangle is removed.

| Production assembly | Before meshes | After meshes | Triangles | Vertex records |
| --- | ---: | ---: | ---: | ---: |
| Furnace | 75 | 51 | 9,144 | 25,903 |
| West lock | 17 | 14 | 1,972 | 5,776 |
| East lock | 17 | 14 | 1,984 | 5,812 |
| North lock | 17 | 14 | 1,996 | 5,848 |
| Complete encounter, including effects and beacon | 137 | 104 | 18,004 | 50,458 |

The complete oriented triangle comparison against frozen 2.40.0 covers sealed, exposed/aiming, quake windup and defeated states. Every position, normal, UV and material/shadow/layer value matches with zero measured attribute difference. Terrain, contacts and economy remain exact. [Conservation JSON](../tools/out/foreman-merge-conservation.json) records the current source hash and the comparison scope.

Eight studio views and two exposed-room views retain identical cameras, lighting and seed. All twenty baseline/release native frames were manually inspected. Nine pairs are pixel-identical; the open/aiming studio image changes one pixel by one channel level. [Pixel results](../tools/out/foreman-merge-pixels.json) preserve all ten comparisons.

Both exposed-room fixtures use the production deep density field, a direct 6.3 m excavation around the furnace and only its nearby terrain chunks. Simulation is frozen, so these are inspection fixtures rather than a claimed traversal or combat playthrough. Their field hashes match. Cached submissions fall from 153 to 129, with 115,223 sealed and 115,575 windup triangles unchanged. Shadow refresh falls from 731 to 683 draws, with 944,386 and 944,738 triangles unchanged. The isolated furnace falls from 74 to 50 cached draws in ordinary states and 75 to 51 during windup. Damaged lock views fall from 17 to 14; intact locks retain 13 draws because the damage fragments are hidden.

`node tools/test.mjs` validates the complete system suite. Existing furnace tests cover all aiming elevations within physical body bounds, actual lock damage and armor gates, committed shots, terrain-shaped shock warnings, falling bodies, save/reload and defeat rewards. Final results are retained in [the system log](../tools/out/system-foreman-merge.log). `node tools/build.mjs` compiles all 70 bundled scripts without external script or stylesheet dependencies. Static native capture and receipt verification keep pointer lock, keys and fire disabled.

This is a measured submission reduction. Competing desktop GPU work prevents a quiet-machine FPS claim. Physical Firefox mouse feel and separate-network co-op still need human/external verification. The furnace is still too pristine and radially regular, pressure locks repeat, the damage fragments look like floating slashes, and broad cave bands and repeated mineral shapes remain art criticism. The earlier mine asset art cost and rejected rounds remain in [MINE-ASSET-ART.md](MINE-ASSET-ART.md). The broader game improvement goal stays active.
