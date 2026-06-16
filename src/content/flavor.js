// All static text: intro, tavern tips, screens, boss dialogue. Kept in one place so writing
// can be edited without touching logic. Original 5 tavern tips preserved + new ones.

export const INTRO = [
  'Welcome, Adventurer, to the land of ELARIA.',
  '',
  'From the Main Road your journey begins. Hunt monsters in ever more dangerous',
  'regions, gather what you can, and grow strong enough to storm the',
  "Demon Lord's Throne — and end his reign.",
  '',
  'Type `help` at any time to see what you can do.',
];

export const TAVERN_TIPS = [
  // Original 5 (lightly trimmed)
  'Did you know you can buy special potions that raise your TOTAL health? ' +
    "But you didn't hear that from me...",
  'Materials are all over Elaria — take them from fallen foes, or gather them yourself ' +
    'where it is safe.',
  'They say the creator of this land grew tired and sick of writing it... the last thing ' +
    'he ever did. Strange, that.',
  'Saving your progress is key. Some say you can even back out without saving — there is no ' +
    'auto-save, after all.',
  'Harder foes seem worse, but the greater the danger, the greater the loot.',
  // New tips that hint at the expanded systems
  'Travel to tougher grounds when your blade is sharp enough — the Caves, the Ruins, ' +
    'and beyond await the worthy.',
  'A focused warrior can PARRY a blow, make a foe BLEED, or unleash a RAGE no armor can stop.',
  'They whisper that only one wielding Excalibur, hale and hearty, may face Malakar and live.',
  'A good trinket is worth its weight in gold — the right charm can turn a losing fight.',
];

export const VICTORY = [
  'Malakar lets out a final, splintering roar — and falls.',
  '',
  'The ash settles. The throne is empty. Elaria is free.',
  '',
  '*** YOU HAVE WON ***',
];

export const DEATH = [
  'Darkness takes you...',
  '',
  'You wake in town, battered but breathing. Half your gold is gone,',
  'and whatever you carried from that last hunt is lost.',
];

export const BOSS_DIALOGUE = {
  intro: 'MALAKAR: "You? A pebble before the mountain. Come, break yourself upon me."',
  phase2: 'MALAKAR: "Enough games." Flames wreathe his blade.',
  phase3: 'MALAKAR: "I will NOT fall!" He strikes with the fury of the abyss.',
};
