// Save/load to localStorage + portable export/import string (spec §10, roadmap §1.3).
// Hardened: every load runs through a versioned migration chain and then a validate-and-repair
// pass, so a partial, hand-edited, or older save is healed against current defaults rather than
// crashing the game or producing an inconsistent character. Includes a one-time importer for
// the old C++ `text.txt` values.

import { SAVE_VERSION, newGameState } from './state.js';
import { WEAPONS } from './content/weapons.js';

const KEY = 'elaria.save.v1';

/** @typedef {import('./types.js').GameState} GameState */

export function hasSave() {
  try {
    return localStorage.getItem(KEY) != null;
  } catch {
    return false;
  }
}

/** @param {GameState} state */
export function saveGame(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** @returns {GameState|null} */
export function loadGame() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return hydrate(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Portable string: base64 of the JSON. `save export` / `save import <string>`.
/** @param {GameState} state */
export function exportString(state) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

/** @returns {GameState|null} */
export function importString(str) {
  try {
    const json = decodeURIComponent(escape(atob(str.trim())));
    return hydrate(JSON.parse(json));
  } catch {
    return null;
  }
}

// One-time C++ import: the 7 text.txt lines (name, hp, gold, dmg, potions, mats, maxHp).
// We map the legacy damage value back onto the weapon ladder.
export function importLegacy(lines) {
  const [name, hp, gold, dmg, potions, mats, maxHp] = lines;
  const state = newGameState(String(name).trim());
  const damage = parseInt(dmg, 10) || 10;
  const weapon = WEAPONS.find((w) => w.damage === damage) || WEAPONS[0];
  Object.assign(state.player, {
    hp: parseInt(hp, 10) || 100,
    gold: parseInt(gold, 10) || 0,
    potions: parseInt(potions, 10) || 0,
    materials: parseInt(mats, 10) || 0,
    maxHp: parseInt(maxHp, 10) || 100,
    weaponId: weapon.id,
  });
  return validate(state);
}

// ---- migration + validation ------------------------------------------------

// Bring any loaded blob to the current version, then repair it. Returns null only if the input
// isn't a usable object at all.
/** @returns {GameState|null} */
export function hydrate(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const migrated = migrate(raw);
  return validate(migrated);
}

// Ordered migration steps. Each step upgrades a save from version N to N+1. To add a future
// schema change: bump SAVE_VERSION in state.js and append a step here keyed by the OLD version.
// Steps are pure transforms on the plain object; validate() fills anything they miss.
const MIGRATIONS = {
  // Example shape for the future (no-op today since v1 is current):
  // 1: (s) => { s.player.newField = default; return s; },
};

function migrate(state) {
  let v = Number(state.version) || 1;
  while (v < SAVE_VERSION && MIGRATIONS[v]) {
    state = MIGRATIONS[v](state);
    v += 1;
    state.version = v;
  }
  state.version = SAVE_VERSION;
  return state;
}

// Validate-and-repair against a fresh template. Anything missing or of the wrong type is reset
// to its default, and numeric fields are clamped to sane invariants. This is what makes a
// truncated or hand-edited save safe to load instead of a source of NaN/undefined bugs.
/** @returns {GameState} */
export function validate(state) {
  const def = newGameState(state?.player?.name || 'Adventurer', state?.rngSeed >>> 0 || 1);

  const out = {
    version: SAVE_VERSION,
    rngSeed: num(state?.rngSeed, def.rngSeed) >>> 0,
    player: mergeShape(def.player, state?.player),
    progress: mergeShape(def.progress, state?.progress),
    settings: mergeShape(def.settings, state?.settings),
  };

  // Invariants the rest of the code relies on.
  const p = out.player;
  p.maxHp = Math.max(1, Math.round(p.maxHp));
  p.hp = clamp(Math.round(p.hp), 0, p.maxHp);
  p.gold = Math.max(0, Math.round(p.gold));
  p.materials = Math.max(0, Math.round(p.materials));
  p.potions = Math.max(0, Math.round(p.potions));
  p.level = Math.max(1, Math.round(p.level));
  p.xp = Math.max(0, Math.round(p.xp));
  p.perkPoints = Math.max(0, Math.round(p.perkPoints));
  // weaponId must index a real weapon.
  if (!WEAPONS[p.weaponId]) p.weaponId = 0;
  if (!Array.isArray(p.perks)) p.perks = [];
  // Forest is always unlocked; keep the list an array of strings.
  if (!Array.isArray(out.progress.unlockedAreas) || !out.progress.unlockedAreas.length) {
    out.progress.unlockedAreas = ['forest'];
  }
  if (!out.progress.unlockedAreas.includes('forest')) out.progress.unlockedAreas.unshift('forest');
  if (out.progress.kills == null || typeof out.progress.kills !== 'object') out.progress.kills = {};

  return out;
}

// ---- small helpers ---------------------------------------------------------

// Shallow-merge `src` onto a copy of `template`, keeping only keys the template defines and
// only when the source value has the same primitive type / shape. Unknown keys are dropped;
// missing/mistyped keys fall back to the template default.
function mergeShape(template, src) {
  const out = Array.isArray(template) ? [...template] : { ...template };
  if (!src || typeof src !== 'object') return out;
  for (const key of Object.keys(template)) {
    const tv = template[key];
    const sv = src[key];
    if (sv == null) continue;
    if (Array.isArray(tv)) {
      if (Array.isArray(sv)) out[key] = sv;
    } else if (typeof tv === 'object') {
      out[key] = mergeShape(tv, sv);
    } else if (typeof sv === typeof tv) {
      out[key] = sv;
    }
  }
  return out;
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}
