// Readable table of the state: amplitude, probability and phase of each
// basis state. Replaces the raw JSON display of the old simulators.

import * as engine from '../engine.js';

// Avoids printing "-0.000"
const fmt = (v, digits = 3) => {
  const s = v.toFixed(digits);
  return Number(s) === 0 ? (0).toFixed(digits) : s;
};

export const AmplitudeTable = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true },
    measurement: { type: String, default: '-' },
    // Classical bits from measurements: { qubit: 0 | 1 }
    bits: { type: Object, default: () => ({}) },
    // Whether re/im have had their global phase removed for display
    // (engine.withoutGlobalPhase), and the index made real and positive
    globalPhaseHidden: { type: Boolean, default: false },
    // Noise has made the state mixed: re/im are only √p, so show no
    // amplitudes or phases
    mixed: { type: Boolean, default: false },
    reference: { type: Number, default: -1 }
  },

  emits: ['toggle-global-phase'],

  computed: {
    referenceLabel() {
      return engine.basisLabel(this.reference, this.n);
    },

    // e.g. "q0 = 1 · q1 = – · q2 = 0" (– means not measured yet)
    bitsText() {
      if (!Object.keys(this.bits).length) return '';
      return [...Array(this.n).keys()]
        .map(q => `q${q} = ${q in this.bits ? this.bits[q] : '–'}`)
        .join(' · ');
    },

    rows() {
      const probs = engine.probabilities(this.re, this.im);
      return probs.map((p, i) => {
        const re = this.re[i];
        const im = this.im[i];
        const imText = fmt(Math.abs(im));
        const sign = Number(fmt(im)) < 0 ? '−' : '+';
        const phaseDeg = Math.atan2(im, re) * 180 / Math.PI;
        return {
          label: engine.basisLabel(i, this.n),
          amplitude: this.mixed ? '—' : `${fmt(re).replace('-', '−')} ${sign} ${imText}i`,
          probability: (p * 100).toFixed(1) + '%',
          // Phase is meaningless for a zero amplitude
          phase: p < 1e-12 || this.mixed ? '—' : `${fmt(phaseDeg, 0).replace('-', '−')}°`,
          zero: p < 1e-12
        };
      });
    }
  },

  template: `
    <div class="card">
      <h2>Quantum State</h2>
      <p v-if="mixed" class="notice mixed-notice">
        The state is <strong>mixed</strong> (noise was applied): it has no list of
        amplitudes, only probabilities. The density matrix shows the whole state.
      </p>
      <div class="table-scroll">
        <table class="amp-table">
          <thead>
            <tr>
              <th>Basis state</th>
              <th>Amplitude</th>
              <th>Probability</th>
              <th>Phase</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.label" :class="{ zero: r.zero }">
              <td>{{ r.label }}</td>
              <td>{{ r.amplitude }}</td>
              <td>{{ r.probability }}</td>
              <td>{{ r.phase }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="n >= 2" class="caption qubit-order">
        Qubit 0 is the left digit: |1{{ '0'.repeat(n - 1) }}⟩ means qubit 0 is 1
        and the {{ n === 2 ? 'other is' : 'others are' }} 0.
      </p>
      <div v-if="!mixed" class="global-phase">
        <label>
          <input type="checkbox" :checked="globalPhaseHidden" @change="$emit('toggle-global-phase')">
          Hide global phase
        </label>
        <p class="caption">
          <template v-if="globalPhaseHidden && reference >= 0">
            Phases are shown relative to {{ referenceLabel }}, the first non-zero amplitude,
            which is made real and positive. Every amplitude is turned by the same angle,
            so nothing you could measure changes.
          </template>
          <template v-else>
            Turning every amplitude by the same angle (a global phase) changes nothing
            you could measure: only differences in phase matter. Tick the box to remove it.
          </template>
        </p>
      </div>
      <p>Measurement: {{ measurement }}</p>
      <p v-if="bitsText" class="bits">Classical bits: {{ bitsText }}</p>
    </div>
  `
};
