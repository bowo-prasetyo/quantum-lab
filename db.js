// Saves each lab size's state and circuit in the browser (IndexedDB).
//
// Uses its own database name so it never touches the data of the three
// original simulators, which run on the same origin (bowo-prasetyo.github.io)
// under 'quantum-db', 'quantum-db-2' and 'quantum-db-3'.

import { isValidState } from './engine.js';
import { isValidStep, readOldLab } from './import-old.js';

const DB_NAME = 'quantum-lab';
const STORE = 'labs';

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
 *
 * If this size has no record at all, the matching original simulator's
 * saved state is imported once (see import-old.js): it is saved here, so
 * later loads use the lab's own copy. The result then also has
 * `importedFrom`, the old simulator's name.
 */
export async function loadLab(n) {
  const own = await loadOwn(n);
  if (own !== undefined) return own;

  const old = await readOldLab(n);
  if (!old) return null;

  await saveLab(n, old.re, old.im, old.circuit);
  return { re: old.re, im: old.im, circuit: old.circuit, importedFrom: old.source };
}

// The lab's own record: the parsed record, null if it exists but is
// invalid, or undefined if this size was never saved.
async function loadOwn(n) {
  const db = await openDB();
  const record = await new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(`lab-${n}`);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (!record) return undefined;
  if (!isValidState(record.re, record.im, n)) return null;

  return {
    re: Float64Array.from(record.re),
    im: Float64Array.from(record.im),
    circuit: Array.isArray(record.circuit)
      ? record.circuit.filter(step => isValidStep(step, n))
      : []
  };
}
