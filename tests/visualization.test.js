// The maths behind the Shots, Interference and Entanglement views.
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  zeroState, applyGate, applyCNOT, applyCZ,
  sampleCounts, amplitudePaths, entanglementEntropy, mutualInformation,
  withoutGlobalPhase, probabilities, blochVector, densityMatrix
} from '../engine.js';
import { entanglementVerdict } from '../components/entanglement-panel.js';
import { stepFromMessage, layArrows } from '../components/interference-view.js';

const close = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol;

/** Small seeded random generator (mulberry32) for repeatable shots. */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Runs [['H', q], ['CNOT', c, t], ['CZ', a, b]] from |0…0⟩. */
function run(n, steps) {
  let s = zeroState(n);
  for (const [g, a, b] of steps) {
    if (g === 'CNOT') s = applyCNOT(s.re, s.im, a, b, n);
    else if (g === 'CZ') s = applyCZ(s.re, s.im, a, b, n);
    else s = applyGate(s.re, s.im, g, a, n);
  }
  return s;
}

const entropies = (s, n) => [...Array(n).keys()].map(q => entanglementEntropy(s.re, s.im, q, n));

describe('sampleCounts (Shots view)', () => {
  test('counts add up to the number of shots and leave the state alone', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1]]);
    const before = [...s.re];
    const counts = sampleCounts(s.re, s.im, 1000, seeded(1));
    assert.equal(counts.reduce((a, b) => a + b), 1000);
    assert.deepEqual([...s.re], before);
  });

  test('impossible outcomes never come up', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1]]);
    const counts = sampleCounts(s.re, s.im, 5000, seeded(2));
    assert.equal(counts[1], 0);
    assert.equal(counts[2], 0);
    assert.ok(counts[0] > 2300 && counts[3] > 2300, `counts ${counts}`);
  });

  test('frequencies approach the probabilities', () => {
    const s = run(1, [['H', 0], ['T', 0], ['H', 0]]); // P(0) = cos²(π/8) ≈ 0.854
    const counts = sampleCounts(s.re, s.im, 20000, seeded(3));
    assert.ok(Math.abs(counts[0] / 20000 - Math.cos(Math.PI / 8) ** 2) < 0.01, `got ${counts[0]}`);
  });

  test('a basis state always gives itself; bad shot counts are rejected', () => {
    const s = run(3, [['X', 1]]);
    assert.deepEqual(sampleCounts(s.re, s.im, 50, seeded(4)), [0, 0, 50, 0, 0, 0, 0, 0]);
    assert.throws(() => sampleCounts(s.re, s.im, 1.5), RangeError);
  });
});

describe('amplitudePaths (Interference view)', () => {
  const H = (q, n) => (re, im) => applyGate(re, im, 'H', q, n);

  test('H on |+⟩: the paths to |0⟩ add up, the paths to |1⟩ cancel', () => {
    const plus = run(1, [['H', 0]]);
    const [out0, out1] = amplitudePaths(plus.re, plus.im, H(0, 1), 1);
    assert.equal(out0.kind, 'constructive');
    assert.equal(out0.paths.length, 2);
    assert.ok(close(out0.probability, 1) && close(out0.without, 0.5));
    assert.equal(out1.kind, 'cancel');
    assert.equal(out1.paths.length, 2);
    assert.ok(close(out1.probability, 0) && close(out1.without, 0.5));
  });

  test('H on |−⟩ (the interference lesson): now |0⟩ cancels and |1⟩ adds up', () => {
    const minus = run(1, [['H', 0], ['Z', 0]]);
    const [out0, out1] = amplitudePaths(minus.re, minus.im, H(0, 1), 1);
    assert.equal(out0.kind, 'cancel');
    assert.equal(out1.kind, 'constructive');
    assert.ok(close(out1.re, -1) || close(out1.re, 1));
  });

  test('the paths always sum to what the gate really gives', () => {
    const s = run(3, [['H', 0], ['T', 0], ['H', 1], ['CNOT', 0, 2], ['S', 2], ['H', 2]]);
    const steps = [H(1, 3), (re, im) => applyCNOT(re, im, 2, 0, 3), (re, im) => applyCZ(re, im, 0, 1, 3)];
    for (const apply of steps) {
      const after = apply(s.re, s.im);
      for (const out of amplitudePaths(s.re, s.im, apply, 3)) {
        assert.ok(close(out.re, after.re[out.index]) && close(out.im, after.im[out.index]));
      }
    }
  });

  test('a path 90° from another neither adds nor cancels', () => {
    // H on (|0⟩ + i|1⟩)/√2: each output gets paths 1/2 and ±i/2
    const s = run(1, [['H', 0], ['S', 0]]);
    for (const out of amplitudePaths(s.re, s.im, H(0, 1), 1)) {
      assert.equal(out.kind, 'neutral');
      assert.ok(close(out.probability, out.without));
    }
  });

  test('X, phase gates, CNOT and CZ give one path per output', () => {
    const s = run(2, [['H', 0], ['H', 1]]);
    for (const apply of [
      (re, im) => applyGate(re, im, 'X', 0, 2),
      (re, im) => applyGate(re, im, 'T', 1, 2),
      (re, im) => applyCNOT(re, im, 0, 1, 2),
      (re, im) => applyCZ(re, im, 0, 1, 2)
    ]) {
      for (const out of amplitudePaths(s.re, s.im, apply, 2)) assert.equal(out.kind, 'single');
    }
  });

  test('outputs nothing can reach have no paths', () => {
    const s = zeroState(2);
    const outs = amplitudePaths(s.re, s.im, H(0, 2), 2);
    assert.deepEqual(outs.map(o => o.kind), ['single', 'none', 'single', 'none']);
  });

  test('arrows are laid head to tail; one that doubles back is moved aside', () => {
    const [a, b] = layArrows([{ re: 0.5, im: 0 }, { re: -0.5, im: 0 }], 80);
    assert.deepEqual([a.x1, a.y1, a.x2, a.y2], [0, 0, 40, 0]);
    assert.ok(close(b.x1, 40) && close(b.x2, 0), 'the second starts where the first ends');
    assert.ok(Math.abs(b.y1) > 3 && close(b.y1, b.y2), 'and runs beside it, not over it');
    const [c, d] = layArrows([{ re: 0.5, im: 0 }, { re: 0, im: 0.5 }], 80);
    assert.ok(close(d.x1, c.x2) && close(d.y1, c.y2) && close(d.y2, -40), 'a turn stays joined (y is down)');
  });

  test('stepFromMessage turns the lab\'s worker messages into steps', () => {
    const s = zeroState(2);
    const gate = stepFromMessage({ type: 'gate', gate: 'H', targetQubit: 1 }, 2);
    assert.equal(gate.name, 'H on qubit 1');
    assert.ok(close(gate.apply(s.re, s.im).re[1], Math.SQRT1_2));
    assert.match(stepFromMessage({ type: 'cnot', control: 0, target: 1 }, 2).name, /^CNOT/);
    assert.match(stepFromMessage({ type: 'cz', control: 0, target: 1 }, 2).name, /^CZ/);
    assert.equal(stepFromMessage({ type: 'measure' }, 2), null);
    assert.equal(stepFromMessage({ type: 'measureQubit', targetQubit: 0 }, 2), null);
  });
});

describe('entanglementEntropy and mutualInformation (Entanglement view)', () => {
  test('product states: no entropy, no mutual information', () => {
    for (const s of [zeroState(2), run(2, [['H', 0], ['T', 0], ['H', 1]])]) {
      assert.ok(entropies(s, 2).every(v => close(v, 0, 1e-9)));
      assert.ok(close(mutualInformation(s.re, s.im, 0, 1, 2), 0, 1e-9));
    }
  });

  test('Bell pair: 1 bit each, 2 bits shared', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1]]);
    assert.ok(entropies(s, 2).every(v => close(v, 1)));
    assert.ok(close(mutualInformation(s.re, s.im, 0, 1, 2), 2));
  });

  test('an entangled pair the ⟨ZZ⟩ graph misses still shows 2 bits', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1], ['H', 1]]);
    assert.ok(close(mutualInformation(s.re, s.im, 0, 1, 2), 2));
  });

  test('partial entanglement is between 0 and 1', () => {
    // cos(π/8)|00⟩ + sin(π/8)|11⟩
    const s = run(2, [['H', 0], ['T', 0], ['H', 0], ['CNOT', 0, 1]]);
    const p = Math.cos(Math.PI / 8) ** 2;
    const expected = -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
    assert.ok(close(entanglementEntropy(s.re, s.im, 0, 2), expected, 1e-9));
  });

  test('GHZ: every qubit 1 bit, every pair 1 bit', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]);
    assert.ok(entropies(s, 3).every(v => close(v, 1)));
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) assert.ok(close(mutualInformation(s.re, s.im, a, b, 3), 1));
  });

  test('Bell pair plus a spare qubit: 2 bits between the pair, 0 to the spare', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1], ['H', 2]]);
    assert.ok(close(mutualInformation(s.re, s.im, 0, 1, 3), 2));
    assert.ok(close(mutualInformation(s.re, s.im, 0, 2, 3), 0, 1e-9));
    assert.ok(close(mutualInformation(s.re, s.im, 1, 2, 3), 0, 1e-9));
  });

  test('rejects a qubit paired with itself and unsupported sizes', () => {
    const s = zeroState(2);
    assert.throws(() => mutualInformation(s.re, s.im, 1, 1, 2), RangeError);
    const one = zeroState(1);
    assert.throws(() => mutualInformation(one.re, one.im, 0, 0, 1), RangeError);
  });
});

describe('entanglementVerdict', () => {
  test('names which qubits are entangled with which', () => {
    assert.match(entanglementVerdict([0, 0]), /^No entanglement/);
    assert.match(entanglementVerdict([1, 1]), /maximally entangled, as in a Bell pair/);
    assert.match(entanglementVerdict([0.6, 0.6]), /partly entangled/);
    assert.match(entanglementVerdict([0, 0, 0]), /^No entanglement/);
    assert.equal(entanglementVerdict([1, 1, 0]), 'Qubits 0 and 1 are entangled with each other; qubit 2 is separate.');
    assert.equal(entanglementVerdict([0, 0.5, 0.5]), 'Qubits 1 and 2 are entangled with each other; qubit 0 is separate.');
    assert.match(entanglementVerdict([1, 1, 1]), /^All three qubits are entangled together/);
  });

  test('agrees with the states it is used on', () => {
    const bellPlusSpare = run(3, [['H', 0], ['CNOT', 0, 1], ['H', 2]]);
    assert.match(entanglementVerdict(entropies(bellPlusSpare, 3)), /qubit 2 is separate/);
    const ghz = run(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]);
    assert.match(entanglementVerdict(entropies(ghz, 3)), /^All three/);
  });
});

describe('withoutGlobalPhase (Hide global phase)', () => {
  test('makes the first non-zero amplitude real and positive, and keeps relative phases', () => {
    // Y·X = −iZ, so this is −i·Z(|0⟩ + i|1⟩)/√2: a state with a global phase of −90°
    const s = run(1, [['H', 0], ['S', 0], ['X', 0], ['Y', 0]]);
    assert.ok(close(s.im[0], -Math.SQRT1_2), 'starts with a phase on |0⟩');
    const g = withoutGlobalPhase(s.re, s.im);
    assert.equal(g.reference, 0);
    assert.ok(g.re[0] > 0 && g.im[0] === 0);
    // relative phase ψ1/ψ0 is unchanged
    const rel = (re, im) => Math.atan2(im[1] * re[0] - re[1] * im[0], re[1] * re[0] + im[1] * im[0]);
    assert.ok(close(rel(g.re, g.im), rel(s.re, s.im)));
  });

  test('skips leading zero amplitudes', () => {
    const s = run(2, [['X', 0], ['H', 1], ['S', 0]]); // i|1⟩(|0⟩+|1⟩)/√2
    const g = withoutGlobalPhase(s.re, s.im);
    assert.equal(g.reference, 2);
    assert.ok(close(g.re[2], Math.SQRT1_2) && g.im[2] === 0);
    assert.ok(close(g.re[3], Math.SQRT1_2) && close(g.im[3], 0));
  });

  test('turns Grover\'s −1 into 1 and changes nothing measurable', () => {
    const s = run(2, [['H', 0], ['H', 1], ['CZ', 0, 1], ['H', 0], ['H', 1], ['X', 0], ['X', 1],
      ['CZ', 0, 1], ['X', 0], ['X', 1], ['H', 0], ['H', 1]]);
    assert.ok(close(s.re[3], -1));
    const g = withoutGlobalPhase(s.re, s.im);
    assert.ok(close(g.re[3], 1));

    const t = run(3, [['H', 0], ['T', 0], ['CNOT', 0, 1], ['H', 2], ['S', 2], ['Y', 1]]);
    const h = withoutGlobalPhase(t.re, t.im);
    probabilities(t.re, t.im).forEach((p, i) => assert.ok(close(p, probabilities(h.re, h.im)[i])));
    for (let q = 0; q < 3; q++) {
      const a = blochVector(t.re, t.im, q, 3);
      const b = blochVector(h.re, h.im, q, 3);
      assert.ok(close(a.x, b.x) && close(a.y, b.y) && close(a.z, b.z));
    }
    const da = densityMatrix(t.re, t.im);
    const db = densityMatrix(h.re, h.im);
    da.re.forEach((v, k) => assert.ok(close(v, db.re[k]) && close(da.im[k], db.im[k])));
  });

  test('leaves its input alone; an all-zero state comes back as it is', () => {
    const s = run(1, [['H', 0], ['Z', 0], ['X', 0]]);
    const before = [...s.re];
    withoutGlobalPhase(s.re, s.im);
    assert.deepEqual([...s.re], before);
    const zero = withoutGlobalPhase(new Float64Array(2), new Float64Array(2));
    assert.equal(zero.reference, -1);
  });
});
