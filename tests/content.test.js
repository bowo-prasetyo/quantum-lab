// The long-form content (content/<code>.js): the words of the lessons,
// Quantum Concepts and Help. Every language must fit the lessons it
// describes and the English it translates: the same lessons, the same
// number of prediction options in the same order (lessons.js stores the
// right answer as an index), the same structure and markup, and only the
// button and view names content.js knows.
// Run with: npm test

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { LOCALES, DEFAULT_LOCALE } from '../locales/index.js';
import { LESSONS, PARTS } from '../lessons.js';
import { BUTTONS, buttonLabels, lessonText, partTitle, conceptsText, helpText } from '../content.js';
import { setLocale } from '../i18n.js';

afterEach(() => setLocale(DEFAULT_LOCALE));

const english = LOCALES[DEFAULT_LOCALE].content;
const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
const markup = text => ({
  bold: (text.match(/\*\*(.+?)\*\*/g) ?? []).length,
  em: (text.replace(/\*\*(.+?)\*\*/g, '').match(/\*[^*\s][^*]*?\*/g) ?? []).length,
  links: [...text.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1])
});

// Every string in a piece of content, with where it is
function strings(value, path = []) {
  if (typeof value === 'string') return [[path.join('.'), value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, [...path, i]));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => strings(v, [...path, k]));
  return [];
}

// The value at a dotted path, or undefined
const at = (root, path) => path.split('.').reduce((v, k) => v?.[k], root);

describe('English content', () => {
  test('every lesson and part has its words, and nothing else is described', () => {
    assert.deepEqual(Object.keys(english.lessons).sort(), LESSONS.map(l => l.id).sort());
    assert.deepEqual(Object.keys(english.parts).sort(), PARTS.map(p => String(p.part)).sort());
    for (const lesson of LESSONS) {
      const text = english.lessons[lesson.id];
      for (const field of ['title', 'goal', 'why', 'question', 'result']) assert.equal(typeof text[field], 'string', `${lesson.id}.${field}`);
      assert.ok(Array.isArray(text.steps) && text.steps.length, `${lesson.id}.steps`);
      assert.ok(Array.isArray(text.options) && text.options.length >= 2, `${lesson.id}.options`);
    }
  });

  test('uses only placeholders that name a button or view, and every one of them', () => {
    const used = new Set(strings(english).flatMap(([, s]) => placeholders(s)));
    for (const name of used) assert.ok(Object.hasOwn(BUTTONS, name), `unknown placeholder {${name}}`);
    for (const name of Object.keys(BUTTONS)) assert.ok(used.has(name), `{${name}} is never used`);
  });

  test('every button and view name exists in the interface messages', () => {
    // A missing message comes back as its key, such as "gates.measureAll"
    for (const [name, label] of Object.entries(buttonLabels())) {
      assert.ok(label && !/^[a-zA-Z]+\.[a-zA-Z0-9]+$/.test(label), `${name}: "${label}"`);
    }
  });

  test('titles are plain text: no markup or placeholders (they appear in links and headings)', () => {
    const titles = [
      ...Object.values(english.lessons).map(l => l.title),
      ...Object.values(english.parts),
      english.concepts.title, english.help.title,
      ...english.concepts.sections.map(s => s.title),
      ...english.help.sections.map(s => s.title)
    ];
    for (const title of titles) assert.doesNotMatch(title, /[*[\]{}]/, title);
  });

  test('a lesson names buttons exactly as they read', () => {
    assert.deepEqual(lessonText('bit-flip').steps, ['Press X on qubit 0.', 'Press Measure all.']);
    assert.match(helpText().sections[0].blocks[0].ol[2], /^Press \*\*Measure all\*\*\./);
    assert.match(lessonText('noisy-readout').steps.join(' '), /Correct for readout errors \(mitigation\)/);
  });
});

describe('every language', () => {
  for (const [code, locale] of Object.entries(LOCALES)) {
    if (!locale.content) continue;

    test(`${code}: describes only real lessons and parts, with the same number of options`, () => {
      for (const id of Object.keys(locale.content.lessons ?? {})) {
        assert.ok(Object.hasOwn(english.lessons, id), `unknown lesson ${id}`);
        const options = locale.content.lessons[id].options;
        if (options) assert.equal(options.length, english.lessons[id].options.length, `${id}: options (the answer is an index)`);
      }
      for (const part of Object.keys(locale.content.parts ?? {})) assert.ok(Object.hasOwn(english.parts, part), `unknown part ${part}`);
    });

    test(`${code}: same structure, markup and placeholders as English`, () => {
      for (const [path, text] of strings(locale.content)) {
        const source = at(english, path);
        assert.equal(typeof source, 'string', `${path}: not in English`);
        assert.deepEqual(markup(text), markup(source), `${path}: bold, emphasis and links in "${text}"`);
        for (const name of placeholders(text)) assert.ok(Object.hasOwn(BUTTONS, name), `${path}: unknown placeholder {${name}}`);
      }
    });
  }

  test('a language that leaves something out shows it in English', () => {
    setLocale('en-XA');
    assert.match(lessonText('bit-flip').title, /^⟦Ɓíţ ƒļíþ/);
    assert.match(partTitle(1), /^⟦Öñé ǫúƀíţ/);
    // Button names inside pseudo text come from the pseudo messages
    assert.match(lessonText('bit-flip').steps[1], /⟦Ṁéášúŕé áļļ ~+⟧/);
    assert.match(conceptsText().title, /^⟦/);
  });
});
