// Gate buttons for each qubit, CNOT with any control and target, presets,
// Measure and Reset. Emits events; the lab page runs them.

export const GatePanel = {
  props: { n: { type: Number, required: true } },
  emits: ['gate', 'cnot', 'bell', 'ghz', 'measure', 'reset'],

  data() {
    return {
      gates: ['I', 'H', 'X', 'Y', 'Z', 'S', 'T'],
      cnotControl: 0,
      cnotTarget: 1
    };
  },

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    }
  },

  watch: {
    // Keep control and target different
    cnotControl(c) {
      if (c === this.cnotTarget) this.cnotTarget = (c + 1) % this.n;
    },
    cnotTarget(t) {
      if (t === this.cnotControl) this.cnotControl = (t + 1) % this.n;
    }
  },

  template: `
    <div class="card">
      <h2>Gates</h2>

      <div v-for="q in qubits" :key="q">
        <h3>Qubit {{ q }}</h3>
        <button
          v-for="g in gates"
          :key="g"
          @click="$emit('gate', g, q)"
        >{{ g }}</button>
      </div>

      <hr>

      <div v-if="n >= 2" class="cnot-row">
        <button @click="$emit('cnot', cnotControl, cnotTarget)">CNOT</button>
        <label>
          control
          <select v-model.number="cnotControl" aria-label="CNOT control qubit">
            <option v-for="q in qubits" :key="q" :value="q">Q{{ q }}</option>
          </select>
        </label>
        <span aria-hidden="true">→</span>
        <label>
          target
          <select v-model.number="cnotTarget" aria-label="CNOT target qubit">
            <option v-for="q in qubits" :key="q" :value="q">Q{{ q }}</option>
          </select>
        </label>
      </div>

      <button v-if="n >= 2" @click="$emit('bell')">Create Bell Pair</button>
      <button v-if="n === 3" @click="$emit('ghz')">GHZ State</button>
      <button @click="$emit('measure')">Measure</button>
      <button @click="$emit('reset')">Reset</button>

      <p v-if="n >= 2" class="caption">
        Create Bell Pair{{ n === 3 ? ' and GHZ State start' : ' starts' }}
        from |{{ '0'.repeat(n) }}⟩, so they always give the same state.
      </p>
    </div>
  `
};
