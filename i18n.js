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
//
// A message may also mark text **bold** or *emphasized*, or link it,
// [like this](/lessons).
// Plain t() returns that markup as it is; the <i18n-t> component
// (locale.js) turns it into <strong> and <router-link>.
//
// Every call reads the current language through track(), which the Vue
// plugin (locale.js) points at a reactive value: a template or computed
// property that calls t() or a format function then re-renders by itself
// when the language changes, even through plain modules such as describe.js.

import { LOCALES, DEFAULT_LOCALE } from './locales/index.js';

/** Languages written right to left. None is offered yet (see docs/I18N.md). */
const RTL = new Set(['ar', 'fa', 'he', 'ur', 'yi']);

let current = DEFAULT_LOCALE;
const listeners = new Set();
const warned = new Set();
let track = () => {};

/** Lets a reactive system see each read of the language (see locale.js). */
export function trackLocaleWith(fn) {
  track = fn;
}

// The language in use, as a dependency of whoever is asking
function active() {
  track();
  return current;
}

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
  return active();
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
export function t(key, params = {}, locale = active()) {
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

/**
 * Fills {placeholders} in a text from params, leaving unknown ones as they
 * are. t() does this for messages; content.js for lesson and page text.
 */
export function fill(text, params = {}) {
  return interpolate(text, params);
}

// ---------- Content (lessons, Concepts, Help) ----------

/**
 * A piece of the long-form content (content/<code>.js) by its path, e.g.
 * ['lessons', 'bit-flip', 'title'], from the most specific language that
 * has it, then English: a translation can leave anything out. Returns
 * undefined if even English has nothing there.
 */
export function contentText(path, locale = active()) {
  for (const code of fallbackChain(locale)) {
    let value = LOCALES[code].content;
    for (const key of path) value = value?.[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

// ---------- Formatting ----------

// Formatters are slow to build and called on every redraw, so keep them
const formatters = new Map();
function formatter(Kind, locale, options) {
  const key = `${Kind.name}|${locale}|${JSON.stringify(options)}`;
  if (!formatters.has(key)) formatters.set(key, new Kind(intlLocale(locale), options));
  return formatters.get(key);
}

// Maths uses a real minus sign (−), not the hyphen most locales print
const mathMinus = text => text.replace(/-/g, '−');

// Rounds as toFixed does, so a number reads the same in every language and
// as it always has (Intl alone would round 1.005 to 1.01, toFixed to 1.00)
const roundLikeToFixed = (value, digits) => Number(value.toFixed(digits));

/**
 * A number with exactly `digits` decimals in the current language's style:
 * 0.7071 → "0.707" in English, "0,707" in German. Never "-0". Groups
 * thousands only from five digits up (12 345, but 1000), as is usual for
 * numbers in science. `minus: true` uses a real minus sign (−0.5).
 */
export function formatNumber(value, { digits = 0, minus = false, locale = active() } = {}) {
  const text = formatter(Intl.NumberFormat, locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay: 'negative',
    useGrouping: 'min2'
  }).format(roundLikeToFixed(value, digits));
  return minus ? mathMinus(text) : text;
}

/**
 * A fraction as a percentage with up to `digits` decimals (exactly `digits`
 * with `fixed: true`): 0.125 → "12.5%" in English, "12,5 %" in German.
 */
export function formatPercent(fraction, { digits = 1, fixed = false, minus = false, locale = active() } = {}) {
  const text = formatter(Intl.NumberFormat, locale, {
    style: 'percent',
    minimumFractionDigits: fixed ? digits : 0,
    maximumFractionDigits: digits,
    signDisplay: 'negative',
    useGrouping: 'min2'
  }).format(roundLikeToFixed(fraction * 100, digits) / 100);
  return minus ? mathMinus(text) : text;
}

/** A list joined in the current language's style: ["X", "H", "Z"] → "X, H and Z". */
export function formatList(items, { type = 'conjunction', locale = active() } = {}) {
  return formatter(Intl.ListFormat, locale, { style: 'long', type }).format(items.map(String));
}

/** The text with its first letter capitalized, by the language's rules. */
export function capitalize(text, { locale = active() } = {}) {
  return text.charAt(0).toLocaleUpperCase(intlLocale(locale)) + text.slice(1);
}
