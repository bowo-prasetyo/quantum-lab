// Shots: run the circuit many times, as a real quantum computer does.
//
// Each shot prepares the current state afresh and measures every qubit;
// the lab's own state is left alone. The bars show how often each result
// came up, next to a marker at the exact probability, so the learner sees
// that one measurement gives one random answer and that probabilities only
// appear as counts over many runs.

import * as engine from '../engine.js';
import { percent } from '../describe.js';

const SHOT_CHOICES = [100, 1000];

export const ShotsHistogram = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card shots">
      <h2>Shots</h2>
      <p class="caption">
        A quantum computer can’t show you amplitudes. It runs the circuit again
        and again, measuring each time, and counts the results. Each shot here
        starts from the current state; the state itself doesn’t change.
      </p>

      <div class="button-grid shots-buttons">
        <button v-for="s in SHOT_CHOICES" :key="s" class="secondary" @click="run(s)">Run {{ s }} shots</button>
      </div>

      <p class="shots-summary" role="status">{{ summary }}</p>

      <ul v-if="counts" class="shots-rows">
        <li v-for="row in rows" :key="row.label" class="shots-row" :class="{ zero: !row.count && !row.p }">
          <span class="shots-label">{{ row.label }}</span>
          <span class="shots-track" aria-hidden="true">
            <span class="shots-bar" :style="{ width: row.barWidth }"></span>
            <span v-if="row.p" class="shots-expected" :style="{ left: row.markerLeft }"></span>
          </span>
          <span class="shots-count">{{ row.count }} <span class="shots-detail">({{ row.observed }}, expected {{ row.expected }})</span></span>
        </li>
      </ul>
      <p v-if="counts" class="caption">
        The bar is how often each result came up; the line marks its exact
        probability. Run again: the counts change, but they stay close to the
        lines, and closer with more shots.
      </p>
    </div>
  `,

  data() {
    return { SHOT_CHOICES, counts: null, shots: 0 };
  },

  // A new state makes old counts meaningless
  watch: {
    re() { this.counts = null; },
    im() { this.counts = null; }
  },

  computed: {
    probs() {
      return engine.probabilities(this.re, this.im);
    },

    rows() {
      if (!this.counts) return [];
      return this.counts.map((count, i) => {
        const p = this.probs[i] < 1e-12 ? 0 : this.probs[i];
        const fraction = count / this.shots;
        return {
          label: engine.basisLabel(i, this.n),
          count,
          p,
          observed: percent(fraction),
          expected: percent(p),
          barWidth: `${fraction * 100}%`,
          markerLeft: `${p * 100}%`
        };
      });
    },

    // e.g. "100 shots: |00⟩ 52, |11⟩ 48."
    summary() {
      if (!this.counts) return 'No shots run yet for this state.';
      const seen = this.rows.filter(r => r.count).map(r => `${r.label} ${r.count}`);
      return `${this.shots} shots: ${seen.join(', ')}.`;
    }
  },

  methods: {
    run(shots, random = Math.random) {
      this.shots = shots;
      this.counts = engine.sampleCounts(this.re, this.im, shots, random);
    }
  }
};
