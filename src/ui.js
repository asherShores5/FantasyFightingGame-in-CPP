// Small pure text-UI helpers (roadmap §5.2). No DOM — these return strings the terminal prints,
// so they're trivially unit-tested. Keeps combat/HUD rendering legible as ASCII meters.

// Render an ASCII meter like "[####------] 40/100". `width` is the number of cells. The shown
// value is clamped to [0, max] too, so a HP bar never reads a nonsensical "9999/100".
export function bar(value, max, width = 10, { filled = '#', empty = '-', showNums = true } = {}) {
  const v = Math.max(0, Math.min(value, max));
  const cells = max > 0 ? Math.round((v / max) * width) : 0;
  const meter = filled.repeat(cells) + empty.repeat(Math.max(0, width - cells));
  return showNums ? `[${meter}] ${Math.round(v)}/${Math.round(max)}` : `[${meter}]`;
}

// A compact Focus pips display, e.g. "Focus: ***··" (filled = available focus, dots = headroom).
export function pips(value, max = 9, { filled = '*', empty = '·' } = {}) {
  const v = Math.max(0, Math.min(value, max));
  return filled.repeat(v) + empty.repeat(Math.max(0, max - v));
}

// Left-pad/truncate a label to a fixed column width so stacked HUD lines align.
export function padLabel(label, width) {
  if (label.length >= width) return label.slice(0, width);
  return label + ' '.repeat(width - label.length);
}
