# Content & Modding Guide

Elaria is **data-driven**: enemies, areas, weapons, perks, accessories, items, events, and all
flavor text live as plain JavaScript data in [`src/content/`](../src/content/). The logic
modules (`combat.js`, `economy.js`, `progression.js`, `encounter.js`) read that data — they
contain no hard-coded content. **You can add or change most content without touching logic.**

Every shape below is type-checked (JSDoc in [`src/types.js`](../src/types.js), run via
`npm run typecheck`) and integrity-checked (`tests/content.test.js`, run via `npm test`). If you
add content that breaks an invariant, a test fails with a message telling you what's wrong —
that's the contract.

> **Guardrails:** content stays text/ASCII (no raster assets), the game stays 100% static (no
> network), and new *systems* (not just data) must ship with headless tests + a balance-sim
> update. See [ROADMAP.md](../ROADMAP.md).

---

## How to add an enemy
Append to `ENEMIES` in [`src/content/enemies.js`](../src/content/enemies.js):
```js
{ name: 'Bog Lurker', weapon: 'Rotting Maul', pool: 'caves' }
```
- `pool` **must** be an existing area `id` (test: *every enemy's pool points at a real area*).
- HP/damage are **not** set here — they're rolled from the area's ranges at fight time, so the
  same enemy scales with whatever region it's placed in.

## How to add an area (risk tier)
Append to `AREAS` in [`src/content/areas.js`](../src/content/areas.js):
```js
{
  id: 'ashwastes', name: 'Ashen Wastes', order: 5,
  gate: { damage: 50 },              // unlock requirement (damage and/or maxHp)
  hp: [420, 600], dmg: [50, 70],     // enemy stat ranges rolled per fight
  goldMult: 7, matMult: 6, xpMult: 6,
  gather: ['a scorched mine', 'a charcoal grove'],
  flavor: 'Ash falls like grey snow...',
}
```
Then add enemies with `pool: 'ashwastes'`. Invariants enforced by tests:
- `id` unique; `hp`/`dmg` are ascending `[min,max]` pairs; all multipliers > 0.
- Areas should **escalate** with `order` (HP and loot must not drop as order rises).
- The pool must be non-empty.

## How to add/extend the weapon ladder
Edit `WEAPONS` in [`src/content/weapons.js`](../src/content/weapons.js). Rules (tested):
- `id` equals array index; the first weapon has `upgradeCost: null`; damage strictly ascends;
  every later weapon has positive gold + material costs.
- Weapons are referenced by `id` everywhere — never inferred from a damage number.

## How to add a perk
Append to `PERKS` in [`src/content/perks.js`](../src/content/perks.js) with a unique `id`,
`name`, `desc` (and optional `maxRank` to make it stack). Then **wire its effect** in the logic
that should read it (e.g. `combat.js` via `hasPerk(player, 'your_id')`). Data alone doesn't do
anything until a logic module checks for it — that's the one place a content change needs a
code change.

## How to add an accessory
Append to `ACCESSORIES` in [`src/content/items_accessories.js`](../src/content/items_accessories.js):
```js
{ id: 'emberband', name: 'Emberband', desc: '+15% damage',
  cost: { gold: 1500, materials: 500 }, effect: { damageMult: 1.15 } }
```
Recognized `effect` keys (read by `combat.js`/`encounter.js`): `damageMult`,
`damageTakenMult`, `goldMult`, `startFocus`. Add a new key only alongside the logic that reads it.

## How to add a road event
Append to `EVENTS` in [`src/events.js`](../src/events.js). Each event has `text` and a list of
`choices`, each with a `label` and a `resolve(player, rng)` that mutates the player and returns
a result string. Pure data + a small closure — no rendering code.

## Flavor text
All static prose (intro, tavern tips, win/lose/boss screens) is in
[`src/content/flavor.js`](../src/content/flavor.js). Safe to edit freely.

---

## The data contract (summary)
| Content | File | Key invariants (enforced by `tests/content.test.js`) |
|---|---|---|
| Enemies | `enemies.js` | `pool` is a real area id; name + weapon present |
| Areas | `areas.js` | unique id; ascending `[min,max]` stat ranges; escalating HP/loot; non-empty pool |
| Weapons | `weapons.js` | id == index; first is free; ascending damage; positive costs |
| Perks | `perks.js` | unique id; name + desc present |
| Accessories | `items_accessories.js` | positive cost; non-empty effect |
| Items | `items.js` | potion bundles ascend in amount |
| Boss gate | `areas.js` | reachable with top weapon + all super potions |

## Save compatibility when adding content
Adding new content (areas, enemies, perks) is **save-safe**: old saves load and the
validate-and-repair pass ([`src/save.js`](../src/save.js)) fills any new defaults. If you change
the **shape** of `GameState` (rename/restructure a field), bump `SAVE_VERSION` in
[`src/state.js`](../src/state.js) and add a migration step in `MIGRATIONS` (see `save.js`),
keyed by the old version. Add a fixture test for the migration.

## Workflow for a content PR
```sh
npm run typecheck   # JSDoc/type contract
npm test            # unit + content-integrity tests
npm run sim         # game still winnable across seeds
npm run smoke       # game still boots and runs
# or all four:
npm run check
```
