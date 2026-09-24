/* Surface community, solid building boundaries and persistent conversations. */
'use strict';
(function (B) {
  const SURFACE = Object.freeze({ minX: -58, maxX: 58, minZ: -50, maxZ: 68, maxY: 48 });
  const PEOPLE = Object.freeze([
    { id: 'mara', name: 'Mara Vale', role: 'General supplies', shop: 'VALE SUPPLY', x: -9, z: 37.4, color: '#d39269', coat: '#426e65', skin: '#b87750' },
    { id: 'otis', name: 'Otis Bell', role: 'Machinery & modifications', shop: 'BELL WORKS', x: 19, z: 38.4, color: '#e5b45d', coat: '#b46c40', skin: '#d7ac7e' },
    { id: 'inez', name: 'Inez Rook', role: 'Prospector & surveyor', shop: 'SURVEY OFFICE', x: -24, z: 54.4, color: '#9bd7e5', coat: '#487782', skin: '#ab7257', unlock: 'rescue' },
    { id: 'nell', name: 'Nell Wick', role: 'Lantern maker', shop: 'THE WICK CART', x: -6, z: 51.4, color: '#bde5cd', coat: '#596b92', skin: '#a97555', unlock: 'fossil' }
  ]);
  // Walls are shared by scene construction, movement and conversation visibility.
  const BUILDINGS = Object.freeze([
    { x: -9, z: 36, w: 9, d: 8, h: 3.8, color: '#477164', roof: '#99553d', name: 'VALE SUPPLY', sub: 'CHARGES / LIGHTS / A FAIR PRICE', person: 'mara' },
    { x: 19, z: 37, w: 11, d: 8, h: 4.3, color: '#bb9a68', roof: '#4c6560', name: 'BELL WORKS', sub: 'MORE TORQUE. LESS EXCUSES.', person: 'otis' },
    { x: -24, z: 53, w: 8, d: 7, h: 3.5, color: '#c5b48c', roof: '#725c53', name: 'SURVEY OFFICE', sub: 'MAPS / LEADS / FIELD NOTES', person: 'inez' }
  ]);
  function walls(b) {
    const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, t = .24;
    const out = [[x0, 0, z0, x0 + t, b.h, z1], [x1 - t, 0, z0, x1, b.h, z1], [x0, 0, z1 - t, x1, b.h, z1]];
    if (b.closed) out.push([x0, 0, z0, x1, b.h, z0 + t]);
    else out.push([x0, 0, z0, b.x - 1.3, b.h, z0 + t], [b.x + 1.3, 0, z0, x1, b.h, z0 + t], [b.x - 1.3, 2.65, z0, b.x + 1.3, b.h, z0 + t]);
    return out;
  }
  const FENCES = [[-21.1, 0, -21.1, -20.9, 1.9, -7], [-21.1, 0, -1, -20.9, 1.9, 21], [48.9, 0, -21, 49.1, 1.9, -1], [20.9, 0, 7, 21.1, 1.9, 21], [-21, 0, -21.1, -3, 1.9, -20.9], [3, 0, -21.1, 21, 1.9, -20.9]];
  // Segment/AABB test with open endpoints, so a target on a counter is visible.
  function blockedLine(a, b, boxes) {
    return boxes.some(box => {
      let enter = .001, leave = .999;
      for (let i = 0; i < 3; i++) {
        const k = ['x', 'y', 'z'][i], delta = b[k] - a[k];
        if (Math.abs(delta) < 1e-8) { if (a[k] < box[i] || a[k] > box[i + 3]) return false; }
        else { let lo = (box[i] - a[k]) / delta, hi = (box[i + 3] - a[k]) / delta; if (lo > hi) [lo, hi] = [hi, lo]; enter = Math.max(enter, lo); leave = Math.min(leave, hi); if (enter > leave) return false; }
      }
      return true;
    });
  }
  class Town {
    constructor(progress, world) { this.world=world; this.progress = progress; this.state = progress.expedition.town ||= { version: 1, met: [], heard: [] }; }
    static validate(s, rescue, fossil) {
      if (!s || s.version !== 1 || !Array.isArray(s.met) || !Array.isArray(s.heard) || s.met.length > 4 || s.heard.length > 56 || s.met.some(id => !PEOPLE.some(p => p.id === id)) || new Set(s.met).size !== s.met.length || new Set(s.heard).size !== s.heard.length || s.heard.some(id => !/^(mara|otis|inez|nell):(hello|first|refuge|cinder|flywheel|engine|heart|after|deep|stations|foreman|rescue|fossil|lantern)$/.test(id) || !s.met.includes(id.split(':')[0]))) throw new Error('Invalid town conversations.');
      if ((s.met.includes('inez') || s.heard.some(id => id.endsWith(':rescue'))) && rescue?.phase !== 'rescued') throw new Error('Surveyor has not returned to town.');
      if((s.met.includes('nell') || s.heard.some(id=>id.endsWith(':fossil'))) && !fossil?.recovered || s.heard.some(id=>id.endsWith(':lantern')) && !fossil?.lenses)throw Error('The lantern keeper has not arrived.');
      return { version: 1, met: [...s.met], heard: [...s.heard] };
    }
    static obstacles() {
      return [...BUILDINGS.flatMap(b => [...walls(b), [b.x - b.w / 2 - .4, b.h, b.z - b.d / 2 - .6, b.x + b.w / 2 + .4, b.h + .28, b.z + b.d / 2 + .5]]), ...PEOPLE.filter(p=>p.unlock!=='fossil').flatMap(p => [[p.x - 2.4, 0, p.z - 1.15, p.x + 2.4, 1.08, p.z - .35], ...(p.unlock ? [] : [[p.x - .32, 0, p.z - .28, p.x + .32, 1.94, p.z + .28]])]), ...FENCES, [30.25,0,-.8,30.55,2.5,-.4], [35.45,0,-.8,35.75,2.5,-.4], [30.2,1.05,-.7,35.8,2.3,-.5], [3.7, 0, 44.7, 6.3, .95, 47.3]];
    }
    people() { return PEOPLE.filter(p => !p.unlock || (p.unlock==='rescue' ? this.progress.expedition.rescue?.phase === 'rescued' : this.progress.expedition.fossil?.recovered)); }
    residentObstacles() { const boxes=this.people().filter(p => p.unlock).map(p => [p.x - .32, 0, p.z - .28, p.x + .32, 1.94, p.z + .28]); if(this.progress.expedition.fossil?.recovered)boxes.push([-8.4,0,50.25,-3.6,1.08,51.05],[-8.55,0,50.2,-8.3,2.7,51.8],[-3.7,0,50.2,-3.45,2.7,51.8],[-8.6,2.6,49.8,-3.4,2.9,52]);return boxes; }
    static region(p,world) { return p.y < -1 ? null : p.x>14 && p.x<46 && p.z>-14 && p.z< -2 ? world?.parcelVersion ? 'Eastcut / Claim 03' : 'Eastcut / deed at Vale Supply' : Math.abs(p.x) < 14 && Math.abs(p.z) < 14 ? 'Claim 02' : p.z > 27 && p.z < 60 && p.x > -31 && p.x < 30 ? 'Ridge Common' : 'Common land'; }
    target(player, world, obstacles = []) {
      if (player.y < -.5 || player.y > 2) return null;
      const a = player.head, d = player.direction;
      return this.people().find(p => {
        const b = { x: p.x, y: 1.55, z: p.z }, delta = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, range = Math.hypot(delta.x, delta.y, delta.z);
        return range <= 3.25 && range > .1 && (delta.x * d.x + delta.y * d.y + delta.z * d.z) / range > .68 && world.clearLine(a, b, .1) && !blockedLine(a, b, obstacles.filter(box => !(box[0] === p.x - .32 && box[2] === p.z - .28)));
      }) || null;
    }
    chapter(id) { const s = this.progress, e = s.expedition; return !this.state.met.includes(id) ? 'hello' : id==='nell' ? e.fossil.lenses ? 'lantern' : 'fossil' : e.fossil?.recovered && !this.state.heard.includes(id+':fossil') ? 'fossil' : e.foreman?.defeated ? 'foreman' : e.rescue?.phase === 'rescued' && !this.state.heard.includes(id + ':rescue') ? 'rescue' : e.deep?.repaired.length ? 'stations' : e.deep?.open ? 'deep' : e.vaults.length === 3 ? 'after' : e.awakened ? 'heart' : e.recovered.includes(1) ? 'engine' : e.recovered.includes(0) ? 'flywheel' : e.combat?.enemies.some(n => n.known) ? 'cinder' : e.refuges?.lit.length ? 'refuge' : id === 'inez' ? 'rescue' : s.trips > 0 ? 'first' : 'hello'; }
    talk(id) {
      if (!this.people().some(p => p.id === id)) return null;
      const chapter = this.chapter(id), key = id + ':' + chapter;
      if (!this.state.met.includes(id)) this.state.met.push(id);
      const fresh = !this.state.heard.includes(key); if (fresh) this.state.heard.push(key);
      const lines = id === 'nell' ? { hello: 'Nell Wick. Your lamps woke something very old. I followed the light. That warm bead belongs in a lens, if you can bear to part with it.', fossil: 'It swam here before there was stone. Its ember remembers daylight. I can fit living lenses to every work light you own, including the ones still underground.', lantern: 'Mint light. Longer reach. The moths dislike it more than the yellow sort. No fuel, no clock. Set down a light and make yourself a place to work.' } : id === 'inez' ? {
        fossil: 'A whole skeleton? My chart had a fault line there. I owe a very old animal an apology. Nell has parked her cart west of the well.',
        hello: "Inez Rook. We met in a tin can under several tons of rock. Thank you for changing the venue. My old charts are yours to read; forty dollars gets you a fresh mineral survey.",
        rescue: "You made a road out of a cave-in. I can at least make you a map. I mark untouched seams near the depths you have reached. How you get there is the interesting part.",
        foreman: "The old charts call it a furnace. The older ones call it a landlord. You seem to have settled the lease. I am drawing a new edition.",
        stations: "Those station connections are on the back of my oldest chart. Otis has made them useful again. A road down is worth more than another bag up.",
        deep: "My old crew stopped at the rootworks. You have opened their route again. I can chart the new minerals once you reach their layer."
      } : id === 'mara' ? {
        fossil: 'A cart turned up west of the well. Nell says you found her an ember. I asked how she knew. She said the lamps told her. Very normal customer.',
        rescue: "Inez is back at her desk. I left her a mug. She drew a contour map on it. Go west past the well; she can find you something worth digging for.",
        foreman: "The well lit up. Then the street. Then every dead bulb on my shelves. I suppose that makes you the power company. You still owe me for the charges.",
        deep: "A whole mine under the mine? Take two lights and three charges for each old station. Otis knows the connections. I know what you forgot to pack.",
        stations: "I could hear the pump from my shop. Those old stations still have a use, then. Come back with a proper haul.",
        hello: "You're the new owner of number two. Mara. I sell lights, charges, and the occasional sensible suggestion. The last one's free.",
        refuge: "You found one of the old shelter lamps. Good. Keep its chart. People used those passages long before we put fences up here.",
        cinder: "Cinder moths. They carry little nests of blasting salts. Keep a work light nearby, and get out of their way when they flare. If Otis has to pull you out, your lost ore waits in a marked cache.",
        first: "First haul's in, then. Keep a few lights on the way home. Every hole looks like your hole when you're lost.",
        flywheel: "Otis heard that flywheel before he saw it. Take a look at his crane. Less climbing, more finding things to sell me.",
        engine: "The cups on my shelves turned toward your claim this morning. You brought up something with opinions.",
        heart: "I can hear it from here. Yes, I'll still buy your ore. No, I am not putting that thing in my stockroom.",
        after: "You brought daylight to somewhere that never had it. That's a decent day's work. Your tab's still a tab, though."
      } : {
        fossil: 'That lantern maker does things to glass I cannot do to steel. Show her what you found in the skull. Her cart is west of the well.',
        rescue: "Inez brought me a sketch of the winch you fixed. Said you made a proper shaft. The survey office is open again; she knows where the old workings went.",
        foreman: "That furnace belongs to the common now. Press Z underground to melt a whole passage. Twelve metres. Six seconds to cool. Try not to dig under my shop.",
        deep: "The rootworks! Restore the pump house first. Two lights, three charges, a bit of nerve. Bring that circuit back and I can send you down from here.",
        stations: "Your restored stations are on the board. Pick a landing and I will send you back. If you dig away its floor, reset the arrival beside the machine with E.",
        hello: "Otis Bell. If it turns, I can make it turn harder. If it doesn't, bring it here anyway. I like a challenge.",
        refuge: "That survey cabinet still works? The old crews made things to last. Its light stays with the cabinet, so leave solid rock under it.",
        cinder: "The drill bites them too. Your mining axe has more stopping power, but you have to get close. They flare before they charge. Step aside, then swing while they recover.",
        first: "Copper buys torque. Torque gets you into the harder stuff. Come back when that cutter starts arguing with the rock.",
        flywheel: "That survey flywheel is older than the road. I've drawn up a freight rig for it. Give the cage a clear shaft and it'll do the climbing.",
        engine: "No fuel line. No winding key. Your engine just listens, then turns. Try that resonator against the marked stone below.",
        heart: "The wrench floated off my bench. Put it back, will you? Then tell me how you did that.",
        after: "Three geodes and a machine that runs on impossible. Leave me a sketch of the mine before you find anything else."
      };
      return { chapter, fresh, text: lines[chapter] || lines.rescue };
    }
    advice(id) {
      const s = this.progress;
      if(id==='nell')return 'The lenses retrofit every placed work light. Their reach grows from sixteen to twenty-four metres, and moths keep five metres away while the light has a clear path. Walls still block that protection.';
      if (id === 'otis' && s.expedition.crawlers?.recovered.length && !s.expedition.crawlers.impactHead) return 'That basalt tooth will take an edge. I can fit it to your axe for $240. Hits harder, bites through twice as much rock. Same weight and swing.';
      if(id==='otis' && s.expedition.kinetics?.unlocked)return 'A Stonewright sling! Hold a loose mineral in its field, then release the trigger. The rock still has value after a fight. Turn it into ammunition, then bring it home.';
      if(id==='otis' && s.expedition.deep?.open)return 'There was an ore-launching workshop under the rootworks, around 134 metres. Two field coils held its sling in the frame. Your resonator should wake them once you uncover them. F will find the workshop.';
      if (id === 'inez') return 'A survey marks real minerals you have not scanned or collected. It reaches twelve metres beyond your deepest descent, but never through the sealed floor. The map remembers the deposits; you make the tunnels. Read the old survey for leads on stranger workings.';
      if (id === 'mara') return s.deepest >= 16 ? 'Pink thunderstone can become a spare charge if you dig it completely free. Or set off one crystal and let its neighbors do the digging. E recovers a crystal; H fires your planted satchels.' : 'Hold C to see where a charge will land, then release. V places a light. Aim at a placed light and press E to bring it home again. The marked ground is yours; the common stays intact.';
      return s.expedition.recovered.includes(0) ? 'Crane docks need open ground below the surface. Hold T to find a spot. The cage needs a clear shaft all the way up. An orange marker shows the rock holding it back.' : 'Expose the survey flywheel on every side before attaching your tether with E. It is wider than you are. Cut a route that fits the machine, then lift it home with Space.';
    }
  }
  Object.assign(B, { SURFACE, Town, TOWN: { people: PEOPLE, buildings: BUILDINGS, walls, fences: FENCES, blockedLine } });
})(B2);
