'use strict';
(function (B) {
  const $ = id => document.getElementById(id), money = value => '$' + Math.round(value).toLocaleString('en-US');
  class Game {
    constructor() {
      this.settings = { sound: true, tips: true, sensitivity: 1, quality: 1.5, motion: !matchMedia('(prefers-reduced-motion:reduce)').matches };
      this.store = new B.Saves.SaveStore(); this.input = { keys: new Set(), fire: false, lookPointer: null, lookX: 0, lookY: 0 }; this.audio = new B.AudioEngine(this.settings);
      this.economy = new B.Economy(); this.screen = 'title'; this.ready = false; this.running = false; this.clock = 0; this.scanUntil = 0; this.scanCooldown = 0; this.recallTime = 0; this.lastSave = 0; this.dirty = false; this.revision = 0; this.saving = false; this.accumulator = 0; this.pickupUntil = 0; this.toastTimer = null; this.scanFocus = 'ore'; this.pointerHint = false;
      this.audit = { frames: 0, frameMs: [], recoveries: 0, pickups: 0, saves: 0 };
      this.fieldKit = new B.FieldKit(this); this.townUI = new B.TownUI(this);
      this.bindUI(); this.bindInput();
    }
    async boot() {
      try {
        this.view = new B.View($('view'), this.settings);
        let data;
        try { const saved = await this.store.read(); if (saved) data = B.Saves.validate(saved); }
        catch (error) { this.toast('Local save unavailable: ' + error.message, 6500); $('save-status').textContent = 'Use Export save to keep your claim.'; }
        await this.install(data);
        $('save-note').textContent = data ? 'Your claim is right where you left it. The deep has changed.' : 'Dig. Detonate. Recover. Awaken.';
        $('start-button').textContent = data ? 'Continue digging' : 'Start digging'; $('start-button').disabled = false;
        this.setScreen('title');
        let previous = performance.now(), visualTime = 0;
        const frame = now => {
          requestAnimationFrame(frame); const raw = (now - previous) / 1000; previous = now; const dt = Math.min(.05, raw); visualTime += dt;
          this.audit.frames++; if (this.audit.frameMs.length > 599) this.audit.frameMs.shift(); this.audit.frameMs.push(raw * 1000);
          if (this.running && this.ready) this.update(dt);
          if (this.player) this.view.render(this, dt, visualTime);
        };
        requestAnimationFrame(frame);
      } catch (error) { console.error(error); $('loading').hidden = false; $('loading-message').textContent = 'Could not start: ' + error.message; }
    }
    async install(data) {
      $('loading').hidden = false; $('loading-progress').value = 0;
      const state = data ? data.state : B.freshState(), world = new B.World(state.seed, data ? data.generation : B.CAVE_VERSION);
      if (data) world.field = data.field;
      await world.build(progress => { $('loading-progress').value = progress; });
      if (!data) world.carve({ x: 0, y: -.12, z: 7 }, 1.35);
      const deposits = B.generateDeposits(state.seed), collected = new Set(data?.collected || []);
      for (const node of deposits.nodes) node.collected = collected.has(node.id);
      // Everything above is staged. The live state is replaced only after construction succeeds.
      this.clearInput(); this.world = world; this.deposits = deposits; this.orePhysics = new B.OreSystem(world, deposits.nodes, data?.loose || []); this.index = this.orePhysics.index; this.economy = new B.Economy(state); this.player = new B.Player(world); this.cutter = new B.Cutter(world);
      if (data) { Object.assign(this.settings, data.settings); this.player.teleport(data.player.x, data.player.y, data.player.z); this.player.yaw = data.player.yaw; this.player.pitch = data.player.pitch; }
      this.expedition = new B.Expedition(world, this.economy); this.gadgets = new B.Gadgets(world, state.expedition, state); this.thunder = new B.Thunderstone(world, state); this.mysteries = new B.Mysteries(world, state); this.freight = new B.Freight(world, this.economy); this.feedback = new B.Feedback(world); this.guide = new B.FieldGuide(state); this.town = new B.Town(state); this.refuges = new B.Refuges(world, state); this.survey = new B.Survey(world, state, deposits, this.expedition); this.lastChapter = B.chapter(state.deepest); this.chapterUntil = 0; this.aimPreview = null; this.previewAt = -1;
      this.combat = new B.Combat(world, state); this.actions = new B.ToolActions(world, this.cutter, this.combat); this.combatRevision = 0;
      this.expedition.damageTarget = (head, dir, reach) => B.enemyTarget(world, this.combat.enemies, head, dir, reach);
      this.player.obstacles = [...this.view.obstacles, ...this.refuges.obstacles(), ...this.freight.obstacles()];
      if (this.player.blocked(this.player.x, this.player.y, this.player.z)) { this.player.teleport(0, .1, 12); this.toast('Saved position was inside rock. Returned to the claim entrance.'); }
      this.view.bindWorld(world); for (const rec of world.chunks.values()) world.onChunk(rec);
      this.view.setDeposits(deposits); this.view.makeExpedition(this.expedition); this.view.makeMysteries(); this.view.makeThunderstone(this.thunder); this.view.makeFreight(); this.view.makeCaverns(this); this.view.makeCombat(this); this.view.resize();
      this.orePhysics.onMove = node => this.view.updateOre(node);
      this.orePhysics.onContact = node => { this.audio.impact(node, this.player, world); return false; };
      this.clock = state.seconds; this.scanUntil = this.scanCooldown = this.recallTime = this.accumulator = this.lastSoundPulse = this.lastSoundBlast = 0; this.lastSave = this.clock;
      this.ready = true; this.changed(); this.syncSettings(); this.updateHUD(); $('loading').hidden = true;
    }
    changed() { this.dirty = true; this.revision++; }
    update(dt) {
      this.clock += dt; const state = this.economy.state; state.seconds += dt;
      if (this.expedition && this.view) this.player.obstacles = [...this.view.obstacles, ...(this.refuges?.obstacles() || []), ...(this.freight?.obstacles() || []), ...this.expedition.bodies.filter(b => !b.collected).map(b => [b.x - b.size[0] / 2, b.y - b.size[1] / 2, b.z - b.size[2] / 2, b.x + b.size[0] / 2, b.y + b.size[1] / 2, b.z + b.size[2] / 2])];
      this.accumulator += dt;
      const liftSpeed = this.expedition?.tether != null ? Math.min(B.GEAR.lift.values[state.gear.lift], state.expedition.awakened ? 7 : 3.5) : B.GEAR.lift.values[state.gear.lift];
      while (this.accumulator >= 1 / 120) { this.player.step(1 / 120, this.input.keys, liftSpeed); this.accumulator -= 1 / 120; }
      state.deepest = Math.max(state.deepest, Math.max(0, -this.player.y));
      const mode = state.expedition.tool, mechanical = ['cutter', 'scoop', 'lance'].includes(mode);
      if (this.actions) this.actions.update(dt, this.player, state, this.input.fire && !this.input.aim);
      else this.cutter.update(dt, this.player, state.gear.drill, this.input.fire && mechanical && !this.input.aim, mode);
      if (this.cutter.edited) this.changed();
      if (this.expedition) {
        if (this.expedition.update(dt, this.player, this.input.fire && !this.input.aim, this.orePhysics)) this.changed();
        const chapter = B.chapter(state.deepest);
        if (chapter > this.lastChapter) { this.lastChapter = chapter; this.chapterUntil = this.clock + 7; const c = B.STRATA[chapter]; $('chapter-number').textContent = `STRATUM 0${chapter + 1} / ${c.depth} METERS`; $('chapter-name').textContent = c.name; $('chapter-copy').textContent = c.subtitle; $('chapter-unlock').textContent = c.unlock; this.audio.note(220 + chapter * 90, .7, .04); this.changed(); }
        this.expeditionEvents();
      }
      if (this.refuges?.update(dt, this.player)) this.changed();
      if (this.orePhysics.update(dt)) this.changed();
      if (this.gadgets?.update(dt, this.orePhysics, this.expedition.physics, this.player)) this.changed();
      if (this.thunder) { if (this.thunder.update(dt, this)) this.changed(); this.expedition.events.push(...this.thunder.events.splice(0)); }
      if (this.combat) {
        this.combat.update(dt, this);
        if (this.combat.revision !== this.combatRevision) { this.combatRevision = this.combat.revision; this.changed(); }
        for (const event of this.combat.events.splice(0)) {
          if (event.kind === 'warn') this.audio.note(190, .3, .025);
          else if (event.kind === 'hurt') this.audio.note(85, .2, .04);
          else if (event.kind === 'kill') { this.feedback.burst(event.point, .55, true); this.toast('Cinder moth cleared. Recover its husk with E for two charges.'); }
          else if (event.kind === 'hit' || event.kind === 'swing') this.audio.note(event.kind === 'hit' ? 310 : 140, .08, .018);
          this.changed();
        }
        if (this.combat.needsRescue) {
          this.combat.rescue(this.player); this.recall();
          $('discovery-name').textContent = 'The yard crew found your tether.';
          $('discovery-text').textContent = 'You are back at the surface with your equipment. Lost minerals wait in a marked recovery cache on M. Clear some cargo space, then return and collect them with E. Placed lights keep cinder moths at bay.';
          $('discovery-reward').textContent = 'No money or upgrades lost. Cleared creatures stay cleared.';
          this.setScreen('discovery'); this.save(); return;
        }
      }
      if (this.gadgets) { this.gadgets.events.length = 0; for (const b of this.gadgets.blasts) if (b.serial > this.lastSoundBlast) { this.lastSoundBlast = b.serial; this.audio.blast(false, b, this.player, this.world); } }
      if (this.mysteries) {
        if (this.mysteries.update(dt, this.player, this.gadgets)) this.changed();
        this.expedition.events.push(...this.mysteries.events.splice(0));
      }
      if (this.freight) { if (this.freight.update(dt, this.player, this.expedition.bodies)) this.changed(); this.expedition.events.push(...this.freight.events.splice(0)); }
      if (this.survey?.update(dt, this.player)) this.changed();
      if (this.input.aim === 'bomb' && this.clock - this.previewAt > .08) { this.aimPreview = this.gadgets.preview(this.player); this.previewAt = this.clock; }
      if (this.input.aim === 'freight' && this.clock - this.previewAt > .12) { this.freightPreview = this.freight.placement(this.player); this.previewAt = this.clock; }
      this.feedback?.update(dt, this);
      this.collect();
      if (this.input.keys.has('KeyR')) { this.recallTime += dt; if (this.recallTime >= 1.25) this.recall(); } else this.recallTime = 0;
      if (this.player.y < -74 || !Number.isFinite(this.player.y)) { this.recall(); this.audit.recoveries++; }
      this.audio.drill(this.input.fire && !this.input.aim, this.cutter.edited, -this.player.y, mode, this.expedition?.charge || 0);
      if (this.expedition && this.expedition.pulseSerial !== (this.lastSoundPulse || 0)) { this.lastSoundPulse = this.expedition.pulseSerial; this.audio.blast(this.expedition.lastPulse?.magic ? 'rift' : true, this.expedition.lastPulse, this.player, this.world); }
      if (this.clock - this.lastSave >= 20) { this.lastSave = this.clock; this.changed(); this.save(); }
      this.audio.update?.(this, dt);
      this.updateHUD();
    }
    collect() {
      const p = this.player.head;
      for (const o of this.index.query(p.x, p.y, p.z, 3)) {
        if (this.economy.count >= this.economy.capacity) break;
        if (!this.orePhysics.collect(o, this.economy, p)) continue;
        this.audit.pickups++; this.pickupUntil = this.clock + 1.6; this.changed();
        $('pickup').textContent = `+ ${B.ORES[o.kind].name}  ${money(B.ORES[o.kind].value)}`; if (this.audio.pickup) this.audio.pickup(o.kind); else this.audio.note(560 + o.kind * 140, .09, .025); this.feedback?.collect(o);
      }
    }
    nextRelic() { return this.economy.state.relics.length < 3 ? [0, 1, 2].find(i => !this.economy.state.relics.includes(i)) : this.economy.state.core ? -1 : 3; }
    expeditionEvents() {
      const event = this.expedition.events.shift(); if (!event) return;
      this.changed(); this.audio.note(event.tone || 480, .5, .05);
      if (event.complete) { $('ending-stats').innerHTML = this.statsHTML(this.economy.state); this.setScreen('ending'); this.save(); return; }
      if (event.title) { $('discovery-name').textContent = event.title; $('discovery-text').textContent = event.text; $('discovery-reward').textContent = event.reward ? `${money(event.reward)} recovery payment received.` : ''; this.setScreen('discovery'); this.save(); }
      else if (event.text) this.toast(event.text, 6000);
    }
    selectTool(key) { if (!this.expedition.select(key)) { const t = B.TOOLS[key]; this.toast(t.magic ? 'Wake the heart beneath the seal.' : t.recovery !== undefined ? 'Recover the resonance engine to build this tool.' : `Reach ${t.depth} m to unlock ${t.name.toLowerCase()}.`); return; } this.input.fire = false; this.changed(); this.audio.note(440, .1, .025); this.updateHUD(); }
    cycleTool() { const keys = this.expedition.tools(); this.selectTool(keys[(keys.indexOf(this.expedition.state.tool) + 1) % keys.length]); }
    deploy(type) { if (!this.running) return; if (this.gadgets.deploy(type, this.player)) { this.changed(); this.audio.note(type === 'bomb' ? 170 : 880, .12, .035); } else this.toast(this.gadgets.placement(type, this.player).reason); }
    aimBomb() { if (!this.running) return; this.input.aim = 'bomb'; this.aimPreview = this.gadgets.preview(this.player); this.previewAt = this.clock; }
    releaseBomb() { if (this.input.aim !== 'bomb') return; this.input.aim = null; this.aimPreview = null; this.deploy('bomb'); }
    selectCharge(mode) { if (!this.gadgets.select(mode)) { this.toast(`Reach ${B.CHARGES[mode].depth} m to unlock ${B.CHARGES[mode].name.toLowerCase()}.`); return; } this.changed(); if (this.input.aim) this.aimBomb(); this.audio.note(560, .1, .025); this.updateHUD(); }
    cycleCharge() { const modes = this.gadgets.modes(); this.selectCharge(modes[(modes.indexOf(this.gadgets.state.chargeMode) + 1) % modes.length]); }
    detonate() { if (!this.running) return; const count = this.gadgets.detonate(); if (count) { this.changed(); this.toast(`${count} remote ${count === 1 ? 'satchel' : 'satchels'} firing.`); this.audio.note(210, .15, .04); } else this.toast('No remote satchels deployed. N selects a charge; hold C to aim.'); }
    aimFreight() { if (!this.running) return; this.input.aim = 'freight'; this.aimPreview = null; this.freightPreview = this.freight.placement(this.player); this.previewAt = this.clock; }
    releaseFreight() {
      if (this.input.aim !== 'freight') return; this.input.aim = null; this.freightPreview = null;
      const placement = this.freight.placement(this.player);
      if (this.running && this.freight.place(this.player)) { this.changed(); this.audio.note(350, .25, .04); this.toast(placement.obstruction ? 'Crane installed. E loads cargo; excavate the shaft at the orange marker.' : 'Crane installed. Approach the dock and press E to send your haul.'); this.save(); }
      else if (this.running) this.toast(placement.reason);
    }
    buyFreight() { if (!this.freight.buy()) return; this.changed(); this.audio.note(850, .25, .04); this.toast(this.freight.state.upgraded ? 'Freight cage expanded to 64 minerals.' : 'Crane purchased. Hold T over an open underground floor; release to place.'); this.updateShop(); this.updateHUD(); this.save(); }
    openFreight() {
      if (!this.freight.near(this.player)) return; const f = this.freight, idle = f.state.phase === 'idle';
      $('freight-dock-status').textContent = f.status(); $('freight-pack-count').textContent = this.economy.count; $('freight-load-count').textContent = `${f.loadCount} / ${f.capacity}`; $('freight-stock-count').textContent = `${f.stockCount} / ${money(f.stockValue)}`;
      $('freight-send').disabled = !idle || (!f.loadCount && !this.economy.count); $('freight-recall').disabled = f.state.phase !== 'outbound'; $('freight-take').disabled = !idle || !f.loadCount || this.economy.count >= this.economy.capacity; $('freight-pack').disabled = !idle || !!f.loadCount;
      this.setScreen('freight');
    }
    freightAction(action) { if (!['send', 'recall', 'take', 'pack'].includes(action) || !this.freight[action](this.player)) return; this.changed(); this.save(); this.play(); }
    restock(type) { if (!this.gadgets.restock(type, this.economy)) return; this.changed(); this.audio.note(750, .12, .035); this.updateShop(); this.updateHUD(); this.save(); }
    anchor() { if (this.expedition.placeAnchor(this.player)) { this.changed(); this.toast('Anchor planted. Recall with R; return from the surface with G.'); this.view.updateAnchor(this.expedition.state.anchor); this.save(); } else this.toast('Recover the survey flywheel, then press B in an open tunnel below 3 m. Release any tether first.'); }
    descend() { if (this.expedition.returnToAnchor(this.player)) { this.clearInput(); this.changed(); this.toast('Back at your survey anchor.'); this.save(); } else this.toast('G returns from the surface to your planted anchor. Place it underground with B.'); }
    interaction() {
      const p = this.player, s = this.economy.state;
      if (Math.abs(p.y) < 2.4) {
        if (Math.hypot(p.x + 7, p.z - 17.6) < 3.8) return { kind: 'sell', label: s.core && !s.won ? 'Deliver the heart & sell cargo' : `Sell haul  ${money(this.economy.saleValue)}` };
        if (Math.hypot(p.x, p.z - 17.6) < 3.8) return { kind: 'shop', label: 'Workshop & recovery board' };
      }
      const resident = this.town?.target(p, this.world, this.view.obstacles);
      if (resident) return { kind: 'resident', id: resident.id, label: 'Talk to ' + resident.name + ' / ' + resident.role };
      const cache = this.combat?.interaction(p); if (cache) return cache;
      const exp = this.expedition;
      if (exp.tether !== null) return { kind: 'detach', label: exp.snagged ? 'Load caught. Widen the passage / release tether' : 'Release salvage tether' };
      const remote = this.gadgets.remoteTarget(p.head, p.direction);
      if (remote) return { kind: 'disarm', id: remote.id, label: 'Disarm & recover satchel' };
      const lamp = this.gadgets.lampTarget(p.head, p.direction);
      if (lamp) return { kind: 'lamp', id: lamp.id, label: 'Retrieve work light' };
      if (this.freight.near(p)) return { kind: 'freight', label: 'Freight dock / ' + this.freight.status() };
      const stone = this.thunder?.interaction(p); if (stone) return stone;
      const refuge = this.refuges.interaction(p); if (refuge) return refuge;
      const prism = this.mysteries.interaction(p); if (prism) return prism;
      for (const body of exp.bodies) {
        if (body.collected || Math.hypot(p.x - body.x, p.head.y - body.y, p.z - body.z) > 4 || !this.world.clearLine(p.head, body, .2)) continue;
        const embedded = exp.physics.contact(body).density < -.004;
        return { kind: 'salvage', id: body.id, locked: embedded || s.deepest < 9, label: embedded ? `Excavate all sides of the ${body.name.toLowerCase()}` : `Tether ${body.name.toLowerCase()} (${body.size[0]} m wide)` };
      }
      if (!exp.state.awakened && Math.hypot(p.x - B.HEART.x, p.head.y - B.HEART.y, p.z - B.HEART.z) < 3 && this.world.clearLine(p.head, B.HEART, .2)) return { kind: 'heart', locked: exp.state.runes.length !== 3, label: exp.state.runes.length === 3 ? 'Give the heart your hand' : 'Wake the three seal stones with resonance' };
      return null;
    }
    use() {
      if (!this.running) return;
      const action = this.interaction(); if (!action) return;
      if (action.kind === 'sell') this.sell();
      if (action.kind === 'shop') { $('receipt').hidden = true; this.updateShop(); this.setScreen('shop'); }
      if (action.kind === 'refuge') { const result = this.refuges.restore(action.id, this.player, this.survey); if (result) { this.changed(); this.audio.note(640, .4, .04); this.save(); if (result.fresh) this.toast('Survey light restored. Local passages copied to your M survey.', 6000); else this.openSurvey(); } }
      if (action.kind === 'resident') this.townUI.open(action.id);
      if (action.kind === 'combat-drop' && this.combat.collect(action.id, this.player)) { this.changed(); this.audio.note(760, .15, .025); this.save(); this.toast(action.id === 3 ? 'Lost cargo recovered. Any overflow stays in the cache.' : 'Cinder husk recovered. Charges added.'); }
      if (action.kind === 'freight') this.openFreight();
      if (action.kind === 'prism' && this.mysteries.rotate(action.id, this.player)) { this.changed(); this.audio.note(560 + this.mysteries.connected * 150, .18, .035); }
      if (action.kind === 'thunderstone' && this.thunder.harvest(action.id, this.player)) { this.changed(); this.audio.note(660, .2, .04); this.toast('Thunderstone recovered. One charge added.'); }
      if (action.kind === 'detach') this.expedition.detach();
      if (action.kind === 'lamp' && this.gadgets.retrieve(action.id, this.player.head)) { this.changed(); this.audio.note(880, .1, .025); this.toast('Light recovered. V places it again.'); }
      if (action.kind === 'disarm' && this.gadgets.disarm(action.id, this.player.head)) { this.changed(); this.audio.note(390, .1, .025); this.toast('Satchel recovered. One charge returned.'); }
      if (action.kind === 'salvage' && !action.locked) this.expedition.attach(action.id, this.player.head);
      if (action.kind === 'heart' && this.expedition.awaken(this.player.head)) this.expeditionEvents();
    }
    sell() {
      const receipt = this.economy.sell(), total = receipt.minerals + receipt.bonus;
      if (!total && !receipt.count) { this.toast('Your cargo is empty. There is copper just beneath the grass.'); return receipt; }
      this.changed(); this.audio.note(920, .2, .06);
      const text = `${receipt.count} minerals sold for ${money(receipt.minerals)}${receipt.bonus ? ` + ${money(receipt.bonus)} in bonuses` : ''}.`;
      $('receipt').textContent = text; $('receipt').hidden = false; this.toast(text); this.updateShop(); this.updateHUD(); this.save();
      return receipt;
    }
    buy(key) { if (!this.economy.buy(key)) return false; this.changed(); this.audio.note(1100, .18, .05); this.toast(B.GEAR[key].name + ' upgraded.'); this.updateShop(); this.updateHUD(); this.save(); return true; }
    scan() {
      if (!this.running) return;
      if (this.clock < this.scanCooldown) { this.toast('Scanner recharging.'); return; }
      this.scanCooldown = this.clock + 1.5; this.scanUntil = this.clock + 6;
      const p = this.player.head, range = this.mysteries.scannerRange(), focus = this.mysteries.state.focus;
      $('scan-mode').textContent = focus < 0 ? `SUBSURFACE SCAN / ${range} m` : `${B.ORES[focus].name.toUpperCase()} FOCUS / ${range} m`;
      const nodes = this.index.query(p.x, p.y, p.z, range).filter(n => !n.collected && (focus < 0 || n.kind === focus)), relic = this.mysteries.target() || this.expedition.target();
      nodes.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z) - Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z));
      const echoes = this.economy.state.deepest >= 59 ? B.VAULTS.filter((v, i) => !this.expedition.state.vaults.includes(i) && Math.hypot(v.x - p.x, v.y - p.y, v.z - p.z) < range) : [];
      const thunder = this.thunder.scan(p, range), refuges = this.refuges.scan(p, range);
      this.mysteries.scan(p, range); this.survey.scan(p, range, nodes); this.changed();
      this.view.scan([...nodes, ...echoes, ...refuges.map(n => ({ ...n, kind: undefined, scanKey: 'refuge:' + n.id })), ...thunder.map(n => ({ ...n, kind: undefined, scanKey: 'thunder:' + n.id })), ...B.MYSTERIES.filter(m => this.mysteries.state.known.includes(m.id) && !this.mysteries.state.solved.includes(m.id) && Math.hypot(m.x - p.x, m.y - p.y, m.z - p.z) <= range)], relic && Math.hypot(relic.x - p.x, relic.y - p.y, relic.z - p.z) < range ? { x: relic.x, y: relic.y, z: relic.z } : null);
      const target = nodes[0];
      const vein = target && this.deposits.veins[target.vein];
      $('scan-target').textContent = target ? `${vein?.name || B.ORES[target.kind].name} · ${Math.hypot(target.x - p.x, target.y - p.y, target.z - p.z).toFixed(1)} m` : focus < 0 ? 'No deposits in range' : `No ${B.ORES[focus].name.toLowerCase()} within ${range} m`;
      const direction = this.player.direction;
      if (relic) {
        const dx = relic.x - p.x, dz = relic.z - p.z, side = dx * Math.cos(this.player.yaw) - dz * Math.sin(this.player.yaw), ahead = dx * direction.x + dz * direction.z;
        const bearing = Math.hypot(dx, dz) < 2 ? relic.y > p.y ? 'directly above' : 'directly below' : Math.abs(side) < 2 && ahead > 0 ? 'ahead' : ahead < 0 && Math.abs(side) < 2 ? 'behind' : side > 0 ? 'to your right' : 'to your left';
        $('scan-detail').textContent = `${relic.name}: ${Math.max(0, Math.round(-relic.y))} m down, ${bearing}`;
      } else $('scan-detail').textContent = `${nodes.length} deposits within ${range} m`;
      this.audio.note(1300, .16, .03);
    }
    recall() { const tethered = this.expedition?.tether !== null; this.expedition?.detach(); this.clearInput(); this.player.teleport(0, .08, 13); this.player.yaw = Math.PI; this.player.pitch = -.08; this.recallTime = 0; this.changed(); this.toast(tethered ? 'Back at the yard. Tether released; heavy salvage remains below.' : 'Back at the yard. Your haul is safe.'); this.save(); }
    updateCombatHUD() {
      if (!this.combat) return;
      const c = this.combat, hp = Math.ceil(c.state.health), p = this.player.head;
      $('vitals').hidden = hp === 100 && !c.enemies.some(n => n.known); $('health').textContent = hp; $('health-bar').style.width = hp + '%';
      $('hurt-shade').style.opacity = String(c.hurtFlash * .65); $('crosshair').classList.toggle('hit-confirm', c.hitFlash > 0);
      const near = c.enemies.filter(n => n.hp > 0 && n.phase !== 'buried' && Math.hypot(n.x - p.x, n.y - p.y, n.z - p.z) < 7 && this.world.clearLine(p, n, .05)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z) - Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z))[0];
      $('threat').hidden = !near;
      if (near) { $('enemy-health').style.width = near.hp / 60 * 100 + '%'; $('threat-action').textContent = near.phase === 'windup' ? 'Lunge incoming. Move sideways or lift.' : near.phase === 'stunned' ? 'Staggered. Keep pressure on it.' : c.lightAt({ x: this.player.x, y: this.player.y + 1.1, z: this.player.z }) ? 'Your work light keeps it back.' : 'Drill to fight. 6 equips the axe. V places a light.'; }
    }
    updateHUD() {
      if (!this.player) return;
      const e = this.economy, s = e.state, full = e.count >= e.capacity;
      this.updateCombatHUD();
      const cavern = this.world.caverns.networks.find(n => Math.hypot(this.player.x - n.x, this.player.head.y - n.y, this.player.z - n.z) < 4);
      $('cash').textContent = money(s.cash); $('cargo').innerHTML = `${e.count} <small>/ ${e.capacity}</small>`; $('cargo-value').textContent = money(e.value); $('cargo-bar').style.width = `${e.count / e.capacity * 100}%`;
      document.body.classList.toggle('cargo-full', full); $('depth').innerHTML = `${Math.max(0, -this.player.y).toFixed(1)} <small>m</small>`; $('depth-marker').style.top = `${B.clamp(-this.player.y / 73, 0, 1) * 100}%`; $('layer').textContent = (B.Town.region(this.player) || cavern?.name || B.geology(this.player.y).name).toUpperCase();
      const exp = this.expedition, target = this.mysteries.target() || exp.target(), t = B.TOOLS[exp.state.tool];
      let title = this.mysteries.target() ? 'UNUSUAL SIGNAL' : exp.state.awakened ? 'AFTER THE AWAKENING' : 'RECOVERY LEAD', objective = `${target.name} · ${Math.max(0, Math.round(-target.y))} m down · F to prospect`;
      if (exp.tether !== null) { title = exp.snagged ? 'LOAD CAUGHT' : 'HEAVY LIFT'; objective = exp.snagged ? exp.obstruction ? 'Cut the rock at the orange marker. E releases the tether.' : 'Widen the shaft around the load. E releases the tether.' : 'Lift the machine above ground. Keep the cable route clear.'; }
      else if (full) { title = 'CARGO FULL'; objective = this.freight.state.dock ? 'Send cargo at the freight dock, or return to sell.' : 'Lift home or hold R. Sell at the hopper.'; }
      else if (s.trips === 0) { title = 'FIRST HAUL'; objective = e.count ? 'Follow the copper seam. Fill your cargo.' : 'Cut into the copper seam ahead'; }
      else if (s.gear.drill === 0 && s.cash >= B.GEAR.drill.costs[0]) { title = 'MORE TORQUE'; objective = 'Buy your first cutter upgrade at the workshop'; }
      if (this.player.y > -.5 && this.player.z > 24 && !full && this.town.state.met.length < 2) { title = 'RIDGE COMMON'; objective = 'Mara sells supplies. Otis builds upgrades. Walk inside and press E to talk.'; }
      const nearby = B.MYSTERIES.find(m => this.mysteries.state.known.includes(m.id) && !this.mysteries.state.solved.includes(m.id) && Math.hypot(m.x - this.player.x, m.y - this.player.head.y, m.z - this.player.z) < 7);
      if (nearby && exp.tether === null && !full) { title = nearby.name.toUpperCase(); objective = nearby.id === 0 ? `${this.mysteries.sealUntil.filter(t => t > this.mysteries.time).length}/3 seals ringing. Ring all three within one second. J for clues.` : `${this.mysteries.connected}/3 light paths connected. Cut the beam's path; E turns prisms.`; }
      if (this.thunder?.nodes.some(n => !n.collected && n.fuse >= 0 && Math.hypot(n.x - this.player.x, n.y - this.player.head.y, n.z - this.player.z) < 6)) { title = 'CHAIN REACTION'; objective = 'Thunderstone ignited. Stand clear of the flashing crystals.'; }
      $('mission-label').textContent = title; $('mission').textContent = objective;
      $('chapter-banner').hidden = !this.chapterUntil || this.clock > this.chapterUntil;
      $('tool-name').textContent = t.name; $('tool-hint').textContent = t.hint; $('tool-readout').style.setProperty('--tool-color', t.color);
      const charge = exp.cooldown > 0 ? 1 - exp.cooldown / (exp.state.tool === 'gravity' ? 2.4 : 1.3) : exp.charge;
      $('tool-charge').style.width = `${B.clamp(charge, 0, 1) * 100}%`;
      const available = exp.tools();
      for (const [key, info] of Object.entries(B.TOOLS)) { const button = $('tool-' + key); button.classList.toggle('selected', key === exp.state.tool); button.classList.toggle('locked', !available.includes(key)); button.setAttribute('aria-pressed', String(key === exp.state.tool)); button.title = available.includes(key) ? info.hint : info.depth ? `Unlock at ${info.depth} m` : info.magic ? 'Wake the heart' : 'Recover the resonance engine'; }
      $('anchor-status').textContent = exp.state.anchor ? `B Replace anchor / G Return · ${Math.round(-exp.state.anchor.y)} m` : exp.state.recovered.includes(0) ? 'B Plant a return anchor in your tunnel' : '';
      $('freight-status').hidden = !this.freight.state.owned; $('freight-status').textContent = `Freight: ${this.freight.status()} / ${this.freight.stockCount} at yard`; $('touch-freight').hidden = !this.freight.state.owned || !!this.freight.state.dock;
      $('bomb-count').textContent = exp.state.supplies.bombs; $('light-count').textContent = exp.state.supplies.lights;
      $('touch-rift').hidden = !exp.state.awakened;
      const chargeSpec = this.gadgets.spec(), chargeModes = this.gadgets.modes();
      $('charge-name').textContent = chargeSpec.name; $('charge-description').textContent = chargeSpec.hint;
      for (const key of Object.keys(B.CHARGES)) { const button = $('charge-' + key); button.classList.toggle('selected', key === exp.state.chargeMode); button.classList.toggle('locked', !chargeModes.includes(key)); button.setAttribute('aria-pressed', String(key === exp.state.chargeMode)); button.title = chargeModes.includes(key) ? this.gadgets.spec(key).hint : `Unlock at ${B.CHARGES[key].depth} m`; }
      $('remote-trigger').hidden = this.gadgets.remoteCount === 0; $('remote-trigger').textContent = `H Detonate ${this.gadgets.remoteCount}`;
      $('touch-detonate').hidden = this.gadgets.remoteCount === 0; $('touch-charge-mode').hidden = chargeModes.length < 2;
      $('throw-hint').hidden = this.input.aim !== 'bomb'; $('throw-hint').textContent = this.aimPreview?.reason || (exp.state.chargeMode === 'sticky' ? 'Release to plant / H detonates' : exp.state.chargeMode === 'bore' ? `Release to bore / ${chargeSpec.length} m tunnel / 2 charges` : 'Release to throw / 2.6 s fuse');
      if (this.input.aim === 'freight') { $('throw-hint').hidden = false; $('throw-hint').textContent = this.freightPreview?.reason || (this.freightPreview?.obstruction ? 'Release to place / shaft needs excavation' : 'Release to place / freight route clear'); }
      document.body.classList.toggle('awakened', exp.state.awakened);
      const action = this.interaction(); $('interaction').hidden = !action || !!this.recallTime; if (action) $('interaction').innerHTML = `${action.locked ? '' : '<kbd>E</kbd>'}${action.label}`;
      $('contact').textContent = this.cutter.contact ? this.cutter.contact.protected ? 'Unowned ground / stay inside the claim markers' : this.cutter.contact.layer : '';
      $('crosshair').classList.toggle('cutting', this.cutter.edited); $('scanner').hidden = this.scanUntil <= this.clock;
      this.fieldKit?.sync();
      $('recall').hidden = this.recallTime <= 0; $('recall-bar').style.width = `${this.recallTime / 1.25 * 100}%`; $('pickup').hidden = this.pickupUntil <= this.clock;
    }
    updateShop() {
      const s = this.economy.state; $('shop-cash').textContent = money(s.cash); $('shop-sell').textContent = `Sell cargo · ${money(this.economy.saleValue)}`;
      $('gear-list').replaceChildren();
      for (const [key, gear] of Object.entries(B.GEAR)) {
        const level = s.gear[key], max = level === gear.costs.length, next = Math.min(level + 1, gear.values.length - 1), row = document.createElement('div'); row.className = 'gear-row';
        row.innerHTML = `<div><div class="gear-name"><h3>${gear.name}</h3><span class="gear-level">${level + 1} / ${gear.values.length}</span></div><p>${gear.description}</p><div class="gear-delta">${gear.values[level]}${max ? '' : ' → ' + gear.values[next]} ${gear.unit}</div></div>`;
        const button = document.createElement('button'); button.textContent = max ? 'Fully upgraded' : `Upgrade · ${money(gear.costs[level])}`; button.disabled = max || s.cash < gear.costs[level]; button.dataset.gear = key; if (!button.disabled) button.className = 'primary'; button.onclick = () => this.buy(key); row.append(button); $('gear-list').append(row);
      }
      const f = this.freight, unlocked = s.expedition.recovered.includes(f.state.owned ? 1 : 0), cost = f.state.owned ? B.FREIGHT.upgrade : B.FREIGHT.price;
      $('buy-freight').disabled = !unlocked || f.state.upgraded || s.cash < cost; $('buy-freight').textContent = f.state.upgraded ? 'Fully upgraded' : !unlocked ? f.state.owned ? 'Recover engine' : 'Recover flywheel' : `${f.state.owned ? '64-mineral cage' : 'Build crane'} / ${money(cost)}`;
      $('freight-shop-detail').textContent = `A reusable loading dock and crane. ${f.capacity} minerals per trip. Hold T to place underground; E opens the dock. Clear its shaft to the surface.`; $('freight-shop-stock').textContent = `${f.stockCount} minerals at yard / ${money(f.stockValue)} ready to sell`;
      const lead = this.expedition.target(); $('contract-name').textContent = lead.name; $('contract-detail').textContent = lead.brief; $('contract-reward').textContent = lead.reward ? '+' + money(lead.reward) : 'Explore';
      $('buy-bombs').disabled = s.cash < 32 || s.expedition.supplies.bombs > 96; $('buy-lights').disabled = s.cash < 24 || s.expedition.supplies.lights > 93;
      $('charge-workshop').innerHTML = Object.keys(B.CHARGES).map(k => this.gadgets.spec(k)).map(c => `<div class="charge-info ${s.deepest >= c.depth ? 'unlocked' : ''}"><strong>${c.name}</strong><span>${s.deepest >= c.depth ? 'Available' : c.depth + ' m unlock'} / ${c.cost} ${c.cost === 1 ? 'charge' : 'charges'}</span><p>${c.hint}</p></div>`).join('');
      $('unlock-list').innerHTML = B.STRATA.slice(1).map(c => `<div class="unlock-row ${s.deepest >= c.depth ? 'unlocked' : ''}"><span>${String(c.depth).padStart(2, '0')} m</span><strong>${c.name}</strong><small>${c.unlock}</small></div>`).join('');
    }
    statsHTML(s) { return `<div><strong>${money(s.earned)}</strong><span>Total earned</span></div><div><strong>${s.deepest.toFixed(1)} m</strong><span>Deepest point</span></div><div><strong>${s.trips}</strong><span>Hauls delivered</span></div>`; }
    openSurvey() { $('survey-depth').value = B.clamp(Math.floor(-this.player.head.y), 0, 73); this.updateSurvey(); this.setScreen('survey'); }
    updateSurvey() {
      $('survey-focus').hidden = !this.mysteries.state.solved.includes(1); $('mineral-focus').value = this.mysteries.state.focus;
      const depth = Number($('survey-depth').value), chart = this.survey.render(depth, this);
      $('survey-level').textContent = `${depth} m`; $('survey-plan').innerHTML = chart.map; $('survey-profile').innerHTML = chart.profile;
      $('survey-contacts').innerHTML = chart.markers.length ? chart.markers.map(m => `<button data-survey-depth="${B.clamp(Math.floor(-m.y), 0, 73)}"><i style="background:${m.color}"></i>${m.name}<span>${Math.max(0, -m.y).toFixed(0)} m</span></button>`).join('') : '<p>Scan with F to record buried signals. Your excavations and placed lights appear automatically.</p>';
      $('survey-summary').textContent = `${chart.ore} recorded deposits / ${this.gadgets.nodes.filter(n => n.type === 'lamp').length} work lights`;
      for (const button of document.querySelectorAll('[data-survey-depth]')) button.onclick = () => { $('survey-depth').value = button.dataset.surveyDepth; this.updateSurvey(); };
    }
    journal() {
      const s = this.economy.state; $('journal-stats').innerHTML = this.statsHTML(s);
      $('mineral-list').innerHTML = B.ORES.map((o, i) => `<div class="mineral-entry" style="--ore:${o.color}"><strong>${o.name}</strong><span>${money(o.value)} each</span><span>${s.cargo[i]} held / ${s.sold[i]} sold</span></div>`).join('');
      const e = this.expedition.state;
      const recoveryNotes = B.SALVAGE.filter(r => r.id === 0 || e.recovered.includes(0) || s.deepest >= 25).map(r => `<div class="discovery-entry"><strong>${e.recovered.includes(r.id) ? 'RECOVERED / ' : `${Math.round(-r.y)} m / `}${r.name}</strong><p>${r.brief}</p></div>`).join('');
      const sealNotes = e.recovered.includes(1) || s.deepest >= 43 ? `<div class="discovery-entry"><strong>The choir seal (${e.runes.length}/3 awake)</strong><p>Clear the rock around each glowing wall stone. Charge a resonator pulse into it. Three voices open the way.</p></div>` : '';
      const gardenNotes = e.runes.length === 3 || s.deepest >= 59 ? `<div class="discovery-entry"><strong>${e.awakened ? 'The heart chose you' : 'Something beyond the seal'}</strong><p>${e.awakened ? `Gravity is yours. ${e.vaults.length}/3 sealed geodes opened. Use F to follow their echoes, and Q to open them.` : 'Follow the roots. Something is still alive.'}</p></div>` : '';
      const thunderNotes = this.thunder.state.known.length ? `<div class="discovery-entry"><strong>Thunderstone seams</strong><p>Pink crystals store a shock. Dig one completely free and recover a charge with E, or ignite it with a blast or resonator pulse. After a short flash it explodes, opening more rock and lighting nearby crystals. Breaking a link limits the chain. Rich minerals run beside these seams. Drilling alone is safe.</p></div>` : '';
      const refugeNotes = this.refuges.state.known.length ? `<div class="discovery-entry"><strong>Old survey refuges (${this.refuges.state.lit.length}/3 restored)</strong><p>A cabinet marks a sheltered working. Expose it, then fit one work light with E. Its lamp lights the chamber and its chart records nearby passages on M. Cabinets fall if their supporting rock is removed.</p></div>` : '';
      const creatureNotes = this.combat.enemies.some(n => n.known) ? '<div class="discovery-entry"><strong>Cinder moths</strong><p>Drills cut their shells; the mining axe (6) staggers them. A bright flare warns of a lunge. Dodge sideways or lift. Placed lights and restored refuge lamps keep them back. Cleared moths stay cleared, leaving a husk worth two charges. Surface rest restores health. Lost cargo waits in a marked recovery cache after rescue; E retrieves it, with overflow left safely below.</p></div>' : '';
      $('discovery-list').innerHTML = recoveryNotes + sealNotes + gardenNotes + thunderNotes + refugeNotes + creatureNotes;
      $('mystery-list').replaceChildren();
      if (!this.mysteries.state.known.length) { const hint = document.createElement('p'); hint.className = 'fine'; hint.textContent = 'Unusual signals appear when you scan or explore near them. Recovered machinery may also contain a lead.'; $('mystery-list').append(hint); }
      for (const id of this.mysteries.state.known) {
        const m = B.MYSTERIES[id], solved = this.mysteries.state.solved.includes(id), row = document.createElement('div'); row.className = 'discovery-entry mystery-entry';
        row.innerHTML = `<strong>${solved ? 'RECOVERED / ' : Math.round(-m.y) + ' m / '}${m.name}</strong><p>${solved ? m.benefit : m.clue}</p><small>${solved ? m.reward : 'Optional discovery'}</small>`;
        if (!solved) { const button = document.createElement('button'), tracked = this.mysteries.state.tracked === id; button.textContent = tracked ? 'Stop tracking' : 'Track this signal'; button.onclick = () => { this.mysteries.track(tracked ? -1 : id); this.changed(); this.journal(); this.updateHUD(); }; row.append(button); }
        $('mystery-list').append(row);
      }
      this.setScreen('journal');
    }
    toast(text, duration = 3300) { clearTimeout(this.toastTimer); $('toast').textContent = text; $('toast').classList.add('visible'); this.toastTimer = setTimeout(() => $('toast').classList.remove('visible'), duration); }
    clearInput() { this.input.keys.clear(); this.input.fire = false; this.input.aim = null; this.aimPreview = null; this.freightPreview = null; this.input.lookPointer = null; this.recallTime = 0; this.accumulator = 0; if (this.combat) this.combat.state.swing = 0; if (this.cutter) this.cutter.edited = false; this.audio.drill(false, false, 0); this.audio.silence?.(); }
    setScreen(name) {
      this.clearInput(); this.screen = name; this.running = name === null; document.body.classList.toggle('in-menu', !this.running);
      for (const screen of document.querySelectorAll('.screen')) screen.hidden = screen.id !== name + '-screen';
      if (name) $('field-tip').hidden = true;
      $('hud').hidden = name === 'title'; $('touch-controls').hidden = !this.running || !matchMedia('(pointer:coarse)').matches;
      if (name && document.pointerLockElement) document.exitPointerLock();
      if (name) { const screen = $(name + '-screen'); requestAnimationFrame(() => screen?.querySelector('button:not([disabled])')?.focus({ preventScroll: true })); }
    }
    play() {
      if (!this.ready) return;
      this.setScreen(null); this.audio.start(); $('view').focus({ preventScroll: true });
      if (!matchMedia('(pointer:coarse)').matches) {
        try { const request = $('view').requestPointerLock(); request?.catch(() => this.pointerFallback()); } catch { this.pointerFallback(); }
      }
    }
    pointerFallback() { if (this.pointerHint) return; this.pointerHint = true; this.toast('Right-drag to look when mouse capture is unavailable.'); }
    async save() {
      if (!this.ready) return;
      this.saving = true; const revision = this.revision, data = B.Saves.snapshot(this), serial = this.saveSerial = (this.saveSerial || 0) + 1;
      try { await this.store.write(data); if (revision === this.revision) this.dirty = false; if (serial === this.saveSerial) $('save-status').textContent = 'Claim saved on this device.'; this.audit.saves++; }
      catch { if (serial === this.saveSerial) $('save-status').textContent = 'Local save unavailable. Export a save to keep your claim.'; }
      finally { if (serial === this.saveSerial) this.saving = false; }
    }
    export() {
      if (!this.ready) return;
      const url = URL.createObjectURL(new Blob([JSON.stringify(B.Saves.snapshot(this, true))], { type: 'application/json' })), link = document.createElement('a'); link.href = url; link.download = 'buttloads2-claim-v2.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); this.toast('Claim exported.');
    }
    async import(data) {
      const validated = B.Saves.validate(data); this.setScreen('pause'); this.ready = false;
      try { await this.install(validated); await this.store.pending.catch(() => {}); await this.save(); this.toast('Claim restored.'); }
      finally { this.ready = true; $('loading').hidden = true; }
    }
    async newClaim() { this.setScreen('pause'); this.ready = false; try { await this.store.pending.catch(() => {}); await this.install(null); await this.save(); this.play(); } catch (e) { this.ready = true; $('loading').hidden = true; this.toast('Could not create claim: ' + e.message); } }
    syncSettings() { $('tips-setting').checked = this.settings.tips; $('sound-setting').checked = this.settings.sound; $('motion-setting').checked = this.settings.motion; $('sensitivity-setting').value = this.settings.sensitivity; $('quality-setting').value = this.settings.quality; }
    bindUI() {
      $('start-button').onclick = () => this.play();
      for (const key of Object.keys(B.TOOLS)) $('tool-' + key).onclick = () => { if (this.running) this.selectTool(key); };
      $('touch-tool').onclick = () => this.cycleTool(); $('touch-rift').onclick = () => { if (this.running && this.expedition.pulse(this.player, true)) this.changed(); };
      $('touch-anchor').onclick = () => this.player.y < -.5 ? this.anchor() : this.descend();
      $('touch-light').onclick = () => this.deploy('lamp');
      $('buy-freight').onclick = () => this.buyFreight(); for (const action of ['send', 'recall', 'take', 'pack']) $('freight-' + action).onclick = () => this.freightAction(action);
      $('buy-bombs').onclick = () => this.restock('bomb'); $('buy-lights').onclick = () => this.restock('lamp');
      for (const mode of Object.keys(B.CHARGES)) $('charge-' + mode).onclick = () => this.selectCharge(mode);
      $('remote-trigger').onclick = $('touch-detonate').onclick = () => this.detonate(); $('touch-charge-mode').onclick = () => this.cycleCharge();
      for (const button of document.querySelectorAll('[data-resume]')) button.onclick = () => this.play();
      $('menu-button').onclick = () => { this.setScreen('pause'); this.save(); }; $('journal-button').onclick = () => this.journal();
      $('survey-button').onclick = $('journal-map').onclick = () => this.openSurvey();
      $('mineral-focus').onchange = () => { if (this.mysteries.focus(Number($('mineral-focus').value))) { this.changed(); this.updateSurvey(); } };
      $('survey-depth').oninput = () => this.updateSurvey(); $('survey-here').onclick = () => { $('survey-depth').value = B.clamp(Math.floor(-this.player.head.y), 0, 73); this.updateSurvey(); };
      $('title-about').onclick = () => { this.aboutFrom = 'title'; this.setScreen('about'); }; $('pause-about').onclick = () => { this.aboutFrom = 'pause'; this.setScreen('about'); }; $('about-close').onclick = () => this.setScreen(this.aboutFrom || 'pause');
      $('shop-sell').onclick = () => this.sell(); $('return-button').onclick = () => { this.recall(); this.play(); };
      $('new-button').onclick = () => this.setScreen('confirm'); $('confirm-cancel').onclick = () => this.setScreen('pause'); $('confirm-new').onclick = () => this.newClaim();
      for (const id of ['export-button', 'ending-export', 'confirm-export']) $(id).onclick = () => this.export();
      $('import-button').onclick = () => $('import-file').click();
      $('import-file').onchange = async () => { const file = $('import-file').files[0]; if (!file) return; try { if (file.size > 6000000) throw new Error('Save exceeds 6 MB.'); await this.import(JSON.parse(await file.text())); } catch (e) { this.toast('Could not import: ' + e.message, 6500); } finally { $('import-file').value = ''; } };
      for (const key of ['sound', 'tips', 'motion', 'sensitivity', 'quality']) $(key + '-setting').oninput = e => { this.settings[key] = e.target.type === 'checkbox' ? e.target.checked : +e.target.value; this.changed(); if (key === 'quality') this.view.resize(); if (key === 'sound') this.audio.start(); this.fieldKit.sync(); };
      window.addEventListener('resize', () => this.view?.resize());
      $('view').addEventListener('webglcontextlost', e => { e.preventDefault(); this.setScreen('pause'); this.save(); this.toast('Graphics context lost. Your claim was saved; reload to continue.', 15000); });
    }
    bindInput() {
      const canvas = $('view'), keys = this.input.keys;
      window.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.repeat && ['Escape', 'Tab', 'KeyM', 'KeyI'].includes(e.code)) return;
        if (this.screen === 'town' && e.code === 'Escape') { e.preventDefault(); this.play(); return; }
        if (this.screen === 'town' && e.code === 'Tab') return;
        if (this.screen === 'kit' && ['Escape', 'KeyI'].includes(e.code)) { e.preventDefault(); this.play(); return; }
        if (this.screen === 'kit' && (/^Digit[1-6]$/.test(e.code) || ['KeyX', 'KeyN'].includes(e.code))) {
          e.preventDefault(); if (e.repeat) return;
          if (e.code === 'KeyX') this.cycleTool(); else if (e.code === 'KeyN') this.cycleCharge(); else this.selectTool(Object.keys(B.TOOLS)[Number(e.code.slice(-1)) - 1]);
          return;
        }
        if (e.code === 'Escape' || (e.code === 'Tab' && this.running)) { e.preventDefault(); if (!this.ready || this.screen === 'title') return; if (this.running) { this.setScreen('pause'); this.save(); } else if (this.screen === 'pause') this.play(); else this.setScreen('pause'); return; }
        if (!this.running) {
          if (e.code === 'KeyM' && this.screen === 'survey') { e.preventDefault(); this.play(); return; }
          if (e.code === 'Tab') { const focusables = [...document.querySelectorAll('.screen:not([hidden]) button:not([disabled]),.screen:not([hidden]) a,.screen:not([hidden]) input,.screen:not([hidden]) select')]; const index = focusables.indexOf(document.activeElement); if (focusables.length && ((e.shiftKey && index <= 0) || (!e.shiftKey && index === focusables.length - 1))) { e.preventDefault(); focusables[e.shiftKey ? focusables.length - 1 : 0].focus(); } }
          return;
        }
        if (['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyF', 'KeyE', 'KeyJ', 'KeyM', 'KeyB', 'KeyG', 'KeyQ', 'KeyX', 'KeyC', 'KeyV', 'KeyN', 'KeyH', 'KeyT', 'KeyI', 'KeyY'].includes(e.code) || /^Digit[1-6]$/.test(e.code)) e.preventDefault(); keys.add(e.code);
        if (e.repeat) return;
        if (e.code === 'KeyI') { this.fieldKit.open(); return; }
        if (e.code === 'KeyY') this.fieldKit.dismiss();
        if (e.code === 'KeyE') this.use(); if (e.code === 'KeyF') this.scan(); if (e.code === 'KeyJ') this.journal();
        if (/^Digit[1-6]$/.test(e.code)) this.selectTool(Object.keys(B.TOOLS)[Number(e.code.slice(-1)) - 1]);
        if (e.code === 'KeyX') this.cycleTool(); if (e.code === 'KeyB') this.anchor(); if (e.code === 'KeyG') this.descend();
        if (e.code === 'KeyC') this.aimBomb(); if (e.code === 'KeyV') this.deploy('lamp'); if (e.code === 'KeyM') this.openSurvey();
        if (e.code === 'KeyQ') { if (this.expedition.state.awakened) { if (this.expedition.pulse(this.player, true)) this.changed(); } else this.toast('The power under the garden has not awakened.'); }
        if (e.code === 'KeyN') this.cycleCharge();
        if (e.code === 'KeyH') this.detonate(); if (e.code === 'KeyT') this.aimFreight();
      });
      window.addEventListener('keyup', e => { keys.delete(e.code); if (e.code === 'KeyC') this.releaseBomb(); if (e.code === 'KeyT') this.releaseFreight(); });
      window.addEventListener('blur', () => { if (this.running) { this.setScreen('pause'); this.save(); } else this.clearInput(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden && this.ready) { if (this.running) this.setScreen('pause'); this.save(); } });
      document.addEventListener('pointerlockchange', () => { if (!document.pointerLockElement && this.running && this.hadPointerLock) { this.setScreen('pause'); this.save(); } this.hadPointerLock = document.pointerLockElement === canvas; });
      document.addEventListener('pointerlockerror', () => this.pointerFallback());
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('pointerdown', e => {
        if (!this.running) return;
        if (e.pointerType === 'touch' || e.button === 2) { this.input.lookPointer = e.pointerId; this.input.lookX = e.clientX; this.input.lookY = e.clientY; if (!document.pointerLockElement) canvas.setPointerCapture(e.pointerId); }
        else if (e.button === 0) { this.input.fire = true; this.audio.start(); }
      });
      window.addEventListener('pointerup', e => { if (e.button === 0 && e.pointerType !== 'touch') this.input.fire = false; if (this.input.lookPointer === e.pointerId) this.input.lookPointer = null; });
      canvas.addEventListener('pointercancel', () => this.clearInput());
      window.addEventListener('pointermove', e => {
        if (!this.running) return;
        if (document.pointerLockElement === canvas) this.player.look(e.movementX, e.movementY, this.settings.sensitivity);
        else if (this.input.lookPointer === e.pointerId) { this.player.look(e.clientX - this.input.lookX, e.clientY - this.input.lookY, this.settings.sensitivity); this.input.lookX = e.clientX; this.input.lookY = e.clientY; }
      });
      const hold = (id, start, stop) => { const button = $(id); button.addEventListener('pointerdown', e => { e.preventDefault(); if (!this.running) return; button.setPointerCapture(e.pointerId); start(); }); button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', stop); button.addEventListener('lostpointercapture', stop); };
      const bombButton = $('touch-bomb'); bombButton.addEventListener('pointerdown', e => { e.preventDefault(); if (!this.running) return; bombButton.setPointerCapture(e.pointerId); this.aimBomb(); }); bombButton.addEventListener('pointerup', () => this.releaseBomb());
      for (const event of ['pointercancel', 'lostpointercapture']) bombButton.addEventListener(event, () => { this.input.aim = null; this.aimPreview = null; });
      const freightButton = $('touch-freight'); freightButton.addEventListener('pointerdown', e => { e.preventDefault(); if (!this.running) return; freightButton.setPointerCapture(e.pointerId); this.aimFreight(); }); freightButton.addEventListener('pointerup', () => this.releaseFreight()); for (const event of ['pointercancel', 'lostpointercapture']) freightButton.addEventListener(event, () => { if (this.input.aim === 'freight') { this.input.aim = null; this.freightPreview = null; } });
      hold('touch-cut', () => { this.input.fire = true; this.audio.start(); }, () => { this.input.fire = false; }); hold('touch-lift', () => keys.add('Space'), () => keys.delete('Space')); hold('touch-recall', () => keys.add('KeyR'), () => keys.delete('KeyR'));
      $('touch-use').onclick = () => this.use(); $('touch-scan').onclick = () => this.scan();
      const stick = $('joystick'); let stickPointer = null;
      const resetStick = () => { stickPointer = null; for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) keys.delete(k); stick.firstElementChild.style.transform = ''; };
      const moveStick = e => { const rect = stick.getBoundingClientRect(), x = B.clamp((e.clientX - rect.left - 60) / 40, -1, 1), y = B.clamp((e.clientY - rect.top - 60) / 40, -1, 1); for (const [key, active] of [['KeyA', x < -.25], ['KeyD', x > .25], ['KeyW', y < -.25], ['KeyS', y > .25]]) active ? keys.add(key) : keys.delete(key); stick.firstElementChild.style.transform = `translate(${x * 35}px,${y * 35}px)`; };
      stick.onpointerdown = e => { if (!this.running) return; e.preventDefault(); stickPointer = e.pointerId; stick.setPointerCapture(e.pointerId); moveStick(e); }; stick.onpointermove = e => { if (e.pointerId === stickPointer) moveStick(e); }; stick.onpointerup = stick.onpointercancel = stick.onlostpointercapture = resetStick;
    }
  }
  B.Game = Game;
  const game = new Game();
  // Explicit QA surface. Production state stays inside Game; no hidden cheats in controls.
  window.__buttloads = game;
  game.boot();
})(B2);
