// Weapon ladder as data (spec §6.4). Weapons are referenced by index, NOT inferred from a
// damage value (the original's `if (damage == 10)` was fragile). Upgrade costs rebalanced
// down from the C++ original to reduce the late grind.

export const WEAPONS = [
  { id: 0, name: 'Rusty Sword', damage: 10, upgradeCost: null }, // starting weapon
  { id: 1, name: 'Awkward Cleaver', damage: 15, upgradeCost: { gold: 100, materials: 40 } },
  { id: 2, name: 'Sharpened Iron', damage: 20, upgradeCost: { gold: 450, materials: 180 } },
  { id: 3, name: 'Great Warhammer', damage: 25, upgradeCost: { gold: 1500, materials: 600 } },
  { id: 4, name: 'Excalibur', damage: 50, upgradeCost: { gold: 4000, materials: 1800 } },
];

export function weaponById(id) {
  return WEAPONS[id] || WEAPONS[0];
}

// The weapon you'd upgrade INTO from the current one (null if maxed).
export function nextWeapon(id) {
  return WEAPONS[id + 1] || null;
}
