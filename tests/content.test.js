// Content-integrity tests (roadmap §1.4). These enforce the data contract that lets the game
// stay data-driven: anyone adding/modding content (areas, enemies, weapons, perks, accessories)
// gets a failing test instead of a runtime surprise if their data is inconsistent.

import test from 'node:test';
import assert from 'node:assert/strict';

import { AREAS, BOSS_AREA } from '../src/content/areas.js';
import { ENEMIES, enemiesForArea } from '../src/content/enemies.js';
import { WEAPONS } from '../src/content/weapons.js';
import { PERKS } from '../src/content/perks.js';
import { ACCESSORIES } from '../src/content/items_accessories.js';
import { POTION_BUNDLES, SUPER_POTIONS } from '../src/content/items.js';
import { enemyArt, areaArt } from '../src/content/art.js';

test('every area has the fields the engine reads', () => {
  for (const a of AREAS) {
    assert.ok(a.id && typeof a.id === 'string', `area missing id`);
    assert.ok(a.name, `${a.id} missing name`);
    assert.ok(Array.isArray(a.hp) && a.hp.length === 2 && a.hp[0] <= a.hp[1], `${a.id} bad hp range`);
    assert.ok(Array.isArray(a.dmg) && a.dmg.length === 2 && a.dmg[0] <= a.dmg[1], `${a.id} bad dmg range`);
    assert.ok(a.goldMult > 0 && a.matMult > 0 && a.xpMult > 0, `${a.id} bad multipliers`);
    assert.ok(Array.isArray(a.gather) && a.gather.length > 0, `${a.id} needs gather spots`);
    assert.ok(a.gate && typeof a.gate === 'object', `${a.id} missing gate`);
  }
});

test('area ids are unique', () => {
  const ids = AREAS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('areas escalate: HP, damage, and loot all rise with order', () => {
  const sorted = [...AREAS].sort((a, b) => a.order - b.order);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(sorted[i].hp[0] >= sorted[i - 1].hp[0], `${sorted[i].id} HP should not drop`);
    assert.ok(sorted[i].goldMult >= sorted[i - 1].goldMult, `${sorted[i].id} loot should not drop`);
  }
});

test('every non-boss area has at least one enemy in its pool', () => {
  for (const a of AREAS) {
    assert.ok(enemiesForArea(a.id).length > 0, `area ${a.id} has no enemies`);
  }
});

test("every enemy's pool points at a real area", () => {
  const areaIds = new Set(AREAS.map((a) => a.id));
  for (const e of ENEMIES) {
    assert.ok(e.name && e.weapon, `enemy missing name/weapon`);
    assert.ok(areaIds.has(e.pool), `enemy ${e.name} has unknown pool "${e.pool}"`);
  }
});

test('weapon ladder is contiguous, ascending, and only the first is free', () => {
  for (let i = 0; i < WEAPONS.length; i++) {
    assert.equal(WEAPONS[i].id, i, 'weapon id must equal its index');
    if (i === 0) assert.equal(WEAPONS[i].upgradeCost, null, 'first weapon is free');
    else {
      assert.ok(WEAPONS[i].damage > WEAPONS[i - 1].damage, 'damage must ascend');
      assert.ok(WEAPONS[i].upgradeCost.gold > 0 && WEAPONS[i].upgradeCost.materials > 0);
    }
  }
});

test('the boss gate is reachable with the top weapon + a super potion', () => {
  const topDamage = WEAPONS[WEAPONS.length - 1].damage;
  assert.ok((BOSS_AREA.gate.damage || 0) <= topDamage, 'boss damage gate exceeds best weapon');
  const maxReachableHp = 100 + SUPER_POTIONS.reduce((sum, sp) => sum + sp.bonus, 0);
  assert.ok((BOSS_AREA.gate.maxHp || 0) <= maxReachableHp, 'boss maxHp gate unreachable');
});

test('perk ids are unique and well-formed', () => {
  const ids = PERKS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PERKS) assert.ok(p.id && p.name && p.desc, `perk ${p.id} incomplete`);
});

test('accessories have positive costs and an effect', () => {
  for (const a of ACCESSORIES) {
    assert.ok(a.id && a.name && a.desc, `accessory ${a.id} incomplete`);
    assert.ok(a.cost.gold > 0 && a.cost.materials >= 0, `accessory ${a.id} bad cost`);
    assert.ok(a.effect && Object.keys(a.effect).length > 0, `accessory ${a.id} has no effect`);
  }
});

test('potion bundles ascend in amount', () => {
  for (let i = 1; i < POTION_BUNDLES.length; i++) {
    assert.ok(POTION_BUNDLES[i].amount > POTION_BUNDLES[i - 1].amount);
  }
});

test('every enemy resolves to non-empty ASCII art (fallback guarantees it)', () => {
  for (const e of ENEMIES) {
    const art = enemyArt(e.name);
    assert.ok(Array.isArray(art) && art.length > 0, `no art for ${e.name}`);
  }
});

test('every non-boss area resolves to a banner', () => {
  for (const a of AREAS) {
    assert.ok(areaArt(a.id), `no area art for ${a.id}`);
  }
});
