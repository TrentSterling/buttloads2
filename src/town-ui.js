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
      $('town-initial').innerHTML = '<svg viewBox="0 0 64 80" width="64" height="80" aria-hidden="true"><path fill="' + person.coat + '" d="M5 80V64Q7 52 32 52T59 64V80Z"/><path fill="#ded0ab" d="M25 53H39V80H25Z"/><rect x="25" y="44" width="14" height="15" rx="4" fill="' + person.skin + '"/><rect x="14" y="17" width="36" height="38" rx="15" fill="' + person.skin + '"/><path fill="#24342f" d="M23 31H27V35H23ZM37 31H41V35H37Z"/>' + (person.id === 'mara' ? '<path fill="#513f2d" d="M13 23V12Q32 0 51 12V23Z"/><path fill="#d2b36e" d="M5 18H59V24H5Z"/><path stroke="#493529" stroke-width="2" fill="none" d="M26 43Q32 47 38 43"/>' : '<path fill="#344a42" d="M12 22V15Q32 0 51 15V22Z"/><path fill="#8d8d78" d="M16 38L23 46H41L48 38L43 57H21Z"/><g fill="none" stroke="#d3b069" stroke-width="2"><circle cx="25" cy="33" r="7"/><circle cx="39" cy="33" r="7"/><path d="M32 32H33"/></g>') + '</svg>'; $('town-panel').style.setProperty('--resident-color', person.color);
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
      } else {
        for (const [key, gear] of Object.entries(B.GEAR)) {
          const level = s.gear[key], cost = gear.costs[level], max = cost === undefined;
          add(gear.name, max ? 'Fully upgraded' : `${gear.values[level]} to ${gear.values[level + 1]} ${gear.unit}`, max ? 'Complete' : money(cost), max || s.cash < cost, () => g.buy(key));
        }
        const f = g.freight, unlocked = s.expedition.recovered.includes(f.state.owned ? 1 : 0), cost = f.state.owned ? B.FREIGHT.upgrade : B.FREIGHT.price;
        add(f.state.owned ? 'Freight cage' : 'Freight rig', f.state.upgraded ? '64 minerals per shipment' : !unlocked ? f.state.owned ? 'Recover the resonance engine' : 'Recover the survey flywheel' : f.state.owned ? 'Increase capacity to 64 minerals' : 'A reusable crane and loading dock', f.state.upgraded ? 'Complete' : money(cost), !unlocked || f.state.upgraded || s.cash < cost, () => g.buyFreight());
      }
    }
  }
  B.TownUI = TownUI;
})(B2);
