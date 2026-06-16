// Seedable PRNG (mulberry32). Replaces the original's srand(time(0))-per-call,
// which reseeded every roll and produced biased/repeatable results within a second.
// A single seeded instance flows through the whole game so runs are deterministic + testable.

export function makeRng(seed) {
  let a = (seed >>> 0) || 1;

  function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    // Inclusive integer in [min, max].
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    // Float in [min, max).
    range: (min, max) => next() * (max - min) + min,
    // True with probability p (0..1).
    chance: (p) => next() < p,
    // Random element of a non-empty array.
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    // Current internal state, for persisting across saves.
    seed: () => a >>> 0,
  };
}

// Derive an initial seed without Date.now() (unavailable in some sandboxes anyway).
// Caller may pass an explicit seed; otherwise we mix in performance.now if present.
export function freshSeed() {
  const perf =
    typeof performance !== 'undefined' && performance.now ? performance.now() : 0;
  // Spread the float into the integer range.
  return (Math.floor(perf * 1000) ^ 0x9e3779b9) >>> 0 || 0x12345678;
}
