# Elaria — Long-Term Roadmap

Forward-looking improvements beyond the v1 web port (see [requirements.md](requirements.md)
for v1, [TASKS.md](TASKS.md) for what shipped). This is a **menu of phased epics**, not a
commitment to build all of it — each epic is independently valuable and can be pulled forward.

## Guardrails (decided)
These constraints shape every item below:
- **100% static, forever.** No backend, no accounts, no server. Everything is client-side +
  localStorage. Anything "social" (leaderboards, challenges, sharing) is achieved with
  **seeds + shareable codes**, not a server.
- **Terminal identity, with ASCII art.** Visuals stay text: ASCII portraits, ASCII bars/meters,
  text animation, and CRT screen effects. **No raster sprites / no canvas layer.**
- **Logic stays DOM-free and unit-tested.** New systems follow the existing split: data in
  `src/content/`, pure logic in `src/*.js`, rendering only in `terminal.js`. Every system ships
  with headless tests + a balance-sim update.

## Themes chosen
Content & replayability · Combat depth · Polish & juice · Technical foundation. The phasing
below interleaves them so each release is playable and feels complete, rather than doing one
theme to exhaustion before the next.

---

## Phase 1 — Foundation Hardening (Technical)  ✅ DONE
*Enables everything after it; do this first so later content is type-safe and CI-guarded.*

### 1.1 Type safety — *static-friendly, no build step* ✅
- **Decision:** instead of converting to `.ts` + a bundler (which would add a build step to a
  project whose appeal is "just serve the files"), we type-check the plain `.js` via
  **`checkJs` + JSDoc** (`tsconfig.json`, `npm run typecheck`). Same type safety; files stay
  runnable as-is; **zero runtime deps; still deploys to GitHub Pages with no build.**
- Shared types live in [`src/types.js`](src/types.js) (`Area`, `Enemy`, `Weapon`, `Perk`,
  `GameState`, ...). `tsc --noEmit` is clean (0 errors).

### 1.2 CI + test discipline ✅
- GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs typecheck +
  `node --test` + smoke + balance sim on every push/PR.
- The balance sim now **exits non-zero** if any seed fails to beat the boss, so CI catches
  balance regressions automatically.
- (Coverage floor: deferred — not wired yet.)

### 1.3 Save-migration hardening ✅
- `save.js` now runs every load through a versioned **migration chain** (`MIGRATIONS`) then a
  **validate-and-repair** pass: partial / hand-edited / corrupt saves are healed against
  defaults and clamped to invariants (HP ≤ maxHP, real weaponId, Forest always unlocked, etc.)
  rather than crashing. Corrupt-beyond-repair → falls back to new game. Covered by 6 tests.

### 1.4 Data-driven modding seams ✅
- Documented the content contract in [`docs/CONTENT.md`](docs/CONTENT.md) and enforced it with
  `tests/content.test.js` (10 integrity tests: enemy pools map to real areas, areas escalate,
  weapon ladder well-formed, boss gate reachable, etc.). Adding content = adding a data entry.

**Outcome:** `npm run check` (typecheck + 38 tests + smoke + sim) is green; game still serves
as a static site with no runtime dependencies.

---

## Phase 2 — Combat Depth
*Make fights tactical and builds meaningful. Largely additive to `combat.js`.*

### 2.1 Elements & weaknesses
- Add an element tag to attacks/enemies (physical/fire/ice/holy/shadow). Damage modified by a
  small weakness matrix. Enemies telegraph resistances in their ASCII portrait/HUD.
- Keeps numbers legible: weakness = ×1.5, resist = ×0.5.

### 2.2 Skill tree + cooldowns
- Promote skills (`Parry/Bleed/Rage`) from a flat Focus list into a small **tree** with tiers,
  some on cooldown (turn-based) rather than Focus-cost, enabling more skills without inflation.
- New skills: Guard (reduce next hit), Execute (bonus vs low-HP foes), Disarm (lower enemy dmg),
  Cleave (hits over multiple turns), elemental strikes.

### 2.3 Build archetypes
- Perk tree reorganized into loose paths — **Berserker** (Bloodlust/Rage/crit), **Duelist**
  (parry/counter/accuracy), **Survivor** (Iron Skin/Second Wind/Battle Medic). Respec available
  in town for gold. Encourages distinct playthroughs.

### 2.4 Smarter enemy AI
- Per-enemy **behavior data**: aggressive, defensive (blocks more), caster (summons/DoT),
  coward (flees at low HP, can be chased for bonus loot), berserker (enrages low HP).
- Boss gets a scripted move pattern instead of pure RNG, so it's learnable.

### 2.5 Difficulty modes
- Story / Normal / Brutal selectable at new game: scales enemy HP/dmg + death penalty.
  Brutal enables permadeath-lite (lose the run, keep meta-unlocks). Stored per save.

**Tests:** weakness math, cooldown bookkeeping, AI decisions are pure functions → unit-tested;
balance sim re-tuned per difficulty.

---

## Phase 3 — Content & Replayability
*The biggest bucket. Gives reasons to keep playing and to come back.*

### 3.1 Crafting
- Spend materials (split into types: stone/lumber/ore/essence) at a **forge** to craft potions,
  accessories, and weapon mods, instead of pure gold sinks. Recipes are data.

### 3.2 Loot affixes / rare drops
- Weapons & accessories can roll **affixes** (+fire dmg, +crit, lifesteal, +gold). Rare drops
  from tougher areas/mini-bosses. A light loot-tier system (common→rare→legendary) by area.

### 3.3 Quests & NPCs
- Town NPCs offer **quests** ("slay 5 Frost Wyverns", "bring 200 ore") with gold/item rewards
  and short branching dialogue. A simple quest-log screen. All data-driven, all text.

### 3.4 Named mini-bosses per area
- Each region gets a unique named mini-boss (gated behind N kills there) with a signature
  mechanic and guaranteed rare drop — a mid-tier goal between areas and the final boss.

### 3.5 New biomes / area expansion
- Add regions beyond Frostpeak (e.g. **Ashen Wastes**, **Sunken Abyss**) with new enemy pools,
  hazards (environmental DoT, darkness), and gather types. Each extends the gear/level gates.

### 3.6 New Game+
- On victory, start over with gear/level carried (or meta-currency), enemies scaled up, plus a
  new top-tier area and a harder boss variant. The replay backbone.

### 3.7 Bestiary & achievements
- **Bestiary**: kills already tracked in `progress.kills` — surface a screen showing discovered
  foes, their lore, weaknesses learned. **Achievements**: milestone tracking (no-death boss
  kill, all foes slain, max level) stored locally.

---

## Phase 4 — Static "Social" via Seeds
*Replaces server features within the 100%-static guardrail.*

### 4.1 Seeded runs
- Expose the RNG seed. A **shared seed → identical world** (same enemy/loot rolls), so players
  can race the same run. Already have a seedable PRNG; just surface + lock it per run.

### 4.2 Daily Challenge (offline)
- Derive a deterministic daily seed from the date (computed client-side). Everyone playing
  "today" gets the same challenge run; **score is local**, shareable as a code.

### 4.3 Shareable run codes
- Encode a run result (seed, score, turns, build) into a copyable code (extend the existing
  base64 export). Players post codes; importing one lets you replay/verify it. Local
  "leaderboard" = a pasteable list of friends' codes, sorted client-side.

### 4.4 Score system
- A scoring formula (speed + gear efficiency + low deaths + difficulty) for endless/challenge
  framing, stored in localStorage with a personal-best table.

**Note:** no anti-cheat possible without a server — frame these as friendly/honor-system.

---

## Phase 5 — Polish & Juice (ongoing)
*Layered in continuously, not a single milestone.*

### 5.1 Sound (the deferred v1 item)
- WebAudio (no asset files needed): synthesized typewriter clicks, hit/heal/level/win beeps,
  low CRT hum. Master + SFX toggles in settings; off by default. Respect `prefers-reduced-motion`
  cousin: a "reduced sound" sensibility.

### 5.2 ASCII art layer
- Per-enemy and per-area **ASCII portraits** in `content/art.js`, shown in combat/area intros.
- **ASCII meters**: HP/Focus/XP as `[####----]` bars in the HUD instead of bare numbers.
- A small ASCII map of Elaria for the area-select screen.

### 5.3 Richer text & screen effects
- Damage **flash** (line color pulse), screen **shake** on big hits (CSS transform), CRT
  **warm-up** ramp on boot, channel-change static on screen transitions, "low HP" red vignette.
- Per-line typewriter speed variation for dramatic beats (boss dialogue slower).

### 5.4 Accessibility
- Screen-reader path: an `aria-live` log mirroring output; ensure typed input is fully operable.
- **Font scaling** + line-height control; **colorblind-safe** palettes alongside green/amber;
  toggle to disable scanlines/flicker (motion sensitivity).
- Full keyboard operability audit; visible focus states.

### 5.5 Real settings menu + mobile UX
- A proper `settings` screen (text speed, sound, theme, motion, font size, difficulty).
- Mobile: on-screen tappable number/command bar, larger touch targets, layout that survives the
  software keyboard.

### 5.6 PWA (offline install) — *static-compatible*
- Add a manifest + service worker so Elaria is **installable and fully offline**. No backend —
  this is pure client-side caching of the static assets. Great fit for the static guardrail.

---

## Suggested sequencing
A pragmatic order that keeps the game shippable at every step:

1. ~~**Phase 1** (foundation)~~ — ✅ **DONE** (type-checking, CI, save hardening, modding seams).
2. **Phase 5.1–5.2** (sound + ASCII art) — cheap, high-felt-quality, no logic risk. ← **next up**
3. **Phase 2** (combat depth) — elements + skill tree + difficulty modes.
4. **Phase 3** (content) — crafting, affixes, mini-bosses, then New Game+.
5. **Phase 4** (seeds/daily/scores) — leverages the now-rich systems.
6. **Phase 5.3–5.6** (juice, a11y, settings, PWA) — continuous polish + the install story.

## Cross-cutting acceptance bar
Every epic must: keep the build dependency-free & static-deployable; add headless tests for new
pure logic; update the balance sim so the game stays winnable across the seed set; preserve the
terminal/ASCII identity (no raster graphics); and avoid any network dependency.

## Open questions to resolve per-phase
- Material types: how many before crafting feels rich but not fiddly? (suggest 3–4)
- Difficulty modes: does Brutal permadeath keep meta-progress, or wipe everything?
- New Game+: carry gear, or convert to meta-currency for a fresh-but-faster climb?
- Daily challenge: endless-score framing, or fixed boss-rush?
- Affix budget: cap affixes per item to keep numbers legible on a text HUD.
