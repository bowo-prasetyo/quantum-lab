// Timeline: the states a circuit run went through, one frame per step.
//
// The lab records a frame after each step of Run Circuit or Step (frame 0
// is the state the run started from). Each frame is drawn as a small
// probability chart, labelled with the step that led to it. Picking a frame,
// dragging the slider or pressing Back / Forward puts the lab back in that
// state, with every view following; Step then carries on from there.
// Measurements keep the results they gave in that run.

import * as engine from '../engine.js';
import { stepLabel } from './circuit-editor.js';
import { describeState } from '../describe.js';

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
      <h2>Timeline</h2>
      <div class="timeline-controls">
        <button class="secondary" :disabled="running || current <= 0" @click="go(current - 1)">◀ Back</button>
        <label class="timeline-slider">
          <span class="visually-hidden">Frame</span>
          <input type="range" min="0" :max="last" :value="current" :disabled="running"
            :aria-valuetext="frameText(current)" @input="go(Number($event.target.value))">
        </label>
        <button class="secondary" :disabled="running || current >= last" @click="go(current + 1)">Forward ▶</button>
      </div>
      <p class="timeline-status">{{ frameText(current) }}</p>

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
          </button>
        </li>
      </ol>
      <p class="caption">
        Each frame is the state after that step of the last run, drawn as its
        probabilities. Pick one to put the lab back there: every view follows,
        and Step carries on from it. Measurements keep the results they gave.
        Editing the circuit or pressing another button starts a new timeline.
      </p>
    </div>
  `,

  data() {
    return { CHART_H, BAR_W, BAR_GAP };
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
        label: k === 0 ? 'Start' : stepLabel(this.circuit[k - 1])
      }));
    }
  },

  methods: {
    // e.g. "Step 2 of 3, after CNOT q0→q1: |00⟩ 50%, |11⟩ 50%"
    frameText(k) {
      const f = this.frames[k];
      if (!f) return '';
      const where = k === 0 ? 'Start' : `Step ${k} of ${this.circuit.length}, after ${stepLabel(this.circuit[k - 1])}`;
      return `${where}: ${describeState(f.re, f.im, this.n)}`;
    },
    go(k) {
      if (k >= 0 && k <= this.last && k !== this.current) this.$emit('go', k);
    }
  }
};
