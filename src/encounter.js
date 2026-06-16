// Generates area-scaled enemies and computes loot (spec §4.1, §6.2). Replaces the original's
// fixed 50–99 HP / 15–24 dmg foes; stats now come from the chosen area's ranges.

import { enemiesForArea } from './content/enemies.js';
import { hasPerk } from './content/perks.js';
import { accessoryEffect } from './economy.js';

// Difficulty scales only incoming enemy damage — leaves loot/XP/economy (and the balance sim,
// which runs 'normal') untouched. ponytail: damage-only lever; widen to HP if it feels flat.
export const DIFFICULTY = { easy: 0.7, normal: 1.0, hard: 1.4 };
const dmgMult = (d) => DIFFICULTY[d] ?? 1;

// Roll a fresh enemy for an area.
export function generateEnemy(area, rng, difficulty = 'normal') {
  const pool = enemiesForArea(area.id);
  const tpl = rng.pick(pool);
  const maxHp = rng.int(area.hp[0], area.hp[1]);
  const dmg = Math.round(rng.int(area.dmg[0], area.dmg[1]) * dmgMult(difficulty));
  return { name: tpl.name, weapon: tpl.weapon, maxHp, hp: maxHp, dmg, isBoss: false };
}

// The final boss (spec §4.2). ~800 effective HP, 3 phases handled in combat.js.
export function generateBoss(difficulty = 'normal') {
  return {
    name: 'Demon Lord Malakar',
    weapon: 'Hellfire Greatblade',
    maxHp: 800,
    hp: 800,
    dmg: Math.round(40 * dmgMult(difficulty)),
    isBoss: true,
    phase: 0,
  };
}

// Loot for a defeated enemy (spec §6.2). Uses the enemy's rolled stats + area multipliers.
export function rollLoot(enemy, area, player, rng) {
  const accGoldMult = accessoryEffect(player).goldMult || 1;
  const scavenger = hasPerk(player, 'scavenger') ? 1.25 : 1;

  const gold = Math.round(
    ((enemy.maxHp + enemy.dmg) / 2) * area.goldMult * rng.range(0.6, 1.0) * accGoldMult
  );
  const materials = Math.round(
    ((enemy.maxHp + enemy.dmg) / 6) * area.matMult * rng.range(0.6, 1.0) * scavenger
  );
  return { gold: Math.max(0, gold), materials: Math.max(0, materials) };
}

// Safe gathering (no combat): 2–6 base × area mat multiplier, of stone or lumber.
export function rollGather(area, player, rng) {
  const scavenger = hasPerk(player, 'scavenger') ? 1.25 : 1;
  const amount = Math.max(1, Math.round(rng.int(2, 6) * area.matMult * scavenger));
  const where = rng.pick(area.gather);
  const kind = rng.chance(0.5) ? 'stone' : 'lumber';
  return { amount, where, kind };
}
