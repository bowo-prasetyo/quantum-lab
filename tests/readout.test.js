// Readout errors and their mitigation. Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  misread, sampleCountsWithReadout, confusionMatrix, recordedProbabilities, mitigateCounts
} from '../engine.js';

const close = (a, b, tol = 1e-12) => Math.abs(a - b) <= tol;

/** Small seeded random generator (mulberry32). */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RATES = { oneAsZero: 0.04, zeroAsOne: 0.01 };
const bell = [0.5, 0, 0, 0.5];

describe('readout errors', () => {
  test('one qubit: the confusion matrix, columns adding up to 1', () => {
    const M = confusionMatrix(RATES, 1);
    assert.deepEqual(M, [[0.99, 0.04], [0.01, 0.96]]);
    const M3 = confusionMatrix(RATES, 3);
    for (let t = 0; t < 8; t++) assert.ok(close(M3.reduce((s, row) => s + row[t], 0), 1));
    // |111⟩ read as |000⟩: all three ones misread
    assert.ok(close(M3[0][7], 0.04 ** 3));
  });

  test('a perfect readout changes nothing', () => {
    const perfect = { oneAsZero: 0, zeroAsOne: 0 };
    const counts = sampleCountsWithReadout(bell, 500, perfect, 2, seeded(1));
    assert.equal(counts[1] + counts[2], 0);
    assert.deepEqual(mitigateCounts([30, 0, 0, 70], perfect, 2).map(v => Number(v.toFixed(12))), [0.3, 0, 0, 0.7]);
  });

  test('misread flips bits with the right chances, ones more often than zeros', () => {
    let zeroToOne = 0, oneToZero = 0;
    const rnd = seeded(2);
    for (let k = 0; k < 20000; k++) {
      if (misread(0, 1, RATES, rnd) === 1) zeroToOne++;
      if (misread(1, 1, RATES, rnd) === 0) oneToZero++;
    }
    assert.ok(Math.abs(zeroToOne / 20000 - 0.01) < 0.003, `${zeroToOne}`);
    assert.ok(Math.abs(oneToZero / 20000 - 0.04) < 0.005, `${oneToZero}`);
  });

  test('a Bell pair read out with errors shows results the state can never give', () => {
    const counts = sampleCountsWithReadout(bell, 2000, RATES, 2, seeded(3));
    assert.equal(counts.reduce((a, b) => a + b), 2000);
    assert.ok(counts[1] + counts[2] > 20, `impossible results recorded: ${counts}`);
  });
});

describe('mitigation', () => {
  test('undoing the confusion matrix recovers the true probabilities exactly from expected counts', () => {
    for (const probs of [bell, [0.1, 0.2, 0.3, 0.4], [0, 0, 0, 1]]) {
      const recorded = recordedProbabilities(probs, RATES, 2).map(p => p * 1e6);
      mitigateCounts(recorded, RATES, 2).forEach((v, i) => assert.ok(close(v, probs[i], 1e-9), `${i}: ${v}`));
    }
    const ghz = [0.5, 0, 0, 0, 0, 0, 0, 0.5];
    const big = { oneAsZero: 0.15, zeroAsOne: 0.08 };
    mitigateCounts(recordedProbabilities(ghz, big, 3), big, 3).forEach((v, i) => assert.ok(close(v, ghz[i], 1e-9)));
  });

  test('from sampled counts, the estimates land near the truth and add up to 1', () => {
    const counts = sampleCountsWithReadout(bell, 20000, RATES, 2, seeded(4));
    const est = mitigateCounts(counts, RATES, 2);
    assert.ok(close(est.reduce((a, b) => a + b), 1, 1e-9));
    assert.ok(Math.abs(est[0] - 0.5) < 0.02 && Math.abs(est[3] - 0.5) < 0.02, `${est}`);
    assert.ok(Math.abs(est[1]) < 0.01 && Math.abs(est[2]) < 0.01, `${est}`);
  });

  test('with few shots an estimate can dip below 0', () => {
    // 100 shots of |00⟩ with no misreads at all: undoing the expected errors overshoots
    const est = mitigateCounts([100, 0, 0, 0], RATES, 2);
    assert.ok(est[1] < 0 && est[2] < 0, `${est}`);
    assert.ok(est[0] > 1);
  });

  test('rejects rates that can’t be undone or aren’t probabilities', () => {
    assert.throws(() => mitigateCounts([1, 1], { oneAsZero: 0.5, zeroAsOne: 0.5 }, 1), RangeError);
    assert.throws(() => confusionMatrix({ oneAsZero: -0.1, zeroAsOne: 0 }, 1), RangeError);
    assert.throws(() => misread(0, 1, { oneAsZero: 0.1 }, Math.random), RangeError);
  });
});
