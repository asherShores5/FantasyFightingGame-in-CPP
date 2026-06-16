// Accessories — one optional equip slot (spec §6.5). Bought with gold + materials, each
// gives a passive bonus. Adds build variety without a second full upgrade ladder.

export const ACCESSORIES = [
  {
    id: 'whetstone',
    name: 'Whetstone',
    desc: '+10% damage dealt',
    cost: { gold: 800, materials: 300 },
    effect: { damageMult: 1.1 },
  },
  {
    id: 'aegis',
    name: 'Aegis Charm',
    desc: '−10% damage taken',
    cost: { gold: 800, materials: 300 },
    effect: { damageTakenMult: 0.9 },
  },
  {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    desc: '+20% gold from fights',
    cost: { gold: 1000, materials: 200 },
    effect: { goldMult: 1.2 },
  },
  {
    id: 'focus_crystal',
    name: 'Focus Crystal',
    desc: '+1 starting Focus',
    cost: { gold: 1200, materials: 400 },
    effect: { startFocus: 1 },
  },
];

export function accessoryById(id) {
  return ACCESSORIES.find((a) => a.id === id) || null;
}
