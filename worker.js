// Background worker for gates and measurement, so the page stays responsive.
// All the maths is in engine.js; this file only passes messages.
//
// Request:  { id, type: 'gate' | 'cnot' | 'cz' | 'measure' | 'measureQubit',
//             re, im, qubitCount,
//             gate, targetQubit,   // for 'gate'; targetQubit also for 'measureQubit'
//             control, target }    // for 'cnot' and 'cz'
// Response: { id, re, im, measured, qubit, bit }
//             measured: ket label, for 'measure'
//             qubit, bit: the measured qubit and its result, for 'measureQubit'
//
// Loaded as a module worker: new Worker('./worker.js', { type: 'module' })

import { applyGate, applyCNOT, applyCZ, measure, measureQubit } from './engine.js';

self.onmessage = (e) => {
  const {
    id,
    type,
    gate,
    targetQubit,
    control,
    target,
    re,
    im,
    qubitCount
  } = e.data;

  let result;

  if (type === 'gate') {
    result = applyGate(re, im, gate, targetQubit, qubitCount);
  } else if (type === 'cnot') {
    result = applyCNOT(re, im, control, target, qubitCount);
  } else if (type === 'cz') {
    result = applyCZ(re, im, control, target, qubitCount);
  } else if (type === 'measure') {
    const m = measure(re, im, qubitCount);
    result = { re: m.re, im: m.im, measured: m.label };
  } else if (type === 'measureQubit') {
    const m = measureQubit(re, im, targetQubit, qubitCount);
    result = { re: m.re, im: m.im, qubit: targetQubit, bit: m.bit };
  } else {
    return;
  }

  // Transfer the buffers instead of copying them
  self.postMessage({
    id,
    re: result.re,
    im: result.im,
    measured: result.measured,
    qubit: result.qubit,
    bit: result.bit
  }, [
    result.re.buffer,
    result.im.buffer
  ]);
};
