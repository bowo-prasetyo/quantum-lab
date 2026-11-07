// What each gate does, in one line, shared by the Gates panel and the
// circuit editor so a gate is described the same way everywhere.
//
// Each component shows the description of the gate last hovered, focused or
// tapped in a hint line (so it also works on touch screens, which have no
// hover), and links every gate button to its description with
// aria-describedby for screen readers. Keep in step with pages/concepts.js.

export const GATE_INFO = Object.freeze({
  I: 'Identity: leaves the qubit unchanged.',
  H: 'Hadamard: turns |0⟩ into an equal superposition of |0⟩ and |1⟩. Applying it twice undoes it.',
  X: 'Pauli-X, the quantum NOT: swaps |0⟩ and |1⟩.',
  Y: 'Pauli-Y: swaps |0⟩ and |1⟩ and adds a phase: Y|0⟩ = i|1⟩.',
  Z: 'Pauli-Z: flips the sign (phase 180°) of |1⟩; |0⟩ is unchanged.',
  S: 'Phase S: gives |1⟩ a 90° phase. S twice is Z.',
  T: 'π/8 gate T: gives |1⟩ a 45° phase. T twice is S.',
  M: 'Measure: reads this qubit as 0 or 1 and collapses it to that result.',
  CNOT: 'Controlled-NOT: flips the target qubit when the control qubit is 1.',
  CZ: 'Controlled-Z: flips the sign where both qubits are 1. Either qubit can be the control.'
});

/**
 * Component mixin: `hintGate` is the gate whose description is shown;
 * call showHint(gate) on hover, focus and tap. descId(gate) is the id of
 * the gate's hidden description, unique to this component.
 * Render the descriptions with:
 *   <span v-for="(text, g) in GATE_INFO" :id="descId(g)" class="visually-hidden">{{ text }}</span>
 */
export const gateHints = {
  data() {
    return { hintGate: null };
  },

  computed: {
    GATE_INFO: () => GATE_INFO
  },

  methods: {
    showHint(gate) {
      this.hintGate = gate;
    },
    descId(gate) {
      return `gate-desc-${this.$.uid}-${gate}`;
    }
  }
};
