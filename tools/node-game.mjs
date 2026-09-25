// Inert DOM and renderer for simulation tests. Never starts a browser or sends OS input.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const root = path.resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
export async function nodeGame() {
  if (!globalThis.B2?.Gadgets) for (const name of ['core', 'town', 'caverns', 'deep-terrain', 'parcels', 'mesher', 'world', 'player', 'ore', 'expedition', 'refuges', 'deep', 'combat', 'foreman', 'rescue', 'crawlers', 'kinetics', 'fossil', 'actions', 'gadgets', 'thunderstone', 'freight', 'mysteries', 'survey', 'persistence', 'feedback', 'audio', 'fieldkit', 'town-ui']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', name + '.js'), 'utf8'));
  const Three = require(path.join(root, 'vendor/three.min.js'));
  class InertRenderer { constructor() { this.shadowMap = {}; } setPixelRatio() {} setSize() {} render() {} clearDepth() {} }
  globalThis.THREE = { ...Three, WebGLRenderer: InertRenderer };
  const elements = new Map(), handlers = new Map();
  function element() { const classes = new Set(), listeners = new Map(), attributes = new Map(); return { children: [], dataset: {}, listeners, attributes, style: { setProperty() {} }, classList: { add(v) { classes.add(v); }, remove(v) { classes.delete(v); }, toggle(v, on) { on ? classes.add(v) : classes.delete(v); } }, addEventListener(name, fn) { listeners.set(name, fn); }, setPointerCapture() {}, setAttribute(name, value) { attributes.set(name, String(value)); }, append(v) { this.children.push(v); }, replaceChildren() { this.children = []; }, querySelector() { return null; }, focus() {}, getContext() { return { fillRect() {}, fillText() {} }; } }; }
  for (const m of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/\bid="([^"]+)"/g)) { assert.ok(!elements.has(m[1]), 'duplicate DOM id'); elements.set(m[1], element()); }
  globalThis.document = { body: element(), getElementById(id) { assert.ok(elements.has(id), 'missing DOM id ' + id); return elements.get(id); }, createElement: element, querySelectorAll() { return []; }, addEventListener() {} };
  globalThis.window = { addEventListener(name, fn) { handlers.set(name, fn); } };
  globalThis.innerWidth = 1440; globalThis.innerHeight = 900; globalThis.devicePixelRatio = 1; globalThis.matchMedia = () => ({ matches: false }); globalThis.requestAnimationFrame = () => 0;
  for (const file of ['render', 'beauty', 'scenery', 'ruins', 'crane', 'feedback-view', 'thunderstone-view', 'town-view', 'cavern-view', 'combat-view', 'deep-view', 'foreman-view', 'rescue-view', 'crawler-view', 'kinetic-view', 'parcel-view', 'fossil-view']) vm.runInThisContext(fs.readFileSync(path.join(root, 'src', file + '.js'), 'utf8'));
  const source = fs.readFileSync(path.join(root, 'src/game.js'), 'utf8'); vm.runInThisContext(source.slice(0, source.indexOf('  const game = new Game();')) + '\n})(B2);');
  const game = new B2.Game(); game.store.read = async () => null; game.store.write = async () => {}; await game.boot();
  assert.ok(game.ready, 'Game boot failed');
  game.play = () => { if(game.ready)game.setScreen(null); }; // Explicitly bypass browser input/audio acquisition in simulation.
  return { game, elements, handlers, close() { clearTimeout(game.toastTimer); } };
}
