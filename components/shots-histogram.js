// Shots: run the circuit many times, as a real quantum computer does.
//
// Each shot prepares the current state afresh and measures every qubit;
// the lab's own state is left alone. The bars show how often each result
// came up, next to a marker at the exact probability, so the learner sees
// that one measurement gives one random answer and that probabilities only
// appear as counts over many runs.
//
// Readout errors (optional): each recorded bit can be wrong, a 1 read as 0
// or a 0 as 1, as real measurement electronics do. The state is untouched;
// only what is recorded changes. Correcting for them (readout error
// mitigation) undoes the known rates to estimate the true probabilities,
// drawn as a second, purple bar.

import * as engine from '../engine.js';
import { percent } from '../describe.js';

const SHOT_CHOICES = [100, 1000];

// "−0.4%" with a real minus sign
const signedPercent = p => percent(p).replace('-', '−');

export const ShotsHistogram = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true },
    // A lesson's readout errors, { oneAsZero, zeroAsOne } from 0 to 1: when
    // set (a new object each Set up), readout errors are switched on at
    // those rates, with correction off. null leaves the choice to the learner.
    preset: { type: Object, default: null }
  },

  template: `
    <div class="card shots">
      <h2>Shots</h2>
      <p class="caption">
        A quantum computer can’t show you amplitudes. It runs the circuit again
        and again, measuring each time, and counts the results. Each shot here
        starts from the current state; the state itself doesn’t change.
      </p>

      <div class="shots-readout">
        <label class="check-label">
          <input type="checkbox" v-model="readout"> Readout errors
        </label>
        <template v-if="readout">
          <label class="shots-rate">
            Read 1 as 0
            <input type="range" min="0" max="20" step="1" v-model.number="oneAsZero" :aria-valuetext="oneAsZero + '%'">
            <output>{{ oneAsZero }}%</output>
          </label>
          <label class="shots-rate">
            Read 0 as 1
            <input type="range" min="0" max="20" step="1" v-model.number="zeroAsOne" :aria-valuetext="zeroAsOne + '%'">
            <output>{{ zeroAsOne }}%</output>
          </label>
          <label class="check-label">
            <input type="checkbox" v-model="mitigate"> Correct for readout errors (mitigation)
          </label>
        </template>
      </div>

      <div class="button-grid shots-buttons">
        <button v-for="s in SHOT_CHOICES" :key="s" class="secondary" @click="run(s)">Run {{ s }} shots</button>
      </div>

      <p class="shots-summary" role="status">{{ summary }}</p>

      <ul v-if="counts" class="shots-rows">
        <li v-for="row in rows" :key="row.label" class="shots-row" :class="{ zero: row.zero }">
          <span class="shots-label">{{ row.label }}</span>
          <span class="shots-track" aria-hidden="true">
            <span class="shots-bar" :style="{ width: row.barWidth }"></span>
            <span v-if="row.correctedWidth !== null" class="shots-corrected" :style="{ width: row.correctedWidth }"></span>
            <span v-if="row.p" class="shots-expected" :style="{ left: row.markerLeft }"></span>
          </span>
          <span class="shots-count">
            {{ row.count }} <span class="shots-detail">({{ row.observed }}<template v-if="row.corrected">, corrected {{ row.corrected }}</template>, exact {{ row.expected }})</span>
          </span>
        </li>
      </ul>
      <p v-if="counts" class="caption">
        The bar is how often each result came up; the line marks its exact
        probability. Run again: the counts change, but they stay close to the
        lines, and closer with more shots.
      </p>
      <p v-if="counts && recordedWith" class="caption shots-readout-note">
        These counts are what was <em>recorded</em>, with each bit misread now and
        then (1 as 0: {{ pct(recordedWith.oneAsZero) }}, 0 as 1: {{ pct(recordedWith.zeroAsOne) }}).
        The state didn’t change: results with no line, which the state can never
        give, come from misreading alone. Real qubits are read 1 as 0 more often,
        because a qubit can decay while it is being read.
      </p>
      <p v-if="counts && corrections" class="caption shots-readout-note">
        The purple bars correct for it: knowing the error rates (the confusion
        matrix, measured beforehand on real hardware), the counts are worked back
        to estimates of the true probabilities, with no quantum error correction
        needed. With few shots the estimates scatter, and can even dip below 0%,
        because undoing the errors amplifies the random scatter too; with more
        shots they settle near the lines.
      </p>
    </div>
  `,

  data() {
    return {
      SHOT_CHOICES,
      counts: null,
      shots: 0,
      readout: false,
      oneAsZero: 4,   // percent
      zeroAsOne: 1,   // percent
      mitigate: false,
      // The error rates the current counts were recorded with, or null
      recordedWith: null
    };
  },

  // A new state, or new error rates, make old counts meaningless
  watch: {
    preset: {
      immediate: true,
      handler(p) {
        if (!p) return;
        this.readout = true;
        this.oneAsZero = Math.round(p.oneAsZero * 100);
        this.zeroAsOne = Math.round(p.zeroAsOne * 100);
        this.mitigate = false;
        this.counts = null;
      }
    },
    re() { this.counts = null; },
    im() { this.counts = null; },
    readout() { this.counts = null; },
    oneAsZero() { this.counts = null; },
    zeroAsOne() { this.counts = null; }
  },

  computed: {
    probs() {
      return engine.probabilities(this.re, this.im);
    },

    rates() {
      return { oneAsZero: this.oneAsZero / 100, zeroAsOne: this.zeroAsOne / 100 };
    },

    // Mitigated estimates of the true probabilities, or null
    corrections() {
      if (!this.counts || !this.recordedWith || !this.mitigate) return null;
      return engine.mitigateCounts(this.counts, this.recordedWith, this.n);
    },

    rows() {
      if (!this.counts) return [];
      return this.counts.map((count, i) => {
        const p = this.probs[i] < 1e-12 ? 0 : this.probs[i];
        const fraction = count / this.shots;
        const est = this.corrections ? this.corrections[i] : null;
        return {
          label: engine.basisLabel(i, this.n),
          count,
          p,
          observed: percent(fraction),
          expected: percent(p),
          corrected: est === null ? '' : signedPercent(Math.abs(est) < 5e-4 ? 0 : est),
          barWidth: `${fraction * 100}%`,
          correctedWidth: est === null ? null : `${Math.min(1, Math.max(0, est)) * 100}%`,
          markerLeft: `${p * 100}%`,
          zero: !count && !p && (est === null || Math.abs(est) < 5e-4)
        };
      });
    },

    // e.g. "100 shots: |00⟩ 52, |11⟩ 48."
    summary() {
      if (!this.counts) return 'No shots run yet for this state.';
      const seen = this.rows.filter(r => r.count).map(r => `${r.label} ${r.count}`);
      const how = this.recordedWith ? ', read out with errors' : '';
      let text = `${this.shots} shots${how}: ${seen.join(', ')}.`;
      if (this.corrections) {
        const est = this.rows.filter(r => r.corrected && r.corrected !== '0%').map(r => `${r.label} ${r.corrected}`);
        text += ` Corrected: ${est.join(', ')}.`;
      }
      return text;
    }
  },

  methods: {
    pct(p) {
      return percent(p);
    },

    run(shots, random = Math.random) {
      this.shots = shots;
      if (this.readout) {
        this.recordedWith = this.rates;
        this.counts = engine.sampleCountsWithReadout(this.probs, shots, this.rates, this.n, random);
      } else {
        this.recordedWith = null;
        this.counts = engine.sampleCounts(this.re, this.im, shots, random);
      }
    }
  }
};
