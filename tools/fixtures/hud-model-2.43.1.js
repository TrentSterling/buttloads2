// Frozen production methods from 2.43.1, used only for output compatibility.
(function(B){const $=id=>document.getElementById(id),money=value=>'$'+Math.round(value).toLocaleString('en-US');return {
updateCombatHUD() {
      if (!this.combat) return;
      const c = this.combat, hp = Math.ceil(c.state.health), p = this.player.head;
      $('vitals').hidden = hp === 100 && !c.enemies.some(n => n.known) && !this.foreman.state.known && !this.crawlers.nodes.some(n => n.known); $('health').textContent = hp; $('health-bar').style.width = hp + '%';
      $('hurt-shade').style.opacity = String(c.hurtFlash * .65); $('crosshair').classList.toggle('hit-confirm', c.hitFlash > 0);
      const near = c.enemies.filter(n => n.hp > 0 && n.phase !== 'buried' && Math.hypot(n.x - p.x, n.y - p.y, n.z - p.z) < 7 && this.world.clearLine(p, n, .05)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z) - Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z))[0];
      const furnace = this.foreman.state.active && Math.hypot(this.player.x - this.foreman.core.x, this.player.y - this.foreman.core.y, this.player.z - this.foreman.core.z) < 26;
      $('foreman-hud').hidden = !furnace; $('foreman-health').style.width = (this.foreman.core?.hp || 0) / 420 * 100 + '%'; $('foreman-hint').textContent = this.foreman.hint(); $('foreman-locks').textContent = `${this.foreman.broken}/3 pressure locks broken`;
      const crawler = this.crawlers.nodes.filter(n => n.hp > 0 && n.known && n.phase !== 'buried' && Math.hypot(n.x-p.x,n.y-p.y,n.z-p.z)<9 && this.world.clearLine(p,n,.05)).sort((a,b) => Math.hypot(a.x-p.x,a.y-p.y,a.z-p.z)-Math.hypot(b.x-p.x,b.y-p.y,b.z-p.z))[0];
      $('threat').hidden = !(near || crawler) || furnace; $('threat-name').textContent = crawler ? 'SHALE CRAWLER' : 'CINDER MOTH'; $('enemy-armor').hidden = !crawler;
      if (crawler) { $('enemy-armor').textContent = crawler.shell > 0 ? `Shell ${Math.ceil(crawler.shell)} / 90` : 'Shell broken'; $('enemy-health').style.width = crawler.hp / B.CRAWLER_HP * 100 + '%'; $('threat-action').textContent = this.crawlers.hint(crawler); }
      $('touch-foundry').hidden = !this.foreman.state.defeated; $('kit-foundry').hidden = !this.foreman.state.defeated; $('foundry-charge').textContent = this.foreman.state.forgeCooldown > 0 ? `${this.foreman.state.forgeCooldown.toFixed(1)} s` : 'Ready';
      if (near && !crawler) { $('enemy-health').style.width = near.hp / 60 * 100 + '%'; $('threat-action').textContent = near.phase === 'windup' ? 'Lunge incoming. Move sideways or lift.' : near.phase === 'stunned' ? 'Staggered. Keep pressure on it.' : c.lightAt({ x: this.player.x, y: this.player.y + 1.1, z: this.player.z }) ? 'Your work light keeps it back.' : 'Drill to fight. 6 equips the axe. V places a light.'; }
    },
    updateHUD() {
      if (!this.player) return;
      const e = this.economy, s = e.state, full = e.count >= e.capacity;
      this.updateCombatHUD();
      const cavern = this.world.caverns.networks.find(n => Math.hypot(this.player.x - n.x, this.player.head.y - n.y, this.player.z - n.z) < 4);
      $('cash').textContent = money(s.cash); $('cargo').innerHTML = `${e.count} <small>/ ${e.capacity}</small>`; $('cargo-value').textContent = money(e.value); $('cargo-bar').style.width = `${e.count / e.capacity * 100}%`;
      document.body.classList.toggle('cargo-full', full); $('depth').innerHTML = `${Math.max(0, -this.player.y).toFixed(1)} <small>m</small>`; $('depth-marker').style.top = `${B.clamp(-this.player.y / -this.world.floor, 0, 1) * 100}%`; $('layer').textContent = (B.Town.region(this.player,this.world) || cavern?.name || B.geology(this.player.y).name).toUpperCase();
      const exp = this.expedition, target = this.mysteries.target() || this.deep.target() || exp.target(), t = B.TOOLS[exp.state.tool];
      let title = this.mysteries.target() ? 'UNUSUAL SIGNAL' : exp.state.awakened ? 'AFTER THE AWAKENING' : 'RECOVERY LEAD', objective = `${target.name} · ${Math.max(0, Math.round(-target.y))} m down · F to prospect`;
      if (exp.tether !== null) { title = exp.snagged ? 'LOAD CAUGHT' : 'HEAVY LIFT'; objective = exp.snagged ? exp.obstruction ? 'Cut the rock at the orange marker. E releases the tether.' : 'Widen the shaft around the load. E releases the tether.' : 'Lift the machine above ground. Keep the cable route clear.'; }
      else if (full) { title = 'CARGO FULL'; objective = this.freight.state.dock ? 'Send cargo at the freight dock, or return to sell.' : 'Lift home or hold R. Sell at the hopper.'; }
      else if (s.trips === 0) { title = 'FIRST HAUL'; objective = e.count ? 'Follow the copper seam. Fill your cargo.' : 'Cut into the copper seam ahead'; }
      else if (s.gear.drill === 0 && s.cash >= B.GEAR.drill.costs[0]) { title = 'MORE TORQUE'; objective = 'Buy your first cutter upgrade at the workshop'; }
      if (this.player.y > -.5 && this.player.z > 24 && !full && this.town.state.met.length < 2) { title = 'RIDGE COMMON'; objective = 'Mara sells supplies. Otis builds upgrades. Walk inside and press E to talk.'; }
      const nearby = B.MYSTERIES.find(m => this.mysteries.state.known.includes(m.id) && !this.mysteries.state.solved.includes(m.id) && Math.hypot(m.x - this.player.x, m.y - this.player.head.y, m.z - this.player.z) < 7);
      if (nearby && exp.tether === null && !full) { title = nearby.name.toUpperCase(); objective = nearby.id === 0 ? `${this.mysteries.sealUntil.filter(t => t > this.mysteries.time).length}/3 seals ringing. Ring all three within one second. J for clues.` : `${this.mysteries.connected}/3 light paths connected. Cut the beam's path; E turns prisms.`; }
      if (this.foreman.state.defeated && exp.tether === null && !full) { title = 'THE FURNACE IS YOURS'; objective = 'Z melts a 12 m passage. Ridge Common has power again.'; }
      if (this.thunder?.nodes.some(n => !n.collected && n.fuse >= 0 && Math.hypot(n.x - this.player.x, n.y - this.player.head.y, n.z - this.player.z) < 6)) { title = 'CHAIN REACTION'; objective = 'Thunderstone ignited. Stand clear of the flashing crystals.'; }
      if (this.rescue.state.known && !this.rescue.rescued && Math.hypot(this.player.x - B.BELL.x, this.player.y - this.rescue.state.y, this.player.z - B.BELL.z) < 10 && !full) { title = 'BRING INEZ HOME'; objective = this.rescue.status(); }
      $('mission-label').textContent = title; $('mission').textContent = objective;
      $('chapter-banner').hidden = !this.chapterUntil || this.clock > this.chapterUntil;
      $('tool-name').textContent = exp.state.tool === 'axe' && this.crawlers.state.impactHead ? 'Impact axe' : t.name; $('tool-hint').textContent = exp.state.tool === 'axe' && this.crawlers.state.impactHead ? 'Basalt edge / 52 damage / double rock cutting' : t.hint; $('tool-readout').style.setProperty('--tool-color', t.color);
      const charge = exp.cooldown > 0 ? 1 - exp.cooldown / (exp.state.tool === 'gravity' ? 2.4 : 1.3) : exp.charge;
      $('tool-charge').style.width = `${B.clamp(exp.state.tool==='sling'?this.kinetics.state.charge:charge, 0, 1) * 100}%`;
      if(exp.state.tool==='sling')$('tool-hint').textContent=this.kinetics.hint();
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
      $('contact').textContent = this.cutter.contact ? this.cutter.contact.protected ? this.cutter.contact.y <= this.world.floorAt(this.cutter.contact.x,this.cutter.contact.z) + .3 ? this.world.parcelVersion && this.cutter.contact.x>=14 ? 'Eastcut bedrock / Claim 02 continues deeper' : this.world.deepOpen ? 'Bedrock / explore the furnace chamber above' : 'Sealed floor / the living heart opens the rootway' : 'Unowned ground / stay inside the claim markers' : this.cutter.contact.layer : '';
      $('crosshair').classList.toggle('cutting', this.cutter.edited); $('scanner').hidden = this.scanUntil <= this.clock;
      if(exp.state.tool==='sling' && this.kinetics.state.held!==null && this.kinetics.obstruction)$('contact').textContent=this.kinetics.hint();
      this.fieldKit?.sync();
      $('recall').hidden = this.recallTime <= 0; $('recall-bar').style.width = `${this.recallTime / 1.25 * 100}%`; $('pickup').hidden = this.pickupUntil <= this.clock;
    },
sync() {
      const g = this.game; if (!g.ready || !g.guide) return;
      const e = g.expedition.state, available = g.expedition.tools(), modes = g.gadgets.modes(), spec = g.gadgets.spec();
      if (g.guide.observe(g)) g.changed();
      for (const [key, row] of this.rows) {
        const owned = available.includes(key); row.hidden = !owned; row.disabled = !owned; row.setAttribute('aria-pressed', String(key === e.tool));
        $('tool-' + key).hidden = !owned; $('tool-' + key).disabled = !owned;
      }
      $('tool-slots').hidden = available.length < 2;
      $('tool-meter').hidden = !['resonance', 'gravity', 'sling'].includes(e.tool);
      $('hud-charge-name').textContent = spec.short[0] + spec.short.slice(1).toLowerCase();
      $('hud-charge-cycle').hidden = modes.length < 2;
      $('kit-equipped').textContent = e.tool === 'axe' && e.crawlers?.impactHead ? 'Impact axe / 52 damage / double rock cutting' : B.TOOLS[e.tool].name; $('kit-bombs').textContent = e.supplies.bombs; $('kit-lights').textContent = e.supplies.lights;
      const useLabel = e.tool === 'sling' ? 'Sling' : e.tool === 'gravity' ? 'Draw' : e.tool === 'resonance' ? 'Pulse' : e.tool === 'axe' ? 'Swing' : 'Cut'; $('touch-cut').textContent = useLabel; $('primary-use-label').textContent = useLabel;
      $('kit-remote-count').textContent = g.gadgets.remoteCount ? `${g.gadgets.remoteCount} remote ${g.gadgets.remoteCount === 1 ? 'satchel' : 'satchels'} waiting / H detonates` : 'Hold C to aim. Release to throw.';
      for (const key of Object.keys(B.CHARGES)) { const button = $('charge-' + key), unlocked = modes.includes(key); button.disabled = !unlocked; button.textContent = unlocked ? B.CHARGES[key].short : `${B.CHARGES[key].depth} m`; }
      const next = B.STRATA.find(s => s.depth > g.economy.state.deepest); $('kit-next').textContent = next ? `Next stratum at ${next.depth} m: ${next.unlock}.` : 'Every stratum reached. Your equipment and discoveries stay with this mine.';
      $('kit-anchor').hidden = !e.recovered.includes(0); $('kit-freight').hidden = !g.freight.state.owned; $('kit-rift').hidden = !e.awakened;
      $('touch-anchor').hidden = !e.recovered.includes(0); $('touch-tool').hidden = available.length < 2;
      const action = g.interaction(); $('touch-use').disabled = !action || action.locked;
      $('kit-summary').textContent = `${available.length} ${available.length === 1 ? 'tool' : 'tools'} / ${modes.length} ${modes.length === 1 ? 'charge type' : 'charge types'} / ${g.economy.capacity} mineral capacity`;
      this.tip = g.guide.hint(g); $('field-tip').hidden = !this.tip;
      if (this.tip) { $('tip-key').textContent = matchMedia('(pointer:coarse)').matches ? 'FIELD TIP' : this.tip.key; $('tip-title').textContent = this.tip.title; $('tip-text').textContent = matchMedia('(pointer:coarse)').matches ? this.tip.touch : this.tip.text; }
    }
};})(B2);
