// Mixed states and noise: density-matrix evolution agrees with the pure
// simulator, and each noise channel does what its description says.
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  zeroState, applyGate, applyCNOT, densityMatrix, blochVector, probabilities, pauliExpectation,
  applyToRho, applyNoise, rhoProbabilities, purity, rhoBlochVector, rhoPauliExpectation,
  rhoMeasure, rhoMeasureQubit, probabilityAmplitudes, isValidRho, sampleCountsFromProbabilities
} from '../engine.js';

const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;
const r = Math.SQRT1_2;

function run(n, steps) {
  let s = zeroState(n);
  for (const [g, a, b] of steps) s = g === 'CNOT' ? applyCNOT(s.re, s.im, a, b, n) : applyGate(s.re, s.im, g, a, n);
  return s;
}
const rhoOf = (n, steps) => { const s = run(n, steps); return densityMatrix(s.re, s.im); };
const sameRho = (a, b) => a.re.every((v, k) => close(v, b.re[k]) && close(a.im[k], b.im[k]));

describe('density-matrix evolution matches the pure simulator', () => {
  const start = [['H', 0], ['T', 0], ['H', 1], ['CNOT', 0, 2], ['S', 2], ['Y', 1]];

  test('gates and CNOT: UρU† = |Uψ⟩⟨Uψ|', () => {
    const s = run(3, start);
    const rho = densityMatrix(s.re, s.im);
    for (const apply of [
      (re, im) => applyGate(re, im, 'H', 1, 3),
      (re, im) => applyGate(re, im, 'T', 2, 3),
      (re, im) => applyCNOT(re, im, 2, 0, 3)
    ]) {
      const after = apply(s.re, s.im);
      assert.ok(sameRho(applyToRho(rho, apply), densityMatrix(after.re, after.im)));
    }
  });

  test('probabilities, Bloch vectors and Pauli expectations agree for a pure ρ', () => {
    const s = run(3, start);
    const rho = densityMatrix(s.re, s.im);
    rhoProbabilities(rho).forEach((p, i) => assert.ok(close(p, probabilities(s.re, s.im)[i])));
    for (let q = 0; q < 3; q++) {
      const a = blochVector(s.re, s.im, q, 3);
      const b = rhoBlochVector(rho, q, 3);
      assert.ok(close(a.x, b.x) && close(a.y, b.y) && close(a.z, b.z));
    }
    for (const p of ['XIZ', 'YYI', 'ZXY', 'III']) assert.ok(close(rhoPauliExpectation(rho, p, 3), pauliExpectation(s.re, s.im, p, 3)), p);
    assert.ok(close(purity(rho), 1));
  });
});

describe('noise channels', () => {
  test('dephasing shrinks x and y by (1 − λ), keeps probabilities; full strength leaves a coin', () => {
    for (const λ of [0, 0.3, 1]) {
      const rho = applyNoise(rhoOf(1, [['H', 0], ['T', 0]]), 'dephasing', 0, λ, 1);
      const v = rhoBlochVector(rho, 0, 1);
      assert.ok(close(v.x, r * (1 - λ)) && close(v.y, r * (1 - λ)) && close(v.z, 0));
      assert.ok(close(rhoProbabilities(rho)[0], 0.5));
      assert.ok(close(purity(rho), (1 + (1 - λ) ** 2) / 2));
    }
  });

  test('depolarizing shrinks the vector by (1 − λ) in every direction', () => {
    const rho0 = rhoOf(1, [['H', 0], ['T', 0], ['H', 0]]);
    const before = rhoBlochVector(rho0, 0, 1);
    const v = rhoBlochVector(applyNoise(rho0, 'depolarizing', 0, 0.4, 1), 0, 1);
    for (const k of ['x', 'y', 'z']) assert.ok(close(v[k], 0.6 * before[k]));
    assert.ok(close(purity(applyNoise(rho0, 'depolarizing', 0, 1, 1)), 0.5), 'full strength: completely random');
  });

  test('damping pulls towards |0⟩: |1⟩ survives with 1 − γ; full strength resets', () => {
    const one = rhoOf(1, [['X', 0]]);
    assert.ok(close(rhoProbabilities(applyNoise(one, 'damping', 0, 0.25, 1))[1], 0.75));
    assert.ok(close(rhoProbabilities(applyNoise(one, 'damping', 0, 1, 1))[0], 1));
    const plus = applyNoise(rhoOf(1, [['H', 0]]), 'damping', 0, 0.36, 1);
    const v = rhoBlochVector(plus, 0, 1);
    assert.ok(close(v.x, 0.8) && close(v.z, 0.36));
  });

  test('GHZ, fully dephased on one qubit: the corners vanish, the diagonal stays', () => {
    const rho = applyNoise(rhoOf(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]), 'dephasing', 0, 1, 3);
    const at = (i, j) => Math.hypot(rho.re[i * 8 + j], rho.im[i * 8 + j]);
    assert.ok(close(at(0, 0), 0.5) && close(at(7, 7), 0.5));
    assert.ok(close(at(0, 7), 0) && close(at(7, 0), 0));
    assert.ok(close(purity(rho), 0.5));
  });

  test('every channel keeps a valid density matrix, and only touches its qubit', () => {
    const rho = rhoOf(2, [['H', 0], ['T', 0], ['CNOT', 0, 1], ['H', 1]]);
    for (const ch of ['dephasing', 'depolarizing', 'damping']) {
      const out = applyNoise(rho, ch, 1, 0.5, 2);
      assert.ok(isValidRho(out, 2), ch);
      // Qubit 0's own state doesn't change when only qubit 1 is noisy
      const a = rhoBlochVector(rho, 0, 2);
      const b = rhoBlochVector(out, 0, 2);
      assert.ok(close(a.x, b.x) && close(a.y, b.y) && close(a.z, b.z), ch);
    }
    assert.throws(() => applyNoise(rho, 'bitrot', 0, 0.5, 2));
    assert.throws(() => applyNoise(rho, 'dephasing', 0, 1.5, 2), RangeError);
  });
});

describe('measuring a mixed state', () => {
  // ½(|00⟩⟨00| + |11⟩⟨11|): a Bell pair whose coherence noise removed
  const mixed = applyNoise(rhoOf(2, [['H', 0], ['CNOT', 0, 1]]), 'dephasing', 0, 1, 2);

  test('measuring every qubit gives a pure basis state', () => {
    const m = rhoMeasure(mixed, 2, () => 0.9);
    assert.equal(m.label, '|11⟩');
    assert.equal(m.re[3], 1);
    assert.equal(rhoMeasure(mixed, 2, () => 0).label, '|00⟩');
  });

  test('measuring one qubit keeps what agrees with it', () => {
    const m = rhoMeasureQubit(mixed, 0, 2, () => 0.2); // 0.2 < P(1) = 0.5 → 1
    assert.equal(m.bit, 1);
    assert.ok(close(m.probability, 0.5));
    assert.ok(close(m.rho.re[15], 1) && close(purity(m.rho), 1));
  });

  test('probability amplitudes and shots follow the diagonal', () => {
    const { re, im } = probabilityAmplitudes(mixed);
    assert.deepEqual([...re].map(v => Number(v.toFixed(6))), [Number(r.toFixed(6)), 0, 0, Number(r.toFixed(6))]);
    assert.ok(im.every(v => v === 0));
    const counts = sampleCountsFromProbabilities(rhoProbabilities(mixed), 1000, () => 0.7);
    assert.deepEqual(counts, [0, 0, 0, 1000]);
  });

  test('isValidRho rejects bad matrices', () => {
    assert.ok(isValidRho(mixed, 2));
    assert.ok(!isValidRho(mixed, 3), 'wrong size');
    const bad = { ...mixed, re: Float64Array.from(mixed.re, (v, k) => (k === 0 ? v + 0.5 : v)) };
    assert.ok(!isValidRho(bad, 2), 'trace');
    const notHermitian = { ...mixed, im: Float64Array.from(mixed.im, (v, k) => (k === 1 ? 0.3 : v)) };
    assert.ok(!isValidRho(notHermitian, 2), 'Hermitian');
  });
});
