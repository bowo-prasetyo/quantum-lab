// Unit tests for parsing the original simulators' saved data (import-old.js).
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { parseOldRecord, isValidStep, OLD_SOURCES } from '../import-old.js';

const r = Math.SQRT1_2;

describe('parseOldRecord', () => {
  test('1-qubit format: an array of { re, im }', () => {
    const parsed = parseOldRecord(1, [{ re: r, im: 0 }, { re: 0, im: r }]);
    assert.deepEqual([...parsed.re], [r, 0]);
    assert.deepEqual([...parsed.im], [0, r]);
    assert.deepEqual(parsed.circuit, []);
  });

  test('2-qubit format: an array of four { re, im }', () => {
    const parsed = parseOldRecord(2, [{ re: r, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: r, im: 0 }]);
    assert.deepEqual([...parsed.re], [r, 0, 0, r]);
  });

  test('3-qubit format: { re, im, circuit }, keeping valid circuit steps only', () => {
    const re = [0, 0, 0, 0, 1, 0, 0, 0];
    const parsed = parseOldRecord(3, {
      qubit: 'latest',
      re,
      im: new Array(8).fill(0),
      circuit: [
        { gate: 'H', target: 0 },
        { gate: 'CNOT', control: 2, target: 0 },
        { gate: 'Q', target: 0 },              // unknown gate
        { gate: 'X', target: 5 },              // no such qubit
        { gate: 'CNOT', control: 1, target: 1 } // control = target
      ]
    });
    assert.deepEqual([...parsed.re], re);
    assert.deepEqual(parsed.circuit, [{ gate: 'H', target: 0 }, { gate: 'CNOT', control: 2, target: 0 }]);
  });

  test('rejects missing, malformed and wrong-sized data', () => {
    assert.equal(parseOldRecord(1, undefined), null, 'missing');
    assert.equal(parseOldRecord(1, 'text'), null, 'not an object');
    assert.equal(parseOldRecord(2, [{ re: 1, im: 0 }, { re: 0, im: 0 }]), null,
      'a 2-amplitude state saved by the 2-qubit app before its first-visit bug was fixed');
    assert.equal(parseOldRecord(1, [{ re: 1, im: 0 }, null]), null, 'null amplitude');
    assert.equal(parseOldRecord(1, [{ re: 1, im: 0 }, { re: 1, im: 0 }]), null, 'not normalized');
    assert.equal(parseOldRecord(3, { re: [1], im: [0] }), null, 'wrong size');
    assert.equal(parseOldRecord(1, [{ re: NaN, im: 0 }, { re: 0, im: 0 }]), null, 'NaN');
  });
});

describe('isValidStep', () => {
  test('accepts gates and CNOTs that fit the lab size', () => {
    assert.ok(isValidStep({ gate: 'T', target: 0 }, 1));
    assert.ok(isValidStep({ gate: 'CNOT', control: 0, target: 1 }, 2));
  });

  test('rejects CNOT on 1 qubit, unknown gates and bad qubits', () => {
    assert.equal(isValidStep({ gate: 'CNOT', control: 0, target: 0 }, 1), false);
    assert.equal(isValidStep({ gate: 'SWAP', target: 0 }, 2), false);
    assert.equal(isValidStep({ gate: 'H', target: 1.5 }, 2), false);
    assert.equal(isValidStep(null, 2), false);
  });
});

test('there is an old source for each lab size, with the old database names', () => {
  assert.deepEqual(Object.keys(OLD_SOURCES), ['1', '2', '3']);
  assert.deepEqual(Object.values(OLD_SOURCES).map(s => s.db), ['quantum-db', 'quantum-db-2', 'quantum-db-3']);
});
