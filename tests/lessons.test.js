// Checks every lesson with the engine alone: its data is well formed, its
// prediction answer is valid, and running Set up then its steps really
// gives the result it promises. Run with: npm test

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LESSONS, PANELS, PARTS } from '../lessons.js';
import { evaluateChecks, runOps } from '../lesson-checks.js';

/** Small seeded random generator (mulberry32) for repeatable measurements. */
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('lesson data', () => {
  test('ids are unique and URL-safe', () => {
    const ids = LESSONS.map(l => l.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9-]+$/);
  });

  test('parts run in order, and each lesson uses its part\'s number of qubits', () => {
    let lastPart = 1;
    for (const lesson of LESSONS) {
      assert.ok(lesson.part >= lastPart, `${lesson.id} is out of order`);
      lastPart = lesson.part;
      const part = PARTS.find(p => p.part === lesson.part);
      assert.ok(part, `${lesson.id}: unknown part ${lesson.part}`);
      assert.equal(lesson.n, part.n, `${lesson.id}: n`);
    }
  });

  for (const lesson of LESSONS) {
    test(`${lesson.id}: has every field, valid panels and a valid prediction`, () => {
      assert.ok(typeof lesson.title === 'string' && lesson.title.length > 0, 'title');
      for (const field of ['goal', 'why', 'result']) {
        assert.ok(typeof lesson[field] === 'string' && lesson[field].length > 20, `${field}`);
      }
      assert.ok(lesson.steps.length > 0, 'steps');
      assert.ok(lesson.checks.length > 0, 'checks');
      assert.deepEqual(lesson.setup[0], ['reset'], 'setup starts with reset');
      for (const panel of lesson.panels) assert.ok(PANELS.includes(panel), `panel ${panel}`);
      assert.ok(lesson.predict.options.length >= 2, 'at least two options');
      assert.ok(Number.isInteger(lesson.predict.answer) &&
        lesson.predict.answer >= 0 && lesson.predict.answer < lesson.predict.options.length, 'answer index');
    });
  }
});

describe('every lesson gives the result it promises', () => {
  for (const lesson of LESSONS) {
    test(`${lesson.id}: Set up, then the steps, meets every check`, () => {
      // Lessons with measurements are run with several seeds, so a check
      // that only holds for some random outcomes would fail.
      const seeds = lesson.ops.some(op => op[0] === 'measure') ? [1, 2, 3, 4, 5, 6, 7, 8] : [1];
      for (const seed of seeds) {
        const random = seeded(seed);
        const afterSetup = runOps(lesson.setup, lesson.n, null, random);
        const final = runOps(lesson.ops, lesson.n, afterSetup, random);
        const { pass, results } = evaluateChecks(lesson.checks, final);
        assert.ok(pass, `seed ${seed}:\n` + results.filter(r => !r.pass).map(r => '  ' + r.text).join('\n'));
      }
    });
  }

  test('a check fails when the steps are skipped (the checks are not trivially true)', () => {
    let distinguishing = 0;
    for (const lesson of LESSONS) {
      // Skip lessons with no steps, and ones that end where they start on purpose
      if (!lesson.ops.length || lesson.returnsToStart) continue;
      const afterSetup = runOps(lesson.setup, lesson.n, null, seeded(1));
      if (!evaluateChecks(lesson.checks, afterSetup).pass) distinguishing++;
      else assert.fail(`${lesson.id}: its checks already pass right after Set up`);
    }
    assert.ok(distinguishing > 0);
  });
});
