// Headless balance simulation: exercises the real logic modules end-to-end without the DOM.
// Plays a full run with a reasonably smart auto-player and asserts the game stays WINNABLE
// across a fixed seed set. Exits non-zero if any seed fails to beat the boss, so CI catches
// balance regressions. Run: node tests/sim.mjs
import { makeRng } from '../src/rng.js';
import { newGameState } from '../src/state.js';
import { upgradeWeapon, buySuperPotion } from '../src/economy.js';
import { grantXp, xpForKill, refreshUnlocks, recordKill } from '../src/progression.js';
import { generateEnemy, generateBoss, rollLoot } from '../src/encounter.js';
import { AREAS } from '../src/content/areas.js';
import { Combat } from '../src/combat.js';

const SEEDS = [1, 7, 99, 2024, 55555];

function playRun(seed) {
  const rng = makeRng(seed);
  const s = newGameState('SimHero', seed);

  // A reasonably smart player: rest to full before each fight, use skills with Focus, heal low.
  function autoFight(area, enemy) {
    s.player.hp = s.player.maxHp; // rest at tavern before heading out
    const fight = new Combat(s, area, enemy, rng);
    let guard = 0;
    while (!fight.over && guard++ < 400) {
      const lowHp = s.player.hp < s.player.maxHp * 0.4;
      if (lowHp && s.player.potions > 0) { fight.playerTurn('heal'); continue; }
      if (fight.focus >= 3) { fight.playerTurn('rage'); fight.playerTurn('power'); continue; }
      if (fight.focus >= 2 && enemy.maxHp > 200) { fight.playerTurn('bleed'); continue; }
      fight.playerTurn('slash');
    }
    return fight.result;
  }

  function restock() {
    while (s.player.potions < 10 && s.player.gold >= 35) { s.player.gold -= 35; s.player.potions += 1; }
  }

  let fights = 0, wins = 0, deaths = 0;
  for (let i = 0; i < 6000 && !s.progress.bossDefeated; i++) {
    while (upgradeWeapon(s.player).ok) { /* climb */ }
    while (buySuperPotion(s.player).ok) { /* raise maxHP */ }
    refreshUnlocks(s);
    restock();

    const unlocked = AREAS.filter((a) => s.progress.unlockedAreas.includes(a.id));
    const idx = s.player.weaponId >= 4 ? unlocked.length - 1 : Math.max(0, unlocked.length - 2);
    const area = unlocked[idx];

    if (s.progress.unlockedAreas.includes('throne') && s.player.maxHp >= 230) {
      const res = autoFight(AREAS[3], generateBoss());
      fights++;
      if (res === 'win') { s.progress.bossDefeated = true; wins++; break; }
      if (res === 'lose') { deaths++; s.player.gold = Math.floor(s.player.gold / 2); }
      continue;
    }

    const enemy = generateEnemy(area, rng);
    const res = autoFight(area, enemy);
    fights++;
    if (res === 'win') {
      wins++;
      recordKill(s, enemy.name);
      const loot = rollLoot(enemy, area, s.player, rng);
      s.player.gold += loot.gold; s.player.materials += loot.materials;
      grantXp(s.player, xpForKill(enemy.maxHp, area.xpMult));
    } else if (res === 'lose') {
      deaths++; s.player.gold = Math.floor(s.player.gold / 2);
    }
  }

  return { seed, won: s.progress.bossDefeated, fights, wins, deaths, level: s.player.level };
}

let failures = 0;
for (const seed of SEEDS) {
  const r = playRun(seed);
  const tag = r.won ? 'WIN ' : 'FAIL';
  console.log(`[${tag}] seed=${String(seed).padEnd(6)} fights=${String(r.fights).padStart(3)} wins=${String(r.wins).padStart(3)} deaths=${String(r.deaths).padStart(3)} level=${r.level}`);
  if (!r.won) failures++;
}

if (failures) {
  console.error(`\nBALANCE REGRESSION: ${failures}/${SEEDS.length} seed(s) could not beat the boss.`);
  process.exit(1);
}
console.log(`\nAll ${SEEDS.length} seeds beat the boss — game is winnable.`);
