// Inert DOM and renderer for simulation tests. Never starts a browser or sends OS input.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
export async function nodeGame(options={}) {
  if (!globalThis.B2?.Gadgets) for (const name of ['core', 'town', 'caverns', 'deep-terrain', 'parcels', 'mesher', 'world', 'mining', 'player', 'ore', 'expedition', 'refuges', 'deep', 'combat', 'foreman', 'rescue', 'crawlers', 'kinetics', 'fossil', 'actions', 'gadgets', 'thunderstone', 'freight', 'mysteries', 'survey', 'persistence', 'feedback', 'audio', 'fieldkit', 'town-ui']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8'));
  const Three = require(path.join(root, 'vendor/three.min.js'));
  class InertRenderer { constructor() { this.shadowMap = {}; } setPixelRatio() {} setSize() {} render() {} clearDepth() {} }
  globalThis.THREE = { ...Three, WebGLRenderer: InertRenderer };
  const elements = new Map(), handlers = new Map(), documentHandlers = new Map();
  const registrations=new WeakMap();
  function listen(map,name,fn,options){let events=registrations.get(map);if(!events){events=new Map();registrations.set(map,events);}const listeners=events.get(name)||[];listeners.push({fn,capture:options===true||!!options?.capture});listeners.sort((a,b)=>Number(b.capture)-Number(a.capture));events.set(name,listeners);map.set(name,e=>{for(const item of listeners){item.fn(e);if(e?.__b2UIHandled)break;}});}
  function element(tag) { if(tag==='canvas' && options.canvasFactory)return options.canvasFactory(300,150); const classes = new Set(), listeners = new Map(), attributes = new Map(); return { children: [], dataset: {}, listeners, attributes, style: { setProperty(key, value) { this[key] = String(value); }, getPropertyValue(key) { return this[key] || ''; } }, classList: { contains(v) { return classes.has(v); }, add(v) { classes.add(v); }, remove(v) { classes.delete(v); }, toggle(v, on) { on ? classes.add(v) : classes.delete(v); } }, addEventListener(name, fn, options) { listen(listeners,name,fn,options); }, setPointerCapture() {}, setAttribute(name, value) { attributes.set(name, String(value)); }, getAttribute(name) { return attributes.get(name) ?? null; }, append(v) { this.children.push(v); }, replaceChildren() { this.children = []; }, querySelector() { return null; }, focus() {}, getBoundingClientRect() { return {left:0,top:0,width:innerWidth,height:innerHeight}; }, getContext() { return new Proxy({measureText(s){return {width:String(s).length*8};},createLinearGradient(){return {addColorStop(){}};},createImageData(width,height){return {width,height,data:new Uint8ClampedArray(width*height*4)};}},{get(t,k){return k in t?t[k]:()=>{};}}); } }; }
  for (const m of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/\bid="([^"]+)"/g)) { assert.ok(!elements.has(m[1]), 'duplicate DOM id'); elements.set(m[1], element()); }
  globalThis.document = { body: element(), getElementById(id) { assert.ok(elements.has(id), 'missing DOM id ' + id); return elements.get(id); }, createElement: element, querySelectorAll() { return []; }, addEventListener(name,fn,options) { listen(documentHandlers,name,fn,options); } };
  globalThis.window = { addEventListener(name, fn, options) { listen(handlers,name,fn,options); } };
  globalThis.innerWidth = 1440; globalThis.innerHeight = 900; globalThis.devicePixelRatio = 1; globalThis.matchMedia = () => ({ matches: false }); globalThis.requestAnimationFrame = options.animationFrame || (() => 0);
  for (const file of ['render', 'beauty', 'common-art', 'common-view', 'perimeter-art', 'ground-cover', 'cave-form-art', 'mine-asset-art', 'underground-view', 'mining-view', 'scenery', 'ruins', 'crane', 'feedback-view', 'thunderstone-view', 'residents', 'shops', 'town-view', 'cavern-view', 'creature-art', 'combat-view', 'deep-view', 'foreman-art', 'foreman-view', 'rescue-view', 'crawler-view', 'kinetic-view', 'parcel-view', 'fossil-view', 'game-ui', 'multiplayer', 'crew-controls', 'miner-art', 'support-batches', 'tool-art', 'yard-art', 'crew-view', 'polish']) vm.runInThisContext(options.sources?.[file] || file === 'multiplayer' && options.multiplayerSource || file === 'game-ui' && options.gameUISource || file === 'common-view' && options.commonViewSource || file === 'miner-art' && options.minerArtSource || file === 'perimeter-art' && options.perimeterArtSource || file === 'ground-cover' && options.groundCoverSource || fs.readFileSync(path.join(root, 'src', file + '.js'), 'utf8'));
  const source = options.gameSource || fs.readFileSync(path.join(root, 'src/game.js'), 'utf8'); vm.runInThisContext(source.slice(0, source.indexOf('  const game = new Game();')) + '\n})(B2);');
  const game = new B2.Game(); game.store.read = async () => null; game.store.write = async () => {}; await game.boot();
  assert.ok(game.ready, 'Game boot failed');
  game.play = () => { if(game.ready)game.setScreen(null); }; // Explicitly bypass browser input/audio acquisition in simulation.
  return { game, elements, handlers, documentHandlers, close() { clearTimeout(game.toastTimer); } };
}
