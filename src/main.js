// Game driver (spec §3, §8). Boots the terminal, runs the boot/POST animation, manages the
// menu/screen flow, and drives the main loop. This is the orchestration layer: it reads
// player input via the parser and calls the pure logic modules, narrating results to the
// terminal. The only stateful UI object besides Terminal is the in-progress Combat.

import { Terminal } from './terminal.js';
import { parse, matchOption } from './parser.js';
import { makeRng } from './rng.js';
import { newGameState, playerDamage } from './state.js';
import {
  hasSave, loadGame, saveGame, clearSave, exportString, importString, importLegacy,
} from './save.js';
import { AREAS, BOSS_AREA, areaById, isAreaUnlocked, gateText } from './content/areas.js';
import { WEAPONS, weaponById, nextWeapon } from './content/weapons.js';
import { POTION_BUNDLES, nextSuperPotion } from './content/items.js';
import { ACCESSORIES, accessoryById } from './content/items_accessories.js';
import { PERKS, perkById, hasPerk, perkRank } from './content/perks.js';
import { TAVERN_TIPS, INTRO, VICTORY, DEATH, BOSS_DIALOGUE } from './content/flavor.js';
import {
  buyPotions, buySuperPotion, upgradeWeapon, buyAccessory,
} from './economy.js';
import {
  xpToNext, xpForKill, grantXp, refreshUnlocks, recordKill, isWon, LEVEL_CAP,
} from './progression.js';
import { generateEnemy, generateBoss, rollLoot, rollGather } from './encounter.js';
import { Combat, SKILL_COST } from './combat.js';
import { maybeEvent } from './events.js';
import { sfx, setEnabled as setSoundEnabled, isEnabled as soundEnabled } from './audio.js';
import { enemyArt, areaArt, BOSS_ART } from './content/art.js';
import { bar, pips } from './ui.js';

/** @type {Terminal} */
let term;
/** @type {ReturnType<typeof makeRng>} */
let rng;
/** @type {import('./types.js').GameState} */
let state;

// Resolve the CRT mount element, failing fast if the page is malformed (the game cannot run
// without it). Centralizing this keeps the rest of the code free of null checks.
function crtEl() {
  const el = document.getElementById('crt');
  if (!el) throw new Error('CRT mount element #crt not found');
  return el;
}

// ---- boot ------------------------------------------------------------------

async function boot() {
  // Typewriter key-click is injected as a callback so terminal.js stays audio-agnostic.
  term = new Terminal(crtEl(), { speed: 'normal', onChar: () => sfx.key() });

  await powerOnSequence();

  // Title.
  term.printInstant(TITLE_ART, 'title');
  await term.print('');

  await startMenu();
}

const TITLE_ART = [
  '',
  '   ███████╗██╗      █████╗ ██████╗ ██╗ █████╗ ',
  '   ██╔════╝██║     ██╔══██╗██╔══██╗██║██╔══██╗',
  '   █████╗  ██║     ███████║██████╔╝██║███████║',
  '   ██╔══╝  ██║     ██╔══██║██╔══██╗██║██╔══██║',
  '   ███████╗███████╗██║  ██║██║  ██║██║██║  ██║',
  '   ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝',
  '        a fantasy fighting game',
  '',
];

async function powerOnSequence() {
  // Brief fake POST; skippable by the fast-forward mechanism.
  term.setSpeed('fast');
  await term.print([
    'ELARIA-OS v1.0  (c) Wayfarer Systems',
    'POWER ON ........................ OK',
    'PHOSPHOR TUBE ................... OK',
    'MEMORY CHECK .... 64K ........... OK',
    'LOADING WORLD: Elaria ........... OK',
    '',
  ], 'dim');
  term.setSpeed('normal');
}

// ---- start menu / character creation ---------------------------------------

async function startMenu() {
  if (hasSave()) {
    await term.print('A saved adventurer was found. Load them? (y/n)');
    const ans = parse(await term.input());
    if (ans.verb === 'yes' || ans.num === 1) {
      const loaded = loadGame();
      if (loaded) {
        state = loaded;
        rng = makeRng(state.rngSeed || 1);
        applySettings();
        await term.print(`Welcome back, ${state.player.name}.`);
        return mainLoop();
      }
      // Save existed but couldn't be parsed/repaired — start fresh rather than crash.
      await term.print('That save could not be read. Starting a new adventure.', 'info');
    }
  }
  await newCharacter();
  return mainLoop();
}

async function newCharacter() {
  await term.print('What is your name, adventurer?');
  let name = (await term.input('name>')).trim();
  if (!name) name = 'Adventurer';
  state = newGameState(name);
  rng = makeRng(state.rngSeed);
  term.clear();
  await term.print(INTRO);
  await term.print('');
}

// ---- helpers ---------------------------------------------------------------

function persistSeed() {
  state.rngSeed = rng.seed();
}

// Apply persisted settings (theme, text speed, sound) to the live UI.
function applySettings() {
  const s = state.settings || {};
  if (s.theme) crtEl().dataset.theme = s.theme;
  if (s.textSpeed) term.setSpeed(s.textSpeed);
  setSoundEnabled(!!s.sound);
}

/**
 * A selectable menu row. `verb` is the canonical action; any extra fields (bundleId, accId,
 * perkId, areaId, idx, ...) ride along and are read by the caller after selection.
 * @typedef {{ label: string, verb: string, disabled?: boolean, note?: string,
 *   [key: string]: any }} MenuOption
 */

/**
 * Print a context menu and read a choice. Returns the chosen option (by number, verb, or
 * alias), re-prompting on invalid input. `extraVerbs` are verbs accepted even though they
 * aren't numbered rows (e.g. combat skills); when typed, menu() returns a synthetic { verb }.
 * @param {string|null} title
 * @param {MenuOption[]} options
 * @param {{prompt?: string, extraVerbs?: string[]}} [opts]
 * @returns {Promise<MenuOption & {parsed?: any}>}
 */
async function menu(title, options, { prompt = 'elaria>', extraVerbs = [] } = {}) {
  if (title) term.printInstant(title, 'heading');
  options.forEach((o, i) => {
    const n = i + 1;
    const txt = o.disabled
      ? `  ${n}. ${o.label}  (${o.note || 'locked'})`
      : `  ${n}. ${o.label}`;
    term.printInstant(txt, o.disabled ? 'dim' : '');
  });
  term.printInstant('');

  while (true) {
    const p = parse(await term.input(prompt));
    if (p.verb === 'help') { await showHelp(options); continue; }
    if (p.verb === 'clear') { term.clear(); continue; }
    if (p.verb === 'theme') { await setTheme(p.args[0]); continue; }
    if (p.verb === 'sound') { await setSound(p.args[0]); continue; }
    if (p.verb === 'speed') { await setTextSpeed(p.args[0]); continue; }
    // by number
    if (p.num != null && p.num >= 1 && p.num <= options.length) {
      const opt = options[p.num - 1];
      if (opt.disabled) { await term.print(`That path is ${opt.note || 'locked'}.`); continue; }
      return opt;
    }
    // by verb
    if (p.verb) {
      const opt = options.find((o) => o.verb === p.verb);
      if (opt) {
        if (opt.disabled) { await term.print(`That path is ${opt.note || 'locked'}.`); continue; }
        return { ...opt, parsed: p };
      }
      // verbs not shown as numbered rows but still valid here (e.g. combat skills)
      if (extraVerbs.includes(p.verb)) return { label: p.verb, verb: p.verb, parsed: p };
    }
    await term.print('Please enter a valid option.');
  }
}

async function setTheme(name) {
  const theme = name === 'amber' ? 'amber' : name === 'green' ? 'green' : null;
  if (!theme) { await term.print('Usage: theme <green|amber>'); return; }
  crtEl().dataset.theme = theme;
  state.settings.theme = theme;
  autosave();
  await term.print(`Phosphor set to ${theme}.`, 'info');
}

async function setSound(arg) {
  // `sound` with no arg toggles; `sound on|off` sets explicitly.
  const on = arg === 'on' ? true : arg === 'off' ? false : !soundEnabled();
  setSoundEnabled(on);
  state.settings.sound = on;
  autosave();
  if (on) sfx.blip(); // immediate confirmation that audio is live
  await term.print(`Sound ${on ? 'on' : 'off'}.`, 'info');
}

async function setTextSpeed(arg) {
  const valid = ['slow', 'normal', 'fast', 'instant'];
  if (!valid.includes(arg)) { await term.print('Usage: speed <slow|normal|fast|instant>'); return; }
  term.setSpeed(arg);
  state.settings.textSpeed = arg;
  autosave();
  await term.print(`Text speed: ${arg}.`, 'info');
}

async function showHelp(options) {
  term.printInstant('Commands here:', 'dim');
  options.forEach((o, i) => {
    if (o.verb) term.printInstant(`  ${i + 1} / ${o.verb} — ${o.label}`, 'dim');
  });
  term.printInstant('  Global: help, clear, theme <green|amber>, sound <on|off>, speed <slow|normal|fast>', 'dim');
  term.printInstant('');
}

// ---- main loop -------------------------------------------------------------

async function mainLoop() {
  while (true) {
    if (isWon(state)) {
      await term.print('Elaria is at peace. (Type `stats` to admire your legend, or reload to play again.)');
      await term.input();
      continue;
    }
    term.printInstant('', '');
    const choice = await menu('On the Main Road\n----------------', [
      { label: 'Travel to town', verb: 'town' },
      { label: 'Gather Materials', verb: 'gather' },
      { label: 'Go on a Hunt', verb: 'hunt' },
      { label: 'Check Progress', verb: 'stats' },
      { label: 'Save Game', verb: 'save' },
    ]);

    switch (choice.verb) {
      case 'town': await town(); break;
      case 'gather': await gather(); break;
      case 'hunt': await hunt(); break;
      case 'stats': await showStats(); break;
      case 'save': await doSave(); break;
    }
    // QoL: auto-save after every Main Road action. Progress is never lost between actions,
    // so the explicit "Save Game" option is kept purely for the classic aesthetic.
    autosave();
  }
}

// ---- town / shop / tavern --------------------------------------------------

async function town() {
  while (true) {
    const choice = await menu('Wayfarer Village\n----------------', [
      { label: 'Go to the shop', verb: 'shop' },
      { label: 'Visit the tavern', verb: 'tavern' },
      { label: 'Leave town', verb: 'leave' },
    ]);
    if (choice.verb === 'leave') { autosave(); return; }
    if (choice.verb === 'tavern') { await tavern(); continue; }
    if (choice.verb === 'shop') { await shop(); continue; }
  }
}

async function tavern() {
  await term.print('You order an ale. The barkeep leans in and says...');
  await term.print(`"${rng.pick(TAVERN_TIPS)}"`, 'flavor');
  // Resting at the tavern fully restores HP — the loop's recovery beat between hunts.
  if (state.player.hp < state.player.maxHp) {
    await term.print('You could rent a room and rest off your wounds. Rest here? (y/n)');
    const ans = parse(await term.input());
    if (ans.verb === 'yes' || ans.num === 1) {
      state.player.hp = state.player.maxHp;
      await term.print(`You sleep soundly and wake at full strength — ${state.player.hp}/${state.player.maxHp} HP.`, 'info');
      autosave();
    }
  }
}

async function shop() {
  while (true) {
    const choice = await menu('The Shop\n--------', [
      { label: 'Buy health potions', verb: 'buy' },
      { label: 'Buy a super potion (raise max HP)', verb: 'super' },
      { label: `Upgrade weapon (you wield the ${weaponById(state.player.weaponId).name})`, verb: 'upgrade' },
      { label: 'Buy an accessory', verb: 'equip' },
      { label: 'Return to town', verb: 'back' },
    ]);
    if (choice.verb === 'back') return;
    if (choice.verb === 'buy') await buyPotionsFlow();
    if (choice.verb === 'super') await buySuperFlow();
    if (choice.verb === 'upgrade') await upgradeFlow();
    if (choice.verb === 'equip') await accessoryFlow();
  }
}

async function buyPotionsFlow() {
  /** @type {MenuOption[]} */
  const opts = POTION_BUNDLES.map((b) => ({ label: `${b.label} — ${b.cost}G`, verb: `b${b.id}`, bundleId: b.id }));
  opts.push({ label: 'Back', verb: 'back' });
  const choice = await menu(`Gold: ${state.player.gold}`, opts);
  if (choice.verb === 'back') return;
  const res = buyPotions(state.player, choice.bundleId);
  await term.print(res.message);
}

async function buySuperFlow() {
  const sp = nextSuperPotion(state.player.superTier || 0);
  if (!sp) { await term.print("The storekeeper shrugs: \"All out, kid.\""); return; }
  await term.print(`A super potion raises your max HP by +${sp.bonus} (to ${state.player.maxHp + sp.bonus}) for ${sp.cost}G. Buy it? (y/n)`);
  const ans = parse(await term.input());
  if (ans.verb === 'yes' || ans.num === 1) {
    const res = buySuperPotion(state.player);
    await term.print(res.message);
    if (res.ok) await afterPowerChange();
  }
}

async function upgradeFlow() {
  const next = nextWeapon(state.player.weaponId);
  if (!next || !next.upgradeCost) { await term.print('Your weapon is already fully upgraded!'); return; }
  await term.print(`Upgrade to ${next.name} (${next.damage} dmg) for ${next.upgradeCost.gold}G + ${next.upgradeCost.materials} mats? (y/n)`);
  const ans = parse(await term.input());
  if (ans.verb === 'yes' || ans.num === 1) {
    const res = upgradeWeapon(state.player);
    await term.print(res.message);
    if (res.ok) await afterPowerChange();
  }
}

async function accessoryFlow() {
  /** @type {MenuOption[]} */
  const opts = ACCESSORIES.map((a) => ({
    label: `${a.name} — ${a.desc} (${a.cost.gold}G + ${a.cost.materials} mats)${state.player.accessoryId === a.id ? ' [equipped]' : ''}`,
    verb: a.id, accId: a.id,
  }));
  opts.push({ label: 'Back', verb: 'back' });
  const choice = await menu('Accessories (one equipped at a time)', opts);
  if (choice.verb === 'back') return;
  const res = buyAccessory(state.player, choice.accId);
  await term.print(res.message);
}

// When weapon/maxHp changes, new areas may open.
async function afterPowerChange() {
  const newly = refreshUnlocks(state);
  for (const a of newly) {
    if (a.id === BOSS_AREA.id) {
      await term.print(`*** The way to the ${a.name} is now open. The final challenge awaits. ***`, 'boss');
    } else {
      await term.print(`New hunting ground unlocked: ${a.name}!`, 'info');
    }
  }
}

// ---- gather ----------------------------------------------------------------

async function gather() {
  // Gather from the highest unlocked non-boss area for better yields.
  const area = highestArea();
  if (await tryEvent()) { /* event already narrated */ }
  const g = rollGather(area, state.player, rng);
  state.player.materials += g.amount;
  await term.print(`In ${area.name} you find ${g.where}. You gather ${g.amount} ${g.kind}.`);
  persistSeed();
  autosave();
}

function highestArea() {
  const unlocked = AREAS.filter((a) => state.progress.unlockedAreas.includes(a.id));
  return unlocked[unlocked.length - 1] || AREAS[0];
}

// ---- hunt ------------------------------------------------------------------

async function hunt() {
  // Build the area-select menu; locked areas are shown greyed (spec §4.1).
  const player = { damage: playerDamage(state.player), maxHp: state.player.maxHp };
  /** @type {MenuOption[]} */
  const opts = [];
  for (const a of AREAS) {
    const unlocked = isAreaUnlocked(a, player);
    opts.push({
      label: `${a.name}  [HP ${a.hp?.[0]}-${a.hp?.[1]}, loot ×${a.goldMult}]`,
      verb: a.id, areaId: a.id, disabled: !unlocked, note: gateText(a),
    });
  }
  // Boss entry.
  const bossUnlocked = isAreaUnlocked(BOSS_AREA, player);
  opts.push({
    label: `⚔ ${BOSS_AREA.name} — FINAL BOSS`, verb: BOSS_AREA.id, areaId: BOSS_AREA.id,
    disabled: !bossUnlocked, note: gateText(BOSS_AREA),
  });
  opts.push({ label: 'Back to the road', verb: 'back' });

  const choice = await menu('Go on a Hunt — choose your ground:', opts);
  if (choice.verb === 'back') return;

  if (choice.areaId === BOSS_AREA.id) return bossFight();

  const area = areaById(choice.areaId);
  if (!area) return; // unreachable: choice.areaId always maps to a real area
  const banner = areaArt(area.id);
  if (banner) term.printInstant(banner, 'dim');
  await term.print(area.flavor, 'flavor');
  if (await tryEvent()) { /* narrated */ }

  const enemy = generateEnemy(area, rng);
  term.printInstant(enemyArt(enemy.name), 'enemy');
  await term.print(`A ${enemy.name} approaches, wielding a ${enemy.weapon}! (${enemy.hp} HP)`);
  await runCombat(area, enemy);
}

async function bossFight() {
  term.clear();
  term.printInstant(BOSS_ART, 'boss');
  await term.print(BOSS_AREA.flavor, 'boss');
  sfx.boss();
  await term.print(BOSS_DIALOGUE.intro, 'boss');
  const boss = generateBoss();
  await runCombat(BOSS_AREA, boss, { isBoss: true });
}

// ---- combat loop -----------------------------------------------------------

async function runCombat(area, enemy, { isBoss = false } = {}) {
  const fight = new Combat(state, area, enemy, rng);

  while (!fight.over) {
    printHud(fight);
    const skillsLine = `Focus ${fight.focus}: [parry ${SKILL_COST.parry}] [bleed ${SKILL_COST.bleed}] [rage ${SKILL_COST.rage}]`;
    const choice = await menu(null, [
      { label: 'Stab  (100% / 1× dmg)', verb: 'stab' },
      { label: 'Slash (60% / 2× dmg)', verb: 'slash' },
      { label: 'Power (40% / 4× dmg)', verb: 'power' },
      { label: `Heal  (${state.player.potions} potions left)`, verb: 'heal' },
      { label: skillsLine + '  — type the skill name', verb: '__skills', disabled: true, note: 'type: parry/bleed/rage' },
      { label: 'Retreat', verb: 'retreat' },
    ], { prompt: 'fight>', extraVerbs: ['parry', 'bleed', 'rage'] });

    const action = choice.verb;
    const res = fight.playerTurn(action);
    for (const ev of res.events) {
      playEventSfx(ev.t);
      await term.print(ev.text, ev.t);
    }
  }

  persistSeed();
  await resolveCombat(fight, area, enemy, isBoss);
}

// Map a combat event type to a sound. No-op when sound is disabled.
function playEventSfx(type) {
  switch (type) {
    case 'hit': case 'dot': sfx.hit(); break;
    case 'miss': sfx.miss(); break;
    case 'enemy': sfx.hurt(); break;
    case 'boss': sfx.boss(); break;
    case 'heal': sfx.heal(); break;
    case 'skill': sfx.skill(); break;
  }
}

function printHud(fight) {
  const h = fight.hud();
  const tags = [];
  if (h.status.bleed) tags.push(`bleed:${h.status.bleed}`);
  if (h.status.burn) tags.push(`burn:${h.status.burn}`);
  const tagStr = tags.length ? `  {${tags.join(' ')}}` : '';
  term.printInstant('', '');
  term.printInstant(`  ${h.enemy.name.padEnd(18)} ${bar(h.enemy.hp, h.enemy.maxHp, 12)}${tagStr}`, 'enemy-hud');
  term.printInstant(`  ${state.player.name.padEnd(18)} ${bar(h.player.hp, h.player.maxHp, 12)}`, 'player-hud');
  term.printInstant(`  Focus ${pips(h.focus)}   Potions ${h.player.potions}`, 'dim');
}

async function resolveCombat(fight, area, enemy, isBoss) {
  if (fight.result === 'flee') return;

  if (fight.result === 'win') {
    if (isBoss) return victory();
    recordKill(state, enemy.name);
    const loot = rollLoot(enemy, area, state.player, rng);
    state.player.gold += loot.gold;
    state.player.materials += loot.materials;
    const xp = xpForKill(enemy.maxHp, area.xpMult);
    const levelUps = grantXp(state.player, xp);
    sfx.win();
    await term.print(`Victory! ${enemy.name} is defeated.`, 'info');
    await term.print(`Loot: ${loot.gold} gold, ${loot.materials} materials, ${xp} XP.`);
    for (const lu of levelUps) {
      sfx.level();
      await term.print(`*** LEVEL UP! You are now level ${lu.level}. Max HP ${lu.maxHp}. +1 perk point. ***`, 'info');
    }
    await afterPowerChange();
    autosave();
    return;
  }

  if (fight.result === 'lose') {
    // Death stakes (spec §5.5): lose half gold, forfeit this hunt's loot, respawn full HP.
    state.progress.deaths += 1;
    const lost = Math.floor(state.player.gold / 2);
    state.player.gold -= lost;
    state.player.hp = state.player.maxHp;
    sfx.death();
    await term.print(DEATH, 'info');
    await term.print(`(You lost ${lost} gold.)`, 'dim');
    autosave();
  }
}

async function victory() {
  state.progress.bossDefeated = true;
  state.player.hp = state.player.maxHp;
  term.clear();
  sfx.level();
  await term.print(VICTORY, 'boss');
  await term.print('');
  await term.print('— RUN SUMMARY —', 'heading');
  await term.print(`  Adventurer: ${state.player.name}  (Level ${state.player.level})`);
  await term.print(`  Turns played: ${state.progress.turnsPlayed}`);
  await term.print(`  Gold: ${state.player.gold}    Deaths: ${state.progress.deaths}`);
  autosave();
}

// ---- events ----------------------------------------------------------------

async function tryEvent() {
  const ev = maybeEvent(rng);
  if (!ev) return false;
  const opts = ev.choices.map((c, i) => ({ label: c.label, verb: `c${i}`, idx: i }));
  await term.print(ev.text, 'flavor');
  const choice = await menu(null, opts);
  const out = ev.choices[choice.idx].resolve(state.player, rng);
  await term.print(out);
  return true;
}

// ---- stats / save ----------------------------------------------------------

async function showStats() {
  const p = state.player;
  const w = weaponById(p.weaponId);
  const acc = accessoryById(p.accessoryId);
  term.printInstant('Your Adventurer\n---------------', 'heading');
  await term.print([
    `  ${p.name} — Level ${p.level}` + (p.level < LEVEL_CAP ? `  (XP ${p.xp}/${xpToNext(p.level)})` : '  (MAX)'),
    `  HP: ${p.hp}/${p.maxHp}    Gold: ${p.gold}    Materials: ${p.materials}    Potions: ${p.potions}`,
    `  Weapon: ${w.name} (${w.damage} dmg)    Accessory: ${acc ? acc.name : 'none'}`,
    `  Perk points: ${p.perkPoints}    Perks: ${p.perks.length ? p.perks.map((id) => perkById(id)?.name).join(', ') : 'none'}`,
    `  Areas unlocked: ${state.progress.unlockedAreas.length}    Deaths: ${state.progress.deaths}`,
  ]);
  if (p.perkPoints > 0) {
    await term.print(`You have ${p.perkPoints} perk point(s)! Type \`perk\` to spend them.`, 'info');
  }
  // Let the player spend perks straight from the stats screen.
  await term.print('(type `perk` to choose perks, or press ENTER to continue)');
  const p2 = parse(await term.input());
  if (p2.verb === 'perk') await perkFlow();
}

async function perkFlow() {
  while (state.player.perkPoints > 0) {
    const avail = PERKS.filter((perk) => {
      if (perk.maxRank) return perkRank(state.player, perk.id) < perk.maxRank;
      return !hasPerk(state.player, perk.id);
    });
    if (!avail.length) { await term.print('No more perks to learn.'); return; }
    /** @type {MenuOption[]} */
    const opts = avail.map((perk) => ({ label: `${perk.name} — ${perk.desc}`, verb: perk.id, perkId: perk.id }));
    opts.push({ label: 'Done', verb: 'back' });
    const choice = await menu(`Perk points: ${state.player.perkPoints}`, opts);
    if (choice.verb === 'back') return;
    state.player.perks.push(choice.perkId);
    state.player.perkPoints -= 1;
    await term.print(`Learned ${perkById(choice.perkId)?.name}!`, 'info');
    autosave();
  }
  await term.print('No perk points left.');
}

// Manual save — kept for the classic aesthetic. Progress already auto-saves continuously,
// so this is really just a satisfying "it is written" confirmation.
async function doSave() {
  autosave();
  await term.print('Game saved. (Your progress also auto-saves as you play.)', 'info');
}

// The single source of truth for persistence: snapshot the RNG seed and write the state.
// Called after every meaningful change and on tab close, so a session is never lost.
function autosave() {
  if (!state) return;
  persistSeed();
  saveGame(state);
}

// ---- go --------------------------------------------------------------------

window.addEventListener('DOMContentLoaded', boot);

// Flush a save when the tab closes/reloads, so even an interrupted fight is preserved.
window.addEventListener('beforeunload', autosave);

// Expose a tiny debug hook for manual testing in the console.
/** @type {any} */ (window).__elaria = () => ({ state, rng });
