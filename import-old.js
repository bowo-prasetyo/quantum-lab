// One-time import of saved states from the three original simulators.
//
// They ran on the same origin (bowo-prasetyo.github.io), so their
// IndexedDB data is visible here. When a lab size has nothing saved yet,
// the lab brings over that size's old state (and, for 3 qubits, the
// circuit). The old data is only read, never changed or deleted.
//
// Old formats (from each simulator's db.js):
//   1 qubit   'quantum-db',   store 'states', key 'qubit':  [{ re, im }, { re, im }]
//   2 qubits  'quantum-db-2', store 'states', key 'qubit':  [{ re, im } × 4]
//   3 qubits  'quantum-db-3', store 'states', key 'latest': { qubit, re: [8], im: [8], circuit }

import { isValidState, NOISE_CHANNELS } from './engine.js';

export const OLD_SOURCES = {
  1: { db: 'quantum-db', key: 'qubit', name: '1-qubit simulator' },
  2: { db: 'quantum-db-2', key: 'qubit', name: '2-qubit simulator' },
  3: { db: 'quantum-db-3', key: 'latest', name: '3-qubit simulator' }
};

const STORE = 'states';
const GATE_NAMES = ['I', 'H', 'X', 'Y', 'Z', 'S', 'T'];
const isQubit = (q, n) => Number.isInteger(q) && q >= 0 && q < n;

/** True if a circuit step is valid for an n-qubit lab. */
export function isValidStep(step, n) {
  if (!step || typeof step !== 'object') return false;
  if (step.gate === 'CNOT' || step.gate === 'CZ') {
    return n >= 2 && isQubit(step.control, n) && isQubit(step.target, n) &&
      step.control !== step.target;
  }
  // 'N' adds noise: { gate: 'N', target, channel, strength from 0 to 1 }
  if (step.gate === 'N') {
    return isQubit(step.target, n) && Object.hasOwn(NOISE_CHANNELS, step.channel) &&
      typeof step.strength === 'number' && step.strength >= 0 && step.strength <= 1;
  }
  // 'M' measures one qubit
  return (GATE_NAMES.includes(step.gate) || step.gate === 'M') && isQubit(step.target, n);
}

/**
 * Converts an old simulator's saved value to { re, im, circuit }, or
 * returns null if it is missing or not a valid state. Pure: no storage.
 */
export function parseOldRecord(n, value) {
  if (!value) return null;

  let re;
  let im;
  let circuit = [];

  if (Array.isArray(value)) {
    // 1- and 2-qubit format: an array of { re, im }
    if (!value.every(a => a && typeof a === 'object')) return null;
    re = value.map(a => a.re);
    im = value.map(a => a.im);
  } else if (typeof value === 'object') {
    // 3-qubit format
    re = value.re;
    im = value.im;
    if (Array.isArray(value.circuit)) circuit = value.circuit;
  } else {
    return null;
  }

  if (!isValidState(re, im, n)) return null;

  return {
    re: Float64Array.from(re),
    im: Float64Array.from(im),
    circuit: circuit
      .filter(step => isValidStep(step, n))
      .map(step => step.gate === 'CNOT' || step.gate === 'CZ'
        ? { gate: step.gate, control: step.control, target: step.target }
        : { gate: step.gate, target: step.target })
  };
}

/**
 * Opens a database only if it already exists. Opening a missing database
 * would create an empty one, which would break the old simulator if it
 * were ever opened again, so the creation is aborted instead.
 */
function openExisting(name) {
  return new Promise(resolve => {
    let request;
    try {
      request = indexedDB.open(name);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      // Only fires when the database doesn't exist yet: don't create it
      request.transaction.abort();
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

/**
 * Reads the old simulator's saved state for an n-qubit lab.
 * Returns { re, im, circuit, source } or null. Never throws.
 */
export async function readOldLab(n) {
  const source = OLD_SOURCES[n];
  if (!source || typeof indexedDB === 'undefined') return null;

  const db = await openExisting(source.db);
  if (!db) return null;

  try {
    if (!db.objectStoreNames.contains(STORE)) return null;

    const value = await new Promise(resolve => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(source.key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    const parsed = parseOldRecord(n, value);
    return parsed ? { ...parsed, source: source.name } : null;
  } catch {
    return null;
  } finally {
    db.close();
  }
}
