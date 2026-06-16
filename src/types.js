// Shared JSDoc type definitions for the whole game. This file emits nothing at runtime — it
// exists purely so `tsc --noEmit` (checkJs) can type-check the plain .js modules. Import the
// types with `@typedef {import('./types.js').Player} Player` style references where needed.

/**
 * @typedef {Object} UpgradeCost
 * @property {number} gold
 * @property {number} materials
 */

/**
 * @typedef {Object} Weapon
 * @property {number} id
 * @property {string} name
 * @property {number} damage
 * @property {UpgradeCost|null} upgradeCost  null for the starting weapon
 */

/**
 * @typedef {Object} Area
 * @property {string} id
 * @property {string} name
 * @property {number} order
 * @property {{damage?: number, maxHp?: number}} gate
 * @property {[number, number]} [hp]    min/max enemy HP (absent on the boss area)
 * @property {[number, number]} [dmg]   min/max enemy damage
 * @property {number} [goldMult]
 * @property {number} [matMult]
 * @property {number} [xpMult]
 * @property {string[]} [gather]
 * @property {string} flavor
 */

/**
 * @typedef {Object} Enemy
 * @property {string} name
 * @property {string} weapon
 * @property {number} maxHp
 * @property {number} hp
 * @property {number} dmg
 * @property {boolean} [isBoss]
 * @property {number} [phase]
 */

/**
 * @typedef {Object} Accessory
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {UpgradeCost} cost
 * @property {AccessoryEffect} effect
 */

/**
 * @typedef {Object} AccessoryEffect
 * @property {number} [damageMult]
 * @property {number} [damageTakenMult]
 * @property {number} [goldMult]
 * @property {number} [startFocus]
 */

/**
 * @typedef {Object} Perk
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {number} [maxRank]
 */

/**
 * @typedef {Object} Player
 * @property {string} name
 * @property {number} level
 * @property {number} xp
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} gold
 * @property {number} materials
 * @property {number} potions
 * @property {number} weaponId
 * @property {string|null} accessoryId
 * @property {number} superTier
 * @property {string[]} perks
 * @property {number} perkPoints
 */

/**
 * @typedef {Object} Progress
 * @property {string[]} unlockedAreas
 * @property {boolean} bossDefeated
 * @property {Record<string, number>} kills
 * @property {number} deaths
 * @property {number} turnsPlayed
 */

/**
 * @typedef {Object} Settings
 * @property {string} theme
 * @property {string} textSpeed
 * @property {boolean} sound
 */

/**
 * @typedef {Object} GameState
 * @property {number} version
 * @property {Player} player
 * @property {Progress} progress
 * @property {Settings} settings
 * @property {number} rngSeed
 */

/**
 * A transaction result returned by economy functions.
 * @typedef {Object} TxResult
 * @property {boolean} ok
 * @property {string} message
 * @property {Weapon} [weapon]
 */

export {}; // make this a module
