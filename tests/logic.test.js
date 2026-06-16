// Headless unit tests for the pure game logic (spec §13). Run with:  node --test
// Covers RNG determinism, economy transactions, progression/XP, loot scaling, and the
// combat repairs (heal costs a turn, seeded outcomes, death detection).

import test from 'node:test';
import assert from 'node:assert/strict';

import { makeRng } from '../src/rng.js';
import { newGameState } from '../src/state.js';
import { buyPotions, buySuperPotion, upgradeWeapon } from '../src/economy.js';
import { xpToNext, xpForKill, grantXp, refreshUnlocks, LEVEL_CAP } from '../src/progression.js';
import { generateEnemy, rollLoot } from '../src/encounter.js';
import { AREAS } from '../src/content/areas.js';
import { potionHealAmount } from '../src/content/items.js';
import { Combat } from '../src/combat.js';

// Minimal localStorage shim so save.js works under node --test.
const _store = {};
globalThis.localStorage ??= {
  getItem: (k) => (k in _store ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};
globalThis.btoa ??= (s) => Buffer.from(s, 'binary').toString('base64');
globalThis.atob ??= (s) => Buffer.from(s, 'base64').toString('binary');
const { saveGame, loadGame, clearSave, exportString, importString, importLegacy, hydrate, validate } =
  await import('../src/save.js');

const forest = AREAS[0];

// ---- RNG -------------------------------------------------------------------

test('rng is deterministic for a given seed', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  const seqA = Array.from({ length: 5 }, () => a.int(1, 100));
  const seqB = Array.from({ length: 5 }, () => b.int(1, 100));
  assert.deepEqual(seqA, seqB);
});

test('rng int respects bounds', () => {
  const r = makeRng(7);
  for (let i = 0; i < 500; i++) {
    const v = r.int(3, 9);
    assert.ok(v >= 3 && v <= 9);
  }
});

// ---- economy ---------------------------------------------------------------

test('buying potions deducts gold and adds potions', () => {
  const s = newGameState('Test');
  s.player.gold = 200;
  s.player.potions = 0;
  const res = buyPotions(s.player, 2); // 5 potions, 160G
  assert.ok(res.ok);
  assert.equal(s.player.potions, 5);
  assert.equal(s.player.gold, 40);
});

test('buying potions fails without enough gold', () => {
  const s = newGameState('Test');
  s.player.gold = 10;
  const res = buyPotions(s.player, 4); // 25 potions, 700G
  assert.ok(!res.ok);
  assert.equal(s.player.gold, 10);
});

test('weapon upgrade requires gold AND materials, advances ladder by one', () => {
  const s = newGameState('Test');
  s.player.gold = 100;
  s.player.materials = 40;
  const res = upgradeWeapon(s.player); // Rusty -> Awkward Cleaver: 100G + 40 mats
  assert.ok(res.ok);
  assert.equal(s.player.weaponId, 1);
  assert.equal(s.player.gold, 0);
  assert.equal(s.player.materials, 0);
});

test('super potions add +50 max HP each and stack with level-ups', () => {
  const s = newGameState('Test');
  s.player.gold = 5000;
  assert.equal(s.player.maxHp, 100);
  buySuperPotion(s.player); // +50 -> 150
  assert.equal(s.player.maxHp, 150);
  assert.equal(s.player.superTier, 1);
  // A level-up nudges maxHp off the round threshold...
  grantXp(s.player, xpToNext(1));
  assert.equal(s.player.maxHp, 165); // 150 + 15
  // ...and the next super potion still works (regression: exact-match bug).
  const res = buySuperPotion(s.player);
  assert.ok(res.ok);
  assert.equal(s.player.maxHp, 215);
  assert.equal(s.player.superTier, 2);
});

test('potion healing scales to 40% of maxHP (repaired from flat 100)', () => {
  assert.equal(potionHealAmount(100), 40);
  assert.equal(potionHealAmount(250), 100);
  assert.equal(potionHealAmount(250, true), 130); // battle medic +30%
});

// ---- progression -----------------------------------------------------------

test('xp curve follows 100 * level^1.5', () => {
  assert.equal(xpToNext(1), 100);
  assert.equal(xpToNext(4), 800);
});

test('granting enough xp triggers level up: +15 maxHP, full heal, +1 perk point', () => {
  const s = newGameState('Test');
  s.player.hp = 1;
  const ups = grantXp(s.player, xpToNext(1));
  assert.equal(ups.length, 1);
  assert.equal(s.player.level, 2);
  assert.equal(s.player.maxHp, 115);
  assert.equal(s.player.hp, 115); // full heal
  assert.equal(s.player.perkPoints, 1);
});

test('level is capped', () => {
  const s = newGameState('Test');
  grantXp(s.player, 10_000_000);
  assert.equal(s.player.level, LEVEL_CAP);
});

test('refreshUnlocks opens areas when gear gates are met', () => {
  const s = newGameState('Test');
  // Forest only at start.
  assert.deepEqual(s.progress.unlockedAreas, ['forest']);
  s.player.weaponId = 2; // Sharpened Iron = 20 dmg -> unlocks caves(15) + ruins(20)
  const newly = refreshUnlocks(s);
  const ids = newly.map((a) => a.id);
  assert.ok(ids.includes('caves'));
  assert.ok(ids.includes('ruins'));
  assert.ok(s.progress.unlockedAreas.includes('ruins'));
});

test('boss gate needs Excalibur AND maxHP >= 200', () => {
  const s = newGameState('Test');
  s.player.weaponId = 4; // Excalibur
  s.player.maxHp = 150;
  let newly = refreshUnlocks(s).map((a) => a.id);
  assert.ok(!newly.includes('throne'));
  s.player.maxHp = 200;
  newly = refreshUnlocks(s).map((a) => a.id);
  assert.ok(newly.includes('throne'));
});

// ---- encounter / loot ------------------------------------------------------

test('generated enemy stats fall within the area ranges', () => {
  const r = makeRng(123);
  for (let i = 0; i < 200; i++) {
    const e = generateEnemy(forest, r);
    assert.ok(e.maxHp >= forest.hp[0] && e.maxHp <= forest.hp[1]);
    assert.ok(e.dmg >= forest.dmg[0] && e.dmg <= forest.dmg[1]);
    assert.equal(e.hp, e.maxHp);
  }
});

test('loot scales with area multiplier', () => {
  const r1 = makeRng(5);
  const r2 = makeRng(5);
  const s = newGameState('Test');
  const enemy = { maxHp: 100, dmg: 20 };
  const forestLoot = rollLoot(enemy, AREAS[0], s.player, r1);
  const ruinsLoot = rollLoot(enemy, AREAS[2], s.player, r2);
  assert.ok(ruinsLoot.gold > forestLoot.gold);
});

// ---- combat repairs --------------------------------------------------------

test('heal consumes the turn — enemy gets to act (no free-heal exploit)', () => {
  const s = newGameState('Test');
  s.player.hp = 50;
  s.player.potions = 1;
  const r = makeRng(1);
  const enemy = { name: 'Goblin', weapon: 'x', maxHp: 999, hp: 999, dmg: 20, isBoss: false };
  const fight = new Combat(s, forest, enemy, r);
  const hpBeforeAnyTurn = s.player.hp;
  const res = fight.playerTurn('heal');
  // Player healed...
  assert.ok(s.player.hp >= hpBeforeAnyTurn); // healed up from 50 (then possibly took a hit)
  // ...and the enemy's turn ran: events should include an enemy/boss action OR a block.
  const enemyActed = res.events.some((e) => ['enemy', 'boss', 'dot'].includes(e.t));
  assert.ok(enemyActed, 'enemy must act after a heal');
  assert.equal(s.player.potions, 0);
});

test('stab always hits (100% accuracy) and reduces enemy hp', () => {
  const s = newGameState('Test');
  const r = makeRng(99);
  const enemy = { name: 'Goblin', weapon: 'x', maxHp: 100, hp: 100, dmg: 1, isBoss: false };
  const fight = new Combat(s, forest, enemy, r);
  fight.playerTurn('stab');
  assert.ok(enemy.hp < 100);
});

test('a fight is winnable and reports result=win', () => {
  const s = newGameState('Test');
  s.player.weaponId = 4; // Excalibur, 50 dmg
  s.player.hp = 100;
  const r = makeRng(3);
  const enemy = { name: 'Goblin', weapon: 'x', maxHp: 40, hp: 40, dmg: 1, isBoss: false };
  const fight = new Combat(s, forest, enemy, r);
  let out;
  let guard = 0;
  do { out = fight.playerTurn('stab'); } while (!out.over && guard++ < 50);
  assert.equal(out.result, 'win');
});

// ---- save / load -----------------------------------------------------------

test('save then load round-trips the full game state', () => {
  clearSave();
  const s = newGameState('Saver');
  s.player.gold = 4321;
  s.player.weaponId = 3;
  s.progress.unlockedAreas = ['forest', 'caves', 'ruins'];
  assert.ok(saveGame(s));
  const back = loadGame();
  assert.equal(back.player.name, 'Saver');
  assert.equal(back.player.gold, 4321);
  assert.equal(back.player.weaponId, 3);
  assert.deepEqual(back.progress.unlockedAreas, ['forest', 'caves', 'ruins']);
});

test('export/import string round-trips a character', () => {
  const s = newGameState('Exporter');
  s.player.materials = 999;
  const str = exportString(s);
  const back = importString(str);
  assert.equal(back.player.name, 'Exporter');
  assert.equal(back.player.materials, 999);
});

test('importing a bad string returns null (not a throw)', () => {
  assert.equal(importString('not-valid-base64-$$$'), null);
});

test('legacy C++ text.txt import maps damage onto the weapon ladder', () => {
  // name, hp, gold, dmg(=20 -> Sharpened Iron / id 2), potions, mats, maxHp
  const s = importLegacy(['asher', '100', '500', '20', '8', '40', '150']);
  assert.equal(s.player.name, 'asher');
  assert.equal(s.player.gold, 500);
  assert.equal(s.player.weaponId, 2);
  assert.equal(s.player.maxHp, 150);
});

// ---- save hardening (validate-and-repair) ----------------------------------

test('hydrate repairs a partial save by filling defaults', () => {
  // A truncated save with only a name and gold — everything else missing.
  const repaired = hydrate({ player: { name: 'Frag', gold: 50 } });
  assert.ok(repaired);
  assert.equal(repaired.player.name, 'Frag');
  assert.equal(repaired.player.gold, 50);
  assert.equal(repaired.player.maxHp, 100); // default filled
  assert.equal(repaired.player.weaponId, 0); // default filled
  assert.deepEqual(repaired.progress.unlockedAreas, ['forest']); // default filled
  assert.equal(repaired.version, 1);
});

test('validate clamps HP to maxHP and floors negatives', () => {
  const s = newGameState('Clampy');
  s.player.maxHp = 200;
  s.player.hp = 9999; // over max
  s.player.gold = -50; // negative
  const v = validate(s);
  assert.equal(v.player.hp, 200);
  assert.equal(v.player.gold, 0);
});

test('validate resets an out-of-range weaponId to the starting weapon', () => {
  const s = newGameState('Hacker');
  s.player.weaponId = 999; // not a real weapon index
  const v = validate(s);
  assert.equal(v.player.weaponId, 0);
});

test('validate guarantees Forest is always unlocked', () => {
  const s = newGameState('Lost');
  s.progress.unlockedAreas = []; // somehow emptied
  const v = validate(s);
  assert.ok(v.progress.unlockedAreas.includes('forest'));
});

test('hydrate rejects total garbage', () => {
  assert.equal(hydrate(null), null);
  assert.equal(hydrate('a string'), null);
  assert.equal(hydrate(42), null);
});

test('a hand-edited save with wrong-typed fields is healed, not trusted', () => {
  const s = newGameState('Sneaky');
  // Attacker sets gold to a string and perks to a non-array.
  s.player.gold = '999999';
  s.player.perks = 'allofthem';
  const v = validate(s);
  assert.equal(v.player.gold, 100); // string rejected, default kept
  assert.ok(Array.isArray(v.player.perks));
});

test('player death is detected and result=lose', () => {
  const s = newGameState('Test');
  s.player.hp = 5;
  s.player.weaponId = 0;
  const r = makeRng(2);
  const enemy = { name: 'Ogre', weapon: 'x', maxHp: 9999, hp: 9999, dmg: 9999, isBoss: false };
  const fight = new Combat(s, forest, enemy, r);
  let out;
  let guard = 0;
  do { out = fight.playerTurn('stab'); } while (!out.over && guard++ < 50);
  assert.equal(out.result, 'lose');
  assert.equal(s.player.hp, 0);
});
