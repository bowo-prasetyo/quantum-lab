// The English messages (locales/en.js) and the code that uses them stay in
// step: every key the code names exists, and every message is used. Also
// checks the translatable text helpers (describe.js, lesson-checks.js) in
// a language whose numbers differ from English.
// Run with: npm test

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import en from '../locales/en.js';
import { setLocale } from '../i18n.js';
import { parseMarkup } from '../locale.js';
import { describeState, percent, degrees, measurementText } from '../describe.js';
import { evaluateCheck } from '../lesson-checks.js';
import { stepLabel } from '../components/circuit-editor.js';
import { entryText } from '../components/unitary-view.js';
import { zeroState, applyGate } from '../engine.js';

afterEach(() => setLocale('en'));

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const SOURCES = ['.', 'components', 'pages']
  .flatMap(dir => readdirSync(join(ROOT, dir)).filter(f => f.endsWith('.js')).map(f => join(ROOT, dir, f)))
  .map(file => readFileSync(file, 'utf8'));

// Keys built in code from a prefix and a variable, e.g. t(`gate.${gate}`)
const DYNAMIC = ['advanced.', 'gate.', 'interference.', 'noise.', 'rotation.', 'step.', 'view.', 'editor.caption', 'density.caption'];

const sections = new Set(Object.keys(en).map(k => k.split('.')[0]));
// Keys are written in single quotes or backticks (t('nav.help')), or as
// k="..." on <i18n-t>; double quotes elsewhere hold Vue expressions
const named = new Set(SOURCES.flatMap(src => [
  ...[...src.matchAll(/['`]([a-zA-Z]+\.[a-zA-Z0-9]+)['`]/g)].map(m => m[1]),
  ...[...src.matchAll(/\bk="([a-zA-Z]+\.[a-zA-Z0-9]+)"/g)].map(m => m[1])
]).filter(k => sections.has(k.split('.')[0])));

describe('English messages', () => {
  test('every key the code names exists in locales/en.js', () => {
    const missing = [...named].filter(k => !Object.hasOwn(en, k));
    assert.deepEqual(missing, []);
  });

  test('every message is used by the code', () => {
    const unused = Object.keys(en).filter(k => !named.has(k) && !DYNAMIC.some(p => k.startsWith(p)));
    assert.deepEqual(unused, []);
  });
});

describe('message markup', () => {
  test('splits bold, emphasis, links and slots', () => {
    assert.deepEqual(parseMarkup('Press **Run** or see [Help](/help), {btn}. *Recorded*, 2 * 3.'), [
      { text: 'Press ' }, { bold: 'Run' }, { text: ' or see ' }, { link: 'Help', to: '/help' },
      { text: ', ' }, { slot: 'btn' }, { text: '. ' }, { em: 'Recorded' }, { text: ', 2 * 3.' }
    ]);
    assert.deepEqual(parseMarkup('plain'), [{ text: 'plain' }]);
  });
});

describe('text in another number style', () => {
  // The pseudo-locale formats numbers as German does
  test('percentages, angles and state descriptions', () => {
    setLocale('en-XA');
    assert.equal(percent(0.125), '12,5\u00a0%');
    assert.equal(degrees(-Math.PI / 2), '⟦−90° ~~~⟧');
    const s = applyGate(...Object.values(zeroState(1)), 'H', 0, 1);
    assert.match(describeState(s.re, s.im, 1), /\|0⟩ 50\u00a0%.*\|1⟩ 50\u00a0%/);
  });

  test('matrix entries and noise steps', () => {
    setLocale('en-XA');
    assert.equal(entryText(-Math.SQRT1_2, 0), '−0,71');
    assert.match(stepLabel({ gate: 'N', target: 1, channel: 'dephasing', strength: 0.1 }), /10\u00a0%.*ǫ1/);
    assert.equal(stepLabel({ gate: 'CNOT', control: 0, target: 1 }), 'CNOT q0→q1', 'gate names and qN stay as they are');
  });

  test('lesson checks report numbers in the language', () => {
    setLocale('en-XA');
    const { re, im } = zeroState(1);
    const { text } = evaluateCheck({ type: 'probs', values: { '|0⟩': 1 } }, { re, im, n: 1, measured: '-' });
    assert.match(text, /100,0\u00a0%/);
  });

  test('a single-qubit measurement is kept as data and put into words when shown', () => {
    assert.equal(measurementText({ qubit: 0, bit: 1 }), 'qubit 0 gave 1');
    assert.equal(measurementText('|01⟩'), '|01⟩');
    assert.equal(measurementText('-'), '-');
    setLocale('en-XA');
    assert.match(measurementText({ qubit: 2, bit: 0 }), /^⟦ǫúƀíţ 2 ĝáṽé 0/);
  });
});
