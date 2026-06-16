// Tests for the pure text-UI helpers (roadmap §5.2). These render ASCII meters the combat HUD
// prints; being pure string functions, they're cheap to lock down.

import test from 'node:test';
import assert from 'node:assert/strict';

import { bar, pips, padLabel } from '../src/ui.js';

test('bar renders a proportional meter with counts', () => {
  assert.equal(bar(50, 100, 10), '[#####-----] 50/100');
  assert.equal(bar(100, 100, 10), '[##########] 100/100');
  assert.equal(bar(0, 100, 10), '[----------] 0/100');
});

test('bar clamps over/under and rounds cells', () => {
  assert.equal(bar(9999, 100, 10), '[##########] 100/100'); // clamp high
  assert.equal(bar(-50, 100, 10), '[----------] 0/100'); // clamp low
});

test('bar tolerates zero max without dividing by zero', () => {
  assert.equal(bar(0, 0, 5), '[-----] 0/0');
});

test('bar can hide the numbers', () => {
  assert.equal(bar(50, 100, 10, { showNums: false }), '[#####-----]');
});

test('pips show filled focus against headroom', () => {
  assert.equal(pips(3, 9), '***······');
  assert.equal(pips(0, 5), '·····');
  assert.equal(pips(9, 5), '*****'); // clamped to max
});

test('padLabel pads and truncates to a fixed width', () => {
  assert.equal(padLabel('Goblin', 10), 'Goblin    ');
  assert.equal(padLabel('Frostpeak Warden', 8), 'Frostpea');
});
