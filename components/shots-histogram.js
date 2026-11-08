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
import { t, formatNumber, formatPercent } from '../i18n.js';

const SHOT_CHOICES = [100, 1000];

// "−0.4%" with a real minus sign
const signedPercent = p => formatPercent(Math.round(p * 1000) / 1000, { digits: 1, minus: true });

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
      <h2>{{ $t('shots.title') }}</h2>
      <p class="caption">{{ $t('shots.intro') }}</p>

      <div class="shots-readout">
        <label class="check-label">
          <input type="checkbox" v-model="readout"> {{ $t('shots.readout') }}
        </label>
        <template v-if="readout">
          <label class="shots-rate">
            {{ $t('shots.oneAsZero') }}
            <input type="range" min="0" max="20" step="1" v-model.number="oneAsZero" :aria-valuetext="pct(oneAsZero / 100)">
            <output>{{ pct(oneAsZero / 100) }}</output>
          </label>
          <label class="shots-rate">
            {{ $t('shots.zeroAsOne') }}
            <input type="range" min="0" max="20" step="1" v-model.number="zeroAsOne" :aria-valuetext="pct(zeroAsOne / 100)">
            <output>{{ pct(zeroAsOne / 100) }}</output>
          </label>
          <label class="check-label">
            <input type="checkbox" v-model="mitigate"> {{ $t('shots.mitigate') }}
          </label>
        </template>
      </div>

      <div class="button-grid shots-buttons">
        <button v-for="s in SHOT_CHOICES" :key="s" class="secondary" @click="run(s)">{{ $t('shots.run', { count: s, shots: num(s) }) }}</button>
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
            {{ num(row.count) }} <span class="shots-detail">({{ $t(row.corrected ? 'shots.detailCorrected' : 'shots.detail', row) }})</span>
          </span>
        </li>
      </ul>
      <p v-if="counts" class="caption">{{ $t('shots.explain') }}</p>
      <i18n-t v-if="counts && recordedWith" k="shots.recorded" tag="p" class="caption shots-readout-note"
        :params="{ oneAsZero: pct(recordedWith.oneAsZero), zeroAsOne: pct(recordedWith.zeroAsOne) }" />
      <p v-if="counts && corrections" class="caption shots-readout-note">{{ $t('shots.corrected', { zero: pct(0) }) }}</p>
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
          // The corrected estimate's text, '' without one
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
      if (!this.counts) return t('shots.none');
      const sep = t('list.separator');
      const seen = this.rows.filter(r => r.count).map(r => t('shots.count', { label: r.label, count: this.num(r.count) })).join(sep);
      let text = t(this.recordedWith ? 'shots.summaryErrors' : 'shots.summary', { count: this.shots, shots: this.num(this.shots), list: seen });
      if (this.corrections) {
        const zero = signedPercent(0);
        const est = this.rows.filter(r => r.corrected && r.corrected !== zero).map(r => t('describe.outcome', { label: r.label, percent: r.corrected })).join(sep);
        text += t('text.sentenceGap') + t('shots.summaryCorrected', { list: est });
      }
      return text;
    }
  },

  methods: {
    pct(p) {
      return percent(p);
    },
    // A whole number in the language's style
    num(v) {
      return formatNumber(v);
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
