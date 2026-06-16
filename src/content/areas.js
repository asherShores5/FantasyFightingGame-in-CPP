// Area / risk-tier definitions (spec §4.1). The Hunt menu lets the player choose where to
// fight; tougher areas are gated by base weapon damage and pay out proportionally more.
// This is the core difficulty-balancing mechanism: the player opts into risk.

export const AREAS = [
  {
    id: 'forest',
    name: 'Whispering Forest',
    order: 1,
    gate: { damage: 0 }, // always open
    hp: [40, 70],
    dmg: [8, 14],
    goldMult: 1.0,
    matMult: 1.0,
    xpMult: 1.0,
    gather: ['an old quarry', 'an abandoned lumber mill'],
    flavor: 'Sunlight filters through ancient trees. Something rustles in the underbrush.',
  },
  {
    id: 'caves',
    name: 'Damp Caves',
    order: 2,
    gate: { damage: 15 },
    hp: [80, 130],
    dmg: [14, 22],
    goldMult: 1.8,
    matMult: 1.6,
    xpMult: 1.6,
    gather: ['a glittering ore vein', 'a cavern of fossilized roots'],
    flavor: 'Water drips in the dark. Your torch throws long, shifting shadows.',
  },
  {
    id: 'ruins',
    name: 'Sunken Ruins',
    order: 3,
    gate: { damage: 20 },
    hp: [150, 230],
    dmg: [22, 34],
    goldMult: 3.0,
    matMult: 2.6,
    xpMult: 2.6,
    gather: ['a collapsed treasury', 'a forgotten armory'],
    flavor: 'Drowned halls of a fallen kingdom. The air is thick with old magic.',
  },
  {
    id: 'frostpeak',
    name: 'Frostpeak Ascent',
    order: 4,
    gate: { damage: 25 },
    hp: [280, 400],
    dmg: [34, 50],
    goldMult: 5.0,
    matMult: 4.0,
    xpMult: 4.0,
    gather: ['a frozen mineshaft', 'a windswept timber camp'],
    flavor: 'Bitter wind claws at the mountainside. Few who climb this far return.',
  },
];

// Final boss "area" — gated by top gear, not just damage (spec §4.2).
export const BOSS_AREA = {
  id: 'throne',
  name: "Demon Lord's Throne",
  order: 5,
  gate: { damage: 50, maxHp: 200 },
  flavor: 'A throne of blackened bone. Malakar rises, and the air turns to ash.',
};

export function areaById(id) {
  if (id === BOSS_AREA.id) return BOSS_AREA;
  return AREAS.find((a) => a.id === id) || null;
}

// Is an area unlocked given the player's current power?
export function isAreaUnlocked(area, player) {
  const g = area.gate || {};
  if (g.damage && player.damage < g.damage) return false;
  if (g.maxHp && player.maxHp < g.maxHp) return false;
  return true;
}

// Human-readable unlock requirement, for the greyed menu entries.
export function gateText(area) {
  const g = area.gate || {};
  const parts = [];
  if (g.damage) parts.push(`base dmg ≥ ${g.damage}`);
  if (g.maxHp) parts.push(`max HP ≥ ${g.maxHp}`);
  return parts.length ? `locked: ${parts.join(' and ')}` : '';
}
