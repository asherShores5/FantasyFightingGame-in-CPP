// Road/area random events (spec §7). ~20% chance when entering Hunt or Gather. Each event is
// a tiny vignette with numbered choices; resolution mutates the player. Data-driven.

export const EVENT_CHANCE = 0.2;

// Each event: { id, text, choices: [{ label, resolve(player, rng) -> string }] }
export const EVENTS = [
  {
    id: 'wounded_traveler',
    text: 'A wounded traveler slumps against a tree, begging for a healing potion.',
    choices: [
      {
        label: 'Give a potion',
        resolve(player) {
          if (player.potions <= 0) return 'You have none to give. The traveler sighs and limps away.';
          player.potions -= 1;
          const reward = 120;
          player.gold += reward;
          return `You hand over a potion. Grateful, the traveler presses ${reward}G into your palm.`;
        },
      },
      {
        label: 'Walk on by',
        resolve() {
          return 'You leave the traveler to their fate. The road is no place for the soft.';
        },
      },
    ],
  },
  {
    id: 'hidden_cache',
    text: 'You spot loose stones concealing a small cache.',
    choices: [
      {
        label: 'Pry it open',
        resolve(player, rng) {
          const mats = rng.int(15, 40);
          player.materials += mats;
          return `Inside: ${mats} salvaged materials. A lucky find.`;
        },
      },
      { label: 'Leave it — could be trapped', resolve() { return 'Better safe than sorry. You move on.'; } },
    ],
  },
  {
    id: 'snare_trap',
    text: 'Your foot catches a hidden snare!',
    choices: [
      {
        label: 'Cut yourself free',
        resolve(player) {
          const dmg = Math.round(player.maxHp * 0.1);
          player.hp = Math.max(1, player.hp - dmg);
          return `You wrench free, but the wire bites deep — you lose ${dmg} HP.`;
        },
      },
    ],
  },
  {
    id: 'wandering_merchant',
    text: 'A hooded merchant appears. "Five potions, half price — 80G. Interested?"',
    choices: [
      {
        label: 'Buy (80G)',
        resolve(player) {
          if (player.gold < 80) return 'You count your coins... not enough. The merchant tuts and vanishes.';
          player.gold -= 80;
          player.potions += 5;
          return 'A fair deal! Five potions join your pack.';
        },
      },
      { label: 'Decline', resolve() { return 'The merchant shrugs and melts back into the mist.'; } },
    ],
  },
];

export function maybeEvent(rng) {
  return rng.chance(EVENT_CHANCE) ? rng.pick(EVENTS) : null;
}
