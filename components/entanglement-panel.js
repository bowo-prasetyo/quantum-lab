// Entanglement: how much each qubit is entangled, and how strongly each
// pair of qubits is linked. Two or three qubits.
//
// - Entanglement entropy S of each qubit (0 to 1 bit): 0 means the qubit
//   has a state of its own, 1 means it is maximally entangled. With 3
//   qubits in a pure state, a split of one qubit from the other two is the
//   only way to divide them, so the three entropies cover every split.
// - Mutual information I of each pair (0 to 2 bits): 0 exactly when the
//   two qubits' results are unrelated in every basis. Unlike the
//   correlation graph's ⟨ZZ⟩, it is 0 for |00⟩ and positive for every
//   entangled pair, whatever basis the link is in.
// - A sentence naming which qubits are entangled with which, decided from
//   the entropies (exact for pure states, which is all this lab makes).

import * as engine from '../engine.js';
import { t, formatNumber } from '../i18n.js';

const EPS = 1e-6;

// Node positions in a 200 × 120 SVG
const NODES = {
  2: [{ x: 50, y: 60 }, { x: 150, y: 60 }],
  3: [{ x: 100, y: 22 }, { x: 40, y: 98 }, { x: 160, y: 98 }]
};

const fmt = v => formatNumber(Math.abs(v) < 0.005 ? 0 : v, { digits: 2 });

function entropyWord(s) {
  if (s < EPS) return t('entanglement.none');
  if (s > 1 - EPS) return t('entanglement.maximal');
  return t('entanglement.partial');
}

/**
 * Which qubits are entangled with which, in words, for a pure state of 2
 * or 3 qubits given each qubit's entanglement entropy.
 */
export function entanglementVerdict(entropies) {
  const n = entropies.length;
  const free = entropies.map((s, q) => (s < EPS ? q : -1)).filter(q => q >= 0);

  if (free.length === n) return t('entanglement.verdictNone');

  if (n === 2) return t(entropies[0] > 1 - EPS ? 'entanglement.verdictBell' : 'entanglement.verdictPartial');

  if (free.length === 1) {
    const [a, b] = [0, 1, 2].filter(q => q !== free[0]);
    return t('entanglement.verdictPair', { a, b, free: free[0] });
  }

  // No qubit can be split off, so all three are entangled together
  return t('entanglement.verdictAll');
}

export const EntanglementPanel = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true },
    // Noise has made the state mixed
    mixed: { type: Boolean, default: false }
  },

  template: `
    <div class="card entanglement">
      <h2>{{ $t('entanglement.title') }}</h2>
      <p v-if="mixed" class="entanglement-mixed">{{ $t('entanglement.mixed', { measureAll: $t('gates.measureAll'), reset: $t('gates.reset') }) }}</p>
      <template v-else>
      <p class="entanglement-verdict"><strong>{{ verdict }}</strong></p>

      <h3>{{ $t('entanglement.eachQubit') }}</h3>
      <ul class="entropy-rows">
        <li v-for="row in qubits" :key="row.q" class="entropy-row">
          <span class="entropy-label">{{ $t('bloch.qubit', { qubit: row.q }) }}</span>
          <span class="entropy-track" aria-hidden="true"><span class="entropy-bar" :style="{ width: row.width }"></span></span>
          <span class="entropy-value">{{ $t('entanglement.entropy', { value: row.value }) }} <span class="entropy-word">({{ row.word }})</span></span>
        </li>
      </ul>
      <p class="caption">
        {{ $t('entanglement.entropyCaption') }}
        <template v-if="n === 3">{{ $t('entanglement.entropyCaption3') }}</template>
      </p>

      <h3>{{ $t('entanglement.eachPair') }}</h3>
      <svg class="mi-graph" viewBox="0 0 200 120" role="img" :aria-label="pairSummary">
        <g v-for="e in pairs" :key="e.key">
          <line :x1="e.a.x" :y1="e.a.y" :x2="e.b.x" :y2="e.b.y" class="mi-edge" :stroke-width="e.width" />
          <text :x="(e.a.x + e.b.x) / 2" :y="(e.a.y + e.b.y) / 2 - 6" class="mi-label" text-anchor="middle">{{ e.value }}</text>
        </g>
        <g v-for="(node, q) in nodes" :key="q">
          <circle :cx="node.x" :cy="node.y" r="13" class="mi-node" />
          <text :x="node.x" :y="node.y + 4" class="mi-node-label" text-anchor="middle">Q{{ q }}</text>
        </g>
      </svg>
      <p class="caption">{{ $t('entanglement.miCaption', { state: '|' + '0'.repeat(n) + '⟩' }) }}</p>
      </template>
    </div>
  `,

  computed: {
    entropies() {
      return [...Array(this.n).keys()].map(q => engine.entanglementEntropy(this.re, this.im, q, this.n));
    },

    qubits() {
      return this.entropies.map((s, q) => ({
        q,
        value: fmt(s),
        word: entropyWord(s),
        width: `${Math.min(1, s) * 100}%`
      }));
    },

    nodes() {
      return NODES[this.n];
    },

    pairs() {
      const result = [];
      for (let q1 = 0; q1 < this.n; q1++) {
        for (let q2 = q1 + 1; q2 < this.n; q2++) {
          const value = engine.mutualInformation(this.re, this.im, q1, q2, this.n);
          result.push({
            key: `${q1}-${q2}`,
            q1,
            q2,
            a: this.nodes[q1],
            b: this.nodes[q2],
            value: fmt(value),
            width: 1 + (value / 2) * 7
          });
        }
      }
      return result;
    },

    pairSummary() {
      return t('entanglement.miAria', {
        list: this.pairs.map(e => t('entanglement.miPair', { q1: e.q1, q2: e.q2, value: e.value })).join(t('list.separator'))
      });
    },

    verdict() {
      return entanglementVerdict(this.entropies);
    }
  }
};
