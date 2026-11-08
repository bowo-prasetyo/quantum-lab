// Noise steps in the circuit editor: labels and validation of saved steps.
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { stepLabel } from '../components/circuit-editor.js';
import { isValidStep } from '../import-old.js';

describe('noise steps', () => {
  test('labels name the kind, strength and qubit', () => {
    assert.equal(stepLabel({ gate: 'N', target: 1, channel: 'dephasing', strength: 0.1 }), 'Dephase 10% q1');
    assert.equal(stepLabel({ gate: 'N', target: 0, channel: 'damping', strength: 1 }), 'Damp 100% q0');
    assert.equal(stepLabel({ gate: 'N', target: 2, channel: 'depolarizing', strength: 0.055 }), 'Depolarize 6% q2');
  });

  test('saved noise steps are checked like any other step', () => {
    assert.ok(isValidStep({ gate: 'N', target: 1, channel: 'damping', strength: 0.25 }, 2));
    assert.ok(isValidStep({ gate: 'N', target: 0, channel: 'dephasing', strength: 0 }, 1));
    for (const bad of [
      { gate: 'N', target: 2, channel: 'damping', strength: 0.25 },     // no qubit 2
      { gate: 'N', target: 0, channel: 'bitrot', strength: 0.25 },      // unknown kind
      { gate: 'N', target: 0, channel: 'toString', strength: 0.25 },    // not an own key
      { gate: 'N', target: 0, channel: 'dephasing', strength: 1.5 },    // too strong
      { gate: 'N', target: 0, channel: 'dephasing', strength: '0.5' },  // not a number
      { gate: 'N', target: 0, channel: 'dephasing' }                    // no strength
    ]) {
      assert.equal(isValidStep(bad, 2), false, JSON.stringify(bad));
    }
  });
});
