// Quantum simulation engine: pure functions, no DOM, no Vue.
//
// Used by worker.js (gates, CNOT, measurement) and by the page (everything
// it displays), and covered by tests/engine.test.js.
//
// Conventions
// - A state of n qubits is two Float64Arrays of length 2^n: `re` and `im`,
//   the real and imaginary parts of the amplitudes.
// - Basis index bits are written with qubit 0 on the LEFT, so for n = 3
//   index 4 = binary 100 = |100⟩ means qubit 0 is 1.
//   Qubit q therefore lives at bit position (n - 1 - q).
// - Functions never modify their inputs; they return new arrays.

// Written as 1 / Math.sqrt(2) (0.7071067811865475) rather than Math.SQRT1_2
// (0.7071067811865476) to keep results bit-for-bit identical to the original
// simulator. The two differ only in the last digit.
const SQRT1_2 = 1 / Math.sqrt(2);

const c = (re, im = 0) => ({ re, im });

// 2×2 matrices as [[m00, m01], [m10, m11]] of { re, im }
export const GATES = Object.freeze({
  I: [[c(1), c(0)], [c(0), c(1)]],
  X: [[c(0), c(1)], [c(1), c(0)]],
  Y: [[c(0), c(0, -1)], [c(0, 1), c(0)]],
  Z: [[c(1), c(0)], [c(0), c(-1)]],
  H: [[c(SQRT1_2), c(SQRT1_2)], [c(SQRT1_2), c(-SQRT1_2)]],
  S: [[c(1), c(0)], [c(0), c(0, 1)]],
  T: [[c(1), c(0)], [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]]
});

function checkQubit(q, n, name = 'qubit') {
  if (!Number.isInteger(q) || q < 0 || q >= n) {
    throw new RangeError(`${name} must be an integer from 0 to ${n - 1}, got ${q}`);
  }
}

// Bit position of qubit q in an n-qubit basis index
const bitOf = (q, n) => n - 1 - q;

/** |0…0⟩ for n qubits. */
export function zeroState(n) {
  const re = new Float64Array(1 << n);
  re[0] = 1;
  return { re, im: new Float64Array(1 << n) };
}

/** Ket label for a basis index, e.g. basisLabel(4, 3) === '|100⟩'. */
export function basisLabel(index, n) {
  return '|' + index.toString(2).padStart(n, '0') + '⟩';
}

/**
 * Applies a single-qubit gate to qubit `target`.
 * `gate` is a name from GATES ('H', 'X', …) or a 2×2 matrix.
 */
export function applyGate(re, im, gate, target, n) {
  const m = typeof gate === 'string' ? GATES[gate] : gate;
  if (!m) throw new Error(`Unknown gate: ${gate}`);
  checkQubit(target, n, 'target');

  const size = 1 << n;
  const bit = bitOf(target, n);
  const outRe = new Float64Array(size);
  const outIm = new Float64Array(size);

  const [[m00, m01], [m10, m11]] = m;

  for (let i = 0; i < size; i++) {
    if (((i >> bit) & 1) !== 0) continue;

    const j = i | (1 << bit); // same index with the target qubit set to 1

    const ar = re[i], ai = im[i];
    const br = re[j], bi = im[j];

    outRe[i] = m00.re * ar - m00.im * ai + m01.re * br - m01.im * bi;
    outIm[i] = m00.re * ai + m00.im * ar + m01.re * bi + m01.im * br;
    outRe[j] = m10.re * ar - m10.im * ai + m11.re * br - m11.im * bi;
    outIm[j] = m10.re * ai + m10.im * ar + m11.re * bi + m11.im * br;
  }

  return { re: outRe, im: outIm };
}

/** Flips qubit `target` wherever qubit `control` is 1. */
export function applyCNOT(re, im, control, target, n) {
  checkQubit(control, n, 'control');
  checkQubit(target, n, 'target');
  if (control === target) throw new RangeError('control and target must differ');

  const size = 1 << n;
  const outRe = new Float64Array(re);
  const outIm = new Float64Array(im);
  const controlBit = bitOf(control, n);
  const targetBit = bitOf(target, n);

  for (let i = 0; i < size; i++) {
    if (((i >> controlBit) & 1) !== 1) continue;

    const j = i ^ (1 << targetBit);
    if (i < j) {
      // swap amplitudes i and j
      [outRe[i], outRe[j]] = [outRe[j], outRe[i]];
      [outIm[i], outIm[j]] = [outIm[j], outIm[i]];
    }
  }

  return { re: outRe, im: outIm };
}

/**
 * Controlled-Z: flips the sign of every amplitude where both qubits are 1.
 * It is symmetric, so which qubit is the "control" doesn't matter. The
 * same as H on the target, then CNOT, then H on the target.
 */
export function applyCZ(re, im, control, target, n) {
  checkQubit(control, n, 'control');
  checkQubit(target, n, 'target');
  if (control === target) throw new RangeError('control and target must differ');

  const outRe = new Float64Array(re);
  const outIm = new Float64Array(im);
  const mask = (1 << bitOf(control, n)) | (1 << bitOf(target, n));

  for (let i = 0; i < outRe.length; i++) {
    if ((i & mask) === mask) {
      outRe[i] = -outRe[i];
      outIm[i] = -outIm[i];
    }
  }

  return { re: outRe, im: outIm };
}

/** Measurement probability of every basis state, |amplitude|². */
export function probabilities(re, im) {
  const result = new Array(re.length);
  for (let i = 0; i < re.length; i++) {
    result[i] = re[i] * re[i] + im[i] * im[i];
  }
  return result;
}

/**
 * The basis index a uniform random number r in [0, 1) selects, each index
 * i being chosen with probability probs[i] / (sum of probs).
 * Strict < so that an outcome with probability 0 can never be picked
 * (r can be exactly 0). If rounding leaves the running total a hair below
 * 1 and r falls in that gap, the last outcome that is actually possible is
 * kept rather than falling back to index 0.
 */
function pickOutcome(probs, r) {
  const total = probs.reduce((sum, p) => sum + p, 0);
  let cumulative = 0;
  let index = -1;

  for (let i = 0; i < probs.length; i++) {
    if (probs[i] === 0) continue;
    index = i;
    cumulative += probs[i] / total;
    if (r < cumulative) break;
  }
  return index < 0 ? 0 : index;
}

/**
 * Measures all qubits. Picks a basis state with probability |amplitude|²
 * (normalizing first, so a slightly unnormalized state still works) and
 * collapses to it. `random` returns a number in [0, 1); pass a seeded
 * generator for repeatable results.
 */
export function measure(re, im, n, random = Math.random) {
  const probs = probabilities(re, im);
  const index = pickOutcome(probs, random());

  const collapsedRe = new Float64Array(re.length);
  collapsedRe[index] = 1;

  return {
    re: collapsedRe,
    im: new Float64Array(im.length),
    index,
    label: basisLabel(index, n)
  };
}

/**
 * Measures one qubit. Gives 0 or 1 with the probabilities the state
 * implies, then collapses only what that result rules out: amplitudes
 * where the qubit has the other value become 0, and the rest are
 * renormalized. Other qubits keep their superposition unless they were
 * entangled with the measured one.
 * Returns { re, im, bit, probability } where probability is P(bit).
 */
export function measureQubit(re, im, qubit, n, random = Math.random) {
  checkQubit(qubit, n);

  const bit = bitOf(qubit, n);
  const probs = probabilities(re, im);
  const total = probs.reduce((sum, p) => sum + p, 0);

  let p1 = 0;
  for (let i = 0; i < probs.length; i++) {
    if ((i >> bit) & 1) p1 += probs[i];
  }
  p1 /= total;

  const outcome = random() < p1 ? 1 : 0;
  const probability = outcome ? p1 : 1 - p1;
  const scale = 1 / Math.sqrt(probability * total);

  const outRe = new Float64Array(re.length);
  const outIm = new Float64Array(im.length);
  for (let i = 0; i < re.length; i++) {
    if (((i >> bit) & 1) === outcome) {
      outRe[i] = re[i] * scale;
      outIm[i] = im[i] * scale;
    }
  }

  return { re: outRe, im: outIm, bit: outcome, probability };
}

/**
 * Full density matrix ρ = |ψ⟩⟨ψ|, so ρij = ψi · conj(ψj).
 * Returns row-major Float64Arrays of length N² (N = 2^n): entry (i, j)
 * is at index i * N + j.
 */
export function densityMatrix(re, im) {
  const size = re.length;
  const rhoRe = new Float64Array(size * size);
  const rhoIm = new Float64Array(size * size);

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      rhoRe[i * size + j] = re[i] * re[j] + im[i] * im[j];
      rhoIm[i * size + j] = im[i] * re[j] - re[i] * im[j];
    }
  }

  return { re: rhoRe, im: rhoIm, size };
}

/**
 * Reduced density matrix of one qubit: trace out all the others.
 * Returns ρ00, ρ11 (real) and ρ01 (complex); ρ10 is conj(ρ01).
 */
export function reducedDensityMatrix(re, im, qubit, n) {
  checkQubit(qubit, n);

  const size = 1 << n;
  const bit = bitOf(qubit, n);
  const othersMask = (size - 1) & ~(1 << bit);

  let rho00 = 0;
  let rho11 = 0;
  let rho01Re = 0;
  let rho01Im = 0;

  for (let i = 0; i < size; i++) {
    const bitI = (i >> bit) & 1;

    for (let j = 0; j < size; j++) {
      // Only pairs that agree on every other qubit survive the trace
      if (((i ^ j) & othersMask) !== 0) continue;

      const bitJ = (j >> bit) & 1;

      // ψi · conj(ψj)
      const ar = re[i], ai = im[i];
      const br = re[j], bi = -im[j];
      const entryRe = ar * br - ai * bi;
      const entryIm = ar * bi + ai * br;

      if (bitI === 0 && bitJ === 0) {
        rho00 += entryRe;
      } else if (bitI === 1 && bitJ === 1) {
        rho11 += entryRe;
      } else if (bitI === 0 && bitJ === 1) {
        rho01Re += entryRe;
        rho01Im += entryIm;
      }
    }
  }

  return { rho00, rho11, rho01Re, rho01Im };
}

/**
 * Bloch vector of one qubit from its reduced density matrix:
 * x = 2·Re ρ01, y = −2·Im ρ01, z = ρ00 − ρ11.
 * Length 1 means the qubit is in a pure state; shorter means mixed, which
 * for a pure overall state means it is entangled with the other qubits.
 */
export function blochVector(re, im, qubit, n) {
  const rho = reducedDensityMatrix(re, im, qubit, n);
  return {
    x: 2 * rho.rho01Re,
    y: -2 * rho.rho01Im,
    z: rho.rho00 - rho.rho11
  };
}

/**
 * ⟨Zᵢ Zⱼ⟩: +1 when the two qubits' measured bits always agree, −1 when they
 * always disagree, 0 when they agree and disagree equally often. It is the
 * raw agreement, not the statistical correlation: independent qubits give
 * ⟨Zᵢ⟩⟨Zⱼ⟩ (so |00⟩ gives 1), and the connected correlation
 * ⟨ZᵢZⱼ⟩ − ⟨Zᵢ⟩⟨Zⱼ⟩ is what vanishes for them. It looks only at the 0/1
 * basis, so it is not a measure of entanglement either way.
 */
export function zzCorrelation(re, im, q1, q2, n) {
  checkQubit(q1, n, 'q1');
  checkQubit(q2, n, 'q2');

  const b1Pos = bitOf(q1, n);
  const b2Pos = bitOf(q2, n);
  let correlation = 0;

  for (let basis = 0; basis < re.length; basis++) {
    const p = re[basis] ** 2 + im[basis] ** 2;
    const b1 = (basis >> b1Pos) & 1;
    const b2 = (basis >> b2Pos) & 1;
    correlation += p * (b1 === b2 ? 1 : -1);
  }

  return correlation;
}

/**
 * True if (re, im) is a usable n-qubit state: arrays of length 2^n holding
 * finite numbers, with total probability 1 (within `tolerance`).
 * Used to reject saved data that is corrupt or from another version.
 */
export function isValidState(re, im, n, tolerance = 1e-6) {
  const size = 1 << n;
  if (!re || !im || re.length !== size || im.length !== size) return false;

  let total = 0;
  for (let i = 0; i < size; i++) {
    if (!Number.isFinite(re[i]) || !Number.isFinite(im[i])) return false;
    total += re[i] * re[i] + im[i] * im[i];
  }

  return Math.abs(total - 1) <= tolerance;
}

/**
 * Repeats "prepare this state, measure every qubit" `shots` times without
 * changing the state, as a real quantum computer does to estimate
 * probabilities. Returns how often each basis state came up: an array of
 * length 2^n. `random` as for measure().
 */
export function sampleCounts(re, im, shots, random = Math.random) {
  if (!Number.isInteger(shots) || shots < 0) throw new RangeError(`shots must be a whole number, got ${shots}`);
  const probs = probabilities(re, im);
  const counts = new Array(probs.length).fill(0);
  for (let k = 0; k < shots; k++) counts[pickOutcome(probs, random())]++;
  return counts;
}

/**
 * How the amplitudes combine in one step: for every output basis state j,
 * the paths that lead to it from the state before the step, i.e. the terms
 * U[j][i]·ψi of the sum ψ'j = Σi U[j][i]·ψi.
 *
 * `apply(re, im)` performs the step (any gate, CNOT or CZ) and returns
 * { re, im }; it is run on each basis state to read off U column by column.
 *
 * Returns one entry per output index, in basis order:
 *   { index, paths: [{ from, re, im }], re, im, probability, without, kind }
 *   re, im       the output amplitude (the sum of its paths)
 *   probability  |sum|², what is measured
 *   without      Σ|path|², what the probability would be if the paths did
 *                not interfere (added as probabilities, not amplitudes)
 *   kind         'none' (no path), 'single' (one path: nothing to interfere),
 *                'constructive' (probability > without), 'destructive'
 *                (probability < without, but not 0), 'cancel' (the paths
 *                cancel completely), or 'neutral' (several paths whose
 *                interference adds nothing, e.g. 90° apart)
 * Paths smaller than 1e-12 are left out.
 */
export function amplitudePaths(re, im, apply, n) {
  const size = 1 << n;
  const EPS = 1e-12;
  const outputs = Array.from({ length: size }, (_, index) => ({ index, paths: [] }));

  for (let i = 0; i < size; i++) {
    if (re[i] * re[i] + im[i] * im[i] < EPS * EPS) continue;
    const basisRe = new Float64Array(size);
    basisRe[i] = 1;
    const column = apply(basisRe, new Float64Array(size));
    for (let j = 0; j < size; j++) {
      // U[j][i] · ψi
      const pr = column.re[j] * re[i] - column.im[j] * im[i];
      const pi = column.re[j] * im[i] + column.im[j] * re[i];
      if (pr * pr + pi * pi >= EPS * EPS) outputs[j].paths.push({ from: i, re: pr, im: pi });
    }
  }

  const TOL = 1e-9;
  for (const out of outputs) {
    out.re = out.paths.reduce((s, p) => s + p.re, 0);
    out.im = out.paths.reduce((s, p) => s + p.im, 0);
    out.probability = out.re * out.re + out.im * out.im;
    out.without = out.paths.reduce((s, p) => s + p.re * p.re + p.im * p.im, 0);
    if (out.paths.length === 0) out.kind = 'none';
    else if (out.paths.length === 1) out.kind = 'single';
    else if (out.probability < TOL) out.kind = 'cancel';
    else if (out.probability > out.without + TOL) out.kind = 'constructive';
    else if (out.probability < out.without - TOL) out.kind = 'destructive';
    else out.kind = 'neutral';
  }

  return outputs;
}

/**
 * Entanglement entropy of one qubit, in bits: the von Neumann entropy
 * S = −Σ λ log₂ λ of its reduced density matrix, whose eigenvalues are
 * (1 ± r)/2 for a Bloch vector of length r.
 * For a pure overall state (always the case in this lab) it is 0 exactly
 * when the qubit is not entangled with the others, and 1 when it is
 * maximally entangled (as in a Bell pair or GHZ state).
 */
export function entanglementEntropy(re, im, qubit, n) {
  const { x, y, z } = blochVector(re, im, qubit, n);
  const r = Math.min(1, Math.hypot(x, y, z));
  return binaryEntropy((1 - r) / 2);
}

// −p log₂ p − (1 − p) log₂ (1 − p), with 0 log 0 = 0
function binaryEntropy(p) {
  const h = q => (q > 0 ? -q * Math.log2(q) : 0);
  return h(p) + h(1 - p);
}

/**
 * Quantum mutual information of two qubits, in bits:
 * I(A:B) = S(A) + S(B) − S(AB). It is 0 exactly when the two qubits'
 * results are unrelated in every measurement basis, and at most 2.
 * It counts every kind of link (classical and quantum), so it is not a
 * test of entanglement on its own.
 *
 * Assumes the overall state is pure, as it always is in this lab: then
 * S(AB) equals the entropy of the remaining qubits, which is 0 for n = 2
 * and the third qubit's entropy for n = 3. Supports n = 2 and 3.
 */
export function mutualInformation(re, im, q1, q2, n) {
  checkQubit(q1, n, 'q1');
  checkQubit(q2, n, 'q2');
  if (q1 === q2) throw new RangeError('q1 and q2 must differ');
  if (n !== 2 && n !== 3) throw new RangeError(`mutualInformation supports 2 or 3 qubits, got ${n}`);

  const rest = n === 3 ? entanglementEntropy(re, im, 3 - q1 - q2, n) : 0;
  const value = entanglementEntropy(re, im, q1, n) + entanglementEntropy(re, im, q2, n) - rest;
  return Math.max(0, value);
}

/**
 * The same state with its global phase removed: every amplitude is
 * multiplied by one unit complex number, chosen so that the first
 * non-zero amplitude (in basis order) becomes real and positive.
 * Multiplying a whole state by e^{iα} changes nothing any measurement can
 * see, so this is only a choice of how to display it; relative phases,
 * probabilities, Bloch vectors and the density matrix are unchanged.
 * Returns { re, im, reference }: reference is the index of the amplitude
 * made real, or -1 for an all-zero state (returned as it is).
 */
export function withoutGlobalPhase(re, im) {
  let reference = -1;
  for (let i = 0; i < re.length; i++) {
    if (re[i] * re[i] + im[i] * im[i] > 1e-12) { reference = i; break; }
  }
  if (reference < 0) return { re: new Float64Array(re), im: new Float64Array(im), reference };

  // Multiply by conj(ψref) / |ψref|
  const size = Math.hypot(re[reference], im[reference]);
  const cr = re[reference] / size;
  const ci = -im[reference] / size;
  const outRe = new Float64Array(re.length);
  const outIm = new Float64Array(im.length);
  for (let i = 0; i < re.length; i++) {
    outRe[i] = re[i] * cr - im[i] * ci;
    outIm[i] = re[i] * ci + im[i] * cr;
  }
  outIm[reference] = 0; // exactly real, not 1e-17
  return { re: outRe, im: outIm, reference };
}

/**
 * Expectation value ⟨ψ|P|ψ⟩ of a Pauli string, one letter per qubit in
 * qubit order: pauliExpectation(re, im, 'XIZ', 3) is ⟨X₀ Z₂⟩. Letters are
 * I, X, Y, Z. The result is real (P is Hermitian), from −1 to 1:
 * +1 when the state is certain to give +1 for P (measuring each named
 * qubit in that basis, the product of the ±1 results is always +1), −1
 * when certain to give −1, 0 when both are equally likely.
 */
export function pauliExpectation(re, im, paulis, n) {
  if (typeof paulis !== 'string' || paulis.length !== n || /[^IXYZ]/.test(paulis)) {
    throw new RangeError(`Pauli string must be ${n} letters from I, X, Y, Z, got ${paulis}`);
  }
  let p = { re, im };
  for (let q = 0; q < n; q++) {
    if (paulis[q] !== 'I') p = applyGate(p.re, p.im, paulis[q], q, n);
  }
  // Re Σ conj(ψi) (Pψ)i
  let value = 0;
  for (let i = 0; i < re.length; i++) value += re[i] * p.re[i] + im[i] * p.im[i];
  return value;
}

/**
 * The 2^n × 2^n matrix of a step: column j is what `apply` does to basis
 * state j. `apply(re, im)` returns { re, im } (a gate, CNOT, CZ, or several
 * of them in a row). Returns { re, im, size } row-major, entry (i, j) at
 * index i * size + j, like densityMatrix.
 */
export function unitaryOf(apply, n) {
  const size = 1 << n;
  const re = new Float64Array(size * size);
  const im = new Float64Array(size * size);
  for (let j = 0; j < size; j++) {
    const basisRe = new Float64Array(size);
    basisRe[j] = 1;
    const column = apply(basisRe, new Float64Array(size));
    for (let i = 0; i < size; i++) {
      re[i * size + j] = column.re[i];
      im[i * size + j] = column.im[i];
    }
  }
  return { re, im, size };
}

/**
 * How far a matrix is from unitary: the largest entry of |U†U − I|.
 * About 1e-16 for every gate in this lab.
 */
export function unitarityError({ re, im, size }) {
  let worst = 0;
  for (let a = 0; a < size; a++) {
    for (let b = 0; b < size; b++) {
      // (U†U)ab = Σi conj(Uia) Uib
      let sr = 0;
      let si = 0;
      for (let i = 0; i < size; i++) {
        const ar = re[i * size + a], ai = -im[i * size + a];
        const br = re[i * size + b], bi = im[i * size + b];
        sr += ar * br - ai * bi;
        si += ar * bi + ai * br;
      }
      worst = Math.max(worst, Math.hypot(sr - (a === b ? 1 : 0), si));
    }
  }
  return worst;
}
