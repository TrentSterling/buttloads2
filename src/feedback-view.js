/* Lit fragments, soft dust and brief local blast light. */
'use strict';
(function (B) {
  const T = THREE, V = T.Vector3;
  B.View.prototype.makeFeedback = function () {
    const alpha = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) { const i = (x + y * 64) * 4, d = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5); alpha[i] = alpha[i + 1] = alpha[i + 2] = 255; alpha[i + 3] = Math.round(Math.max(0, (1 - d) ** 3) * (d < 1 ? 255 : 0)); }
    const map = new T.DataTexture(alpha, 64, 64, T.RGBAFormat); map.needsUpdate = true; map.magFilter = map.minFilter = T.LinearFilter;
    const fadeMaterial = (material, geometry) => {
      geometry.setAttribute('instanceFade', new T.InstancedBufferAttribute(new Float32Array(512), 1));
      material.onBeforeCompile = shader => {
        shader.vertexShader = 'attribute float instanceFade; varying float vFeedbackFade;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFeedbackFade=instanceFade;');
        shader.fragmentShader = 'varying float vFeedbackFade;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a*=vFeedbackFade;');
      };
      const mesh = new T.InstancedMesh(geometry, material, 512); mesh.count = 0; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); this.scene.add(mesh); return mesh;
    };
    this.chipMesh = fadeMaterial(new T.MeshStandardMaterial({ color: '#ffffff', roughness: .9, transparent: true, depthWrite: false }), new T.IcosahedronGeometry(1, 0));
    this.dustMesh = fadeMaterial(new T.MeshBasicMaterial({ color: '#ffffff', map, transparent: true, opacity: .28, depthWrite: false }), new T.PlaneGeometry(2, 2));
    this.moteMesh = fadeMaterial(new T.MeshBasicMaterial({ color: '#ffffff', map, transparent: true, opacity: .65, blending: T.AdditiveBlending, depthWrite: false }), new T.PlaneGeometry(2, 2));
    this.fxDummy = new T.Object3D(); this.fxColor = new T.Color();
    this.blastLights = Array.from({ length: 2 }, () => { const l = new T.PointLight('#ffc681', 0, 9, 2); this.scene.add(l); return l; });
    this.blastRings = Array.from({ length: 12 }, () => { const m = new T.Mesh(new T.TorusGeometry(1, .018, 5, 48), new T.MeshBasicMaterial({ color: '#edbc78', transparent: true, depthWrite: false })); m.visible = false; this.scene.add(m); return m; });
  };
  B.View.prototype.renderFeedback = function (game) {
    const feedback = game.feedback, counts = { chip: 0, dust: 0, mote: 0 }, meshes = { chip: this.chipMesh, dust: this.dustMesh, mote: this.moteMesh }, dummy = this.fxDummy;
    const particles = feedback ? [...feedback.particles].sort((a, b) => (b.x - this.camera.position.x) ** 2 + (b.y - this.camera.position.y) ** 2 + (b.z - this.camera.position.z) ** 2 - ((a.x - this.camera.position.x) ** 2 + (a.y - this.camera.position.y) ** 2 + (a.z - this.camera.position.z) ** 2)) : [];
    for (const p of particles) {
      const mesh = meshes[p.type], i = counts[p.type]++, age = 1 - p.life / p.duration;
      dummy.position.set(p.x, p.y, p.z); dummy.scale.setScalar(p.size * (p.type === 'dust' ? .6 + age * 2.4 : 1));
      if (p.type === 'chip') dummy.rotation.set(p.spin, p.spin * .6, p.spin * 1.2); else dummy.quaternion.copy(this.camera.quaternion);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); this.fxColor.setRGB(...p.color).convertSRGBToLinear(); mesh.setColorAt(i, this.fxColor);
      mesh.geometry.attributes.instanceFade.setX(i, Math.min(1, p.life * 6) * Math.min(1, age * 14));
    }
    for (const [kind, mesh] of Object.entries(meshes)) { mesh.count = counts[kind]; mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true; mesh.geometry.attributes.instanceFade.needsUpdate = true; }
    const flashes = feedback?.flashes || [];
    this.blastRings.forEach((m, i) => { const f = flashes[i]; m.visible = !!f; if (!f) return; m.position.set(f.x, f.y, f.z); m.quaternion.copy(this.camera.quaternion); m.scale.setScalar(f.radius * Math.min(1, .15 + f.age * 4)); m.material.opacity = Math.max(0, .32 - f.age); m.material.color.set(f.magic ? '#87ebd0' : '#edbc78'); });
    const near = flashes.filter(f => f.age < .22 && game.world.clearLine(game.player.head, f, .2)).sort((a, b) => Math.hypot(a.x - game.player.x, a.y - game.player.head.y, a.z - game.player.z) - Math.hypot(b.x - game.player.x, b.y - game.player.head.y, b.z - game.player.z));
    this.blastLights.forEach((l, i) => { const f = near[i]; l.intensity = f ? Math.max(0, 1 - f.age / .22) * 5 : 0; if (f) { l.position.set(f.x, f.y, f.z); l.color.set(f.magic ? '#81edce' : '#ffd09c'); } });
  };
  B.View.prototype.atmosphere = function (depth) {
    const i = B.chapter(depth), a = B.ATMOSPHERES[i], next = B.STRATA[i + 1], blend = next ? B.clamp((depth - next.depth + 2) / 2, 0, 1) : 0, b = next ? B.ATMOSPHERES[i + 1] : a;
    this.deepFog ||= new T.Color(); this.deepLamp ||= new T.Color();
    this.deepFog.set(a.fog).lerp(this.fxColor.set(b.fog), blend); this.deepLamp.set(a.lamp).lerp(this.fxColor.set(b.lamp), blend);
    return { fog: this.deepFog, lamp: this.deepLamp };
  };
})(B2);
