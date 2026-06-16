# Elaria — A Fantasy Fighting Game

A turn-based RPG set in the land of **Elaria**, played entirely on a retro green-phosphor CRT
terminal in your browser. Hunt monsters across ever more dangerous regions, gather materials,
upgrade your gear, level up, and grow strong enough to storm the **Demon Lord's Throne**.

Originally a C++ console game (2020); now a **static, browser-playable JavaScript web app**
with repaired mechanics, balanced difficulty, a real win condition, and new systems
(areas, leveling, perks, combat skills, accessories, and road events).

![image](https://github.com/asherShores5/FantasyFightingGame-in-CPP/assets/71547146/693e8b92-f5c6-4e2d-9cac-04efd7defb3e)

## Play (Web)

No install, no compile — it's a static site. (Node is used only for the test suite and the
optional deploy-bundle step; the game itself ships as plain ES modules.)

**Locally:** serve the folder over HTTP (ES modules don't load from `file://`):

```sh
npm run serve          # zero-dep static server on http://localhost:8000
# or any static server, e.g.:  python -m http.server 8000
```

### Deploy — AWS Amplify Hosting
This repo is Amplify-ready via [amplify.yml](amplify.yml):

1. In the AWS Amplify console, **New app → Host web app**, and connect this Git repository.
2. Amplify auto-detects `amplify.yml`. On each push it runs `npm ci`, then `npm run check`
   (type-check + tests + smoke + balance sim), then `npm run build`, and publishes the
   generated **`dist/`** bundle. A failing check **aborts the deploy**, so a broken commit
   never goes live.
3. That's it — no environment variables or backend required.

To preview the exact deploy bundle locally:

```sh
npm run build          # copies index.html + src/ + styles/ into dist/
npm run serve -- 8000 dist
```

**Other static hosts:** the same `dist/` works on GitHub Pages, Netlify, Cloudflare Pages,
S3+CloudFront, etc. (Or serve the repo root directly — `dist/` just trims tests/docs/tooling.)

### How to play
- The game runs in the CRT terminal. **Menus are numbered** — press `1`–`9`...
- ...**or type commands**: `hunt`, `town`, `shop`, `gather`, `stats`, `save`, and in combat
  `stab` / `slash` / `power` / `heal` / `parry` / `bleed` / `rage` / `retreat`.
- Type `help` anywhere to see the commands available in your current screen.
- `theme green` / `theme amber` switches the phosphor color. Up/Down arrows recall history.
- `sound on` / `sound off` toggles synthesized SFX (off by default).
  `speed slow|normal|fast|instant` sets the typewriter speed. Both persist in your save.
- Combat shows ASCII enemy portraits and `[####----]` HP/Focus meters.
- Progress saves to your browser (localStorage). `save export` / `save import <code>` moves a
  character between devices.

### The goal
Climb the four regions — **Whispering Forest → Damp Caves → Sunken Ruins → Frostpeak Ascent** —
each gated behind better gear. Forge **Excalibur** and raise your max HP, then defeat the
three-phase final boss, **Demon Lord Malakar**, to win.

## Game Features
- **CRT terminal UI** — green/amber phosphor, scanlines, curvature, glow, boot-up sequence.
- **Hybrid input** — numbered menus *and* typed commands, with history.
- **Player-chosen risk tiers** — opt into harder areas for richer loot; gear gates the danger.
- **Turn-based combat** — Stab/Slash/Power/Heal plus a Focus meter and active skills
  (Parry, Bleed, Rage) and status effects.
- **Progression** — XP/levels (cap 20), a perk tree, a weapon ladder, super potions, and
  equippable accessories.
- **Road events** — random vignettes while hunting or gathering.
- **Final boss + win screen**, plus death stakes that make pushing too far a real gamble.
- **Save/load** — localStorage autosave + portable export/import string.

## Architecture

Vanilla JavaScript ES modules. **No framework, no bundler, zero runtime dependencies.** Game
logic is separated from rendering so it can be unit-tested headlessly.

```
index.html            CRT shell + terminal mount
styles/               crt.css (phosphor/scanlines/bezel) + terminal.css (text/prompt)
src/
  main.js             boot + menus + game loop driver (only orchestration)
  terminal.js         the only DOM-touching module (print queue, input, history)
  parser.js           hybrid input → intents
  rng.js              seedable PRNG
  state.js, save.js   game state model + localStorage/save-string
  combat.js           turn engine, skills, status effects, boss phases
  economy.js, progression.js, encounter.js, events.js
  content/            data-driven: areas, enemies, weapons, items, perks, flavor
tests/                headless unit tests + balance sim + smoke test
```

See [requirements.md](requirements.md) for the full design spec and [TASKS.md](TASKS.md) for
the implementation checklist.

## Development & Tests

Requires Node.js (for tests/tooling only; the game itself needs no Node). Install dev deps
once with `npm install`, then:

```sh
npm test             # unit + content-integrity tests (node --test)
npm run sim          # headless balance sim — asserts the game is winnable across seeds
npm run smoke        # boots the real game loop headlessly without a browser
npm run typecheck    # type-check the JS via JSDoc + checkJs (tsc --noEmit, no build output)
npm run check        # all of the above — what CI and Amplify run before deploying
```

CI runs `npm run check` on every push/PR (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).
Adding content? See [docs/CONTENT.md](docs/CONTENT.md) for the data contract.

## Legacy: the original C++ version

The original 2020 C++ console game this web app was ported from lives in [archive/](archive/)
(`main.cpp`, `player.h`, `enemy.h`, `menu_options.h`, plus its original README). To build it:

```sh
cd archive
g++ -o FantasyFightingGame main.cpp
./FantasyFightingGame
```

## Built With
- JavaScript (ES modules), HTML, CSS — the web app.
- C++ — the original console game.

## Author
- Asher Shores, 2020 (original C++); web port 2026.

## License
MIT — see [license](license).
