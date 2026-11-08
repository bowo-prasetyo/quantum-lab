// Short text descriptions of a state, read out to screen-reader users after
// each action (see the lab's announcement line in lab.js), and of numbers
// shown on the canvases. Plain functions, so the unit tests can check them.

import { probabilities, basisLabel } from './engine.js';

/** A probability as a short percentage: 0.5 → "50%", 0.125 → "12.5%". */
export function percent(p) {
  const v = Math.round(p * 1000) / 10;
  return `${Number.isInteger(v) ? v : v.toFixed(1)}%`;
}

/** An angle in radians as whole degrees, with a real minus sign: "−90°". */
export function degrees(radians) {
  const d = Math.round(radians * 180 / Math.PI);
  return `${d === 0 ? 0 : d}°`.replace('-', '−');
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

  const equal = outcomes.every(o => Math.abs(o.p - outcomes[0].p) < 1e-6);
  if (equal && outcomes.length > 4) return `${outcomes.length} outcomes, ${percent(outcomes[0].p)} each`;

  if (outcomes.length <= 4) return outcomes.map(o => `${o.label} ${percent(o.p)}`).join(', ');

  const top = [...outcomes].sort((a, b) => b.p - a.p).slice(0, 4);
  // Listed in basis order, which is easier to follow than likelihood order
  const shown = outcomes.filter(o => top.includes(o));
  return `${shown.map(o => `${o.label} ${percent(o.p)}`).join(', ')}, and ${outcomes.length - 4} more`;
}
