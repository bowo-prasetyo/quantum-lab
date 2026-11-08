// Interference: how the amplitudes combined in the last step.
//
// Every output amplitude is a sum of paths, ψ'j = Σi U[j][i]·ψi. Each row
// draws those paths as arrows laid head to tail in the complex plane
// (colour = phase, the same colours as the density matrix and 3D view),
// with a dashed arrow for their sum, and says in words whether they added
// up or cancelled. The words carry everything the drawing shows.

import * as engine from '../engine.js';
import { phaseToCss } from '../colors.js';
import { percent } from '../describe.js';

const SVG_SIZE = 96;
const SVG_RADIUS = 40; // longest chain of arrows, in SVG units
const HEAD = 7;        // arrowhead length
const STEP_ASIDE = 6;  // sideways shift of an arrow that doubles back

// "0.707", "−0.500i", "0.500 − 0.500i"
function complexText(re, im) {
  const f = v => Math.abs(v).toFixed(3);
  const small = v => Math.abs(v) < 5e-4;
  if (small(im)) return `${re < 0 && !small(re) ? '−' : ''}${f(re)}`;
  if (small(re)) return `${im < 0 ? '−' : ''}${f(im)}i`;
  return `${re < 0 ? '−' : ''}${f(re)} ${im < 0 ? '−' : '+'} ${f(im)}i`;
}

/**
 * Lays paths head to tail. An arrow that doubles back over the previous
 * one (more than 90° from it) is shifted sideways, so opposite arrows lie
 * side by side instead of hiding each other. Returns arrows with their
 * arrowhead points, in SVG coordinates (y down).
 */
export function layArrows(paths, scale) {
  let x = 0;
  let y = 0;
  let shift = 0;
  let prev = null;
  // Sideways means perpendicular to the first arrow
  const first = paths[0];
  const len = first ? Math.hypot(first.re, first.im) || 1 : 1;
  const side = first ? { x: first.im / len, y: first.re / len } : { x: 0, y: 1 };

  return paths.map(p => {
    const dx = p.re * scale;
    const dy = -p.im * scale;
    if (prev && dx * prev.dx + dy * prev.dy < 0) shift += STEP_ASIDE;
    prev = { dx, dy };
    const x1 = x + side.x * shift;
    const y1 = y + side.y * shift;
    const x2 = x1 + dx;
    const y2 = y1 + dy;
    x += dx;
    y += dy;

    // Arrowhead: a small triangle at the tip, pointing along the arrow
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const h = Math.min(HEAD, l * 0.6);
    const head = [
      [x2, y2],
      [x2 - ux * h - uy * h * 0.55, y2 - uy * h + ux * h * 0.55],
      [x2 - ux * h + uy * h * 0.55, y2 - uy * h - ux * h * 0.55]
    ].map(pt => pt.map(v => v.toFixed(2)).join(',')).join(' ');

    return { x1, y1, x2, y2, head, color: phaseToCss(Math.atan2(p.im, p.re)) };
  });
}

const KIND_TEXT = {
  single: 'one path, so nothing to interfere',
  constructive: 'the paths add up (constructive interference)',
  destructive: 'the paths partly cancel (destructive interference)',
  cancel: 'the paths cancel completely (destructive interference)',
  neutral: 'the paths are at right angles, so their interference adds nothing'
};

/**
 * The step a lab worker message describes, as a function (re, im) → state,
 * and its name; null for a measurement (not a gate: nothing to trace).
 */
export function stepFromMessage(message, n) {
  if (message.type === 'gate') {
    return {
      name: `${message.gate} on qubit ${message.targetQubit}`,
      apply: (re, im) => engine.applyGate(re, im, message.gate, message.targetQubit, n)
    };
  }
  if (message.type === 'cnot') {
    return {
      name: `CNOT, control qubit ${message.control}, target qubit ${message.target}`,
      apply: (re, im) => engine.applyCNOT(re, im, message.control, message.target, n)
    };
  }
  if (message.type === 'cz') {
    return {
      name: `CZ on qubits ${message.control} and ${message.target}`,
      apply: (re, im) => engine.applyCZ(re, im, message.control, message.target, n)
    };
  }
  return null;
}

export const InterferenceView = {
  props: {
    n: { type: Number, required: true },
    // The last step: { message, re, im } with the state before it, or null
    step: { type: Object, default: null },
    // Draw the paths turned so the new state has no global phase, matching
    // the table when it hides global phase
    hideGlobalPhase: { type: Boolean, default: false },
    // Noise has made the state mixed
    mixed: { type: Boolean, default: false }
  },

  template: `
    <div class="card interference">
      <h2>Interference</h2>

      <p v-if="!step" class="caption">
        Apply a gate to see how it combines the amplitudes. Each new amplitude
        is a sum of paths from the old ones, and paths can add up or cancel.
      </p>

      <p v-else-if="noisy" class="caption">
        The state is mixed (noise was applied), so it has no list of amplitudes
        and no paths to draw. This view works again after Measure all or Reset.
      </p>

      <p v-else-if="!traced" class="caption">
        The last step was a measurement. It is not a gate: it picks one outcome
        at random and removes the others, so there are no paths to combine.
      </p>

      <template v-else>
        <p class="interference-step">Last step: <strong>{{ traced.name }}</strong></p>
        <p class="caption">{{ summary }}</p>

        <details v-if="allSingle" class="interference-details">
          <summary>Show where each amplitude came from</summary>
          <ul class="interference-rows">
            <li v-for="row in rows" :key="row.index" class="interference-row" :data-kind="row.kind">
              <span class="interference-label"><strong>{{ row.label }}</strong>: {{ row.equation }}</span>
            </li>
          </ul>
        </details>

        <ul v-else class="interference-rows">
          <li v-for="row in rows" :key="row.index" class="interference-row" :data-kind="row.kind">
            <svg :viewBox="viewBox" :width="SVG_SIZE" :height="SVG_SIZE" aria-hidden="true" focusable="false">
              <circle cx="0" cy="0" :r="SVG_RADIUS" class="phasor-ring" />
              <line :x1="-SVG_RADIUS" y1="0" :x2="SVG_RADIUS" y2="0" class="phasor-axis" />
              <line x1="0" :y1="-SVG_RADIUS" x2="0" :y2="SVG_RADIUS" class="phasor-axis" />
              <g v-for="(a, k) in row.arrows" :key="k" class="phasor-path">
                <line :x1="a.x1" :y1="a.y1" :x2="a.x2" :y2="a.y2" :stroke="a.color" stroke-width="3.5" stroke-linecap="round" />
                <polygon :points="a.head" :fill="a.color" />
              </g>
              <line v-if="row.paths.length > 1" x1="0" y1="0" :x2="row.sumX" :y2="row.sumY"
                class="phasor-sum" />
              <circle :cx="row.sumX" :cy="row.sumY" r="3.5" class="phasor-tip" />
            </svg>
            <div class="interference-text">
              <p class="interference-label"><strong>{{ row.label }}</strong>: {{ row.kindText }}</p>
              <p class="interference-sum">{{ row.equation }}</p>
              <p class="interference-prob">{{ row.probText }}</p>
            </div>
          </li>
        </ul>
      </template>
    </div>
  `,

  data() {
    return { SVG_SIZE, SVG_RADIUS };
  },

  computed: {
    viewBox() {
      const h = SVG_SIZE / 2;
      return `${-h} ${-h} ${SVG_SIZE} ${SVG_SIZE}`;
    },

    // The state is mixed now or was before the last step
    noisy() {
      return this.mixed || !!this.step?.rho || this.step?.message.type === 'noise';
    },

    traced() {
      return this.step ? stepFromMessage(this.step.message, this.n) : null;
    },

    outputs() {
      if (!this.traced || this.noisy) return [];
      let { re, im } = this.step;
      if (this.hideGlobalPhase) {
        // The step is linear, so turning the old state by the angle that
        // makes the new state's first amplitude real turns every path, and
        // every sum, by that angle too
        const after = this.traced.apply(re, im);
        const { reference } = engine.withoutGlobalPhase(after.re, after.im);
        if (reference >= 0) {
          const size = Math.hypot(after.re[reference], after.im[reference]);
          const cr = after.re[reference] / size;
          const ci = -after.im[reference] / size;
          const { re: r0, im: i0 } = this.step;
          re = r0.map((r, i) => r * cr - i0[i] * ci);
          im = i0.map((v, i) => r0[i] * ci + v * cr);
        }
      }
      return engine.amplitudePaths(re, im, this.traced.apply, this.n)
        .filter(out => out.kind !== 'none');
    },

    rows() {
      // One scale for every row, so arrow lengths compare across rows
      const longest = Math.max(1e-12, ...this.outputs.map(out =>
        out.paths.reduce((s, p) => s + Math.hypot(p.re, p.im), 0)));
      const scale = SVG_RADIUS / longest;

      return this.outputs.map(out => {
        const arrows = layArrows(out.paths, scale);
        const label = engine.basisLabel(out.index, this.n);
        // "0.500 from |0⟩ − 0.500 from |1⟩ = 0.000": a leading minus becomes the joining sign
        const terms = out.paths.map((p, k) => {
          const text = `${complexText(p.re, p.im)} from ${engine.basisLabel(p.from, this.n)}`;
          if (k === 0) return text;
          return text.startsWith('−') ? `− ${text.slice(1)}` : `+ ${text}`;
        });
        const equation = out.paths.length > 1
          ? `${terms.join(' ')} = ${complexText(out.re, out.im)}`
          : `${terms[0]}`;
        const probText = out.paths.length > 1 && out.kind !== 'neutral'
          ? `Probability ${percent(out.probability)} (${percent(out.without)} if the paths did not interfere)`
          : `Probability ${percent(out.probability)}`;
        return {
          index: out.index,
          kind: out.kind,
          paths: out.paths,
          arrows,
          sumX: out.re * scale,
          sumY: -out.im * scale,
          label,
          kindText: KIND_TEXT[out.kind],
          equation,
          probText
        };
      });
    },

    allSingle() {
      return this.outputs.every(out => out.kind === 'single');
    },

    summary() {
      if (this.allSingle) {
        return 'Every new amplitude comes from just one old one, so nothing interferes: this step only moves amplitudes or changes their phase. Gates that mix |0⟩ and |1⟩, such as H, make paths meet.';
      }
      return 'Each new amplitude is the sum of the arrows that reach it. Arrows pointing the same way add up; opposite arrows cancel. That is how phase, invisible in the probabilities, decides the outcome.';
    }
  }
};
