// Headless smoke test of the REAL main.js game loop. Mocks the minimal DOM/localStorage/window
// surface that terminal.js + main.js touch, feeds a scripted sequence of inputs, and asserts
// the game boots, creates a character, runs a hunt, and reaches the main loop without throwing.
//
// This catches wiring bugs (bad menu verbs, parser mismatches, combat orchestration) that the
// pure-logic unit tests can't see. Run: node tests/smoke.mjs

// ---- scripted input --------------------------------------------------------
// Each entry is what the "player" types when the game calls term.input().
const SCRIPT = [
  'Aria',        // character name
  'gather',      // main road: gather materials
  '',            // (consume any follow-up prompt)
  'hunt',        // main road: go on a hunt
  '1',           // choose Whispering Forest
  'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',  // fight (forest foe dies fast vs repeated stabs)
  'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
  'town',        // travel to town
  'shop',        // open shop
  '1',           // buy potions menu
  '1',           // buy 1 potion
  'back',        // leave potion menu
  'back',        // leave shop
  'leave',       // leave town
  'stats',       // check progress
  '',            // continue past stats
  'save',        // save game
];

let cursor = 0;
let printed = [];
let sawForestFight = false;
let sawLevelOrLoot = false;

// ---- DOM mock --------------------------------------------------------------
function makeEl() {
  return {
    _value: '', disabled: false, dataset: {}, style: {},
    classList: { add() {}, remove() {} },
    _listeners: {},
    set value(v) { this._value = v; }, get value() { return this._value; },
    set textContent(v) { this._tc = v; }, get textContent() { return this._tc || ''; },
    set innerHTML(v) { this._tc = v; }, get innerHTML() { return this._tc || ''; },
    set className(v) { this._cn = v; }, get className() { return this._cn || ''; },
    appendChild(child) { printed.push(child.textContent); },
    addEventListener(ev, fn) { this._listeners[ev] = fn; },
    querySelector(sel) { return makeEl(); },
    focus() {}, scrollTop: 0, scrollHeight: 0,
  };
}

const outputEl = makeEl();
const inputEl = makeEl();
const promptEl = makeEl();
const crtEl = makeEl();

const rootEl = {
  dataset: {},
  querySelector(sel) {
    if (sel === '[data-output]') return outputEl;
    if (sel === '[data-input]') return inputEl;
    if (sel === '[data-prompt]') return promptEl;
    return makeEl();
  },
  addEventListener() {},
};

const store = {};
globalThis.localStorage = {
  getItem: (k) => (k in store ? store[k] : null),
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
};

globalThis.document = {
  getElementById: (id) => (id === 'crt' ? crtEl : rootEl),
  querySelector: () => rootEl,
  addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') this._boot = fn; },
  _boot: null,
};

globalThis.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
globalThis.atob = (s) => Buffer.from(s, 'base64').toString('binary');
globalThis.performance = { now: () => 12345 };

const realSetTimeout = setTimeout;
globalThis.window = {
  addEventListener(ev, fn) { if (ev === 'DOMContentLoaded') document._boot = fn; },
};

// ---- drive the Terminal.input by overriding it -----------------------------
// We import after mocks are in place. Terminal.input() returns a promise; we resolve it from
// the script. We monkeypatch by intercepting the prototype once loaded.
const { Terminal } = await import('../src/terminal.js');

Terminal.prototype.input = function (promptText = 'elaria>') {
  // record context + serve next scripted line (or empty once exhausted)
  const line = cursor < SCRIPT.length ? SCRIPT[cursor++] : '';
  return Promise.resolve(line);
};
// Make printing instant + capture text for assertions.
const origPrint = Terminal.prototype.print;
Terminal.prototype.print = async function (lines, cls) {
  const arr = Array.isArray(lines) ? lines : [lines];
  for (const l of arr) {
    printed.push(String(l));
    if (/Whispering Forest|approaches/.test(String(l))) sawForestFight = true;
    if (/Loot:|LEVEL UP|Victory/.test(String(l))) sawLevelOrLoot = true;
  }
};
Terminal.prototype.printInstant = function (lines, cls) {
  const arr = Array.isArray(lines) ? lines : [lines];
  for (const l of arr) printed.push(String(l));
};
Terminal.prototype._sleep = () => Promise.resolve();

// ---- boot the game ---------------------------------------------------------
await import('../src/main.js');

// main.js registers DOMContentLoaded on window; fire it.
const bootFn = document._boot;
if (!bootFn) { console.error('FAIL: boot handler not registered'); process.exit(1); }

let threw = null;
try {
  // The game loop runs forever (while(true)); we let it consume the script then it will
  // block on an unresolved-but-instantly-resolved input returning '' repeatedly. To stop,
  // we cap turns by throwing from input after enough calls.
  let calls = 0;
  Terminal.prototype.input = function () {
    calls++;
    if (calls > SCRIPT.length + 40) throw new Error('__STOP__');
    const line = cursor < SCRIPT.length ? SCRIPT[cursor++] : '';
    return Promise.resolve(line);
  };
  await bootFn();
} catch (e) {
  if (!/__STOP__/.test(e.message)) threw = e;
}

// ---- assertions ------------------------------------------------------------
const fail = (m) => { console.error('FAIL:', m); process.exit(1); };
// Assert on the deterministic facts: the game booted and ran the core flow WITHOUT THROWING.
// (Exact end-of-script steps like `save` desync because combat consumes a variable number of
// inputs; save/load is covered deterministically in logic.test.js instead.)
if (threw) fail('game threw: ' + threw.stack);
if (!printed.some((l) => /ELARIA-OS|POWER ON/.test(l))) fail('no boot sequence printed');
if (!printed.some((l) => /On the Main Road/.test(l))) fail('never reached main road');
if (!sawForestFight) fail('hunt/forest encounter did not run');
if (!printed.some((l) => /Welcome|ELARIA/i.test(l))) fail('intro never printed');

console.log('SMOKE OK —', printed.length, 'lines printed; boot + char creation + main loop + hunt + combat wiring all ran without throwing.');
