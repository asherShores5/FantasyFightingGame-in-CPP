// Synthesized sound effects via the WebAudio API (roadmap §5.1). NO asset files — every sound
// is generated from oscillators, so the game stays a dependency-free static site. Off by
// default; toggled in settings. Headless-safe: if AudioContext is absent (Node tests) or the
// user hasn't enabled sound, every call is a no-op.
//
// The AudioContext is created lazily on the first play() AFTER enable(), because browsers block
// audio until a user gesture. main.js enables sound from a menu choice (a gesture), so the
// first beep that follows can spin up the context cleanly.

let ctx = null;
let enabled = false;
let masterGain = null;

function ensureContext() {
  if (ctx) return ctx;
  const w = /** @type {any} */ (typeof window !== 'undefined' ? window : null);
  const AC = w && (w.AudioContext || w.webkitAudioContext);
  if (!AC) return null; // headless / unsupported — stay silent
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.18; // keep it gentle
  masterGain.connect(ctx.destination);
  return ctx;
}

export function setEnabled(on) {
  enabled = !!on;
  if (enabled) ensureContext();
  // Resume a context that the browser suspended (common after the autoplay gate).
  if (enabled && ctx && ctx.state === 'suspended') ctx.resume();
}

export function isEnabled() {
  return enabled;
}

// Core tone: a single oscillator with a short attack/decay envelope.
function tone({ freq = 440, dur = 0.08, type = 'square', gain = 1, when = 0 }) {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Percussive envelope so stacked tones don't smear.
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A short noise burst (for hits/impacts), built from a buffer of random samples.
function noise({ dur = 0.09, gain = 0.6, when = 0, hp = false }) {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  const t0 = c.currentTime + when;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // Optional high-pass to make impacts crisper rather than muddy.
  if (hp) {
    const filt = c.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 900;
    src.connect(filt); filt.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

// ---- the game's sound palette ---------------------------------------------
// Each is named for the event it accompanies; main.js / terminal.js call these.

export const sfx = {
  // soft per-character click while the typewriter prints
  key: () => tone({ freq: 1500, dur: 0.012, type: 'square', gain: 0.05 }),
  // menu/confirm blip
  blip: () => tone({ freq: 660, dur: 0.05, type: 'square', gain: 0.5 }),
  // player landing a hit
  hit: () => { noise({ dur: 0.08, gain: 0.5, hp: true }); tone({ freq: 180, dur: 0.07, type: 'sawtooth', gain: 0.4 }); },
  // a miss (whiff)
  miss: () => tone({ freq: 300, dur: 0.12, type: 'sine', gain: 0.25 }),
  // taking damage
  hurt: () => tone({ freq: 140, dur: 0.16, type: 'sawtooth', gain: 0.5 }),
  // drinking a potion (rising arpeggio)
  heal: () => { tone({ freq: 520, dur: 0.08, gain: 0.4 }); tone({ freq: 680, dur: 0.08, gain: 0.4, when: 0.07 }); tone({ freq: 880, dur: 0.12, gain: 0.4, when: 0.14 }); },
  // spending Focus on a skill
  skill: () => { tone({ freq: 700, dur: 0.06, type: 'triangle', gain: 0.4 }); tone({ freq: 1040, dur: 0.1, type: 'triangle', gain: 0.4, when: 0.05 }); },
  // winning a fight / leveling up (triumphant triad)
  level: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.14, type: 'square', gain: 0.45, when: i * 0.09 })); },
  // enemy defeated
  win: () => { [392, 523, 659].forEach((f, i) => tone({ freq: f, dur: 0.1, gain: 0.4, when: i * 0.07 })); },
  // player death (descending)
  death: () => { [330, 262, 196, 131].forEach((f, i) => tone({ freq: f, dur: 0.18, type: 'sawtooth', gain: 0.45, when: i * 0.12 })); },
  // boss phase change / roar
  boss: () => { noise({ dur: 0.4, gain: 0.5 }); tone({ freq: 70, dur: 0.5, type: 'sawtooth', gain: 0.6 }); },
};
