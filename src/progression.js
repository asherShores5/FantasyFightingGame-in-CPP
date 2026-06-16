// XP, levels, perks, area unlocks, win check (spec §4.3–4.4). Pure functions over state.

import { AREAS, BOSS_AREA, isAreaUnlocked } from './content/areas.js';
import { playerDamage } from './state.js';

export const LEVEL_CAP = 20;

// XP needed to go from `level` to `level + 1`: 100 × level^1.5.
export function xpToNext(level) {
  if (level >= LEVEL_CAP) return Infinity;
  return Math.round(100 * Math.pow(level, 1.5));
}

// XP awarded for a kill (spec §4.3).
export function xpForKill(enemyMaxHp, areaXpMult) {
  return Math.round(enemyMaxHp * areaXpMult * 0.4);
}

// Grant XP and process any level-ups. Returns an array of level-up event objects so the
// caller can narrate them. Mutates player (xp, level, maxHp, hp, perkPoints).
export function grantXp(player, amount) {
  player.xp += amount;
  const levelUps = [];
  while (player.level < LEVEL_CAP && player.xp >= xpToNext(player.level)) {
    player.xp -= xpToNext(player.level);
    player.level += 1;
    player.maxHp += 15;
    player.hp = player.maxHp; // full heal on level up
    player.perkPoints += 1;
    levelUps.push({ level: player.level, maxHp: player.maxHp });
  }
  if (player.level >= LEVEL_CAP) player.xp = 0;
  return levelUps;
}

// Recompute which areas are unlocked given current power, and add any newly-unlocked ones to
// progress.unlockedAreas. Returns the list of newly unlocked area objects (for narration).
export function refreshUnlocks(state) {
  const player = { damage: playerDamage(state.player), maxHp: state.player.maxHp };
  const newly = [];
  for (const area of [...AREAS, BOSS_AREA]) {
    if (isAreaUnlocked(area, player) && !state.progress.unlockedAreas.includes(area.id)) {
      state.progress.unlockedAreas.push(area.id);
      newly.push(area);
    }
  }
  return newly;
}

export function recordKill(state, enemyName) {
  state.progress.kills[enemyName] = (state.progress.kills[enemyName] || 0) + 1;
}

export function isWon(state) {
  return state.progress.bossDefeated === true;
}
