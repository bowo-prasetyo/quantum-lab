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
 * Measures all qubits. Picks a basis state with probability |amplitude|²
 * (normalizing first, so a slightly unnormalized state still works) and
 * collapses to it. `random` returns a number in [0, 1); pass a seeded
 * generator for repeatable results.
 */
export function measure(re, im, n, random = Math.random) {
  const probs = probabilities(re, im);
  const total = probs.reduce((sum, p) => sum + p, 0);
  const r = random();

  // Strict < so that an outcome with probability 0 can never be picked
  // (r can be exactly 0). If rounding leaves the running total a hair
  // below 1 and r falls in that gap, keep the last outcome that is
  // actually possible rather than falling back to index 0.
  let cumulative = 0;
  let index = -1;

  for (let i = 0; i < probs.length; i++) {
    if (probs[i] === 0) continue;
    index = i;
    cumulative += probs[i] / total;
    if (r < cumulative) break;
  }
  if (index < 0) index = 0;

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
