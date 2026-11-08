// Unit tests for the internationalization core (i18n.js) and the message
// tables (locales/): lookup, plurals, fallbacks, choosing a language,
// formatting, the pseudo-locale, and that every language translates the
// same keys with the same placeholders as English.

import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  t, setLocale, getLocale, onLocaleChange, negotiate, detectLocale, fallbackChain,
  availableLocales, localeName, isRtl, formatNumber, formatPercent, formatList
} from '../i18n.js';
import { LOCALES, DEFAULT_LOCALE } from '../locales/index.js';
import { pseudoText } from '../locales/pseudo.js';

afterEach(() => setLocale(DEFAULT_LOCALE));

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();
const forms = message => (typeof message === 'string' ? [message] : Object.values(message));

describe('messages', () => {
  test('looks up a message and fills in placeholders', () => {
    assert.equal(t('nav.lessons'), 'Lessons');
    assert.equal(t('nav.lab', { count: 2 }), '2 qubits');
  });

  test('picks the plural form by the language’s rules', () => {
    assert.equal(t('nav.lab', { count: 1 }), '1 qubit');
    assert.equal(t('nav.lab', { count: 3 }), '3 qubits');
    assert.equal(t('nav.lab', { count: 0 }), '0 qubits');
  });

  test('a missing key comes back as the key, so it shows on screen', () => {
    const warn = console.warn;
    const warnings = [];
    console.warn = m => warnings.push(m);
    try {
      assert.equal(t('no.such.key'), 'no.such.key');
      t('no.such.key');
      assert.equal(warnings.length, 1, 'warns once per key');
    } finally {
      console.warn = warn;
    }
  });

  test('a placeholder with no value is left visible', () => {
    assert.equal(t('nav.lab', {}), '{count} qubits');
  });

  test('looks in less specific languages, then English', () => {
    assert.deepEqual(fallbackChain('en-XA'), ['en-XA', 'en']);
    assert.deepEqual(fallbackChain('en-GB'), ['en']);
    assert.deepEqual(fallbackChain('xx-YY'), ['en']);
  });
});

describe('choosing a language', () => {
  test('negotiate: exact, then same language, else null', () => {
    const available = ['en', 'pt-BR', 'de'];
    assert.equal(negotiate(['pt-BR'], available), 'pt-BR');
    assert.equal(negotiate(['pt-PT'], available), 'pt-BR');
    assert.equal(negotiate(['de-AT'], available), 'de');
    assert.equal(negotiate(['EN-us'], available), 'en');
    assert.equal(negotiate(['fr', 'de'], available), 'de', 'first supported in order of preference');
    assert.equal(negotiate(['fr', 'ja'], available), null);
    assert.equal(negotiate([null, undefined, ''], available), null);
  });

  test('detectLocale: address, then saved choice, then browser, then English', () => {
    assert.equal(detectLocale({ search: '?lang=en-XA', saved: 'en', languages: ['en'] }), 'en-XA');
    assert.equal(detectLocale({ search: '?lang=zz', saved: 'en' }), 'en', 'unknown ?lang= is ignored');
    assert.equal(detectLocale({ saved: 'en', languages: ['fr'] }), 'en');
    assert.equal(detectLocale({ languages: ['fr-FR', 'en-US'] }), 'en');
    assert.equal(detectLocale({ languages: ['fr-FR'] }), 'en');
    assert.equal(detectLocale(), 'en');
  });

  test('the pseudo-locale is never picked from the browser or a saved choice', () => {
    assert.equal(detectLocale({ saved: 'en-XA' }), 'en');
    assert.equal(detectLocale({ languages: ['en-XA'] }), 'en');
    assert.ok(!availableLocales().includes('en-XA'));
    assert.ok(availableLocales({ includePseudo: true }).includes('en-XA'));
  });

  test('setLocale switches, tells listeners, and falls back for unknown codes', () => {
    const seen = [];
    const stop = onLocaleChange(l => seen.push(l));
    assert.equal(setLocale('en-XA'), 'en-XA');
    assert.equal(getLocale(), 'en-XA');
    assert.equal(setLocale('en-XA'), 'en-XA', 'no change, no event');
    assert.equal(setLocale('zz'), 'en');
    stop();
    setLocale('en-XA');
    assert.deepEqual(seen, ['en-XA', 'en']);
  });

  test('names and direction', () => {
    assert.equal(localeName('en'), 'English');
    assert.equal(localeName('zz'), 'zz');
    assert.equal(isRtl('ar-EG'), true);
    assert.equal(isRtl('he'), true);
    assert.equal(isRtl('en'), false);
  });
});

describe('formatting', () => {
  test('numbers follow the language, with a fixed number of decimals', () => {
    assert.equal(formatNumber(0.70710678, { digits: 3 }), '0.707');
    assert.equal(formatNumber(0.70710678, { digits: 3, locale: 'de' }), '0,707');
    assert.equal(formatNumber(1, { digits: 2 }), '1.00');
    assert.equal(formatNumber(-0.0001, { digits: 2 }), '0.00', 'never "-0.00"');
    assert.equal(formatNumber(-0.5, { digits: 1 }), '-0.5');
  });

  test('percentages', () => {
    assert.equal(formatPercent(0.5), '50%');
    assert.equal(formatPercent(0.125), '12.5%');
    assert.equal(formatPercent(0.125, { locale: 'de' }), '12,5\u00a0%', 'German puts a no-break space before %');
  });

  test('lists', () => {
    assert.equal(formatList(['X', 'H', 'Z']), 'X, H, and Z');
    assert.equal(formatList(['X', 'H']), 'X and H');
    assert.equal(formatList(['X', 'H'], { type: 'disjunction' }), 'X or H');
  });

  test('the pseudo-locale formats like English', () => {
    setLocale('en-XA');
    assert.equal(formatNumber(0.5, { digits: 2 }), '0.50');
    assert.equal(t('nav.lab', { count: 1 }).includes('1'), true);
  });
});

describe('pseudo-locale', () => {
  test('accents letters, brackets and lengthens the text, keeps placeholders', () => {
    const text = pseudoText('{count} qubits');
    assert.match(text, /^\[\{count\} ǫúƀíţš ~+\]$/);
    assert.ok(text.length >= '{count} qubits'.length * 1.3);
  });

  test('plural messages keep their forms', () => {
    setLocale('en-XA');
    assert.equal(t('nav.lab', { count: 1 }), '[1 ǫúƀíţ ~~~~~]');
    assert.equal(t('nav.lab', { count: 2 }), '[2 ǫúƀíţš ~~~~~]');
  });
});

describe('every language', () => {
  const english = LOCALES[DEFAULT_LOCALE].messages;

  for (const [code, locale] of Object.entries(LOCALES)) {
    test(`${code}: has a name and only English keys`, () => {
      assert.ok(locale.name, 'name');
      for (const key of Object.keys(locale.messages)) {
        assert.ok(Object.hasOwn(english, key), `${key} is not in en.js`);
      }
    });

    test(`${code}: same placeholders as English, and every plural form it needs`, () => {
      const rules = new Intl.PluralRules(locale.intl ?? code).resolvedOptions().pluralCategories;
      for (const [key, message] of Object.entries(locale.messages)) {
        const expected = placeholders(forms(english[key])[0]);
        for (const text of forms(message)) {
          assert.equal(typeof text, 'string', `${key}: text`);
          assert.deepEqual(placeholders(text), expected, `${key}: placeholders in "${text}"`);
        }
        if (typeof message !== 'string') {
          assert.equal(typeof english[key], 'object', `${key}: plural only if English is`);
          for (const form of rules) assert.ok(Object.hasOwn(message, form), `${key}: plural form "${form}"`);
          for (const form of Object.keys(message)) assert.ok(rules.includes(form), `${key}: unknown plural form "${form}"`);
        }
      }
    });
  }

  test('English plurals are written as plurals with a count', () => {
    for (const [key, message] of Object.entries(english)) {
      if (typeof message === 'string') continue;
      for (const text of forms(message)) assert.ok(text.includes('{count}'), `${key}: uses {count}`);
    }
  });
});
