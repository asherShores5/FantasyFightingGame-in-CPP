// Enemy roster, pooled by area (spec §4.1, expanded to ~20 per §12). Each entry is just
// data: a name, the weapon it wields, and which area pool(s) it belongs to. Concrete HP/dmg
// are rolled at fight time from the AREA's ranges (areas.js), so the same enemy name scales
// with the region. No inheritance from `player` (the C++ `enemy : public player` was a smell).

// The original 10 live in the Forest/Caves pools so all legacy content is preserved.
export const ENEMIES = [
  // Whispering Forest
  { name: 'Goblin', weapon: 'Rusty Sword', pool: 'forest' },
  { name: 'Giant Bat', weapon: 'Throwing Knife', pool: 'forest' },
  { name: 'Wild Wolf', weapon: 'Pointy Stick', pool: 'forest' },
  { name: 'Giant Spider', weapon: 'Dagger', pool: 'forest' },
  { name: 'Bandit', weapon: 'Stone Club', pool: 'forest' },

  // Damp Caves
  { name: 'Skeleton', weapon: 'Sharpened Sword', pool: 'caves' },
  { name: 'Zombie', weapon: 'Big Rock', pool: 'caves' },
  { name: 'Giant Slime', weapon: 'Spear', pool: 'caves' },
  { name: 'Cave Troll', weapon: 'Iron Hammer', pool: 'caves' },
  { name: 'Thief', weapon: 'Dagger', pool: 'caves' },

  // Sunken Ruins
  { name: 'Dark Elf', weapon: 'Battle Axe', pool: 'ruins' },
  { name: 'Drowned Knight', weapon: 'Rusted Greatsword', pool: 'ruins' },
  { name: 'Cursed Wraith', weapon: 'Spectral Blade', pool: 'ruins' },
  { name: 'Stone Golem', weapon: 'Boulder Fist', pool: 'ruins' },
  { name: 'Sunken Naga', weapon: 'Trident', pool: 'ruins' },

  // Frostpeak Ascent
  { name: 'Frost Wyvern', weapon: 'Frozen Talon', pool: 'frostpeak' },
  { name: 'Ice Revenant', weapon: 'Glacial Maul', pool: 'frostpeak' },
  { name: 'Yeti', weapon: 'Frostbite Club', pool: 'frostpeak' },
  { name: 'Storm Harpy', weapon: 'Lightning Spear', pool: 'frostpeak' },
  { name: 'Frostpeak Warden', weapon: 'Avalanche Blade', pool: 'frostpeak' },
];

export function enemiesForArea(areaId) {
  return ENEMIES.filter((e) => e.pool === areaId);
}
