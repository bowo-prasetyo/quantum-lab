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
 * Evaluates one check against { re, im, n, measured }.
 * Returns { pass, text } where text says what was expected and found.
 */
export function evaluateCheck(check, { re, im, n, measured }) {
  const probs = engine.probabilities(re, im);

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
      const pass = close(re[i], check.re) && close(im[i], check.im);
      return { pass, text: `Amplitude of ${check.state}: ${show(check.re)} + ${show(check.im)}i (found ${show(re[i])} + ${show(im[i])}i)` };
    }

    case 'bloch': {
      const v = engine.blochVector(re, im, check.qubit, n);
      const pass = close(v.x, check.x) && close(v.y, check.y) && close(v.z, check.z);
      return { pass, text: `Qubit ${check.qubit} Bloch vector (x, y, z) = (${show(check.x)}, ${show(check.y)}, ${show(check.z)}) (found (${show(v.x)}, ${show(v.y)}, ${show(v.z)}))` };
    }

    case 'blochLength': {
      const v = engine.blochVector(re, im, check.qubit, n);
      const length = Math.hypot(v.x, v.y, v.z);
      return { pass: close(length, check.value), text: `Qubit ${check.qubit} Bloch vector length ${show(check.value)} (found ${show(length)})` };
    }

    case 'zz': {
      const value = Math.abs(engine.zzCorrelation(re, im, check.q1, check.q2, n));
      return { pass: close(value, check.value), text: `Correlation Q${check.q1}–Q${check.q2}: ${show(check.value)} (found ${show(value)})` };
    }

    case 'density': {
      const rho = engine.densityMatrix(re, im);
      const k = check.i * rho.size + check.j;
      const value = Math.hypot(rho.re[k], rho.im[k]);
      return { pass: close(value, check.abs), text: `Density matrix |ρ[${check.i}][${check.j}]| = ${show(check.abs)} (found ${show(value)})` };
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
 * same way the lab does. Returns { re, im, n, measured, bits }.
 * `random` is passed to measurements.
 *
 * Operations: ['reset'], ['gate', name, q], ['cnot', c, t], ['cz', c, t],
 * ['measure'], ['measureQubit', q], ['bell'], ['ghz'], and ['if', q, op],
 * which runs op only if the last measurement of qubit q gave 1.
 */
export function runOps(ops, n, start = null, random = Math.random) {
  const fresh = () => ({ ...engine.zeroState(n), measured: '-', bits: {} });
  let state = start ? { bits: {}, ...start } : fresh();

  const apply = op => {
    const [kind, a, b] = op;
    if (kind === 'reset') {
      state = fresh();
    } else if (kind === 'gate') {
      state = { ...state, ...engine.applyGate(state.re, state.im, a, b, n) };
    } else if (kind === 'cnot') {
      state = { ...state, ...engine.applyCNOT(state.re, state.im, a, b, n) };
    } else if (kind === 'cz') {
      state = { ...state, ...engine.applyCZ(state.re, state.im, a, b, n) };
    } else if (kind === 'measure') {
      const m = engine.measure(state.re, state.im, n, random);
      const bits = Object.fromEntries([...m.label.replace(/[|⟩]/g, '')].map((d, q) => [q, Number(d)]));
      state = { re: m.re, im: m.im, measured: m.label, bits };
    } else if (kind === 'measureQubit') {
      const m = engine.measureQubit(state.re, state.im, a, n, random);
      state = { re: m.re, im: m.im, measured: `qubit ${a} gave ${m.bit}`, bits: { ...state.bits, [a]: m.bit } };
    } else if (kind === 'if') {
      if (state.bits[a] === 1) expandOp(b).forEach(apply);
    } else {
      throw new Error(`Unknown operation: ${kind}`);
    }
  };

  ops.flatMap(expandOp).forEach(apply);

  return { re: state.re, im: state.im, n, measured: state.measured, bits: state.bits };
}
