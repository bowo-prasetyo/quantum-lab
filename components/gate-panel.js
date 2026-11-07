// Gate buttons and a Measure (M) button for each qubit, CNOT and CZ with any
// control and target, presets, Measure (all) and Reset. Emits events; the
// lab page runs them.

export const GatePanel = {
  props: { n: { type: Number, required: true } },
  emits: ['gate', 'cnot', 'cz', 'measure-qubit', 'bell', 'ghz', 'measure', 'reset'],

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

  // One row per qubit (label, seven gates, M), so the panel stays compact
  // enough to sit beside the views on a wide screen and above them on a phone.
  template: `
    <div class="card gate-panel">
      <h2>Gates</h2>

      <div
        v-for="q in qubits"
        :key="q"
        class="gate-row"
        role="group"
        :aria-label="'Qubit ' + q"
      >
        <span class="gate-row-label" aria-hidden="true">Q{{ q }}</span>
        <button
          v-for="g in gates"
          :key="g"
          class="gate-button"
          @click="$emit('gate', g, q)"
        >{{ g }}</button>
        <button
          class="gate-button measure-button"
          :aria-label="'Measure qubit ' + q"
          :title="'Measure qubit ' + q + ' only'"
          @click="$emit('measure-qubit', q)"
        >M</button>
      </div>

      <div v-if="n >= 2" class="cnot-row">
        <label>
          control
          <select v-model.number="cnotControl" aria-label="CNOT and CZ control qubit">
            <option v-for="q in qubits" :key="q" :value="q">Q{{ q }}</option>
          </select>
        </label>
        <span aria-hidden="true">→</span>
        <label>
          target
          <select v-model.number="cnotTarget" aria-label="CNOT and CZ target qubit">
            <option v-for="q in qubits" :key="q" :value="q">Q{{ q }}</option>
          </select>
        </label>
        <div class="button-grid">
          <button @click="$emit('cnot', cnotControl, cnotTarget)">CNOT</button>
          <button @click="$emit('cz', cnotControl, cnotTarget)">CZ</button>
        </div>
      </div>

      <div class="action-row button-grid">
        <button v-if="n >= 2" @click="$emit('bell')">Create Bell Pair</button>
        <button v-if="n === 3" @click="$emit('ghz')">GHZ State</button>
        <button @click="$emit('measure')">Measure all</button>
        <button @click="$emit('reset')">Reset</button>
      </div>

      <p class="caption">
        <strong>M</strong> measures just that qubit; <strong>Measure all</strong> measures every qubit.
        <template v-if="n >= 2">
          CZ flips the sign where both chosen qubits are 1 (which one is the control doesn’t matter).
          Create Bell Pair{{ n === 3 ? ' and GHZ State start' : ' starts' }}
          from |{{ '0'.repeat(n) }}⟩, so they always give the same state.
        </template>
      </p>
    </div>
  `
};
