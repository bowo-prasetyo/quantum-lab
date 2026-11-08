// Short text descriptions of a state, read out to screen-reader users after
// each action (see the lab's announcement line in lab.js), and of numbers
// shown on the canvases. Plain functions, so the unit tests can check them.
// The words come from the current language (i18n.js).

import { probabilities, basisLabel } from './engine.js';
import { t, formatNumber, formatPercent } from './i18n.js';

/** A probability as a short percentage: 0.5 → "50%", 0.125 → "12.5%" ("12,5 %" in German). */
export function percent(p) {
  return formatPercent(Math.round(p * 1000) / 1000, { digits: 1 });
}

/** An angle in radians as whole degrees, with a real minus sign: "−90°". */
export function degrees(radians) {
  return t('number.degrees', { value: formatNumber(Math.round(radians * 180 / Math.PI), { minus: true }) });
}

/**
 * The last measurement in words: '-' before any, a basis label such as
 * "|01⟩" after Measure all, or { qubit, bit } after measuring one qubit
 * ("qubit 0 gave 1").
 */
export function measurementText(measurement) {
  if (measurement && typeof measurement === 'object') return t('measurement.qubit', measurement);
  return measurement === '-' ? t('measurement.none') : measurement;
}

/**
 * The outcomes a measurement could give, e.g. "|00⟩ 50%, |11⟩ 50%".
 * Many equally likely outcomes are summed up ("8 outcomes, 12.5% each");
 * otherwise at most the 4 likeliest are listed, then "and 3 more".
 */
export function describeState(re, im, n) {
  const outcomes = probabilities(re, im)
    .map((p, i) => ({ label: basisLabel(i, n), p }))
    .filter(o => o.p > 0.0005);
  const listed = list => list
    .map(o => t('describe.outcome', { label: o.label, percent: percent(o.p) }))
    .join(t('list.separator'));

  const equal = outcomes.every(o => Math.abs(o.p - outcomes[0].p) < 1e-6);
  if (equal && outcomes.length > 4) {
    return t('describe.equal', { count: outcomes.length, percent: percent(outcomes[0].p) });
  }

  if (outcomes.length <= 4) return listed(outcomes);

  const top = [...outcomes].sort((a, b) => b.p - a.p).slice(0, 4);
  // Listed in basis order, which is easier to follow than likelihood order
  const shown = outcomes.filter(o => top.includes(o));
  return t('describe.more', { list: listed(shown), count: outcomes.length - 4 });
}
