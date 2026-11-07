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
    measurement: { type: String, default: '-' }
  },

  computed: {
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
          amplitude: `${fmt(re).replace('-', '−')} ${sign} ${imText}i`,
          probability: (p * 100).toFixed(1) + '%',
          // Phase is meaningless for a zero amplitude
          phase: p < 1e-12 ? '—' : `${fmt(phaseDeg, 0).replace('-', '−')}°`,
          zero: p < 1e-12
        };
      });
    }
  },

  template: `
    <div class="card">
      <h2>Quantum State</h2>
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
      <p>Measurement: {{ measurement }}</p>
    </div>
  `
};
