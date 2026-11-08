// Pauli expectations: ⟨P⟩ for the Pauli strings of 2 or 3 qubits, as
// signed cells (blue positive, orange negative, stronger colour = larger,
// and always the signed number as text).
//
// - Each qubit: ⟨X⟩, ⟨Y⟩, ⟨Z⟩, the same numbers as its Bloch vector.
// - Each pair: the 3 × 3 grid ⟨σa σb⟩. For a pair whose qubits are not
//   entangled with anything, every cell is the product of the two single
//   values (⟨Xᵢ Xⱼ⟩ = ⟨Xᵢ⟩⟨Xⱼ⟩). A grid that differs from that product is
//   correlated, which in this lab's pure states means both qubits are
//   entangled (not necessarily with each other).
// - Three qubits: the three-qubit strings that are not 0, where a GHZ
//   state keeps the link that no pair grid shows (⟨XXX⟩ = 1).
//
// Measuring all of these is how experiments read out a state
// (state tomography).

import * as engine from '../engine.js';
import { t, formatNumber } from '../i18n.js';

const AXES = ['X', 'Y', 'Z'];
const SHOW_MIN = 0.005; // smaller values print as 0.00

const fmt = v => {
  if (Math.abs(v) < SHOW_MIN) return formatNumber(0, { digits: 2 });
  return `${v > 0 ? '+' : '−'}${formatNumber(Math.abs(v), { digits: 2 })}`;
};

// Background for a value: blue for positive, orange for negative, as
// strong as the value is large. The number is always printed too.
function cellStyle(v) {
  if (Math.abs(v) < SHOW_MIN) return {};
  const alpha = (0.12 + 0.5 * Math.min(1, Math.abs(v))).toFixed(3);
  return { background: v > 0 ? `rgba(47, 111, 237, ${alpha})` : `rgba(230, 120, 40, ${alpha})` };
}

/** A Pauli string with the given letters on the given qubits, I elsewhere. */
export function pauliString(n, letters) {
  const s = Array(n).fill('I');
  for (const [q, p] of Object.entries(letters)) s[q] = p;
  return s.join('');
}

/**
 * The largest gap, over the nine cells of a pair's grid, between
 * ⟨σa σb⟩ and ⟨σa⟩⟨σb⟩ (the connected correlation). 0 means the pair's
 * results are unrelated in every basis.
 */
export function pairConnection(re, im, q1, q2, n, rho = null) {
  const expect = p => (rho ? engine.rhoPauliExpectation(rho, p, n) : engine.pauliExpectation(re, im, p, n));
  let largest = 0;
  for (const a of AXES) {
    for (const b of AXES) {
      const both = expect(pauliString(n, { [q1]: a, [q2]: b }));
      const one = expect(pauliString(n, { [q1]: a }));
      const two = expect(pauliString(n, { [q2]: b }));
      largest = Math.max(largest, Math.abs(both - one * two));
    }
  }
  return largest;
}

export const PauliPanel = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    // The density matrix when noise has made the state mixed, else null
    rho: { type: Object, default: null },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card pauli">
      <h2>{{ $t('pauli.title') }}</h2>
      <p class="caption">{{ $t('pauli.intro') }}</p>

      <h3>{{ $t('entanglement.eachQubit') }}</h3>
      <div class="pauli-scroll">
        <table class="pauli-table pauli-singles">
          <thead>
            <tr><th scope="col"><span class="visually-hidden">{{ $t('pauli.qubit') }}</span></th><th v-for="a in AXES" :key="a" scope="col">⟨{{ a }}⟩</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in singles" :key="row.q">
              <th scope="row">{{ $t('bloch.qubit', { qubit: row.q }) }}</th>
              <td v-for="cell in row.cells" :key="cell.axis" :style="cell.style">{{ cell.text }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="caption">{{ $t('pauli.singlesCaption') }}</p>

      <h3>{{ $t('entanglement.eachPair') }}</h3>
      <div class="pauli-pairs">
        <figure v-for="pair in pairs" :key="pair.key" class="pauli-pair">
          <figcaption>{{ $t('pauli.pair', { q1: pair.q1, q2: pair.q2 }) }}</figcaption>
          <table class="pauli-table">
            <thead>
              <tr>
                <th scope="col"><span class="visually-hidden">{{ $t('pauli.corner', { q1: pair.q1, q2: pair.q2 }) }}</span></th>
                <th v-for="b in AXES" :key="b" scope="col">{{ b }}<sub>{{ pair.q2 }}</sub></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in pair.rows" :key="row.a">
                <th scope="row">{{ row.a }}<sub>{{ pair.q1 }}</sub></th>
                <td v-for="cell in row.cells" :key="cell.label" :style="cell.style" :aria-label="cell.label + ' ' + cell.text">{{ cell.text }}</td>
              </tr>
            </tbody>
          </table>
          <p class="pauli-verdict" :data-correlated="String(pair.correlated)">{{ pair.verdict }}</p>
        </figure>
      </div>
      <p class="caption">{{ $t(rho ? 'pauli.pairsCaptionMixed' : 'pauli.pairsCaption') }}</p>

      <template v-if="n === 3">
        <h3>{{ $t('pauli.triplesTitle') }}</h3>
        <ul v-if="triples.length" class="pauli-triples">
          <li v-for="t in triples" :key="t.label" :style="t.style">⟨{{ t.label }}⟩ {{ t.text }}</li>
        </ul>
        <p v-else class="pauli-none">{{ $t('pauli.triplesNone') }}</p>
        <p class="caption">{{ $t('pauli.triplesCaption') }}</p>
      </template>
    </div>
  `,

  data() {
    return { AXES };
  },

  methods: {
    // ⟨P⟩ for a Pauli string, pure or mixed
    expect(paulis, n) {
      return this.rho ? engine.rhoPauliExpectation(this.rho, paulis, n) : engine.pauliExpectation(this.re, this.im, paulis, n);
    }
  },

  computed: {
    singles() {
      return [...Array(this.n).keys()].map(q => ({
        q,
        cells: AXES.map(axis => {
          const v = this.expect(pauliString(this.n, { [q]: axis }), this.n);
          return { axis, text: fmt(v), style: cellStyle(v) };
        })
      }));
    },

    pairs() {
      const result = [];
      for (let q1 = 0; q1 < this.n; q1++) {
        for (let q2 = q1 + 1; q2 < this.n; q2++) {
          const rows = AXES.map(a => ({
            a,
            cells: AXES.map(b => {
              const v = this.expect(pauliString(this.n, { [q1]: a, [q2]: b }), this.n);
              return { label: `${a}${q1} ${b}${q2}`, text: fmt(v), style: cellStyle(v) };
            })
          }));
          const correlated = pairConnection(this.re, this.im, q1, q2, this.n, this.rho) >= SHOW_MIN;
          result.push({
            key: `${q1}-${q2}`,
            q1,
            q2,
            rows,
            correlated,
            verdict: correlated
              ? t('pauli.correlated')
              : t('pauli.notCorrelated')
          });
        }
      }
      return result;
    },

    triples() {
      if (this.n !== 3) return [];
      const result = [];
      for (const a of AXES) {
        for (const b of AXES) {
          for (const c of AXES) {
            const label = a + b + c;
            const v = this.expect(label, 3);
            if (Math.abs(v) >= SHOW_MIN) result.push({ label, text: fmt(v), style: cellStyle(v) });
          }
        }
      }
      return result;
    }
  }
};
