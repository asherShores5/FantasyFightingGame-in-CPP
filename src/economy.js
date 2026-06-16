// Gold/materials, shop transactions, weapon & accessory upgrades, super potions
// (spec §6). Pure: each function returns { ok, message, ...} and mutates player on success.

import { POTION_BUNDLES, SUPER_POTIONS, nextSuperPotion } from './content/items.js';
import { WEAPONS, weaponById, nextWeapon } from './content/weapons.js';
import { ACCESSORIES, accessoryById } from './content/items_accessories.js';
import { hasPerk } from './content/perks.js';

// Thrifty perk: 10% off shop prices.
function priceFor(player, gold) {
  return hasPerk(player, 'thrifty') ? Math.round(gold * 0.9) : gold;
}

export function buyPotions(player, bundleId) {
  const bundle = POTION_BUNDLES.find((b) => b.id === bundleId);
  if (!bundle) return { ok: false, message: 'No such bundle.' };
  const cost = priceFor(player, bundle.cost);
  if (player.gold < cost) return { ok: false, message: 'Not enough gold.' };
  player.gold -= cost;
  player.potions += bundle.amount;
  return { ok: true, message: `Bought ${bundle.amount} potion(s). You now have ${player.potions}.` };
}

export function buySuperPotion(player) {
  const sp = nextSuperPotion(player.superTier || 0);
  if (!sp) {
    return { ok: false, message: "I've run out of stock, kid. Trying to become a god?" };
  }
  const cost = priceFor(player, sp.cost);
  if (player.gold < cost) return { ok: false, message: 'Not enough gold.' };
  player.gold -= cost;
  player.superTier = (player.superTier || 0) + 1;
  player.maxHp += sp.bonus;
  player.hp = Math.min(player.maxHp, player.hp + sp.bonus); // the drink also tops you up
  return { ok: true, message: `Your max HP rises to ${player.maxHp}!` };
}

/**
 * Upgrade to the next weapon on the ladder. Costs gold + materials (spec §6.4).
 * @param {import('./types.js').Player} player
 * @returns {import('./types.js').TxResult}
 */
export function upgradeWeapon(player) {
  const next = nextWeapon(player.weaponId);
  if (!next || !next.upgradeCost) return { ok: false, message: 'Your weapon is already fully upgraded!' };
  const cost = next.upgradeCost;
  const goldCost = priceFor(player, cost.gold);
  if (player.gold < goldCost || player.materials < cost.materials) {
    return {
      ok: false,
      message: `Not enough resources (need ${goldCost}G + ${cost.materials} mats).`,
    };
  }
  player.gold -= goldCost;
  player.materials -= cost.materials;
  player.weaponId = next.id;
  return {
    ok: true,
    message: `You now wield the ${next.name}, dealing ${next.damage} base damage!`,
    weapon: next,
  };
}

export function buyAccessory(player, accId) {
  const acc = accessoryById(accId);
  if (!acc) return { ok: false, message: 'No such accessory.' };
  if (player.accessoryId === acc.id) return { ok: false, message: 'Already equipped.' };
  const goldCost = priceFor(player, acc.cost.gold);
  if (player.gold < goldCost || player.materials < acc.cost.materials) {
    return { ok: false, message: 'Not enough resources.' };
  }
  player.gold -= goldCost;
  player.materials -= acc.cost.materials;
  player.accessoryId = acc.id;
  return { ok: true, message: `Equipped ${acc.name}: ${acc.desc}.` };
}

// Effect accessor used by combat/economy. Returns the equipped accessory's effect or {}.
export function accessoryEffect(player) {
  const acc = accessoryById(player.accessoryId);
  return acc ? acc.effect : {};
}

export { WEAPONS, weaponById, ACCESSORIES, SUPER_POTIONS };
