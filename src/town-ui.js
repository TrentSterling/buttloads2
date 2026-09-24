/* A conversation and service counter, backed by the existing economy. */
'use strict';
(function (B) {
  const $ = id => document.getElementById(id), money = n => '$' + n.toLocaleString('en-US');
  class TownUI {
    constructor(game) {
      this.game = game; this.person = null;
      $('town-close').onclick = () => game.play();
      $('town-advice').onclick = () => { if (this.person) $('town-dialogue').textContent = game.town.advice(this.person.id); };
      $('town-news').onclick = () => { if (!this.person) return; const line = game.town.talk(this.person.id); $('town-dialogue').textContent = line.text; if (line.fresh) { game.changed(); game.save(); } };
    }
    open(id) {
      const g = this.game, person = g.town.target(g.player, g.world, g.view.obstacles);
      if (!person || person.id !== id) return false;
      this.person = person; const line = g.town.talk(id);
      $('town-name').textContent = person.name; $('town-role').textContent = person.role; $('town-dialogue').textContent = line.text;
      $('town-initial').innerHTML = '<svg viewBox="0 0 64 80" width="64" height="80" aria-hidden="true"><path fill="' + person.coat + '" d="M5 80V64Q7 52 32 52T59 64V80Z"/><path fill="#ded0ab" d="M25 53H39V80H25Z"/><rect x="25" y="44" width="14" height="15" rx="4" fill="' + person.skin + '"/><rect x="14" y="17" width="36" height="38" rx="15" fill="' + person.skin + '"/><path fill="#24342f" d="M23 31H27V35H23ZM37 31H41V35H37Z"/>' + (person.id === 'inez' ? '<path fill="#466873" d="M9 23V15Q32 0 55 15V23Z"/><path fill="#e9c778" d="M6 21H58V26H6Z"/><rect x="25" y="12" width="14" height="10" rx="3" fill="#e8f4db"/><path stroke="#593929" stroke-width="2" fill="none" d="M25 44Q32 48 39 44"/>' : person.id === 'mara' ? '<path fill="#513f2d" d="M13 23V12Q32 0 51 12V23Z"/><path fill="#d2b36e" d="M5 18H59V24H5Z"/><path stroke="#493529" stroke-width="2" fill="none" d="M26 43Q32 47 38 43"/>' : '<path fill="#344a42" d="M12 22V15Q32 0 51 15V22Z"/><path fill="#8d8d78" d="M16 38L23 46H41L48 38L43 57H21Z"/><g fill="none" stroke="#d3b069" stroke-width="2"><circle cx="25" cy="33" r="7"/><circle cx="39" cy="33" r="7"/><path d="M32 32H33"/></g>') + '</svg>'; $('town-panel').style.setProperty('--resident-color', person.color);
      g.setScreen('town'); this.refresh(); g.changed(); g.save(); return true;
    }
    refresh() {
      const g = this.game, person = this.person; if (!person) return;
      const s = g.economy.state;
      $('town-money').textContent = money(s.cash); $('town-stock').textContent = `${s.expedition.supplies.bombs} charges / ${s.expedition.supplies.lights} lights / ${g.economy.count} minerals carried`;
      $('town-services').replaceChildren();
      const add = (title, detail, price, disabled, action) => {
        const button = document.createElement('button'); button.className = 'town-service'; button.disabled = disabled;
        const label = document.createElement('strong'), copy = document.createElement('span'), cost = document.createElement('b');
        label.textContent = title; copy.textContent = detail; cost.textContent = price; button.append(label); button.append(copy); button.append(cost);
        button.onclick = () => { if (g.screen !== 'town' || g.town.target(g.player, g.world, g.view.obstacles)?.id !== person.id) return; action(); this.refresh(); };
        $('town-services').append(button);
      };
      if (person.id === 'mara') {
        add('Three charges', 'Shared by blast, remote and bore tools', '$32', s.cash < 32 || s.expedition.supplies.bombs > 96, () => g.restock('bomb'));
        add('Six work lights', 'Place with V. Aim and E to retrieve.', '$24', s.cash < 24 || s.expedition.supplies.lights > 93, () => g.restock('lamp'));
        add('Sell your haul', `${g.economy.saleCount} minerals, including delivered freight`, money(g.economy.saleValue), !g.economy.saleCount, () => g.sell());
        if (!g.rescue.rescued) add("Inez's last position", 'A stranded surveyor below Claim 02. Mark her bell on M.', g.rescue.state.known ? 'Marked' : 'Free', g.rescue.state.known, () => { g.rescue.state.known = true; g.changed(); g.save(); $('town-dialogue').textContent = 'Inez went down in the old survey bell, twenty-three metres below the east side of your claim. The winch went quiet. Take a work light. Its cell fits the motor.'; });
      } else if (person.id === 'inez') {
        const lead = g.rescue.lead(g.deposits, g.survey);
        add('Prospect a new seam', lead ? 'Unscanned minerals near your deepest workings. Marked on M.' : 'Explore deeper to reach more uncharted seams.', '$40', !lead || s.cash < B.BELL.fee, () => { const note = g.rescue.chart(g.deposits, g.survey); if (note) { g.mysteries.state.focus = -1; $('town-dialogue').textContent = note; g.changed(); g.save(); } });
        add('Read the old survey', 'A lead on one unexplored underground structure.', 'Free', !B.MYSTERIES.some(m => !g.mysteries.state.known.includes(m.id)), () => { const m = B.MYSTERIES.find(m => !g.mysteries.state.known.includes(m.id)); if (!m) return; g.mysteries.state.known.push(m.id); $('town-dialogue').textContent = `${m.name}, about ${Math.round(-m.y)} metres down. I marked its position on M. Open J for the field notes when you get there.`; g.changed(); g.save(); });
        add('Open my chart', 'Inspect your latest mineral lead on the mine survey.', 'Map', g.rescue.state.lead === null, () => { const n = g.deposits.nodes[g.rescue.state.lead]; g.openSurvey(); $('survey-depth').value = Math.round(-n.y); g.updateSurvey(); });
      } else {
        for (const [key, gear] of Object.entries(B.GEAR)) {
          const level = s.gear[key], cost = gear.costs[level], max = cost === undefined;
          add(gear.name, max ? 'Fully upgraded' : `${gear.values[level]} to ${gear.values[level + 1]} ${gear.unit}`, max ? 'Complete' : money(cost), max || s.cash < cost, () => g.buy(key));
        }
        const f = g.freight, unlocked = s.expedition.recovered.includes(f.state.owned ? 1 : 0), cost = f.state.owned ? B.FREIGHT.upgrade : B.FREIGHT.price;
        add(f.state.owned ? 'Freight cage' : 'Freight rig', f.state.upgraded ? '64 minerals per shipment' : !unlocked ? f.state.owned ? 'Recover the resonance engine' : 'Recover the survey flywheel' : f.state.owned ? 'Increase capacity to 64 minerals' : 'A reusable crane and loading dock', f.state.upgraded ? 'Complete' : money(cost), !unlocked || f.state.upgraded || s.cash < cost, () => g.buyFreight());
        if (g.crawlers.state.recovered.length) add('Impact axe head', 'Basalt tooth edge: 52 damage and double rock-cutting power.', g.crawlers.state.impactHead ? 'Installed' : '$240', g.crawlers.state.impactHead || s.cash < B.IMPACT_HEAD_PRICE, () => { if (g.crawlers.buy()) { g.changed(); g.save(); g.toast('Impact head fitted. Equip the axe with 6.'); } });
        for (const id of g.deep.state.repaired) {
          const station = B.DEEP_STATIONS[id];
          add('Return to ' + station.name, station.reward + ' installed. E at the station resets your landing.', 'Travel', false, () => {
            if (!g.deep.travel(id, g.player, g.expedition)) { g.toast('The landing is obstructed. Reset it with E at the station.'); return; }
            g.clearInput(); g.changed(); g.save(); g.play(); g.toast('Back at ' + station.name + '.');
          });
        }
      }
    }
  }
  B.TownUI = TownUI;
})(B2);
