# Rigid prop merging, local 2.40.2

Resident-held wrench, notebook and lantern details, echo-seal markings, optical arrows and the opened survey office's map lines now share their existing material meshes. The pass removes 30 more mesh objects without removing model geometry. Wrist, blinking eye, halo, mirror, resident body and progression visibility boundaries stay independent. The echo face reference now points to the actual merged render mesh, so emissive updates still reach the markings and share the halo's material.

| Affected production scene | Before meshes | After meshes | Preserved triangles | Preserved vertex records |
| --- | ---: | ---: | ---: | ---: |
| Town, including buildings and residents | 233 | 218 | 67,212 | 182,954 |
| Echo and optical ruins | 48 | 38 | 5,382 | 4,052 |
| Rescue, including Inez's accessory | 61 | 56 | 10,546 | 26,705 |
| Total | 342 | 312 | 83,140 | 213,711 |

The complete oriented triangle comparison against frozen 2.40.1 covers rest, conversation, blinking and solved/turned puzzle poses. Positions, normals, UVs and material/shadow/layer state match within a maximum measured float difference of 0.00000190735. Terrain bytes, contacts, ore records and economy remain exact. The portable comparison changes only residents.js, ruins.js, town-view.js and the version metadata; all other bundled scripts, markup and styles remain exact. The existing complete system suite reports **COMPLETE 461 system checks passed** with terminal exit code zero.

| Matched native camera | Cached draws before / after | Shadow refresh before / after | Preserved cached / refreshed triangles |
| --- | ---: | ---: | ---: |
| Otis workshop | 191 / 186 | 764 / 744 | 514,845 / 1,356,184 |
| Inez survey office | 116 / 106 | 689 / 664 | 459,299 / 1,300,638 |
| Nell lantern stall | 119 / 115 | 692 / 673 | 466,107 / 1,307,446 |

The eight studio views additionally cover the scaled rescue resident, dormant/lit seal and two mirror states. Dormant seals drop from five to two draws, and optical arrows remove one draw per visible assembly. All eleven final cameras match their baseline. All 22 final native frames were visually inspected; fifteen studio captures are byte-identical reuses of already inspected images. Five pairs are pixel-identical; the remaining pairs change 1 to 59 pixels out of 1,440,000, with a maximum colour-channel difference of 50. The largest channel differences occur at narrow geometry edges; the 59-pixel workshop difference is one channel level. These results retain the measured differences rather than claiming exact raster equality.

Two capture problems were rejected. Initial echo cameras faced the backing instead of the markings, and town cameras faced away from residents. Corrected town poses then kept the first frozen HUD prompt. The final fixtures face the assemblies and request a fresh native HUD draw for each camera. Rejected captures and reports remain linked in the [fourteen-slide comparison](../tools/out/prop-merge-review.html). This is a capture correction, with no production input or HUD change. Native game views use directly unlocked progression and frozen simulation; they do not prove travel or gameplay interaction.

Other large mesh counts mostly reflect excavatable terrain chunks and deliberately bounded canopy/support batches. Their shared materials alone do not make them safe merge candidates. Moving mirrors, beams, blink pupils and independent progression groups likewise retain their own render paths. No new timing sweep runs under the competing GPU workload. This is a verified submission reduction; quiet-machine frame-time benefit remains unmeasured.

Visual inspection still finds stiff resident sleeves and bare palms, broad plain cloth, similar faces, primitive ring/box puzzle devices, repetitive map contours and pristine lanterns. This pass preserves the existing art rather than satisfying the wider hard art request. Physical Firefox mouse feel, quiet-machine performance and separate-network multiplayer remain open. The preceding furnace savings retain their dated [2.40.1 evidence](FOREMAN-MERGING.md); the broader improvement goal stays active.

Raw evidence: [geometry conservation](../tools/out/prop-merge-conservation.json), [pixel comparisons](../tools/out/prop-merge-pixels.json), [portable delta](../tools/out/prop-merge-build-diff.json), [before render counts](../tools/out/prop-merge-before/report.json), [after render counts](../tools/out/prop-merge-after/report.json), and [full system log](../tools/out/system-prop-merge.log).
