# Elaria — Implementation Tasks (Living Doc)

Derived from [requirements.md](requirements.md). This is the working checklist + notebook for
the web port. Check items off as they land; jot notes/decisions under each milestone.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked/needs decision

**Status:** v1 implemented + **post-v1 Phase 1 (Foundation Hardening) complete**. 38 unit tests
+ smoke + balance sim + typecheck all green via `npm run check`. Game winnable across seeds.
See "Verification" and "Post-v1 log" at the bottom. Roadmap lives in [ROADMAP.md](ROADMAP.md).

---

## Post-v1 Log (newest first)

### Project housekeeping + QoL
- **Archived the original C++ game** to [archive/](archive/) via `git mv` (history preserved),
  with its original README restored alongside. Root README + build paths updated.
- **Auto-save QoL:** progress now auto-saves after every Main Road action and on tab close
  (`beforeunload`). Manual "Save Game" retained purely for the classic aesthetic (it just
  confirms what already happened). Centralized through one `autosave()` so no path is missed.

### Roadmap Phase 1 — Foundation Hardening ✅
- **1.1 Type safety (static-friendly):** `tsconfig.json` with `checkJs`+`strict`, JSDoc types
  in `src/types.js`. **No build step / no runtime deps** — chosen over a .ts+bundler migration
  to preserve the "just serve it" static deploy. `npm run typecheck` → 0 errors. Fixed ~35 real
  null-safety / type issues across `main.js`, `economy.js`, `save.js`, `tools/serve.mjs`.
- **1.2 CI + tooling:** `package.json` scripts (`test`/`sim`/`smoke`/`typecheck`/`check`/`serve`),
  GitHub Actions `ci.yml`, a zero-dep static server `tools/serve.mjs`, `.gitignore`. Balance sim
  rewritten to assert winnability across a seed set and **exit non-zero on regression**.
- **1.3 Save hardening:** versioned migration chain + validate-and-repair in `save.js`; corrupt/
  partial/hand-edited saves are healed, not crashed. +6 tests.
- **1.4 Modding seams:** `docs/CONTENT.md` documents the data contract; `tests/content.test.js`
  enforces it (+10 tests). Adding content = adding a data entry.

---

## M0 — CRT Terminal Shell  ✅
*Goal: a glowing terminal that boots, prints, and accepts hybrid input. Demoable.*

- [x] `index.html` — CRT bezel + screen + terminal mount + module bootstrap
- [x] `styles/crt.css` — phosphor palette, scanlines, flicker, vignette, curvature, glow, bezel
- [x] `styles/terminal.css` — text layout, prompt line, blinking cursor, scrollback
- [x] `src/rng.js` — seedable PRNG (mulberry32) + helpers (`int`, `range`, `pick`, `chance`)
- [x] `src/terminal.js` — print queue, typewriter printing, fast-forward, input capture, history
- [x] `src/parser.js` — hybrid input: number keys + typed verbs → normalized intent
- [x] `src/main.js` — boot/POST animation, wires terminal+parser, game loop driver
- [x] Boot sequence: POWER ON flicker → fake POST lines → ELARIA title (fast-forwardable)

**Notes:**
- Block cursor drawn via `.prompt-line::after` (CSS), caret hidden on the input.
- `prefers-reduced-motion` disables flicker/scan/blink.

---

## M1 — Faithful Port (feature parity with C++)  ✅

- [x] `src/state.js` — GameState model, defaults (100hp/100g/10dmg/8pot/1mat/100max), new char
- [x] `src/save.js` — localStorage save/load, base64 export/import string, version, C++ import
- [x] `src/content/weapons.js` — weapon ladder (Rusty Sword → Excalibur) as data
- [x] `src/content/items.js` — potion bundles, super potions, heal formula
- [x] `src/content/enemies.js` — original 10 + expanded to 20, pooled by area
- [x] `src/content/flavor.js` — intro, 5 original tavern tips + new ones, screens, boss lines
- [x] `src/economy.js` — gold/materials, potions, weapon upgrade, super potion, accessories
- [x] Main Road hub menu (Town / Gather / Hunt / Stats / Save)
- [x] Town: Shop (potions, super, upgrade, accessory) + Tavern (tip + rest) + Leave
- [x] Gather materials (area-flavored stone/lumber)
- [x] `src/combat.js` — turn engine: Stab/Slash/Power/Heal, enemy attacks, win/lose
- [x] Check Progress (stats screen, with perk spending)
- [x] Save/Load wired to menu + autosave

**Notes:**
- Original `enemy : public player` inheritance dropped — enemies are plain data shapes now.

---

## M2 — Repairs & Balance  ✅
*See spec §9.*

- [x] Heal consumes the turn (enemy attacks after) — fixes free-heal exploit. **Unit-tested.**
- [x] Single seeded RNG everywhere (no reseed-per-call). **Unit-tested (determinism).**
- [x] Death stakes: lose half gold + forfeit unbanked hunt loot, respawn town full HP
- [x] Rebalanced upgrade costs (weapons table §6.4; mats trimmed from original)
- [x] Potion heals 40% of maxHP (not flat 100). **Unit-tested.**
- [x] Combat EV math per §5.1 (accuracy/damage multipliers)
- [x] Weapons referenced by ID/index, not inferred from damage value
- [x] `tests/logic.test.js` — 22 headless unit tests (combat / economy / progression / save)

**Notes / bugs found while building:**
- 🐛 **Super potion exact-match bug:** original design matched `maxHp === 100/150/200`, but
  level-ups bump maxHp by +15, so supers became unbuyable after any level-up. **Fixed:** supers
  are now ADDITIVE (`player.superTier`, +50 each), stacking cleanly with level-up HP. Regression
  test added.
- 🐛 **No out-of-combat HP recovery** made the loop unwinnable (HP only refilled on level-up/
  death). **Fixed:** added **Rest at the tavern** (full heal). Surfaced by the balance sim.

---

## M3 — Tiered Areas + Win Condition  ✅
*See spec §4.*

- [x] `src/content/areas.js` — 4 areas + boss, unlock gates, loot/HP/dmg/XP multipliers
- [x] Hunt area-select menu (locked areas shown greyed with unlock requirement)
- [x] `src/encounter.js` — area-scaled enemy generation (HP/dmg ranges per tier)
- [x] Area-specific enemy pools + flavor + gather sub-locations
- [x] `src/progression.js` — area unlock checks (`refreshUnlocks`), win check. **Unit-tested.**
- [x] Demon Lord Malakar — 3-phase boss (charge/parry, burn, enrage) in combat.js
- [x] Victory screen + run summary (turns, gold, level, deaths)
- [x] Loss-to-boss handling (death penalty, boss resets each attempt)

**Notes:**
- Boss gate (Excalibur + maxHP ≥ 200) unit-tested.

---

## M4 — Expansion  ✅
*See spec §4.3–4.4, §5.3–5.5, §6.5, §7.*

- [x] XP awards on kill + level curve (`100 × level^1.5`, cap 20). **Unit-tested.**
- [x] Level-up: +15 maxHP, full heal, +1 perk point. **Unit-tested.**
- [x] `src/content/perks.js` — 9-perk tree + spend/apply (Focused stacks ×3)
- [x] Focus meter (+1/turn, +1 on hit, perk/accessory start bonus)
- [x] Active skills: Parry / Bleed / Rage (Focus costs) — wired to combat menu via extraVerbs
- [x] Status effects: Bleed, Burn (DoT ticks + HUD tags); boss telegraphs
- [x] Accessories — `items_accessories.js` + equip slot (Whetstone, Aegis, Lucky Coin, Focus Crystal)
- [x] `src/events.js` + 4 road/area events (~20% chance, numbered vignettes)
- [x] Expand enemy roster to ~20 across tiers

**Notes:**
- 🐛 **Combat skills were unreachable** (the skills row was an info line; typed `parry`/`bleed`/
  `rage` failed menu validation). **Fixed:** `menu()` gained an `extraVerbs` passthrough.

---

## M5 — Polish  ✅ (sound deferred)
*Goal: feel + ship.*

- [x] Theme toggle (green/amber) via `theme` command; persists in save settings
- [ ] Sound: typewriter beep + level-up/win SFX  — **deferred (open question §12.3)**
- [x] Command history (Up/Down). Tab completion: deferred (stretch).
- [x] Mobile layout pass (responsive bezel; click focuses input; tap-to-pick via numbers)
- [x] README refresh + GitHub Pages notes (dead repl.it link retired)
- [ ] New Game+ — **stretch only, not v1 (decided)**

**Notes:**
- Sound left off by default (`settings.sound = false`); hook point exists for a later pass.

---

## Acceptance Criteria (v1) — final gate  ✅
- [x] Loads as a static page (no server beyond file delivery); full loop runs in-browser
- [x] New player can: create char → gather → hunt all 4 areas → shop → reach Excalibur →
      level up → use a skill → beat the Demon Lord → see win screen  *(verified via balance sim)*
- [x] Heal costs a turn; enemies scale by area; death applies stated stakes  *(unit-tested)*
- [x] Save persists across reloads; export/import round-trips a character  *(unit-tested)*
- [x] Renders in CRT terminal (phosphor + scanlines); responsive bezel
- [x] Core combat/economy/progression covered by passing headless unit tests  *(22 pass)*

---

## Verification (how this was checked)
- `node --test` → **22/22 unit tests pass** (rng, economy, progression, loot, combat repairs, save).
- `node tests/sim.mjs` → headless full run **beats the boss**; ~119 fights, ~27 deaths at the
  test seed. Winnable across seeds {1, 7, 99, 2024, 55555} with deaths ranging 1–27 (healthy
  difficulty spread).
- `node tests/smoke.mjs` → real `main.js` game loop boots + runs char creation, main loop,
  hunt, and combat with a mocked DOM without throwing.
- `node --check` on all 18 modules + an import-graph check (57 imported symbols all resolve).
- Static server check: `index.html`, modules (`text/javascript`), and CSS all serve 200 with
  correct MIME types (ES modules require proper Content-Type).

## Decision Log
- Win condition: **tiered-path final boss** (Demon Lord Malakar).
- Difficulty: **player-chosen risk tiers** (gear-gated areas).
- Input: **hybrid** (numbered menus + typed verbs).
- Scope: **bigger expansion** (repairs + leveling + new content).
- Potion healing: **40% of maxHP**.
- Super potions: **additive +50 each** (changed from absolute-set during balance pass).
- New Game+: **stretch only**, not v1.

## Open Questions (non-blocking, carried forward)
- Level cap/curve: cap 20 OK? (currently shipped)
- Per-area named mini-bosses? (not added; roster is generic per tier)
- SFX in v1 or defer to polish? (deferred; hook exists)
- Tab completion for verbs (stretch, not done)
