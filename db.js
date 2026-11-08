// Saves each lab size's state and circuit in the browser (IndexedDB).
//
// Uses its own database name so it never touches the data of the three
// original simulators, which run on the same origin (bowo-prasetyo.github.io)
// under 'quantum-db', 'quantum-db-2' and 'quantum-db-3'.

import { isValidState, isValidRho } from './engine.js';
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

/**
 * Saves an n-qubit lab. `rho` is the density matrix { re, im, size } when
 * noise has made the state mixed (re and im then hold amplitudes √p), or
 * null.
 */
export async function saveLab(n, re, im, circuit, rho = null) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id: `lab-${n}`,
      re: Array.from(re),
      im: Array.from(im),
      circuit: JSON.parse(JSON.stringify(circuit)),
      rho: rho ? { re: Array.from(rho.re), im: Array.from(rho.im), size: rho.size } : null
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Returns { re, im, circuit, rho } for an n-qubit lab, or null if nothing
 * valid is saved (rho is null unless the saved state is mixed). Invalid circuit steps are dropped; an invalid state discards
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
  return { re: old.re, im: old.im, circuit: old.circuit, rho: null, importedFrom: old.source };
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

  // A mixed state's density matrix; a corrupt one discards the record
  let rho = null;
  if (record.rho) {
    rho = { re: Float64Array.from(record.rho.re), im: Float64Array.from(record.rho.im), size: record.rho.size };
    if (!isValidRho(rho, n)) return null;
  }

  return {
    re: Float64Array.from(record.re),
    im: Float64Array.from(record.im),
    rho,
    circuit: Array.isArray(record.circuit)
      ? record.circuit.filter(step => isValidStep(step, n))
      : []
  };
}
