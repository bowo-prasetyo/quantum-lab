// Checks a lab state against a lesson's expected result, and runs lesson
// operations with the engine. Pure functions: used by the lesson page
// ("Check my result"), the unit tests and the browser test.

import * as engine from './engine.js';

const TOLERANCE = 1e-6;

const labelIndex = (label, n) => {
  const bits = label.replace(/[|⟩]/g, '');
  if (bits.length !== n || /[^01]/.test(bits)) throw new Error(`Bad basis label ${label} for ${n} qubits`);
  return parseInt(bits, 2);
};

const close = (a, b) => Math.abs(a - b) <= TOLERANCE;
const show = v => (Math.abs(v) < 5e-4 ? 0 : v).toFixed(3);

/**
 * Evaluates one check against { re, im, n, measured, rho }. rho is the
 * density matrix when noise has made the state mixed (re and im then hold
 * amplitudes √p), else null or absent.
 * Returns { pass, text } where text says what was expected and found.
 */
export function evaluateCheck(check, { re, im, n, measured, rho = null }) {
  const probs = rho ? engine.rhoProbabilities(rho) : engine.probabilities(re, im);
  const bloch = q => (rho ? engine.rhoBlochVector(rho, q, n) : engine.blochVector(re, im, q, n));

  switch (check.type) {
    // Exact probabilities; basis states not listed must be 0
    case 'probs': {
      const expected = new Array(probs.length).fill(0);
      for (const [label, value] of Object.entries(check.values)) expected[labelIndex(label, n)] = value;
      const pass = expected.every((p, i) => close(probs[i], p));
      const listed = Object.entries(check.values)
        .map(([label, v]) => `${label} ${(v * 100).toFixed(1)}%`).join(', ');
      return { pass, text: `Probabilities: ${listed}${Object.keys(check.values).length < probs.length ? ', all others 0%' : ''}` };
    }

    case 'amplitude': {
      const i = labelIndex(check.state, n);
      const pass = !rho && close(re[i], check.re) && close(im[i], check.im);
      return { pass, text: `Amplitude of ${check.state}: ${show(check.re)} + ${show(check.im)}i (found ${show(re[i])} + ${show(im[i])}i)` };
    }

    case 'bloch': {
      const v = bloch(check.qubit);
      const pass = close(v.x, check.x) && close(v.y, check.y) && close(v.z, check.z);
      return { pass, text: `Qubit ${check.qubit} Bloch vector (x, y, z) = (${show(check.x)}, ${show(check.y)}, ${show(check.z)}) (found (${show(v.x)}, ${show(v.y)}, ${show(v.z)}))` };
    }

    case 'blochLength': {
      const v = bloch(check.qubit);
      const length = Math.hypot(v.x, v.y, v.z);
      return { pass: close(length, check.value), text: `Qubit ${check.qubit} Bloch vector length ${show(check.value)} (found ${show(length)})` };
    }

    case 'zz': {
      const value = Math.abs(engine.zzCorrelation(re, im, check.q1, check.q2, n));
      return { pass: close(value, check.value), text: `Correlation Q${check.q1}–Q${check.q2}: ${show(check.value)} (found ${show(value)})` };
    }

    case 'density': {
      const matrix = rho ?? engine.densityMatrix(re, im);
      const k = check.i * matrix.size + check.j;
      const value = Math.hypot(matrix.re[k], matrix.im[k]);
      return { pass: close(value, check.abs), text: `Density matrix |ρ[${check.i}][${check.j}]| = ${show(check.abs)} (found ${show(value)})` };
    }

    // Fidelity with the state the `ideal` operations give (run without
    // noise from |0…0⟩): between min and max
    case 'fidelity': {
      const target = runOps(check.ideal, n);
      const value = engine.fidelity(target, re, im, rho);
      const pass = value >= check.min - TOLERANCE && value <= check.max + TOLERANCE;
      return { pass, text: `Fidelity with the noiseless result: ${show(check.min)} to ${show(check.max)} (found ${show(value)})` };
    }

    // Purity Tr ρ²: 1 for a pure state, less once noise has mixed it
    case 'purity': {
      const value = rho ? engine.purity(rho) : 1;
      return { pass: close(value, check.value), text: `Purity Tr ρ² = ${show(check.value)} (found ${show(value)})` };
    }

    // All the probability is on these basis states (any split between them)
    case 'onlyStates': {
      const allowed = new Set(check.states.map(label => labelIndex(label, n)));
      const outside = probs.reduce((sum, p, i) => sum + (allowed.has(i) ? 0 : p), 0);
      return { pass: close(outside, 0), text: `Only ${check.states.join(' or ')} can be measured` };
    }

    // The state is a single basis state
    case 'collapsed': {
      const pass = probs.some(p => close(p, 1));
      return { pass, text: 'The state has collapsed to a single basis state' };
    }

    case 'measured':
      return { pass: measured === check.label, text: `Last measurement: ${check.label} (found ${measured})` };

    // The last measurement result is the state the qubits are now in
    case 'measuredMatchesState': {
      const pass = typeof measured === 'string' && /^\|[01]+⟩$/.test(measured) &&
        close(probs[labelIndex(measured, n)], 1);
      return { pass, text: `The state is the last measured result (${measured})` };
    }

    default:
      throw new Error(`Unknown check type: ${check.type}`);
  }
}

/** Evaluates every check. Returns { pass, results }. */
export function evaluateChecks(checks, state) {
  const results = checks.map(check => ({ check, ...evaluateCheck(check, state) }));
  return { pass: results.every(r => r.pass), results };
}

/** Expands presets into gates: the same sequences the lab's buttons use. */
export function expandOp(op) {
  switch (op[0]) {
    case 'bell': return [['reset'], ['gate', 'H', 0], ['cnot', 0, 1]];
    case 'ghz': return [['reset'], ['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 1, 2]];
    default: return [op];
  }
}

/**
 * Runs operations on a state with the engine (no worker, no page), the
 * same way the lab does. Returns { re, im, rho, n, measured, bits }.
 * `random` is passed to measurements.
 *
 * Operations: ['reset'], ['gate', name, q], ['cnot', c, t], ['cz', c, t],
 * ['measure'], ['measureQubit', q], ['bell'], ['ghz'],
 * ['noise', channel, q, strength] (makes the state mixed), and
 * ['if', q, op], which runs op only if the last measurement of qubit q gave 1.
 *
 * `noisyRun` ({ channel, strength }) runs the operations as the lab's
 * noisy run does: that noise on every qubit after each circuit step
 * (gate, CNOT, CZ, single-qubit measurement or noise).
 */
export function runOps(ops, n, start = null, random = Math.random, { noisyRun = null } = {}) {
  const fresh = () => ({ ...engine.zeroState(n), rho: null, measured: '-', bits: {} });
  let state = start ? { bits: {}, rho: null, ...start } : fresh();

  // A unitary step, on the state vector or (once mixed) the density matrix
  const unitary = step => {
    if (!state.rho) return { ...state, ...step(state.re, state.im) };
    const rho = engine.applyToRho(state.rho, step);
    return { ...state, ...engine.probabilityAmplitudes(rho), rho };
  };

  const apply = op => {
    const [kind, a, b, c] = op;
    if (kind === 'reset') {
      state = fresh();
    } else if (kind === 'gate') {
      state = unitary((re, im) => engine.applyGate(re, im, a, b, n));
    } else if (kind === 'cnot') {
      state = unitary((re, im) => engine.applyCNOT(re, im, a, b, n));
    } else if (kind === 'cz') {
      state = unitary((re, im) => engine.applyCZ(re, im, a, b, n));
    } else if (kind === 'noise') {
      const rho = engine.applyNoise(state.rho ?? engine.densityMatrix(state.re, state.im), a, b, c, n);
      state = { ...state, ...engine.probabilityAmplitudes(rho), rho };
    } else if (kind === 'measure') {
      const m = state.rho ? engine.rhoMeasure(state.rho, n, random) : engine.measure(state.re, state.im, n, random);
      const bits = Object.fromEntries([...m.label.replace(/[|⟩]/g, '')].map((d, q) => [q, Number(d)]));
      state = { re: m.re, im: m.im, rho: null, measured: m.label, bits };
    } else if (kind === 'measureQubit') {
      const bits = bit => ({ measured: `qubit ${a} gave ${bit}`, bits: { ...state.bits, [a]: bit } });
      if (state.rho) {
        const m = engine.rhoMeasureQubit(state.rho, a, n, random);
        state = { ...engine.probabilityAmplitudes(m.rho), rho: m.rho, ...bits(m.bit) };
      } else {
        const m = engine.measureQubit(state.re, state.im, a, n, random);
        state = { re: m.re, im: m.im, rho: null, ...bits(m.bit) };
      }
    } else if (kind === 'if') {
      if (state.bits[a] === 1) expandOp(b).forEach(apply);
    } else {
      throw new Error(`Unknown operation: ${kind}`);
    }
  };

  const CIRCUIT_STEPS = ['gate', 'cnot', 'cz', 'measureQubit', 'noise'];
  for (const op of ops.flatMap(expandOp)) {
    apply(op);
    if (noisyRun && CIRCUIT_STEPS.includes(op[0])) {
      for (let q = 0; q < n; q++) apply(['noise', noisyRun.channel, q, noisyRun.strength]);
    }
  }

  return { re: state.re, im: state.im, rho: state.rho, n, measured: state.measured, bits: state.bits };
}
