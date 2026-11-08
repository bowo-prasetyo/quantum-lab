// The maths behind the Unitary Matrix view. Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { applyGate, applyCNOT, applyCZ, unitaryOf, unitarityError, zeroState } from '../engine.js';
import { entryText, circuitStepApply } from '../components/unitary-view.js';

const close = (a, b) => Math.abs(a - b) < 1e-12;
const at = (U, i, j) => [U.re[i * U.size + j], U.im[i * U.size + j]];
const r = Math.SQRT1_2;

describe('unitaryOf', () => {
  test('H on one qubit is [[r, r], [r, −r]]', () => {
    const U = unitaryOf((re, im) => applyGate(re, im, 'H', 0, 1), 1);
    assert.deepEqual([at(U, 0, 0), at(U, 0, 1), at(U, 1, 0), at(U, 1, 1)].map(([a]) => Math.sign(a)), [1, 1, 1, -1]);
    assert.ok(close(at(U, 1, 1)[0], -r));
  });

  test('CNOT q0→q1 swaps |10⟩ and |11⟩; CZ is diagonal and the same both ways', () => {
    const cnot = unitaryOf((re, im) => applyCNOT(re, im, 0, 1, 2), 2);
    const expected = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 0, 1], [0, 0, 1, 0]];
    expected.forEach((row, i) => row.forEach((v, j) => assert.ok(close(at(cnot, i, j)[0], v), `${i},${j}`)));

    const cz01 = unitaryOf((re, im) => applyCZ(re, im, 0, 1, 2), 2);
    const cz10 = unitaryOf((re, im) => applyCZ(re, im, 1, 0, 2), 2);
    assert.deepEqual([...cz01.re], [...cz10.re]);
    assert.deepEqual([0, 5, 10, 15].map(k => cz01.re[k]), [1, 1, 1, -1]);
  });

  test('every gate, on every qubit of 3, is unitary', () => {
    for (const g of ['I', 'H', 'X', 'Y', 'Z', 'S', 'T']) {
      for (let q = 0; q < 3; q++) {
        assert.ok(unitarityError(unitaryOf((re, im) => applyGate(re, im, g, q, 3), 3)) < 1e-12, `${g} q${q}`);
      }
    }
  });

  test('a non-unitary matrix is caught', () => {
    const notUnitary = { re: Float64Array.from([1, 1, 0, 1]), im: new Float64Array(4), size: 2 };
    assert.ok(unitarityError(notUnitary) > 0.5);
  });

  test('a whole circuit: the Bell circuit sends |00⟩ to (|00⟩ + |11⟩)/√2', () => {
    const steps = [{ gate: 'H', target: 0 }, { gate: 'CNOT', control: 0, target: 1 }].map(s => circuitStepApply(s, 2));
    const U = unitaryOf((re, im) => steps.reduce((s, f) => f(s.re, s.im), { re, im }), 2);
    const col0 = [0, 1, 2, 3].map(i => at(U, i, 0)[0]);
    [r, 0, 0, r].forEach((v, i) => assert.ok(close(col0[i], v)));
    assert.equal(circuitStepApply({ gate: 'M', target: 0 }, 2), null);
    // Column 0 is what the circuit does to |00⟩
    const s = zeroState(2);
    const out = steps.reduce((st, f) => f(st.re, st.im), s);
    [0, 1, 2, 3].forEach(i => assert.ok(close(out.re[i], col0[i])));
  });
});

describe('entryText', () => {
  test('short forms for real, imaginary and general entries', () => {
    assert.equal(entryText(0, 0), '');
    assert.equal(entryText(1, 0), '1');
    assert.equal(entryText(-r, 0), '−0.71');
    assert.equal(entryText(0, r), '0.71i');
    assert.equal(entryText(0, -1), '−1i');
    assert.equal(entryText(0.5, 0.5), '0.71∠45°');
    assert.equal(entryText(-0.5, -0.5), '0.71∠−135°');
  });
});
