// The one-line gate descriptions shown in the lab (components/gate-hints.js)
// must be true. Each claim they make is checked with the engine here.
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { GATE_INFO } from '../components/gate-hints.js';
import { GATES, zeroState, applyGate, applyCNOT, applyCZ } from '../engine.js';

const EPS = 1e-9;

// |0⟩ or |1⟩ on one qubit
const ket = bit => {
  const s = zeroState(1);
  return bit ? applyGate(s.re, s.im, 'X', 0, 1) : s;
};
const apply = (state, ...gates) => gates.reduce((s, g) => applyGate(s.re, s.im, g, 0, 1), state);
const close = (actual, expected, label) => {
  assert.ok(Math.abs(actual - expected) < EPS, `${label}: ${actual} ≠ ${expected}`);
};
const sameState = (a, b, label) => {
  for (let i = 0; i < a.re.length; i++) {
    close(a.re[i], b.re[i], `${label} re[${i}]`);
    close(a.im[i], b.im[i], `${label} im[${i}]`);
  }
};
// Phase of the |1⟩ amplitude in degrees
const phaseOf1 = s => Math.atan2(s.im[1], s.re[1]) * 180 / Math.PI;

describe('Gate descriptions', () => {
  test('describe every gate the lab offers, in one line each', () => {
    assert.deepEqual(
      Object.keys(GATE_INFO).sort(),
      [...Object.keys(GATES), 'M', 'N', 'CNOT', 'CZ'].sort()
    );
    for (const [gate, text] of Object.entries(GATE_INFO)) {
      assert.ok(text.length > 10 && !text.includes('\n'), gate);
    }
  });

  test('I leaves the qubit unchanged', () => {
    const plus = apply(ket(0), 'H', 'T');
    sameState(apply(plus, 'I'), plus, 'I');
  });

  test('H makes an equal superposition, and twice undoes it', () => {
    const s = apply(ket(0), 'H');
    close(s.re[0] ** 2 + s.im[0] ** 2, 0.5, 'P(0)');
    close(s.re[1] ** 2 + s.im[1] ** 2, 0.5, 'P(1)');
    sameState(apply(ket(1), 'H', 'H'), ket(1), 'HH');
  });

  test('X swaps |0⟩ and |1⟩', () => {
    sameState(apply(ket(0), 'X'), ket(1), 'X|0⟩');
    sameState(apply(ket(1), 'X'), ket(0), 'X|1⟩');
  });

  test('Y swaps and adds a phase: Y|0⟩ = i|1⟩', () => {
    const s = apply(ket(0), 'Y');
    sameState(s, { re: Float64Array.of(0, 0), im: Float64Array.of(0, 1) }, 'Y|0⟩');
  });

  test('Z, S and T give |1⟩ phases of 180°, 90° and 45°, and leave |0⟩ alone', () => {
    close(Math.abs(phaseOf1(apply(ket(1), 'Z'))), 180, 'Z');
    close(phaseOf1(apply(ket(1), 'S')), 90, 'S');
    close(phaseOf1(apply(ket(1), 'T')), 45, 'T');
    for (const g of ['Z', 'S', 'T']) sameState(apply(ket(0), g), ket(0), `${g}|0⟩`);
  });

  test('S twice is Z, and T twice is S', () => {
    const plus = apply(ket(0), 'H');
    sameState(apply(plus, 'S', 'S'), apply(plus, 'Z'), 'SS');
    sameState(apply(plus, 'T', 'T'), apply(plus, 'S'), 'TT');
  });

  test('CNOT flips the target only when the control is 1', () => {
    // |10⟩ (qubit 0 = 1) → |11⟩; |00⟩ unchanged
    let s = zeroState(2);
    s = applyGate(s.re, s.im, 'X', 0, 2);
    s = applyCNOT(s.re, s.im, 0, 1, 2);
    close(s.re[0b11], 1, 'CNOT|10⟩');
    const z = zeroState(2);
    sameState(applyCNOT(z.re, z.im, 0, 1, 2), z, 'CNOT|00⟩');
  });

  test('CZ flips the sign where both are 1, whichever is the control', () => {
    let s = zeroState(2);
    s = applyGate(s.re, s.im, 'H', 0, 2);
    s = applyGate(s.re, s.im, 'H', 1, 2);
    const a = applyCZ(s.re, s.im, 0, 1, 2);
    const b = applyCZ(s.re, s.im, 1, 0, 2);
    sameState(a, b, 'symmetric');
    assert.deepEqual([...a.re].map(v => Math.sign(Math.round(v * 1e6))), [1, 1, 1, -1]);
  });
});
