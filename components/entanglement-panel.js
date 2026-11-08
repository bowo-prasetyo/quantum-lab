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

const EPS = 1e-6;

// Node positions in a 200 × 120 SVG
const NODES = {
  2: [{ x: 50, y: 60 }, { x: 150, y: 60 }],
  3: [{ x: 100, y: 22 }, { x: 40, y: 98 }, { x: 160, y: 98 }]
};

const fmt = v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2);

function entropyWord(s) {
  if (s < EPS) return 'not entangled';
  if (s > 1 - EPS) return 'maximally entangled';
  return 'partly entangled';
}

/**
 * Which qubits are entangled with which, in words, for a pure state of 2
 * or 3 qubits given each qubit's entanglement entropy.
 */
export function entanglementVerdict(entropies) {
  const n = entropies.length;
  const free = entropies.map((s, q) => (s < EPS ? q : -1)).filter(q => q >= 0);

  if (free.length === n) return 'No entanglement: every qubit has a state of its own.';

  if (n === 2) {
    return entropies[0] > 1 - EPS
      ? 'Qubits 0 and 1 are maximally entangled, as in a Bell pair.'
      : 'Qubits 0 and 1 are partly entangled.';
  }

  if (free.length === 1) {
    const [a, b] = [0, 1, 2].filter(q => q !== free[0]);
    return `Qubits ${a} and ${b} are entangled with each other; qubit ${free[0]} is separate.`;
  }

  // No qubit can be split off, so all three are entangled together
  return 'All three qubits are entangled together: none can be split off from the others, as in a GHZ state.';
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
      <h2>Entanglement</h2>
      <p v-if="mixed" class="entanglement-mixed">
        The state is mixed (noise was applied). These measures only work for a pure
        state: in a mixed one, a qubit’s entropy can come from noise as well as from
        entanglement, so this view is paused until Measure all or Reset.
      </p>
      <template v-else>
      <p class="entanglement-verdict"><strong>{{ verdict }}</strong></p>

      <h3>Each qubit</h3>
      <ul class="entropy-rows">
        <li v-for="row in qubits" :key="row.q" class="entropy-row">
          <span class="entropy-label">Qubit {{ row.q }}</span>
          <span class="entropy-track" aria-hidden="true"><span class="entropy-bar" :style="{ width: row.width }"></span></span>
          <span class="entropy-value">S = {{ row.value }} <span class="entropy-word">({{ row.word }})</span></span>
        </li>
      </ul>
      <p class="caption">
        Entanglement entropy S, from 0 (the qubit has a state of its own) to 1
        bit (maximally entangled). It grows as the qubit’s Bloch vector shrinks.
        <template v-if="n === 3">With three qubits, splitting one off from the other two is
        the only way to divide them, so these three numbers cover every split.</template>
      </p>

      <h3>Each pair</h3>
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
      <p class="caption">
        Mutual information I, from 0 (the two qubits’ results are unrelated,
        whatever you measure) to 2 bits. It counts every kind of link, so it is
        positive between qubits of a GHZ state even though no two of them are a
        Bell pair. Unlike the correlation graph, it shows 0 for
        |{{ '0'.repeat(n) }}⟩.
      </p>
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
      return 'Mutual information: ' + this.pairs.map(e => `Q${e.q1} and Q${e.q2} ${e.value} bits`).join(', ');
    },

    verdict() {
      return entanglementVerdict(this.entropies);
    }
  }
};
