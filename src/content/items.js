// Consumables + super potions (spec §6.3).

// Health potion bundles sold in the shop.
export const POTION_BUNDLES = [
  { id: 1, label: '1 Health Potion', amount: 1, cost: 35 },
  { id: 2, label: '5 Health Potions', amount: 5, cost: 160 },
  { id: 3, label: '10 Health Potions', amount: 10, cost: 300 },
  { id: 4, label: '25 Health Potions', amount: 25, cost: 700 },
];

// Super potions each add +50 max HP, in three escalating-cost tiers (spec §6.3). They are
// ADDITIVE (tracked by player.superTier) rather than setting an absolute max, so they stack
// cleanly with the +15 maxHP gained per level-up instead of fighting it.
export const SUPER_POTIONS = [
  { tier: 1, bonus: 50, cost: 500 },
  { tier: 2, bonus: 50, cost: 1000 },
  { tier: 3, bonus: 50, cost: 2000 },
];

// Potions heal 40% of maxHP (spec §6.3) so they stay relevant as maxHP climbs.
export function potionHealAmount(maxHp, battleMedic = false) {
  const base = Math.round(maxHp * 0.4);
  return battleMedic ? Math.round(base * 1.3) : base;
}

// The next super potion the player can buy given how many they've already bought (0..3).
export function nextSuperPotion(superTier = 0) {
  return SUPER_POTIONS.find((p) => p.tier === superTier + 1) || null;
}
