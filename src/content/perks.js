// Perk tree (spec §4.4). Perks are spent with perk points earned on level up. Each is
// single-rank except Focused (×3). Effects are read by combat/economy via hasPerk/perkRank.

export const PERKS = [
  { id: 'crit_slash', name: 'Crit Slash', desc: 'Slash accuracy 60% → 75%' },
  { id: 'deadeye', name: 'Deadeye', desc: 'Power accuracy 40% → 55%' },
  { id: 'iron_skin', name: 'Iron Skin', desc: '−15% damage taken' },
  { id: 'bloodlust', name: 'Bloodlust', desc: '+20% damage dealt while below 30% HP' },
  { id: 'battle_medic', name: 'Battle Medic', desc: 'Potions heal +30%; Heal grants 1 Focus' },
  { id: 'thrifty', name: 'Thrifty', desc: 'Shop prices −10%' },
  { id: 'scavenger', name: 'Scavenger', desc: '+25% materials from all sources' },
  { id: 'second_wind', name: 'Second Wind', desc: 'Once per fight, survive a lethal hit at 1 HP' },
  { id: 'focused', name: 'Focused', desc: '+1 starting Focus per rank', maxRank: 3 },
];

export function perkById(id) {
  return PERKS.find((p) => p.id === id) || null;
}

export function hasPerk(player, id) {
  return (player.perks || []).includes(id);
}

// Count of a stacking perk (Focused). 0 if absent.
export function perkRank(player, id) {
  return (player.perks || []).filter((p) => p === id).length;
}
