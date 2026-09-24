/* Progressive controls and optional advice. Uses the same equipment actions as hotkeys. */
'use strict';
(function (B) {
  const $ = id => document.getElementById(id);
  const TIPS = [
    { id: 'scan', key: 'F', title: 'Follow a vein', text: 'Scan to see nearby minerals and buried signals. M keeps a map of what you find.', touch: 'Tap Scan to find minerals. Open Survey to inspect recorded signals.', ready: g => g.economy.state.mined > 0 },
    { id: 'charge', key: 'C', title: 'Make some room', text: 'Hold C to preview a charge. Release to throw it. Blasts free minerals without destroying them.', touch: 'Hold Charge to preview the blast, then release to throw. Minerals survive.', ready: g => g.economy.state.deepest >= 3 && g.gadgets.state.supplies.bombs > 0 },
    { id: 'light', key: 'V', title: 'Leave a light behind', text: 'V places a work light in your tunnel. Aim at it and press E to retrieve it later.', touch: 'Tap Light to mark your route. Aim at a placed light and tap Use to recover it.', ready: g => g.player.y < -6 && g.gadgets.state.supplies.lights > 0 },
    { id: 'scoop', key: '2', title: 'A wider way through', text: 'The scoop opens broad passages in soil and clay. Press 2 to equip it; X cycles tools.', touch: 'Choose the Scoop in Field kit to open wider passages in soil and clay.', ready: g => g.economy.state.deepest >= 9 },
    { id: 'anchor', key: 'B / G', title: 'Keep your place', text: 'B plants a return anchor in an open tunnel. After returning to the yard, G takes you back.', touch: 'Tap Anchor underground to mark your place. Tap it again at the yard to return.', ready: g => g.expedition.state.recovered.includes(0) && g.player.y < -3 },
    { id: 'remote', key: 'N / H', title: 'Choose when it blows', text: 'N selects remote satchels. Hold C to aim, release to plant; H fires them. E recovers an armed satchel.', touch: 'Choose Remote in Field kit. Hold Charge to aim, release to plant, then tap Detonate.', ready: g => g.economy.state.deepest >= 9 && g.gadgets.state.supplies.bombs > 0 },
    { id: 'lance', key: '3', title: 'Hard rock, narrow cuts', text: 'The lance bites through deep rock faster. Press 3 to equip it. Use the scoop when a load needs room.', touch: 'Choose the Lance in Field kit for hard rock. Use the Scoop to widen a hauling route.', ready: g => g.economy.state.deepest >= 25 },
    { id: 'bore', key: 'N / C', title: 'Cut a tunnel in one shot', text: 'N selects a bore charge. Hold C to inspect its direction before throwing. It uses two charges.', touch: 'Choose Bore in Field kit. Hold Charge to inspect the tunnel direction. Each throw uses two charges.', ready: g => g.economy.state.deepest >= 25 && g.gadgets.state.supplies.bombs >= 2 },
    { id: 'freight', key: 'T', title: 'Give your cargo a ride', text: 'Hold T over an open underground floor, then release to place the freight dock. E opens its controls.', touch: 'Hold Crane over an open underground floor; release to place. Approach the dock and tap Use.', ready: g => g.freight.state.owned && !g.freight.state.dock && g.player.y < -3 },
    { id: 'resonance', key: '4', title: 'Listen to the rock', text: 'Equip the resonator with 4 and hold the trigger to charge a pulse. It breaks rock and wakes exposed seal stones.', touch: 'Choose Resonator in Field kit, then hold Pulse to charge a pulse. It wakes exposed seal stones.', ready: g => g.expedition.state.recovered.includes(1) },
    { id: 'rift', key: 'Q', title: 'The mine answers', text: 'Q tears open rock. Equip the heart with 5 and hold the trigger to draw loose minerals toward you.', touch: 'Tap Rift to open rock. Equip the heart in Field kit and hold Draw to bring in loose minerals.', ready: g => g.expedition.state.awakened }
  ];
  class FieldGuide {
    constructor(progress) { this.state = progress.expedition.guide ||= { version: 1, done: [] }; }
    static validate(s) {
      if (!s || s.version !== 1 || !Array.isArray(s.done) || s.done.length > TIPS.length || new Set(s.done).size !== s.done.length || s.done.some(id => !TIPS.some(t => t.id === id))) throw new Error('Invalid field tips.');
      return { version: 1, done: [...s.done] };
    }
    mark(id) { if (!TIPS.some(t => t.id === id) || this.state.done.includes(id)) return false; this.state.done.push(id); return true; }
    observe(g) {
      const e = g.expedition.state, done = [];
      if (g.scanUntil > 0) done.push('scan');
      for (const n of g.gadgets.nodes) { if (n.type === 'lamp') done.push('light'); else { done.push('charge'); if (n.mode === 'sticky') done.push('remote'); if (n.mode === 'bore') done.push('bore'); } }
      if (['scoop', 'lance'].includes(e.tool)) done.push(e.tool);
      if (e.anchor) done.push('anchor'); if (g.freight.state.dock) done.push('freight');
      if (g.expedition.lastPulse) done.push(g.expedition.lastPulse.magic ? 'rift' : 'resonance');
      let changed = false; for (const id of done) changed = this.mark(id) || changed; return changed;
    }
    hint(g) {
      if (!g.running || g.settings.tips === false || g.input.aim || g.recallTime || g.expedition.tether !== null || g.economy.count >= g.economy.capacity || g.scanUntil > g.clock || (g.chapterUntil && g.chapterUntil > g.clock)) return null;
      if (g.interaction() || g.thunder?.nodes.some(n => !n.collected && n.fuse >= 0 && Math.hypot(n.x - g.player.x, n.y - g.player.head.y, n.z - g.player.z) < 6)) return null;
      return TIPS.find(t => !this.state.done.includes(t.id) && t.ready(g)) || null;
    }
  }
  const ICONS = {
    cutter: '<path d="M9 15h10l4 4v10H9zM19 15V9m-4 6V7m-4 8V9M12 29v8h5v-8"/><path d="M23 23h9l5 6-5 6h-9"/>',
    scoop: '<path d="m21 6 4 16m-6 1 12-3 5 11-8 9-12-4-1-12z"/>',
    lance: '<path d="m22 6 5 14h-9zM17 20h11v12H17zM19 32v8h7v-8"/>',
    resonance: '<circle cx="23" cy="22" r="10"/><circle cx="23" cy="22" r="4"/><path d="M23 5v4m0 26v7M6 22h4m26 0h4M11 10l3 3m18 18 3 3m0-24-3 3M14 31l-3 3"/>',
    gravity: '<path d="m23 8 11 14-11 16-11-16zM9 9c-13 17 7 38 28 23M37 7c-2 8-9 12-19 12"/>'
  };
  class FieldKit {
    constructor(game) {
      this.game = game; this.rows = new Map();
      for (const [key, t] of Object.entries(B.TOOLS)) {
        const row = document.createElement('button'); row.className = 'kit-tool'; row.setAttribute('aria-label', 'Equip ' + t.name);
        row.innerHTML = `<svg viewBox="0 0 46 46" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[key]}</svg><span><strong>${t.name}</strong><small>${t.hint}</small></span><kbd>${t.key}</kbd>`;
        row.onclick = () => { if (!game.expedition.tools().includes(key)) return; game.selectTool(key); this.sync(); };
        this.rows.set(key, row); $('kit-tools').append(row);
      }
      $('kit-button').onclick = $('pause-kit').onclick = () => this.open();
      $('kit-close').onclick = () => game.play();
      $('hud-charge-cycle').onclick = () => { if (game.running) game.cycleCharge(); };
      $('tip-dismiss').onclick = () => this.dismiss();
    }
    dismiss() { if (this.tip && this.game.guide.mark(this.tip.id)) { this.game.changed(); this.sync(); } }
    open() { if (!this.game.ready) return; this.game.setScreen('kit'); this.sync(); }
    sync() {
      const g = this.game; if (!g.ready || !g.guide) return;
      const e = g.expedition.state, available = g.expedition.tools(), modes = g.gadgets.modes(), spec = g.gadgets.spec();
      if (g.guide.observe(g)) g.changed();
      for (const [key, row] of this.rows) {
        const owned = available.includes(key); row.hidden = !owned; row.disabled = !owned; row.setAttribute('aria-pressed', String(key === e.tool));
        $('tool-' + key).hidden = !owned; $('tool-' + key).disabled = !owned;
      }
      $('tool-slots').hidden = available.length < 2;
      $('tool-meter').hidden = !['resonance', 'gravity'].includes(e.tool);
      $('hud-charge-name').textContent = spec.short[0] + spec.short.slice(1).toLowerCase();
      $('hud-charge-cycle').hidden = modes.length < 2;
      $('kit-equipped').textContent = B.TOOLS[e.tool].name; $('kit-bombs').textContent = e.supplies.bombs; $('kit-lights').textContent = e.supplies.lights;
      const useLabel = e.tool === 'gravity' ? 'Draw' : e.tool === 'resonance' ? 'Pulse' : 'Cut'; $('touch-cut').textContent = useLabel; $('primary-use-label').textContent = useLabel;
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
  }
  Object.assign(B, { FieldKit, FieldGuide });
})(B2);
