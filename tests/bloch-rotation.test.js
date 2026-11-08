// Each gate's turn of the Bloch sphere agrees with the simulator.
// Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { zeroState, applyGate, applyCNOT, blochVector } from '../engine.js';
import { GATE_ROTATIONS, rotate, arcPoints } from '../bloch-rotation.js';

const close = (a, b) => Math.abs(a - b) < 1e-9;
const vec = (s, q, n) => { const { x, y, z } = blochVector(s.re, s.im, q, n); return [x, y, z]; };

// A spread of states, including entangled ones whose qubits are mixed
function states() {
  const list = [];
  const seq = [
    [['H', 0]], [['H', 0], ['T', 0]], [['H', 0], ['S', 0], ['H', 0], ['T', 0]],
    [['Y', 0], ['H', 0], ['T', 0], ['H', 0]], [['H', 0], ['T', 0], ['CNOT', 0, 1]],
    [['H', 0], ['T', 0], ['H', 0], ['CNOT', 0, 1], ['S', 1]], [['H', 0], ['CNOT', 0, 1], ['CNOT', 1, 2]]
  ];
  for (const steps of seq) {
    let s = zeroState(3);
    for (const [g, a, b] of steps) s = g === 'CNOT' ? applyCNOT(s.re, s.im, a, b, 3) : applyGate(s.re, s.im, g, a, 3);
    list.push(s);
  }
  return list;
}

describe('gate turns', () => {
  for (const [gate, turn] of Object.entries(GATE_ROTATIONS)) {
    test(`${gate}: the turn takes each qubit's vector to where the gate puts it`, () => {
      for (const s of states()) {
        for (let q = 0; q < 3; q++) {
          const before = vec(s, q, 3);
          const after = applyGate(s.re, s.im, gate, q, 3);
          const turned = rotate(before, turn.axis, turn.angle);
          vec(after, q, 3).forEach((v, k) => assert.ok(close(v, turned[k]), `${gate} q${q}: ${turned} vs ${vec(after, q, 3)}`));
          // The other qubits' vectors don't move
          for (let o = 0; o < 3; o++) {
            if (o !== q) vec(after, o, 3).forEach((v, k) => assert.ok(close(v, vec(s, o, 3)[k])));
          }
        }
      }
    });
  }

  test('S turns +x to +y (right-handed, as the lessons say)', () => {
    const v = rotate([1, 0, 0], GATE_ROTATIONS.S.axis, GATE_ROTATIONS.S.angle);
    assert.ok(close(v[0], 0) && close(v[1], 1) && close(v[2], 0));
  });

  test('arcPoints start at v, end at the turned v, and stay on the same sphere', () => {
    const v = [0.6, 0, 0.8 * 0.5];
    const pts = arcPoints(v, GATE_ROTATIONS.H);
    assert.deepEqual(pts[0], v);
    const end = rotate(v, GATE_ROTATIONS.H.axis, Math.PI);
    pts.at(-1).forEach((c, k) => assert.ok(close(c, end[k])));
    const len = Math.hypot(...v);
    for (const p of pts) assert.ok(close(Math.hypot(...p), len));
    assert.equal(arcPoints(v, GATE_ROTATIONS.T, 0.5, 32).length, 17);
  });
});
