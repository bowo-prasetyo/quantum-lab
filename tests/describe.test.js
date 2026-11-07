// The state descriptions read out to screen-reader users (describe.js).
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { describeState, percent, degrees } from '../describe.js';
import { zeroState, applyGate, applyCNOT } from '../engine.js';

const run = (n, ...ops) => ops.reduce(
  (s, [gate, a, b]) => gate === 'CNOT' ? applyCNOT(s.re, s.im, a, b, n) : applyGate(s.re, s.im, gate, a, n),
  zeroState(n)
);

describe('State descriptions', () => {
  test('list the possible outcomes with their chances', () => {
    let s = zeroState(1);
    assert.equal(describeState(s.re, s.im, 1), '|0⟩ 100%');
    s = run(2, ['H', 0], ['CNOT', 0, 1]);
    assert.equal(describeState(s.re, s.im, 2), '|00⟩ 50%, |11⟩ 50%');
  });

  test('sum up many equally likely outcomes', () => {
    const s = run(3, ['H', 0], ['H', 1], ['H', 2]);
    assert.equal(describeState(s.re, s.im, 3), '8 outcomes, 12.5% each');
  });

  test('list the four likeliest of many unequal outcomes, in basis order', () => {
    // H on qubits 1 and 2, then a rotation on qubit 0 (H then T then H)
    const s = run(3, ['H', 1], ['H', 2], ['H', 0], ['T', 0], ['H', 0]);
    const text = describeState(s.re, s.im, 3);
    assert.match(text, /^\|000⟩ 21\.3%, \|001⟩ 21\.3%, \|010⟩ 21\.3%, \|011⟩ 21\.3%, and 4 more$/);
  });

  test('format percentages and angles', () => {
    assert.equal(percent(0.5), '50%');
    assert.equal(percent(0.125), '12.5%');
    assert.equal(percent(1 / 3), '33.3%');
    assert.equal(degrees(Math.PI / 2), '90°');
    assert.equal(degrees(-Math.PI / 2), '−90°');
    assert.equal(degrees(-1e-12), '0°');
  });
});
