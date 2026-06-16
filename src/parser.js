// Hybrid input parser (spec §8.2). Turns a raw input line into a normalized intent. Supports
// number keys (menu selection) AND typed verbs everywhere, so `3`, `hunt`, or `go caves` all
// work. The game loop decides what each intent means in its current context.

// Verb aliases → canonical verb.
const ALIASES = {
  t: 'town', town: 'town',
  g: 'gather', gather: 'gather',
  h: 'hunt', hunt: 'hunt',
  st: 'stats', stats: 'stats', status: 'stats', progress: 'stats',
  sv: 'save', save: 'save',
  shop: 'shop', tavern: 'tavern', leave: 'leave', back: 'back', exit: 'back',
  buy: 'buy', upgrade: 'upgrade', equip: 'equip',
  go: 'go',
  stab: 'stab', slash: 'slash', power: 'power', heal: 'heal',
  parry: 'parry', bleed: 'bleed', rage: 'rage', retreat: 'retreat', flee: 'retreat',
  help: 'help', clear: 'clear', theme: 'theme', load: 'load',
  perk: 'perk', perks: 'perk',
  y: 'yes', yes: 'yes', n: 'no', no: 'no',
};

// Parse a line into { num, verb, args, raw }. `num` is set when the whole line is an integer
// (menu pick). `verb` is the canonical verb if the first token is a known alias.
export function parse(raw) {
  const text = (raw || '').trim();
  const lower = text.toLowerCase();

  if (/^\d+$/.test(lower)) {
    return { num: parseInt(lower, 10), verb: null, args: [], raw: text };
  }

  const tokens = lower.split(/\s+/).filter(Boolean);
  const verb = tokens.length ? ALIASES[tokens[0]] || null : null;
  const args = tokens.slice(1);

  // Allow a trailing number after a verb (e.g. "buy potion 5" or "go 2").
  let num = null;
  const lastNum = args.find((a) => /^\d+$/.test(a));
  if (lastNum != null) num = parseInt(lastNum, 10);

  return { num, verb, args, raw: text };
}

// Match a free-text token against a list of {id,name} options (for `go caves`, `equip aegis`).
export function matchOption(token, options) {
  if (!token) return null;
  const t = token.toLowerCase();
  return (
    options.find((o) => o.id?.toLowerCase() === t) ||
    options.find((o) => o.name?.toLowerCase().startsWith(t)) ||
    options.find((o) => o.name?.toLowerCase().includes(t)) ||
    null
  );
}
