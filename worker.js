// Background worker for gates, noise and measurement, so the page stays
// responsive. All the maths is in engine.js; this file only passes messages.
//
// Request:  { id, type: 'gate' | 'cnot' | 'cz' | 'noise' | 'measure' | 'measureQubit',
//             re, im, rho, qubitCount,
//             gate, targetQubit,   // for 'gate'; targetQubit also for 'measureQubit' and 'noise'
//             control, target,     // for 'cnot' and 'cz'
//             channel, strength }  // for 'noise'
//   rho: the density matrix { re, im, size } if the state is mixed, else null
// Response: { id, re, im, rho, measured, qubit, bit }
//             rho: the new density matrix if the state is (still) mixed, else null;
//               re, im then hold amplitudes √p with the same probabilities
//             measured: ket label, for 'measure'
//             qubit, bit: the measured qubit and its result, for 'measureQubit'
//
// Noise makes the state mixed. Measuring every qubit makes it pure again.
//
// Loaded as a module worker: new Worker('./worker.js', { type: 'module' })

import {
  applyGate, applyCNOT, applyCZ, measure, measureQubit, densityMatrix,
  applyToRho, applyNoise, rhoMeasure, rhoMeasureQubit, probabilityAmplitudes
} from './engine.js';

// The step a gate message describes, acting on state vectors
function stepOf({ type, gate, targetQubit, control, target, qubitCount: n }) {
  if (type === 'gate') return (re, im) => applyGate(re, im, gate, targetQubit, n);
  if (type === 'cnot') return (re, im) => applyCNOT(re, im, control, target, n);
  if (type === 'cz') return (re, im) => applyCZ(re, im, control, target, n);
  return null;
}

function handle(msg) {
  const { type, re, im, rho, qubitCount: n, targetQubit } = msg;
  const step = stepOf(msg);

  if (type === 'noise') {
    const out = applyNoise(rho ?? densityMatrix(re, im), msg.channel, targetQubit, msg.strength, n);
    return { ...probabilityAmplitudes(out), rho: out };
  }

  if (rho) {
    if (step) {
      const out = applyToRho(rho, step);
      return { ...probabilityAmplitudes(out), rho: out };
    }
    if (type === 'measure') {
      const m = rhoMeasure(rho, n);
      return { re: m.re, im: m.im, rho: null, measured: m.label };
    }
    if (type === 'measureQubit') {
      const m = rhoMeasureQubit(rho, targetQubit, n);
      return { ...probabilityAmplitudes(m.rho), rho: m.rho, qubit: targetQubit, bit: m.bit };
    }
    return null;
  }

  if (step) return { ...step(re, im), rho: null };
  if (type === 'measure') {
    const m = measure(re, im, n);
    return { re: m.re, im: m.im, rho: null, measured: m.label };
  }
  if (type === 'measureQubit') {
    const m = measureQubit(re, im, targetQubit, n);
    return { re: m.re, im: m.im, rho: null, qubit: targetQubit, bit: m.bit };
  }
  return null;
}

self.onmessage = (e) => {
  const result = handle(e.data);
  if (!result) return;

  // Transfer the buffers instead of copying them
  const buffers = [result.re.buffer, result.im.buffer];
  if (result.rho) buffers.push(result.rho.re.buffer, result.rho.im.buffer);
  self.postMessage({
    id: e.data.id,
    re: result.re,
    im: result.im,
    rho: result.rho,
    measured: result.measured,
    qubit: result.qubit,
    bit: result.bit
  }, buffers);
};
