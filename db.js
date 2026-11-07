// Saves each lab size's state and circuit in the browser (IndexedDB).
//
// Uses its own database name so it never touches the data of the three
// original simulators, which run on the same origin (bowo-prasetyo.github.io)
// under 'quantum-db', 'quantum-db-2' and 'quantum-db-3'.

import { isValidState } from './engine.js';

const DB_NAME = 'quantum-lab';
const STORE = 'labs';
const GATE_NAMES = ['I', 'H', 'X', 'Y', 'Z', 'S', 'T'];

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const isQubit = (q, n) => Number.isInteger(q) && q >= 0 && q < n;

function isValidStep(step, n) {
  if (!step || typeof step !== 'object') return false;
  if (step.gate === 'CNOT') {
    return n >= 2 && isQubit(step.control, n) && isQubit(step.target, n) &&
      step.control !== step.target;
  }
  return GATE_NAMES.includes(step.gate) && isQubit(step.target, n);
}

export async function saveLab(n, re, im, circuit) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id: `lab-${n}`,
      re: Array.from(re),
      im: Array.from(im),
      circuit: JSON.parse(JSON.stringify(circuit))
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns { re, im, circuit } for an n-qubit lab, or null if nothing valid
 * is saved. Invalid circuit steps are dropped; an invalid state discards
 * the whole record.
 */
export async function loadLab(n) {
  const db = await openDB();
  const record = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(`lab-${n}`);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!record || !isValidState(record.re, record.im, n)) return null;

  return {
    re: Float64Array.from(record.re),
    im: Float64Array.from(record.im),
    circuit: Array.isArray(record.circuit)
      ? record.circuit.filter(step => isValidStep(step, n))
      : []
  };
}
