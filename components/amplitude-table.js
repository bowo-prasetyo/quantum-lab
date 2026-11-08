// Readable table of the state: amplitude, probability and phase of each
// basis state. Replaces the raw JSON display of the old simulators.

import * as engine from '../engine.js';
import { t, formatNumber, formatPercent } from '../i18n.js';
import { measurementText } from '../describe.js';

// 3 decimals in the language's style, with a real minus sign; never "−0.000"
const fmt = v => formatNumber(v, { digits: 3, minus: true });

export const AmplitudeTable = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true },
    // The last measurement: '-', a basis label, or { qubit, bit }
    measurement: { type: [String, Object], default: '-' },
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

  methods: { measurementText },

  computed: {
    referenceLabel() {
      return engine.basisLabel(this.reference, this.n);
    },

    // e.g. "q0 = 1 · q1 = – · q2 = 0" (– means not measured yet)
    bitsText() {
      if (!Object.keys(this.bits).length) return '';
      return [...Array(this.n).keys()]
        .map(q => t('table.bit', { qubit: q, bit: q in this.bits ? this.bits[q] : '–' }))
        .join(' · ');
    },

    rows() {
      const probs = engine.probabilities(this.re, this.im);
      return probs.map((p, i) => {
        const re = this.re[i];
        const im = this.im[i];
        const sign = Number(im.toFixed(3)) < 0 ? '−' : '+';
        const phaseDeg = Math.atan2(im, re) * 180 / Math.PI;
        return {
          label: engine.basisLabel(i, this.n),
          amplitude: this.mixed ? '—' : t('number.complex', { re: fmt(re), sign, im: fmt(Math.abs(im)) }),
          probability: formatPercent(p, { digits: 1, fixed: true }),
          // Phase is meaningless for a zero amplitude
          phase: p < 1e-12 || this.mixed ? '—' : t('number.degrees', { value: formatNumber(phaseDeg, { minus: true }) }),
          zero: p < 1e-12
        };
      });
    }
  },

  template: `
    <div class="card">
      <h2>{{ $t('table.title') }}</h2>
      <i18n-t v-if="mixed" k="table.mixed" tag="p" class="notice mixed-notice" />
      <div class="table-scroll">
        <table class="amp-table">
          <thead>
            <tr>
              <th>{{ $t('table.basisState') }}</th>
              <th>{{ $t('table.amplitude') }}</th>
              <th>{{ $t('table.probability') }}</th>
              <th>{{ $t('table.phase') }}</th>
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
        {{ $t('table.qubitOrder', { count: n - 1, example: '|1' + '0'.repeat(n - 1) + '⟩' }) }}
      </p>
      <div v-if="!mixed" class="global-phase">
        <label>
          <input type="checkbox" :checked="globalPhaseHidden" @change="$emit('toggle-global-phase')">
          {{ $t('table.hideGlobalPhase') }}
        </label>
        <p class="caption">
          <template v-if="globalPhaseHidden && reference >= 0">{{ $t('table.globalPhaseHidden', { reference: referenceLabel }) }}</template>
          <template v-else>{{ $t('table.globalPhaseShown') }}</template>
        </p>
      </div>
      <p>{{ $t('table.measurement', { result: measurementText(measurement) }) }}</p>
      <p v-if="bitsText" class="bits">{{ $t('table.bits', { bits: bitsText }) }}</p>
    </div>
  `
};
