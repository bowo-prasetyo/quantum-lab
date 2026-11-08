// Internationalization core: the current language, translated messages and
// locale-aware formatting. Plain JavaScript with no DOM and no Vue, so the
// unit tests (tests/i18n.test.js) and plain modules such as describe.js can
// use it. locale.js connects it to the page and to Vue. See docs/I18N.md.
//
// Messages live in locales/<code>.js as flat objects of dotted keys:
//
//   'nav.lessons': 'Lessons',
//   'nav.lab': { one: '{count} qubit', other: '{count} qubits' },
//
// {name} is replaced by params.name. A message given as an object is a
// plural: params.count picks the form by the language's plural rules
// (Intl.PluralRules: zero, one, two, few, many, other), falling back to
// 'other'. Values are inserted as they are, so format numbers first with
// formatNumber or formatPercent where the locale's digits matter.

import { LOCALES, DEFAULT_LOCALE } from './locales/index.js';

/** Languages written right to left. None is offered yet (see docs/I18N.md). */
const RTL = new Set(['ar', 'fa', 'he', 'ur', 'yi']);

let current = DEFAULT_LOCALE;
const listeners = new Set();
const warned = new Set();

// ---------- Locales ----------

/**
 * The codes of the languages a learner can choose, in menu order.
 * The pseudo-locale, a test language, is left out unless asked for.
 */
export function availableLocales({ includePseudo = false } = {}) {
  return Object.keys(LOCALES).filter(code => includePseudo || !LOCALES[code].pseudo);
}

/** The language's name in that language, e.g. "English". */
export function localeName(code) {
  return LOCALES[code]?.name ?? code;
}

export function isRtl(code) {
  return RTL.has(code.split('-')[0].toLowerCase());
}

/**
 * The best supported locale for a list of requested ones (most wanted
 * first, as in navigator.languages), or null if none fits. An exact match
 * wins ("pt-BR" → "pt-BR"); then the same language ("pt-BR" → "pt", or
 * "pt" → "pt-PT"). Case-insensitive, so "EN-us" matches "en-US".
 */
export function negotiate(requested, available) {
  const lower = new Map(available.map(code => [code.toLowerCase(), code]));
  for (const wanted of requested) {
    if (typeof wanted !== 'string' || !wanted) continue;
    const w = wanted.toLowerCase();
    if (lower.has(w)) return lower.get(w);
    const base = w.split('-')[0];
    if (lower.has(base)) return lower.get(base);
    const sameLanguage = available.find(code => code.toLowerCase().split('-')[0] === base);
    if (sameLanguage) return sameLanguage;
  }
  return null;
}

/**
 * The language to start in. In order: the address (?lang=, which may name
 * the pseudo-locale), the learner's saved choice, the browser's languages,
 * then English.
 */
export function detectLocale({ search = '', saved = null, languages = [] } = {}) {
  const fromUrl = new URLSearchParams(search).get('lang');
  return negotiate(fromUrl ? [fromUrl] : [], availableLocales({ includePseudo: true }))
    ?? negotiate([saved], availableLocales())
    ?? negotiate(languages, availableLocales())
    ?? DEFAULT_LOCALE;
}

export function getLocale() {
  return current;
}

/**
 * Switches language (to the closest supported one) and tells every
 * listener. Returns the locale now in use.
 */
export function setLocale(code) {
  const next = negotiate([code], availableLocales({ includePseudo: true })) ?? DEFAULT_LOCALE;
  if (next !== current) {
    current = next;
    for (const fn of listeners) fn(current);
  }
  return current;
}

/** Calls fn(locale) after each change of language. Returns a function that stops it. */
export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---------- Messages ----------

/** "pt-BR" → ["pt-BR", "pt", "en"]: where to look for a message, in order. */
export function fallbackChain(code) {
  const chain = [];
  const parts = code.split('-');
  for (let k = parts.length; k > 0; k--) chain.push(parts.slice(0, k).join('-'));
  if (!chain.includes(DEFAULT_LOCALE)) chain.push(DEFAULT_LOCALE);
  return chain.filter(c => LOCALES[c]);
}

/** The locale whose rules (plurals, digits, lists) Intl should use. */
function intlLocale(code) {
  return LOCALES[code]?.intl ?? code;
}

function interpolate(text, params) {
  return text.replace(/\{(\w+)\}/g, (whole, name) =>
    (Object.hasOwn(params, name) ? String(params[name]) : whole));
}

/**
 * The message `key` in the current language (or `locale`), with params
 * filled in. Falls back to less specific languages and then English; a key
 * missing everywhere comes back as the key itself, so it shows up on screen.
 */
export function t(key, params = {}, locale = current) {
  for (const code of fallbackChain(locale)) {
    const message = LOCALES[code].messages[key];
    if (message === undefined) continue;
    if (typeof message === 'string') return interpolate(message, params);
    const count = Number(params.count);
    const form = new Intl.PluralRules(intlLocale(code)).select(count);
    return interpolate(message[form] ?? message.other, params);
  }
  if (!warned.has(key)) {
    warned.add(key);
    console.warn(`i18n: no message for "${key}"`);
  }
  return key;
}

// ---------- Formatting ----------

/**
 * A number with exactly `digits` decimals in the current language's style:
 * 0.7071 → "0.707" in English, "0,707" in German. Never "-0".
 */
export function formatNumber(value, { digits = 0, locale = current } = {}) {
  return new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'negative'
  }).format(value);
}

/** A probability as a percentage with up to `digits` decimals: 0.125 → "12.5%". */
export function formatPercent(fraction, { digits = 1, locale = current } = {}) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: digits
  }).format(fraction);
}

/** A list joined in the current language's style: ["X", "H", "Z"] → "X, H, and Z". */
export function formatList(items, { type = 'conjunction', locale = current } = {}) {
  return new Intl.ListFormat(intlLocale(locale), { style: 'long', type }).format(items.map(String));
}
