// ASCII art (roadmap §5.2). Strictly text — no raster assets, honoring the terminal identity.
// Enemy portraits keyed by name (with a generic fallback so new foes need no art), area
// banners keyed by area id, and the boss splash. Portraits are kept compact (~5 lines) so they
// sit comfortably above the combat HUD on small screens.

const GENERIC = [
  '    ___',
  '   /   \\',
  '  | x x |',
  '   \\ ~ /',
  '    ---',
];

const ENEMY_ART = {
  Goblin: [
    '   ,---.',
    '  (o   o)',
    '  | >v< |',
    "   \\___/ ",
    '   /| |\\',
  ],
  'Giant Bat': [
    ' /\\       /\\',
    '/  \\__^__/  \\',
    '\\  (o   o)  /',
    ' \\__\\_v_/__/',
    '     """',
  ],
  'Wild Wolf': [
    '   /\\_/\\',
    '  ( o o )',
    '  =( ^ )=',
    "   )   ( ",
    '  (__|__)',
  ],
  'Giant Spider': [
    ' /\\ ___ /\\',
    '/  (o o)  \\',
    '\\ /\\_-_/\\ /',
    ' \\/ | | \\/',
    '   /   \\',
  ],
  Skeleton: [
    '    ___',
    '   /   \\',
    '  |() ()|',
    '   \\ ^ /',
    '   |||||',
  ],
  Zombie: [
    '   ,---.',
    '  (x   o)',
    '  | ~~~ |',
    "   \\___/`",
    '   /| |\\',
  ],
  'Cave Troll': [
    '   _____',
    '  / o o \\',
    ' | \\___/ |',
    '  \\_____/',
    '  /|   |\\',
  ],
  'Dark Elf': [
    '   /\\_/\\',
    '  ( -.- )',
    '  /|   |\\',
    "   | ~ | ",
    '   /   \\',
  ],
  'Stone Golem': [
    ' [#######]',
    ' [# o o #]',
    ' [#  _  #]',
    ' [#######]',
    '  /#####\\',
  ],
  'Frost Wyvern': [
    '   <\\____/>',
    '  <( o  o )>',
    "   \\  vv  /",
    '   /`----`\\',
    '  ^^      ^^',
  ],
  Yeti: [
    '   ( ___ )',
    '  ( O   O )',
    '  (   ^   )',
    "   ) --- ( ",
    '  (__/ \\__)',
  ],
};

// The final boss gets a larger splash.
export const BOSS_ART = [
  '            /\\   /\\',
  '           /  \\_/  \\',
  '          |  ^   ^  |',
  '          |  (o o)  |',
  '          \\   \\_/   /',
  '       /\\__|  vvv  |__/\\',
  '      /   /_\\_____/_\\   \\',
  '     |   /   MALAKAR  \\   |',
  '      \\_/   THE  CRUEL \\_/',
];

// Small area banners shown on the hunt intro.
const AREA_ART = {
  forest: ['  ^  ^  ^   ^  ^', ' /|\\/|\\/|\\ /|\\/|\\', '  WHISPERING FOREST'],
  caves: [' /\\/\\/\\/\\/\\/\\/\\', ' ~~ DAMP  CAVES ~~', ' \\/\\/\\/\\/\\/\\/\\/'],
  ruins: [' []_[]_[]_[]_[]', '  SUNKEN  RUINS', ' ~~~~~~~~~~~~~~~'],
  frostpeak: ['    /\\    /\\', '   /  \\  /  \\  *', '  FROSTPEAK ASCENT'],
};

export function enemyArt(name) {
  return ENEMY_ART[name] || GENERIC;
}

export function areaArt(id) {
  return AREA_ART[id] || null;
}
