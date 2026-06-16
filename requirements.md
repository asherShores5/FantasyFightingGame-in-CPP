# Elaria — Web Port & Expansion Spec

A specification for porting the C++ console RPG **Fantasy Fighting Game** to a static,
browser-playable web app written in JavaScript, rendered inside a retro green-phosphor
CRT terminal. This document covers the faithful content port, the gameplay repairs,
the balance pass, and the new systems (areas, leveling, skills, gear, events, final boss).

---

## 1. Vision & Goals

**Pitch.** You are an adventurer in the land of **Elaria**. From the Main Road you travel
to town, gather materials, and hunt monsters in increasingly dangerous regions, upgrading
your gear and growing in power until you can storm the **Demon Lord's Throne** and win.
The entire game plays out as text on a glowing CRT screen you can type commands into.

**Goals**
- Port 100% of the original game's content (enemies, weapons, shop, tavern, gather, save) to JS.
- Run as a **static web app** — no backend, no build step required, deployable to GitHub Pages.
- Wrap the game in a **CRT terminal** aesthetic (green phosphor, scanlines, curvature, glow).
- **Repair** the broken/exploitable mechanics from the original (see §9).
- **Balance** difficulty so every stage of progression stays tense, not trivial or brutal.
- Deliver a **satisfying loop** (hunt → loot → upgrade → unlock harder area → repeat) with a
  clear **win condition** (defeat the final boss).
- **Expand** with leveling/perks, active combat skills, gear variety, road events, and new
  enemy tiers across multiple regions.

**Non-goals (v1)**
- No multiplayer, no server, no accounts.
- No graphics/sprites — text and ASCII only (it's a terminal).
- No real-money anything. No analytics required.

**Target platform**
- Modern evergreen browsers (Chrome, Firefox, Safari, Edge), desktop + mobile.
- Keyboard for typed commands; clickable/number-key menus for touch and accessibility.

---

## 2. Tech Stack & Architecture

**Stack:** Vanilla JavaScript (ES modules), HTML, CSS. **No framework, no bundler required.**
Optionally a tiny dev server for local file:// module loading. Zero runtime dependencies.

**Why:** "Static + same content in JS" is best served by dependency-free ES modules. It keeps
the project forkable/hackable (matching the original's spirit) and trivially hostable on
GitHub Pages — which also lets us retire the dead repl.it link in the README.

### Proposed file structure
```
/ (repo root)
  index.html              # CRT shell + terminal mount point
  /styles
    crt.css               # phosphor color, scanlines, curvature, glow, bezel
    terminal.css          # text layout, cursor, prompt, input line
  /src
    main.js               # boot sequence, wires modules together, game loop driver
    state.js              # GameState model + defaults + (de)serialization
    save.js               # localStorage save/load, export/import string, migration
    terminal.js           # render queue, typewriter printing, input capture, history
    parser.js             # hybrid input: number keys + typed commands -> intents
    rng.js                # seedable PRNG (replaces srand/rand)
    combat.js             # turn engine, moves, skills, focus, status effects
    progression.js        # XP, levels, perks, area unlocks, win check
    economy.js            # gold/materials, shop transactions, weapon/gear upgrades
    events.js             # road/area random events
    /content
      enemies.js          # enemy definitions per tier (data, not logic)
      areas.js            # area/tier definitions, unlock gates, loot multipliers
      weapons.js          # weapon ladder + accessories
      items.js            # potions, consumables
      perks.js            # perk definitions
      flavor.js           # tavern tips, intro text, win/lose screens, boss dialogue
  /tests
    *.test.js             # headless unit tests for combat/economy/progression math
  README.md
```

**Architecture principles**
- **Data-driven content.** Enemies, areas, weapons, perks, events live in `/content` as plain
  data objects. Logic modules read that data. Adding a foe = adding a data entry.
- **Pure game logic, separate from rendering.** `combat.js`/`economy.js`/`progression.js`
  operate on `GameState` and return results/events. `terminal.js` is the only module that
  touches the DOM. This keeps logic unit-testable headless.
- **Single source of truth:** one `GameState` object, serialized to localStorage.
- **Deterministic RNG** via `rng.js` so runs can be seeded/tested (fixes the original's
  reseed-every-call bug).

---

## 3. Core Gameplay Loop

```
            +-----------------------------------------------+
            |                 MAIN ROAD (hub)               |
            +-----------------------------------------------+
              | 1 Town      | 2 Gather  | 3 Hunt   | 4 Stats | 5 Save
              v             v           v          v         v
        +-----------+   +--------+  +---------+  (read)   (persist)
        | Shop      |   | safe   |  | pick    |
        | Tavern    |   | mats   |  | AREA    |
        +-----------+   +--------+  | -> fight|
              |                     +---------+
              v                          |
        spend gold/mats              loot gold/mats/XP
        on potions/gear  <-------------- + unlock next area
              |                          |
              +----------> grow power ---+
                                |
                                v
                    unlock & clear all areas
                                |
                                v
                   DEMON LORD'S THRONE (final boss)
                                |
                                v
                          WIN SCREEN
```

The loop is intentionally short and legible: **fight → loot → spend → grow → unlock harder
ground → fight again**, terminating in the boss. Each turn of the loop should visibly move a
bar toward the win (gear tier, area unlocks, level).

---

## 4. Progression & Win Condition

### 4.1 Areas (player-chosen risk tiers)

The **Hunt** action opens an area-select menu. Tougher areas demand better gear (gated) and
pay out proportionally more. This is the core difficulty-balancing mechanism: the player opts
into risk, and gear gates stop them from face-planting into content they can't survive.

| # | Area                 | Unlock gate              | Enemy HP | Enemy dmg | Gold ×  | Mat ×  | XP ×  |
|---|----------------------|--------------------------|----------|-----------|---------|--------|-------|
| 1 | Whispering Forest    | always open              | 40–70    | 8–14      | 1.0     | 1.0    | 1.0   |
| 2 | Damp Caves           | base dmg ≥ 15            | 80–130   | 14–22     | 1.8     | 1.6    | 1.6   |
| 3 | Sunken Ruins         | base dmg ≥ 20            | 150–230  | 22–34     | 3.0     | 2.6    | 2.6   |
| 4 | Frostpeak Ascent     | base dmg ≥ 25            | 280–400  | 34–50     | 5.0     | 4.0    | 4.0   |
| B | Demon Lord's Throne  | dmg = 50 AND maxHP ≥ 200 | boss     | boss      | —       | —      | —     |

- Locked areas are **listed but greyed**, showing their unlock requirement, so the player
  always sees the next goal.
- Returning to a low tier with high gear is allowed but yields trivial loot (intended:
  low risk = low reward), so it's never the optimal grind.
- Each area has its own enemy pool, flavor text, and gather sub-locations.

### 4.2 Final boss — Demon Lord Malakar

- **Gate:** Excalibur (50 dmg) + maxHP ≥ 200. The throne is listed early but locked, as the
  stated overall goal from the first session.
- **Fight:** multi-phase, ~800 effective HP.
  - **Phase 1 (100–66%):** standard attacks, telegraphs a "charge" every 3rd turn that the
    player can **Parry** to negate.
  - **Phase 2 (66–33%):** gains a heavy attack (~2.5× dmg); applies **Burn** status.
  - **Phase 3 (33–0%):** enrage — attacks twice per turn; this is where potions/focus skills
    matter. Designed to be winnable with top gear + smart skill use, lethal to the careless.
- **Win:** defeating Malakar shows the **victory screen** + run summary (turns, gold earned,
  level, deaths). **New Game+ is a stretch goal only (§11), not in v1 scope.**
- **Loss to boss:** returns to town with death penalty (§5.4); boss resets to full.

### 4.3 Leveling & XP

- Kills grant XP = `round(enemyMaxHP × areaXPMultiplier × 0.4)`.
- **Level curve:** XP to next = `100 × level^1.5` (L1→2 = 100, L2→3 ≈ 283, … smooth ramp).
- **Level cap:** 20.
- **On level up:** `+15 maxHP`, full heal, and **+1 perk point** every level (or every level;
  see §4.4). A short celebratory print + sound.
- XP is a *secondary* progression axis; **gear remains the primary gate** for areas. Leveling
  smooths the early grind and rewards fighting at all.

### 4.4 Perks (spend perk points)

Light tree, pick as you level. Each perk single-rank unless noted.

| Perk           | Effect                                                        |
|----------------|---------------------------------------------------------------|
| Crit Slash     | Slash accuracy 60% → 75%                                       |
| Deadeye        | Power accuracy 40% → 55%                                       |
| Iron Skin      | −15% damage taken                                             |
| Bloodlust      | +20% damage dealt while below 30% HP                          |
| Battle Medic   | Potions heal +30%; Heal action also grants 1 Focus            |
| Thrifty        | Shop prices −10%                                              |
| Scavenger      | +25% materials from all sources                              |
| Second Wind    | Once per fight, a lethal hit leaves you at 1 HP instead       |
| Focused (×3)   | Start each fight with +1 Focus per rank                       |

---

## 5. Combat System

Turn-based, player-choice. Repairs the original's exploits and adds depth via **Focus** and
**status effects**, while keeping the original three attacks intact.

### 5.1 Player actions

| Action  | Accuracy | Damage on hit | Notes                                        |
|---------|----------|---------------|----------------------------------------------|
| Stab    | 100%     | 1× base dmg   | Reliable. EV = 1.00× base.                   |
| Slash   | 60%      | 2× base dmg   | EV = 1.20× base. (75% w/ Crit Slash)         |
| Power   | 40%      | 4× base dmg   | EV = 1.60× base, high variance. (55% Deadeye)|
| Heal    | —        | —             | Consume 1 potion → +heal amount. **Costs your turn** (enemy attacks after). |
| Skill   | —        | varies        | Spend Focus (see §5.3).                       |
| Retreat | —        | —             | Flee the fight: keep XP, forfeit this fight's loot. |

Expected-value ordering (Stab < Slash < Power) preserves the original's risk/reward; perks
shift the curve rather than flatten it.

### 5.2 Enemy actions

Per turn the enemy rolls:
- **~25% miss/blocked** (stumble or player blocks) → 0 dmg (preserved from original).
- Otherwise jab (1×), slash (1.5×), or blunt (2×) of its area-scaled damage.
- Higher tiers add telegraphed **heavy** attacks and apply status effects (Bleed/Burn).

### 5.3 Focus & active skills (new)

- **Focus** meter, starts at 0 (or +N from `Focused` perk), **+1 per turn**, **+1 on landing a hit**.
- Skills (typed `parry` / `bleed` / `rage`, or from the combat menu):

| Skill  | Focus cost | Effect                                                                 |
|--------|------------|------------------------------------------------------------------------|
| Parry  | 1          | Negate the enemy's next attack and counter for 0.5× base dmg.          |
| Bleed  | 2          | Enemy loses 10% of its max HP per turn for 3 turns (stacks once).      |
| Rage   | 3          | Your next attack is a guaranteed max-damage crit (Power at 4×, hits).  |

### 5.4 Status effects

- **Bleed / Burn:** DoT ticks at start of the affected unit's turn.
- **Stun (boss telegraphs):** skip a turn (rare, boss-only).
- Effects display as tags next to the combatant's HP line.

### 5.5 Death & stakes (repaired)

- On player death in a hunt: **lose half gold**, **forfeit all unbanked loot from this hunt**,
  respawn in town at full HP. (Original gave a full heal + half gold but had no loot stakes.)
- This makes pushing a too-hard area a real gamble without being roguelike-punishing.

---

## 6. Economy, Shop & Gear

### 6.1 Currencies
- **Gold:** from fights, scaled by area multiplier; spent in shop.
- **Materials:** from fights + gathering; spent on weapon/gear upgrades.

### 6.2 Loot formulas (cleaned up from original)
- `goldDrop  = round(((enemyMaxHP + enemyDmg) / 2) × areaGoldMult × rand(0.6..1.0))`
- `matDrop   = round(((enemyMaxHP + enemyDmg) / 6) × areaMatMult  × rand(0.6..1.0) × scavenger)`
- Gather (safe, no combat): `rand(2..6) × areaMatMult` of stone or lumber.

### 6.3 Potions (shop)

| Bundle              | Cost  |
|---------------------|-------|
| 1 Health Potion     | 35 G  |
| 5 Health Potions    | 160 G |
| 10 Health Potions   | 300 G |
| 25 Health Potions   | 700 G |
| Super Potion (maxHP)| see below |

- **Health Potion** heals `40% of maxHP` (or `+30%` of that with Battle Medic), so potions
  stay relevant as maxHP climbs. (Originally a flat 100, which became weak at 250 maxHP.)
- **Super Potion** raises **max HP** in tiers: 100→150 (500 G), 150→200 (1000 G), 200→250 (2000 G).

### 6.4 Weapon ladder (rebalanced grind)

| Weapon          | Base dmg | Upgrade cost (gold / mats) |
|-----------------|----------|----------------------------|
| Rusty Sword     | 10       | starting weapon            |
| Awkward Cleaver | 15       | 100 / 40                   |
| Sharpened Iron  | 20       | 450 / 180                  |
| Great Warhammer | 25       | 1500 / 600                 |
| Excalibur       | 50       | 4000 / 1800                |

Material costs are trimmed from the original (was 50/250/1000/3000) to reduce the grind, since
gather + area multipliers now feed materials faster.

### 6.5 Accessories (new, optional gear slot)

One equippable accessory, bought with gold+mats, providing passive bonuses (e.g. **Whetstone**
+10% dmg, **Aegis Charm** −10% dmg taken, **Lucky Coin** +20% gold, **Focus Crystal** +1 start
Focus). Adds build variety without a second full ladder.

---

## 7. Events & Flavor

- **Tavern** (town): random advice/tip on visit — port all 5 original tips, add a few that
  hint at areas, skills, and the boss.
- **Road/area events** (new, ~20% chance when entering Hunt or Gather): small interactive
  vignettes — e.g. a wounded traveler (heal them for karma/gold later), a hidden cache (free
  mats), a trap (lose a little HP), a wandering merchant (one-off deal). Each is a tiny
  numbered choice. Data-driven in `events.js`.
- **Intro / boot text, win screen, death screen, boss dialogue** in `flavor.js`.

---

## 8. CRT Terminal UI/UX

### 8.1 Visual design
- **Phosphor palette:** text `#33ff66` on near-black `#0b1f0b`; dim variant for inactive text.
- **Effects (CSS):** horizontal **scanlines** overlay, subtle **flicker**, screen **vignette**,
  gentle **curvature** (CSS transform / SVG displacement), **bloom/glow** via `text-shadow`.
- **Bezel:** the screen is framed by a dark monitor bezel; the screen "mostly fills" the
  viewport with margin for the bezel. Responsive down to mobile.
- **Boot sequence:** a brief "POWER ON" animation (flicker, a few fake POST lines, title) on
  first load before the game starts. Skippable with any key.
- **Cursor:** blinking block cursor at the prompt.
- **Typewriter printing:** text prints character-by-character with an optional soft key-click
  beep; pressing a key fast-forwards the current print. Speed configurable.
- **Theme toggle (stretch):** amber phosphor alternative; `theme amber` / `theme green`.

### 8.2 Input model — Hybrid
- Every menu prints **numbered options**; the player may press the **number key**, **click**
  the option, **or type the command verb**.
- A persistent **prompt line** (`elaria>`) at the bottom always accepts typed commands.
- **Command history** via Up/Down arrows; **Tab completion** for verbs (stretch).
- Invalid input reprints the menu with a gentle "Please enter a valid option" (faithful to the
  original's validation behavior).

### 8.3 Command reference (initial)

| Context  | Commands                                                                 |
|----------|--------------------------------------------------------------------------|
| Global   | `help`, `stats`, `save`, `load`, `clear`, `theme <green\|amber>`          |
| Main Road| `town`, `gather`, `hunt`, `stats`, `save` (or `1`–`5`)                    |
| Town     | `shop`, `tavern`, `leave` (or `1`–`3`)                                    |
| Shop     | `buy potion <n>`, `buy super`, `upgrade`, `equip <item>`, `back`          |
| Hunt     | `go <area>` / area number, `back`                                        |
| Combat   | `stab`, `slash`, `power`, `heal`, `parry`, `bleed`, `rage`, `retreat` (or `1`–`n`) |

`help` lists context-appropriate commands. Numbers and verbs are interchangeable everywhere.

---

## 9. Repairs (bugs/exploits in the original to fix)

1. **Heal skipped the enemy turn** (`continue` in the fight loop) — free infinite healing.
   → Heal now consumes the turn; enemy attacks afterward.
2. **Difficulty never scaled** — enemies fixed at 50–99 HP / 15–24 dmg regardless of the
   player's power, so Excalibur trivialized everything and Rusty Sword early game was brutal.
   → Area tiers scale enemy stats to content the player has earned access to.
3. **No win condition** — the original loops forever. → Tiered path + final boss + win screen.
4. **Toothless death** — full heal + lose half gold, no loot stakes. → §5.5 stakes.
5. **RNG reseeded every call** (`srand(time(0))` inside `generateEnemy`, and `rand()` in
   `winGold`/`winMaterials`/`attack` without consistent seeding) — biased/repeatable rolls
   within the same second. → Single seedable PRNG (`rng.js`).
6. **Brutal material grind** for late upgrades (3000 mats for Excalibur). → Rebalanced costs +
   faster material income.
7. **Weapon detection by exact damage value** (`if (damage == 10)`) is fragile. → Weapons are
   IDs/indexes into the ladder data, not inferred from a damage number.
8. **Inheritance smell:** `enemy : public player` in C++ (enemy is not a player). → In JS,
   `enemy` and `player` are independent data shapes; no inheritance.
9. **Plaintext `text.txt` save** is environment-bound. → localStorage JSON + export/import
   string for portability (and a one-time importer for old `text.txt` values).

---

## 10. Save / Load

- **Storage:** `localStorage` key `elaria.save.v1`, value = JSON of `GameState`.
- **Autosave** on returning to town and on quitting combat; **manual save** via menu/`save`.
- **Export/Import:** `save export` prints a copyable encoded string; `save import <string>`
  restores it — preserves the original's "portable save" feel and enables backups.
- **Schema versioning:** `version` field in the save; `save.js` migrates older versions.
- **Migration from C++:** optional one-time prompt to paste the 7 `text.txt` values
  (name, hp, gold, dmg, potions, mats, maxHP) to import an old character.

### GameState shape (initial)
```js
{
  version: 1,
  player: {
    name, level, xp,
    hp, maxHp,
    gold, materials, potions,
    weaponId,            // index into weapons ladder
    accessoryId | null,
    perks: [perkId, ...],
    perkPoints,
  },
  progress: {
    unlockedAreas: [areaId, ...],
    bossDefeated: false,
    kills: { [enemyId]: count },
    deaths, turnsPlayed,
  },
  settings: { theme, textSpeed, sound },
  rngSeed,
}
```

---

## 11. Build Phases / Milestones

1. **M0 — Terminal shell.** CRT CSS, boot sequence, `terminal.js` print queue + input line,
   `parser.js` hybrid input. Echoes commands. (Visible, demoable.)
2. **M1 — Faithful port.** Main Road, Town/Shop/Tavern, Gather, single-area Hunt + combat
   (Stab/Slash/Power/Heal), weapon ladder, super potions, save/load. Feature-parity with C++.
3. **M2 — Repairs & balance.** Fix heal exploit, seeded RNG, death stakes; apply rebalanced
   costs and the §5 EV math; add unit tests for combat/economy.
4. **M3 — Tiered areas + win.** Areas 1–4 with gates and loot multipliers, area-scaled enemy
   pools, the Demon Lord boss fight, win/lose screens.
5. **M4 — Expansion.** Leveling/XP/perks, Focus + skills (Parry/Bleed/Rage), status effects,
   accessories, road events, expanded enemy roster (~20).
6. **M5 — Polish.** Theme toggle, sound, command history/tab-complete, mobile layout, README
   refresh + GitHub Pages deploy, New Game+.

---

### Resolved
- **Potion healing:** scales to `40% of maxHP` (decided). See §6.3.
- **New Game+:** stretch goal only, not in v1 scope (decided). See §4.2 / §11.

### Open
1. **Level cap & curve:** is cap 20 right, or do you want a longer/shorter ramp?
2. **Enemy roster size:** the table reserves ~5 foes per tier (~20 total) — want named
   mini-bosses per area too?
3. **Sound:** include the typewriter/beep SFX in v1 or defer to polish?

---

## 13. Acceptance Criteria (v1)

- Game loads as a static page (no server) and runs the full loop in-browser.
- A new player can: create a character, gather, hunt across all 4 areas, shop, upgrade to
  Excalibur, level up, use at least one skill, and defeat the Demon Lord to see a win screen.
- Heal no longer grants a free turn; enemies scale by area; death applies stated stakes.
- Save persists across reloads; export/import round-trips a character.
- Renders inside the CRT terminal with phosphor + scanlines on desktop and mobile.
- Core combat/economy/progression math covered by passing headless unit tests.
