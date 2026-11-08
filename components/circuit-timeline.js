// Timeline: the states a circuit run went through, one frame per step.
//
// The lab records a frame after each step of Run Circuit or Step (frame 0
// is the state the run started from). Each frame is drawn as a small
// probability chart, labelled with the step that led to it. Picking a frame,
// dragging the slider or pressing Back / Forward puts the lab back in that
// state, with every view following; Step then carries on from there.
// Measurements keep the results they gave in that run.
//
// When noise is involved, each frame also has its fidelity with the same
// circuit run without noise (F = ⟨φ|ρ|φ⟩, from 1 down): a curve above the
// frames shows it falling as noise builds up, step by step.

import * as engine from '../engine.js';
import { stepLabel } from './circuit-editor.js';
import { describeState } from '../describe.js';
import { t, formatNumber } from '../i18n.js';

// A fidelity to 2 decimals, or — where there is none (after a measurement)
const fidelityText = f => (typeof f === 'number' ? formatNumber(f, { digits: 2 }) : '—');

const BAR_W = 8;
const BAR_GAP = 2;
const CHART_H = 36;

export const CircuitTimeline = {
  props: {
    n: { type: Number, required: true },
    // [{ re, im, … }]: frame k is the state after k steps
    frames: { type: Array, required: true },
    circuit: { type: Array, required: true },
    // The frame the lab is at (steps applied), or null
    at: { type: Number, default: null },
    running: { type: Boolean, default: false }
  },
  emits: ['go'],

  template: `
    <div class="card timeline">
      <h2>{{ $t('timeline.title') }}</h2>
      <div class="timeline-controls">
        <button class="secondary" :disabled="running || current <= 0" @click="go(current - 1)">◀ {{ $t('timeline.back') }}</button>
        <label class="timeline-slider">
          <span class="visually-hidden">{{ $t('timeline.frame') }}</span>
          <input type="range" min="0" :max="last" :value="current" :disabled="running"
            :aria-valuetext="frameText(current)" @input="go(Number($event.target.value))">
        </label>
        <button class="secondary" :disabled="running || current >= last" @click="go(current + 1)">{{ $t('timeline.forward') }} ▶</button>
      </div>
      <p class="timeline-status">{{ frameText(current) }}</p>

      <figure v-if="showFidelity" class="fidelity">
        <figcaption>{{ $t('timeline.fidelityTitle') }}</figcaption>
        <svg class="fidelity-chart" :viewBox="'0 0 ' + FW + ' ' + FH" preserveAspectRatio="none"
          role="img" :aria-label="fidelitySummary">
          <line :x1="0" :y1="fy(1)" :x2="FW" :y2="fy(1)" class="fidelity-grid" />
          <line :x1="0" :y1="fy(0.5)" :x2="FW" :y2="fy(0.5)" class="fidelity-grid" />
          <polyline :points="fidelityPoints" class="fidelity-line" />
        </svg>
        <div class="fidelity-axis" aria-hidden="true"><span>{{ fmtAxis(1) }}</span><span>{{ fmtAxis(0.5) }}</span></div>
      </figure>

      <ol class="timeline-strip">
        <li v-for="(f, k) in strip" :key="k">
          <button class="timeline-frame" :class="{ current: k === current }" :disabled="running"
            :aria-current="k === current ? 'step' : null" :aria-label="frameText(k)" @click="go(k)">
            <svg :viewBox="'0 0 ' + chartW + ' ' + CHART_H" :width="chartW" :height="CHART_H" aria-hidden="true" focusable="false">
              <rect v-for="(p, i) in f.probs" :key="i" class="timeline-bar"
                :x="i * (BAR_W + BAR_GAP)" :y="CHART_H - Math.max(p * CHART_H, p > 0 ? 1 : 0)"
                :width="BAR_W" :height="Math.max(p * CHART_H, p > 0 ? 1 : 0)" />
            </svg>
            <span class="timeline-label">{{ f.label }}</span>
            <span v-if="showFidelity" class="timeline-fidelity">{{ $t('timeline.fidelityShort', { value: f.fidelityText }) }}</span>
          </button>
        </li>
      </ol>
      <p class="caption">{{ $t('timeline.explain') }}</p>
      <p v-if="showFidelity" class="caption">{{ $t('timeline.fidelityExplain') }}</p>
    </div>
  `,

  data() {
    return { CHART_H, BAR_W, BAR_GAP, FW: 300, FH: 60 };
  },

  computed: {
    last() {
      return this.frames.length - 1;
    },
    current() {
      return this.at === null ? this.last : Math.min(this.at, this.last);
    },
    chartW() {
      return (1 << this.n) * (BAR_W + BAR_GAP) - BAR_GAP;
    },
    strip() {
      return this.frames.map((f, k) => ({
        probs: engine.probabilities(f.re, f.im),
        label: k === 0 ? t('timeline.start') : stepLabel(this.circuit[k - 1]),
        fidelityText: fidelityText(f.fidelity)
      }));
    },
    // Only when noise has made a difference somewhere in the run
    showFidelity() {
      return this.frames.some(f => typeof f.fidelity === 'number' && f.fidelity < 0.9995);
    },
    // The curve's points, broken where fidelity is undefined (after M)
    fidelityPoints() {
      const last = Math.max(1, this.last);
      return this.frames
        .map((f, k) => (typeof f.fidelity === 'number' ? `${((k / last) * this.FW).toFixed(1)},${this.fy(f.fidelity).toFixed(1)}` : null))
        .filter(Boolean)
        .join(' ');
    },
    fidelitySummary() {
      return t('timeline.fidelityAria', {
        list: this.strip.map(f => t('timeline.fidelityItem', { label: f.label, value: f.fidelityText })).join(t('list.separator'))
      });
    }
  },

  methods: {
    // Height in the fidelity chart: F = 1 at the top, 0.4 at the bottom
    fy(f) {
      return 4 + (1 - Math.max(0.4, f)) / 0.6 * (this.FH - 8);
    },

    // e.g. "Step 2 of 3, after CNOT q0→q1: |00⟩ 50%, |11⟩ 50%"
    frameText(k) {
      const f = this.frames[k];
      if (!f) return '';
      const where = k === 0 ? t('timeline.start') : t('timeline.frameStep', { k, total: this.circuit.length, step: stepLabel(this.circuit[k - 1]) });
      const state = describeState(f.re, f.im, this.n);
      return this.showFidelity
        ? t('timeline.frameTextFidelity', { where, state, fidelity: fidelityText(f.fidelity) })
        : t('timeline.frameText', { where, state });
    },
    fmtAxis(v) {
      return formatNumber(v, { digits: v === 1 ? 0 : 1 });
    },
    go(k) {
      if (k >= 0 && k <= this.last && k !== this.current) this.$emit('go', k);
    }
  }
};
