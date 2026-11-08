// Unitary matrix: the matrix of the last gate, or of the whole circuit in
// the circuit editor, acting on the full register.
//
// Column j is what the gate does to basis state |j⟩; row i is the output
// |i⟩. Each cell prints its entry (0.71, −0.71i, 0.50∠45°), with its
// background coloured by phase (the same colours as the density matrix)
// and as strong as the entry is large. Blank cells are 0.

import * as engine from '../engine.js';
import { phaseToRgb } from '../colors.js';
import { stepFromMessage } from './interference-view.js';
import { stepLabel } from './circuit-editor.js';

const SMALL = 5e-4;

/** A matrix entry as short text: '', '1', '−0.71', '0.71i', '0.50∠45°'. */
export function entryText(re, im) {
  const mag = Math.hypot(re, im);
  if (mag < SMALL) return '';
  const num = v => {
    const t = Math.abs(v).toFixed(2);
    return t === '1.00' ? '1' : t;
  };
  if (Math.abs(im) < SMALL) return `${re < 0 ? '−' : ''}${num(re)}`;
  if (Math.abs(re) < SMALL) return `${im < 0 ? '−' : ''}${num(im)}i`;
  const deg = Math.round(Math.atan2(im, re) * 180 / Math.PI);
  return `${num(mag)}∠${String(deg).replace('-', '−')}°`;
}

/** A circuit editor step as a function (re, im) → state; null for M. */
export function circuitStepApply(step, n) {
  if (step.gate === 'M') return null;
  if (step.gate === 'CNOT') return (re, im) => engine.applyCNOT(re, im, step.control, step.target, n);
  if (step.gate === 'CZ') return (re, im) => engine.applyCZ(re, im, step.control, step.target, n);
  return (re, im) => engine.applyGate(re, im, step.gate, step.target, n);
}

export const UnitaryView = {
  props: {
    n: { type: Number, required: true },
    // The lab's last step ({ message, re, im }) or null
    step: { type: Object, default: null },
    // The circuit editor's steps
    circuit: { type: Array, default: () => [] }
  },

  template: `
    <div class="card unitary">
      <h2>Unitary Matrix</h2>

      <div class="unitary-mode" role="radiogroup" aria-label="Which matrix">
        <label><input type="radio" value="last" v-model="mode"> Last gate</label>
        <label><input type="radio" value="circuit" v-model="mode"> Whole circuit</label>
      </div>

      <p class="unitary-what">{{ what }}</p>

      <template v-if="matrix">
        <div class="unitary-scroll">
          <table class="unitary-table">
            <thead>
              <tr>
                <th scope="col"><span class="visually-hidden">Output down, input across</span></th>
                <th v-for="label in labels" :key="label" scope="col">{{ label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in rows" :key="i">
                <th scope="row">{{ labels[i] }}</th>
                <td v-for="(cell, j) in row" :key="j" :style="cell.style"
                  :aria-label="cell.text ? labels[i] + ' from ' + labels[j] + ': ' + cell.text : undefined">{{ cell.text }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="caption">
          Column = input basis state, row = output. Column |j⟩ is what the matrix
          does to |j⟩: for instance the entry in row |i⟩ is the amplitude it sends to |i⟩.
          Background colour shows the phase, as in the density matrix.
          Every column has length 1 and the columns are at right angles to each
          other (U†U = I, checked here to within {{ errorText }}), so probabilities
          always add up to 1 and the gate can be undone: that is what unitary means.
        </p>
      </template>
    </div>
  `,

  data() {
    return { mode: 'last' };
  },

  computed: {
    labels() {
      return [...Array(1 << this.n).keys()].map(i => engine.basisLabel(i, this.n));
    },

    // { apply, name } for the chosen mode, or { message } when there is no matrix
    source() {
      if (this.mode === 'last') {
        if (!this.step) return { message: 'Apply a gate to see its matrix.' };
        if (this.step.message.type === 'noise') return { message: 'The last step was noise. Noise is not unitary: it can’t be undone, and it mixes states, so no single matrix describes it (it takes several, called Kraus operators).' };
        const traced = stepFromMessage(this.step.message, this.n);
        if (!traced) return { message: 'The last step was a measurement. It is not a gate, and no matrix describes it: its result is random and it can’t be undone.' };
        return { apply: traced.apply, name: traced.name };
      }

      if (!this.circuit.length) return { message: 'The circuit editor is empty. Add gates there to see the matrix of the whole circuit.' };
      const applies = this.circuit.map(step => circuitStepApply(step, this.n));
      if (applies.includes(null)) return { message: 'The circuit contains a measurement (M), which is not a gate, so no single matrix describes the whole circuit.' };
      return {
        apply: (re, im) => applies.reduce((s, f) => f(s.re, s.im), { re, im }),
        name: this.circuit.map(stepLabel).join(', then ')
      };
    },

    what() {
      if (this.source.message) return this.source.message;
      return this.mode === 'last'
        ? `The matrix of ${this.source.name}, on all ${this.n} qubits.`
        : `The matrix of the whole circuit: ${this.source.name}.`;
    },

    matrix() {
      return this.source.apply ? engine.unitaryOf(this.source.apply, this.n) : null;
    },

    rows() {
      const { re, im, size } = this.matrix;
      return [...Array(size).keys()].map(i => [...Array(size).keys()].map(j => {
        const r = re[i * size + j];
        const m = im[i * size + j];
        const mag = Math.hypot(r, m);
        if (mag < SMALL) return { text: '', style: {} };
        const [cr, cg, cb] = phaseToRgb(Math.atan2(m, r)).map(v => Math.round(v * 255));
        return {
          text: entryText(r, m),
          style: { background: `rgba(${cr}, ${cg}, ${cb}, ${(0.12 + 0.4 * mag).toFixed(3)})` }
        };
      }));
    },

    errorText() {
      const e = engine.unitarityError(this.matrix);
      return e < 1e-12 ? '10⁻¹²' : e.toExponential(1);
    }
  }
};
