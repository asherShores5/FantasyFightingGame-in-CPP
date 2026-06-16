// Turn-based combat engine (spec §5). Stateful: the UI calls playerTurn(action) once per
// round; the engine resolves the player's action, then the enemy's, and returns a list of
// narration events plus the round outcome. Pure of the DOM and seeded via rng.js.
//
// Repairs baked in (spec §9): Heal consumes the turn (no free-heal exploit), one seeded RNG,
// EV math from §5.1, weapons by id. Adds Focus, skills (Parry/Bleed/Rage), status effects.

import { playerDamage } from './state.js';
import { hasPerk, perkRank } from './content/perks.js';
import { accessoryEffect } from './economy.js';
import { potionHealAmount } from './content/items.js';

// Accuracy/damage table (spec §5.1). Accuracy can be bumped by perks.
function moveTable(player) {
  return {
    stab: { acc: 1.0, mult: 1, label: 'Stab' },
    slash: { acc: hasPerk(player, 'crit_slash') ? 0.75 : 0.6, mult: 2, label: 'Slash' },
    power: { acc: hasPerk(player, 'deadeye') ? 0.55 : 0.4, mult: 4, label: 'Power' },
  };
}

export const SKILL_COST = { parry: 1, bleed: 2, rage: 3 };

export class Combat {
  // enemy: { name, weapon, maxHp, hp, dmg, isBoss?, phase? }
  constructor(state, area, enemy, rng) {
    this.state = state;
    this.area = area;
    this.rng = rng;
    this.enemy = enemy;
    this.player = state.player;

    // Per-fight transient state.
    this.focus = (accessoryEffect(this.player).startFocus || 0) + perkRank(this.player, 'focused');
    this.enemyStatus = { bleed: 0, burn: 0 }; // turns remaining
    this.parryArmed = false; // negates enemy's next attack
    this.rageArmed = false; // next attack is a guaranteed crit
    this.secondWindUsed = false;
    this.over = false;
    this.result = null; // 'win' | 'lose' | 'flee'
    this.bankedLoot = null;
  }

  // ---- helpers ---------------------------------------------------------------

  _playerDamageDealt(base) {
    let dmg = base;
    const eff = accessoryEffect(this.player);
    if (eff.damageMult) dmg *= eff.damageMult;
    // Bloodlust: +20% while below 30% HP.
    if (hasPerk(this.player, 'bloodlust') && this.player.hp < this.player.maxHp * 0.3) {
      dmg *= 1.2;
    }
    return Math.round(dmg);
  }

  _damageEnemy(amount, events, label) {
    this.enemy.hp = Math.max(0, this.enemy.hp - amount);
    if (amount > 0) {
      events.push({ t: 'hit', text: `${label}! ${this.enemy.name} takes ${amount} damage — ${this.enemy.hp} HP left.` });
      this.focus = Math.min(9, this.focus + 1); // +1 Focus on landing a hit
    } else {
      events.push({ t: 'miss', text: `Miss! ${this.enemy.name} takes no damage — ${this.enemy.hp} HP.` });
    }
  }

  _damagePlayer(amount, events) {
    const eff = accessoryEffect(this.player);
    let dmg = amount;
    if (eff.damageTakenMult) dmg *= eff.damageTakenMult;
    if (hasPerk(this.player, 'iron_skin')) dmg *= 0.85;
    dmg = Math.round(dmg);
    this.player.hp -= dmg;

    // Second Wind: survive one lethal hit at 1 HP.
    if (this.player.hp <= 0 && hasPerk(this.player, 'second_wind') && !this.secondWindUsed) {
      this.player.hp = 1;
      this.secondWindUsed = true;
      events.push({ t: 'info', text: 'Second Wind! You cling to life at 1 HP.' });
    }
    if (this.player.hp < 0) this.player.hp = 0;
    return dmg;
  }

  _tickStatus(events) {
    if (this.enemyStatus.bleed > 0) {
      const dot = Math.round(this.enemy.maxHp * 0.1);
      this.enemy.hp = Math.max(0, this.enemy.hp - dot);
      this.enemyStatus.bleed -= 1;
      events.push({ t: 'dot', text: `${this.enemy.name} bleeds for ${dot} — ${this.enemy.hp} HP.` });
    }
    if (this.enemyStatus.burn > 0) {
      const dot = Math.round(this.enemy.maxHp * 0.05);
      this.enemy.hp = Math.max(0, this.enemy.hp - dot);
      this.enemyStatus.burn -= 1;
      events.push({ t: 'dot', text: `${this.enemy.name} burns for ${dot} — ${this.enemy.hp} HP.` });
    }
  }

  // ---- player actions --------------------------------------------------------

  // Returns { events, over, result }. action ∈ stab|slash|power|heal|parry|bleed|rage|retreat
  playerTurn(action) {
    if (this.over) return { events: [], over: true, result: this.result };
    const events = [];
    this.state.progress.turnsPlayed += 1;
    this.focus = Math.min(9, this.focus + 1); // +1 Focus per turn

    let skipEnemy = false;

    switch (action) {
      case 'stab':
      case 'slash':
      case 'power': {
        const mv = moveTable(this.player)[action];
        const base = playerDamage(this.player) * mv.mult;
        const hit = this.rageArmed || this.rng.chance(mv.acc);
        if (this.rageArmed) this.rageArmed = false;
        this._damageEnemy(hit ? this._playerDamageDealt(base) : 0, events, mv.label);
        break;
      }
      case 'heal': {
        if (this.player.potions <= 0) {
          events.push({ t: 'info', text: "You don't have any potions." });
          // No turn consumed if you can't heal — re-prompt.
          return { events, over: false, result: null, retry: true };
        }
        this.player.potions -= 1;
        const heal = potionHealAmount(this.player.maxHp, hasPerk(this.player, 'battle_medic'));
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + heal);
        if (hasPerk(this.player, 'battle_medic')) this.focus = Math.min(9, this.focus + 1);
        events.push({ t: 'heal', text: `You drink a potion and recover ${heal} HP — now ${this.player.hp}/${this.player.maxHp}.` });
        // REPAIR: heal consumes the turn; enemy still attacks below.
        break;
      }
      case 'parry': {
        if (this.focus < SKILL_COST.parry) { events.push({ t: 'info', text: 'Not enough Focus.' }); return { events, over: false, result: null, retry: true }; }
        this.focus -= SKILL_COST.parry;
        this.parryArmed = true;
        events.push({ t: 'skill', text: 'You ready a parry, watching the foe closely.' });
        break;
      }
      case 'bleed': {
        if (this.focus < SKILL_COST.bleed) { events.push({ t: 'info', text: 'Not enough Focus.' }); return { events, over: false, result: null, retry: true }; }
        this.focus -= SKILL_COST.bleed;
        this.enemyStatus.bleed = 3;
        events.push({ t: 'skill', text: `You open a deep wound — ${this.enemy.name} will bleed for 3 turns.` });
        break;
      }
      case 'rage': {
        if (this.focus < SKILL_COST.rage) { events.push({ t: 'info', text: 'Not enough Focus.' }); return { events, over: false, result: null, retry: true }; }
        this.focus -= SKILL_COST.rage;
        this.rageArmed = true;
        events.push({ t: 'skill', text: 'Rage floods your veins — your next strike cannot miss.' });
        return { events, over: false, result: null, retry: true }; // free action: still your turn
      }
      case 'retreat': {
        this.over = true;
        this.result = 'flee';
        events.push({ t: 'info', text: 'You break off the fight and slip away. (Loot forfeited.)' });
        return { events, over: true, result: 'flee' };
      }
      default:
        events.push({ t: 'info', text: 'You hesitate, unsure what to do.' });
        return { events, over: false, result: null, retry: true };
    }

    // Status DoT after the player's action.
    this._tickStatus(events);

    if (this.enemy.hp <= 0) {
      this.over = true;
      this.result = 'win';
      return { events, over: true, result: 'win' };
    }

    // ---- enemy turn ----
    if (this.enemy.isBoss) {
      this._bossTurn(events);
    } else {
      this._enemyTurn(events);
    }

    if (this.player.hp <= 0) {
      this.over = true;
      this.result = 'lose';
      return { events, over: true, result: 'lose' };
    }

    return { events, over: false, result: null };
  }

  // ---- enemy AI --------------------------------------------------------------

  _enemyTurn(events) {
    // ~25% miss/block (preserved from original).
    if (this.rng.chance(0.25)) {
      events.push({ t: 'enemy', text: `${this.enemy.name} lunges — you block it. No damage.` });
      return;
    }
    if (this.parryArmed) {
      this.parryArmed = false;
      const counter = this._playerDamageDealt(playerDamage(this.player) * 0.5);
      events.push({ t: 'skill', text: `You parry the blow and counter for ${counter}!` });
      this._damageEnemy(counter, events, 'Counter');
      return;
    }
    const roll = this.rng.int(1, 3);
    const mult = roll === 1 ? 1 : roll === 2 ? 1.5 : 2;
    const verb = roll === 1 ? 'jabs' : roll === 2 ? 'slashes' : 'bashes';
    const dealt = this._damagePlayer(this.enemy.dmg * mult, events);
    events.push({ t: 'enemy', text: `${this.enemy.name} ${verb} you for ${dealt} — you have ${this.player.hp} HP.` });
  }

  _bossTurn(events) {
    // Phase by remaining HP.
    const pct = this.enemy.hp / this.enemy.maxHp;
    const phase = pct > 0.66 ? 1 : pct > 0.33 ? 2 : 3;
    if (phase !== this.enemy.phase) {
      this.enemy.phase = phase;
      if (phase === 2) events.push({ t: 'boss', text: 'MALAKAR: "Enough games." Flames wreathe his blade.' });
      if (phase === 3) events.push({ t: 'boss', text: 'MALAKAR: "I will NOT fall!"' });
    }

    const attacks = phase === 3 ? 2 : 1; // enrage: two attacks per turn
    for (let i = 0; i < attacks; i++) {
      if (this.player.hp <= 0) break;

      // Phase 1: telegraphs a charge every 3rd turn that Parry can negate.
      const charging = phase >= 1 && this.state.progress.turnsPlayed % 3 === 0 && i === 0;
      if (charging) {
        events.push({ t: 'boss', text: 'Malakar rears back for a devastating CHARGE!' });
        if (this.parryArmed) {
          this.parryArmed = false;
          const counter = this._playerDamageDealt(playerDamage(this.player) * 0.5);
          events.push({ t: 'skill', text: `You parry the charge and counter for ${counter}!` });
          this._damageEnemy(counter, events, 'Counter');
          continue;
        }
        const dealt = this._damagePlayer(this.enemy.dmg * 2.5, events);
        events.push({ t: 'boss', text: `The charge connects for ${dealt}! You have ${this.player.hp} HP.` });
        if (phase >= 2) this._applyBurn(events);
        continue;
      }

      if (this.parryArmed) {
        this.parryArmed = false;
        const counter = this._playerDamageDealt(playerDamage(this.player) * 0.5);
        events.push({ t: 'skill', text: `You parry and counter for ${counter}!` });
        this._damageEnemy(counter, events, 'Counter');
        continue;
      }

      const mult = phase >= 2 && this.rng.chance(0.4) ? 2.5 : this.rng.range(1, 2);
      const dealt = this._damagePlayer(this.enemy.dmg * mult, events);
      events.push({ t: 'boss', text: `Malakar strikes for ${dealt} — you have ${this.player.hp} HP.` });
      if (phase >= 2 && mult >= 2.5) this._applyBurn(events);
    }
  }

  _applyBurn(events) {
    this.enemyStatus.burn; // (enemy burns are player-side; boss burns the player instead)
    // Boss applies Burn to the PLAYER: small DoT next turn. Modeled as immediate chip here.
    const dot = Math.round(this.player.maxHp * 0.04);
    this._damagePlayer(dot, events);
    events.push({ t: 'dot', text: `Flames sear you for ${dot}.` });
  }

  // Snapshot for HUD rendering.
  hud() {
    return {
      enemy: { name: this.enemy.name, hp: this.enemy.hp, maxHp: this.enemy.maxHp, weapon: this.enemy.weapon },
      focus: this.focus,
      status: { ...this.enemyStatus },
      player: { hp: this.player.hp, maxHp: this.player.maxHp, potions: this.player.potions },
    };
  }
}
