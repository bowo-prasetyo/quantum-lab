// Unit tests for engine.js. Run with:  npm test   (or: node --test)
// Uses only Node's built-in test runner; no dependencies.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  GATES,
  zeroState,
  basisLabel,
  applyGate,
  applyCNOT,
  probabilities,
  measure,
  densityMatrix,
  reducedDensityMatrix,
  blochVector,
  zzCorrelation,
  isValidState,
  applyCZ,
  measureQubit
} from '../engine.js';

const EPS = 1e-12;
const S2 = Math.SQRT1_2;

// ---------- helpers ----------

/** Basis state |index⟩ for n qubits. */
function basis(index, n) {
  const s = zeroState(n);
  s.re[0] = 0;
  s.re[index] = 1;
  return s;
}

/** State from a list of [re, im] amplitudes. */
function state(amps) {
  return {
    re: Float64Array.from(amps, a => a[0]),
    im: Float64Array.from(amps, a => a[1])
  };
}

/** Applies a sequence of steps: ['H', q] or ['CNOT', control, target]. */
function run(n, steps, start = zeroState(n)) {
  let s = start;
  for (const [g, a, b] of steps) {
    s = g === 'CNOT'
      ? applyCNOT(s.re, s.im, a, b, n)
      : applyGate(s.re, s.im, g, a, n);
  }
  return s;
}

function assertState(actual, expected, msg = '') {
  assert.equal(actual.re.length, expected.re.length, `${msg} length`);
  for (let i = 0; i < expected.re.length; i++) {
    assert.ok(
      Math.abs(actual.re[i] - expected.re[i]) < EPS &&
      Math.abs(actual.im[i] - expected.im[i]) < EPS,
      `${msg} amplitude ${i}: got ${actual.re[i]}${actual.im[i] >= 0 ? '+' : ''}${actual.im[i]}i, ` +
      `expected ${expected.re[i]}${expected.im[i] >= 0 ? '+' : ''}${expected.im[i]}i`
    );
  }
}

function near(actual, expected, msg) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${msg}: got ${actual}, expected ${expected}`);
}

/** Small seeded random generator (mulberry32) for repeatable tests. */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random normalized n-qubit state. */
function randomState(n, rnd) {
  const size = 1 << n;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let norm = 0;
  for (let i = 0; i < size; i++) {
    re[i] = rnd() - 0.5;
    im[i] = rnd() - 0.5;
    norm += re[i] ** 2 + im[i] ** 2;
  }
  norm = Math.sqrt(norm);
  for (let i = 0; i < size; i++) { re[i] /= norm; im[i] /= norm; }
  return { re, im };
}

const total = s => probabilities(s.re, s.im).reduce((a, b) => a + b, 0);

// ---------- gates ----------

describe('single-qubit gates', () => {
  test('every gate matrix is unitary (U·U† = I)', () => {
    for (const [name, m] of Object.entries(GATES)) {
      for (let r = 0; r < 2; r++) {
        for (let col = 0; col < 2; col++) {
          let re = 0, im = 0;
          for (let k = 0; k < 2; k++) {
            const a = m[r][k], b = m[col][k]; // (U·U†)[r][col] = Σ U[r][k]·conj(U[col][k])
            re += a.re * b.re + a.im * b.im;
            im += a.im * b.re - a.re * b.im;
          }
          near(re, r === col ? 1 : 0, `${name} (U·U†)[${r}][${col}] real`);
          near(im, 0, `${name} (U·U†)[${r}][${col}] imaginary`);
        }
      }
    }
  });

  test('H|0⟩ = (|0⟩ + |1⟩)/√2 and H|1⟩ = (|0⟩ − |1⟩)/√2', () => {
    assertState(run(1, [['H', 0]]), state([[S2, 0], [S2, 0]]), 'H|0⟩');
    assertState(run(1, [['H', 0]], basis(1, 1)), state([[S2, 0], [-S2, 0]]), 'H|1⟩');
  });

  test('X|0⟩ = |1⟩ and Y|0⟩ = i|1⟩', () => {
    assertState(run(1, [['X', 0]]), state([[0, 0], [1, 0]]), 'X|0⟩');
    assertState(run(1, [['Y', 0]]), state([[0, 0], [0, 1]]), 'Y|0⟩');
  });

  test('Z, S and T only change the phase of |1⟩', () => {
    const plus = run(1, [['H', 0]]);
    assertState(run(1, [['Z', 0]], plus), state([[S2, 0], [-S2, 0]]), 'Z|+⟩');
    assertState(run(1, [['S', 0]], plus), state([[S2, 0], [0, S2]]), 'S|+⟩');
    assertState(run(1, [['T', 0]], plus), state([[S2, 0], [0.5, 0.5]]), 'T|+⟩');
  });

  test('identities hold on random states: S·S = Z, T·T = S, H·Z·H = X, H·H = I', () => {
    const rnd = seeded(1);
    for (let trial = 0; trial < 20; trial++) {
      const s = randomState(1, rnd);
      assertState(run(1, [['S', 0], ['S', 0]], s), run(1, [['Z', 0]], s), 'S·S = Z');
      assertState(run(1, [['T', 0], ['T', 0]], s), run(1, [['S', 0]], s), 'T·T = S');
      assertState(run(1, [['H', 0], ['Z', 0], ['H', 0]], s), run(1, [['X', 0]], s), 'H·Z·H = X');
      assertState(run(1, [['H', 0], ['H', 0]], s), s, 'H·H = I');
      assertState(run(1, [['I', 0]], s), s, 'I');
    }
  });

  test('qubit 0 is the leftmost digit', () => {
    // X on qubit 0 of 3: |000⟩ → |100⟩ (index 4); on qubit 2: → |001⟩ (index 1)
    assertState(run(3, [['X', 0]]), basis(4, 3), 'X on q0');
    assertState(run(3, [['X', 1]]), basis(2, 3), 'X on q1');
    assertState(run(3, [['X', 2]]), basis(1, 3), 'X on q2');
  });

  test('a gate acts only on its target qubit', () => {
    // H on q1 of |101⟩ → (|101⟩ + |111⟩)/√2
    const s = run(3, [['H', 1]], basis(0b101, 3));
    const expected = { re: new Float64Array(8), im: new Float64Array(8) };
    expected.re[0b101] = S2;
    expected.re[0b111] = S2;
    assertState(s, expected);
  });

  test('accepts a custom 2×2 matrix', () => {
    assertState(applyGate(...Object.values(zeroState(1)), GATES.X, 0, 1), basis(1, 1));
  });

  test('inputs are not modified', () => {
    const s = zeroState(2);
    applyGate(s.re, s.im, 'H', 0, 2);
    applyCNOT(s.re, s.im, 0, 1, 2);
    assertState(s, zeroState(2));
  });

  test('rejects unknown gates and out-of-range qubits', () => {
    const s = zeroState(2);
    assert.throws(() => applyGate(s.re, s.im, 'Q', 0, 2), /Unknown gate/);
    assert.throws(() => applyGate(s.re, s.im, 'H', 2, 2), RangeError);
    assert.throws(() => applyGate(s.re, s.im, 'H', -1, 2), RangeError);
  });
});

// ---------- CNOT ----------

describe('CNOT', () => {
  for (const n of [2, 3]) {
    test(`flips the target exactly when the control is 1, for every ordered pair (n = ${n})`, () => {
      for (let control = 0; control < n; control++) {
        for (let target = 0; target < n; target++) {
          if (control === target) continue;
          for (let index = 0; index < 1 << n; index++) {
            const controlSet = (index >> (n - 1 - control)) & 1;
            const expected = controlSet ? index ^ (1 << (n - 1 - target)) : index;
            assertState(
              run(n, [['CNOT', control, target]], basis(index, n)),
              basis(expected, n),
              `CNOT ${control}→${target} on ${basisLabel(index, n)}`
            );
          }
        }
      }
    });
  }

  test('rejects control equal to target', () => {
    const s = zeroState(2);
    assert.throws(() => applyCNOT(s.re, s.im, 1, 1, 2), RangeError);
  });
});

// ---------- known states ----------

describe('Bell and GHZ states', () => {
  test('H on q0 then CNOT 0→1 gives (|00⟩ + |11⟩)/√2', () => {
    assertState(
      run(2, [['H', 0], ['CNOT', 0, 1]]),
      state([[S2, 0], [0, 0], [0, 0], [S2, 0]])
    );
  });

  test('the 3-qubit Bell pair is (|000⟩ + |110⟩)/√2', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1]]);
    const p = probabilities(s.re, s.im);
    near(p[0b000], 0.5, 'P(000)');
    near(p[0b110], 0.5, 'P(110)');
  });

  test('H, CNOT 0→1, CNOT 1→2 gives GHZ (|000⟩ + |111⟩)/√2', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]);
    const expected = { re: new Float64Array(8), im: new Float64Array(8) };
    expected.re[0] = S2;
    expected.re[7] = S2;
    assertState(s, expected);
  });
});

// ---------- normalization ----------

describe('normalization', () => {
  test('total probability stays 1 through 200 random circuits', () => {
    const rnd = seeded(42);
    const names = Object.keys(GATES);
    for (let trial = 0; trial < 200; trial++) {
      const n = 1 + Math.floor(rnd() * 3);
      let s = randomState(n, rnd);
      for (let step = 0; step < 30; step++) {
        if (n > 1 && rnd() < 0.3) {
          const control = Math.floor(rnd() * n);
          const target = (control + 1 + Math.floor(rnd() * (n - 1))) % n;
          s = applyCNOT(s.re, s.im, control, target, n);
        } else {
          const g = names[Math.floor(rnd() * names.length)];
          s = applyGate(s.re, s.im, g, Math.floor(rnd() * n), n);
        }
      }
      near(total(s), 1, `trial ${trial}`);
    }
  });
});

// ---------- measurement ----------

describe('measurement', () => {
  test('collapses to a single basis state and labels it', () => {
    const s = run(3, [['H', 0], ['H', 1], ['H', 2]]);
    const m = measure(s.re, s.im, 3, seeded(7));
    assert.equal(probabilities(m.re, m.im).filter(p => p === 1).length, 1);
    assert.equal(m.re[m.index], 1);
    assert.equal(m.label, basisLabel(m.index, 3));
  });

  test('a basis state always measures as itself', () => {
    const rnd = seeded(3);
    for (let i = 0; i < 8; i++) {
      const s = basis(i, 3);
      for (let k = 0; k < 5; k++) assert.equal(measure(s.re, s.im, 3, rnd).index, i);
    }
  });

  test('H|0⟩ gives 0 and 1 about equally often (seeded, 10 000 shots)', () => {
    const s = run(1, [['H', 0]]);
    const rnd = seeded(2024);
    let ones = 0;
    for (let k = 0; k < 10000; k++) ones += measure(s.re, s.im, 1, rnd).index;
    assert.ok(ones > 4800 && ones < 5200, `got ${ones} ones out of 10000`);
  });

  test('a Bell pair only ever gives |00⟩ or |11⟩', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1]]);
    const rnd = seeded(5);
    const seen = new Set();
    for (let k = 0; k < 1000; k++) seen.add(measure(s.re, s.im, 2, rnd).label);
    assert.deepEqual([...seen].sort(), ['|00⟩', '|11⟩']);
  });

  test('never picks an outcome with probability 0, even at the ends of [0, 1)', () => {
    const one = run(1, [['X', 0]]);
    assert.equal(measure(one.re, one.im, 1, () => 0).label, '|1⟩');
    assert.equal(measure(one.re, one.im, 1, () => 1 - 2 ** -53).label, '|1⟩');
    const bell = run(2, [['H', 0], ['CNOT', 0, 1]]);
    assert.equal(measure(bell.re, bell.im, 2, () => 1 - 2 ** -53).label, '|11⟩');
  });

  test('basisLabel pads to the number of qubits', () => {
    assert.equal(basisLabel(0, 1), '|0⟩');
    assert.equal(basisLabel(2, 2), '|10⟩');
    assert.equal(basisLabel(4, 3), '|100⟩');
  });
});

// ---------- density matrices and Bloch vectors ----------

describe('density matrix', () => {
  test('is Hermitian with trace 1 and ρ² = ρ for a pure state', () => {
    const s = randomState(3, seeded(11));
    const { re, im, size } = densityMatrix(s.re, s.im);
    let trace = 0;
    for (let i = 0; i < size; i++) {
      trace += re[i * size + i];
      for (let j = 0; j < size; j++) {
        near(re[i * size + j], re[j * size + i], `Re ρ[${i}][${j}] symmetric`);
        near(im[i * size + j], -im[j * size + i], `Im ρ[${i}][${j}] antisymmetric`);
        // (ρ²)ij = Σk ρik ρkj
        let sqRe = 0, sqIm = 0;
        for (let k = 0; k < size; k++) {
          const aRe = re[i * size + k], aIm = im[i * size + k];
          const bRe = re[k * size + j], bIm = im[k * size + j];
          sqRe += aRe * bRe - aIm * bIm;
          sqIm += aRe * bIm + aIm * bRe;
        }
        near(sqRe, re[i * size + j], `(ρ²)[${i}][${j}] real`);
        near(sqIm, im[i * size + j], `(ρ²)[${i}][${j}] imaginary`);
      }
    }
    near(trace, 1, 'trace');
  });

  test('GHZ has exactly four non-zero entries, each 1/2, in the corners', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]);
    const { re, im, size } = densityMatrix(s.re, s.im);
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const corner = (i === 0 || i === 7) && (j === 0 || j === 7);
        near(Math.hypot(re[i * size + j], im[i * size + j]), corner ? 0.5 : 0, `|ρ[${i}][${j}]|`);
      }
    }
  });
});

describe('reduced states and Bloch vectors', () => {
  const vec = (s, q, n) => blochVector(s.re, s.im, q, n);
  const assertVec = (v, [x, y, z], msg) => {
    near(v.x, x, `${msg} x`); near(v.y, y, `${msg} y`); near(v.z, z, `${msg} z`);
  };

  test('|0⟩, |1⟩, |+⟩ and S|+⟩ point along +z, −z, +x and +y', () => {
    assertVec(vec(zeroState(1), 0, 1), [0, 0, 1], '|0⟩');
    assertVec(vec(basis(1, 1), 0, 1), [0, 0, -1], '|1⟩');
    assertVec(vec(run(1, [['H', 0]]), 0, 1), [1, 0, 0], '|+⟩');
    assertVec(vec(run(1, [['H', 0], ['S', 0]]), 0, 1), [0, 1, 0], 'S|+⟩');
  });

  test('a single-qubit state matches cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩', () => {
    const rnd = seeded(9);
    for (let trial = 0; trial < 20; trial++) {
      const theta = rnd() * Math.PI;
      const phi = rnd() * 2 * Math.PI;
      const s = state([
        [Math.cos(theta / 2), 0],
        [Math.cos(phi) * Math.sin(theta / 2), Math.sin(phi) * Math.sin(theta / 2)]
      ]);
      assertVec(vec(s, 0, 1), [
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta)
      ], `θ=${theta.toFixed(2)} φ=${phi.toFixed(2)}`);
    }
  });

  test('each qubit of a product state keeps its own vector', () => {
    // q0 = |+⟩, q1 = |1⟩, q2 = |0⟩
    const s = run(3, [['H', 0], ['X', 1]]);
    assertVec(vec(s, 0, 3), [1, 0, 0], 'q0');
    assertVec(vec(s, 1, 3), [0, 0, -1], 'q1');
    assertVec(vec(s, 2, 3), [0, 0, 1], 'q2');
  });

  test('entangled qubits shrink to the centre; an unentangled one does not', () => {
    const bell = run(3, [['H', 0], ['CNOT', 0, 1]]);
    assertVec(vec(bell, 0, 3), [0, 0, 0], 'Bell q0');
    assertVec(vec(bell, 1, 3), [0, 0, 0], 'Bell q1');
    assertVec(vec(bell, 2, 3), [0, 0, 1], 'Bell q2');

    const ghz = run(3, [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]);
    for (let q = 0; q < 3; q++) assertVec(vec(ghz, q, 3), [0, 0, 0], `GHZ q${q}`);
  });

  test('every reduced state has trace 1 and a Bloch vector no longer than 1', () => {
    const rnd = seeded(13);
    for (let trial = 0; trial < 50; trial++) {
      const s = randomState(3, rnd);
      for (let q = 0; q < 3; q++) {
        const r = reducedDensityMatrix(s.re, s.im, q, 3);
        near(r.rho00 + r.rho11, 1, 'trace');
        const v = vec(s, q, 3);
        assert.ok(Math.hypot(v.x, v.y, v.z) <= 1 + 1e-9, 'length ≤ 1');
      }
    }
  });
});

describe('⟨ZᵢZⱼ⟩ correlation', () => {
  const zz = (s, a, b) => zzCorrelation(s.re, s.im, a, b, 3);

  test('|000⟩ gives +1 on every pair, although nothing is entangled', () => {
    const s = zeroState(3);
    near(zz(s, 0, 1), 1, 'q0q1'); near(zz(s, 0, 2), 1, 'q0q2'); near(zz(s, 1, 2), 1, 'q1q2');
  });

  test('|100⟩ gives −1 between qubit 0 and the others', () => {
    const s = basis(0b100, 3);
    near(zz(s, 0, 1), -1, 'q0q1'); near(zz(s, 0, 2), -1, 'q0q2'); near(zz(s, 1, 2), 1, 'q1q2');
  });

  test('a Bell pair on q0, q1 gives 1 for that pair and 0 for pairs with q2', () => {
    const s = run(3, [['H', 0], ['CNOT', 0, 1]]);
    near(zz(s, 0, 1), 1, 'q0q1'); near(zz(s, 0, 2), 0, 'q0q2'); near(zz(s, 1, 2), 0, 'q1q2');
  });
});

describe('isValidState', () => {
  test('accepts normalized states of the right length', () => {
    for (const n of [1, 2, 3]) {
      const s = zeroState(n);
      assert.ok(isValidState(s.re, s.im, n), `|0…0⟩, n = ${n}`);
      const r = randomState(n, seeded(n));
      assert.ok(isValidState(r.re, r.im, n), `random, n = ${n}`);
      assert.ok(isValidState(Array.from(r.re), Array.from(r.im), n), `plain arrays, n = ${n}`);
    }
  });

  test('rejects wrong length, non-finite values and unnormalized states', () => {
    const s = zeroState(2);
    assert.equal(isValidState(s.re, s.im, 3), false, 'wrong length');
    assert.equal(isValidState([1, 0], [0], 1), false, 'mismatched arrays');
    assert.equal(isValidState([NaN, 0], [0, 0], 1), false, 'NaN');
    assert.equal(isValidState([1, 1], [0, 0], 1), false, 'total probability 2');
    assert.equal(isValidState([0, 0], [0, 0], 1), false, 'all zero');
    assert.equal(isValidState(undefined, undefined, 1), false, 'missing');
  });
});

describe('CZ', () => {
  test('flips the sign of |11⟩ only, on every pair of 3 qubits', () => {
    for (let a = 0; a < 3; a++) {
      for (let b = 0; b < 3; b++) {
        if (a === b) continue;
        for (let index = 0; index < 8; index++) {
          const bothSet = ((index >> (2 - a)) & 1) && ((index >> (2 - b)) & 1);
          const out = applyCZ(...Object.values(basis(index, 3)), a, b, 3);
          assert.equal(out.re[index], bothSet ? -1 : 1, `CZ ${a},${b} on ${basisLabel(index, 3)}`);
        }
      }
    }
  });

  test('is symmetric and equals H·CNOT·H on the target, on random states', () => {
    const rnd = seeded(21);
    for (let trial = 0; trial < 20; trial++) {
      const s = randomState(3, rnd);
      const cz = applyCZ(s.re, s.im, 0, 2, 3);
      assertState(applyCZ(s.re, s.im, 2, 0, 3), cz, 'symmetric');
      assertState(run(3, [['H', 2], ['CNOT', 0, 2], ['H', 2]], s), cz, 'H·CNOT·H');
    }
  });

  test('rejects control equal to target', () => {
    const s = zeroState(2);
    assert.throws(() => applyCZ(s.re, s.im, 0, 0, 2), RangeError);
  });
});

describe('measuring one qubit', () => {
  test('on a product state, only that qubit collapses', () => {
    // q0 = |+⟩, q1 = |+⟩: measure q0; q1 stays |+⟩
    const s = run(2, [['H', 0], ['H', 1]]);
    for (const seed of [1, 2, 3, 4]) {
      const m = measureQubit(s.re, s.im, 0, 2, seeded(seed));
      const v1 = blochVector(m.re, m.im, 1, 2);
      near(v1.x, 1, 'q1 still along +x');
      const v0 = blochVector(m.re, m.im, 0, 2);
      near(v0.z, m.bit ? -1 : 1, 'q0 at the pole matching the result');
      near(m.probability, 0.5, 'P = 1/2');
      near(probabilities(m.re, m.im).reduce((a, b) => a + b, 0), 1, 'normalized');
    }
  });

  test('on a Bell pair, measuring qubit 0 also fixes qubit 1', () => {
    const s = run(2, [['H', 0], ['CNOT', 0, 1]]);
    const seen = new Set();
    const rnd = seeded(8);
    for (let k = 0; k < 50; k++) {
      const m = measureQubit(s.re, s.im, 0, 2, rnd);
      const p = probabilities(m.re, m.im);
      near(p[m.bit ? 3 : 0], 1, 'collapsed to |00⟩ or |11⟩');
      seen.add(m.bit);
    }
    assert.deepEqual([...seen].sort(), [0, 1], 'both results occur');
  });

  test('follows the state\'s probabilities (seeded, 10 000 shots)', () => {
    // Bloch angle θ = 120°: P(1) = sin²(60°) = 0.75
    const s = state([[0.5, 0], [Math.sqrt(3) / 2, 0]]);
    const rnd = seeded(99);
    let ones = 0;
    for (let k = 0; k < 10000; k++) ones += measureQubit(s.re, s.im, 0, 1, rnd).bit;
    assert.ok(ones > 7300 && ones < 7700, `got ${ones} ones`);
  });

  test('keeps the relative phases of the surviving amplitudes', () => {
    // (|00⟩ + i|01⟩ + |10⟩ + i|11⟩)/2: measure q0 → (|x0⟩ + i|x1⟩)/√2
    const s = state([[0.5, 0], [0, 0.5], [0.5, 0], [0, 0.5]]);
    const m = measureQubit(s.re, s.im, 0, 2, () => 0.9); // gives 0
    assert.equal(m.bit, 0);
    assertState(m, state([[S2, 0], [0, S2], [0, 0], [0, 0]]));
  });

  test('a certain result is always given', () => {
    const s = basis(0b101, 3);
    for (const q of [0, 1, 2]) {
      const m = measureQubit(s.re, s.im, q, 3, seeded(q));
      assert.equal(m.bit, (0b101 >> (2 - q)) & 1);
      near(m.probability, 1, 'probability 1');
    }
  });
});
