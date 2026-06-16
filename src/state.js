// GameState model + defaults (spec §10). Single source of truth, serialized to localStorage.
// Logic modules mutate this; only terminal.js touches the DOM.

import { freshSeed } from './rng.js';

export const SAVE_VERSION = 1;

// Create a fresh character. Mirrors the original new-game defaults
// (100 hp / 100 gold / 10 dmg / 8 potions / 1 material / 100 maxHp).
export function newGameState(name, seed = freshSeed()) {
  return {
    version: SAVE_VERSION,
    player: {
      name: name || 'Adventurer',
      level: 1,
      xp: 0,
      hp: 100,
      maxHp: 100,
      gold: 100,
      materials: 1,
      potions: 8,
      weaponId: 0,
      accessoryId: null,
      superTier: 0, // how many super potions bought (0..3); each adds +50 maxHp
      perks: [],
      perkPoints: 0,
    },
    progress: {
      unlockedAreas: ['forest'],
      bossDefeated: false,
      kills: {},
      deaths: 0,
      turnsPlayed: 0,
    },
    settings: { theme: 'green', textSpeed: 'normal', sound: false },
    rngSeed: seed >>> 0,
  };
}

// `damage` is derived from the equipped weapon throughout the code; expose a helper so
// callers never infer the weapon from a damage number (an original bug, spec §9.7).
import { weaponById } from './content/weapons.js';
export function playerDamage(player) {
  return weaponById(player.weaponId).damage;
}
