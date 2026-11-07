// Gate buttons and a Measure (M) button for each qubit, CNOT and CZ with any
// control and target, presets, Measure (all), Reset and Undo. Emits events;
// the lab page runs them. Everything is disabled while a circuit runs.
//
// CNOT and CZ use the lab's control → target pair, chosen with the same
// picker as in the circuit editor. Each gate is described in a hint line
// (hover, focus or tap) and to screen readers (see gate-hints.js).

import { QubitPicker } from './qubit-picker.js';
import { gateHints } from './gate-hints.js';

export const GatePanel = {
  components: { QubitPicker },
  mixins: [gateHints],

  props: {
    n: { type: Number, required: true },
    // CNOT and CZ control and target (shared with the circuit editor)
    control: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    // A circuit is running: hold the buttons until it finishes
    disabled: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false }
  },
  emits: ['gate', 'cnot', 'cz', 'measure-qubit', 'bell', 'ghz', 'measure', 'reset', 'undo', 'pair'],

  data() {
    return {
      gates: ['I', 'H', 'X', 'Y', 'Z', 'S', 'T']
    };
  },

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    }
  },

  // One row per qubit (label, seven gates, M), so the panel stays compact
  // enough to sit beside the views on a wide screen and above them on a phone.
  template: `
    <div class="card gate-panel">
      <h2>Gates</h2>

      <!-- A disabled fieldset disables every button and select inside it -->
      <fieldset class="plain-fieldset" :disabled="disabled">
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
            :aria-describedby="descId(g)"
            @pointerenter="showHint(g)"
            @focus="showHint(g)"
            @click="showHint(g); $emit('gate', g, q)"
          >{{ g }}</button>
          <button
            class="gate-button measure-button"
            :aria-label="'Measure qubit ' + q"
            :aria-describedby="descId('M')"
            @pointerenter="showHint('M')"
            @focus="showHint('M')"
            @click="showHint('M'); $emit('measure-qubit', q)"
          >M</button>
        </div>

        <div v-if="n >= 2" class="cnot-row">
          <qubit-picker :n="n" :control="control" :target="target" @change="$emit('pair', $event)" />
          <div class="button-grid">
            <button
              v-for="g in ['CNOT', 'CZ']"
              :key="g"
              :aria-describedby="descId(g)"
              @pointerenter="showHint(g)"
              @focus="showHint(g)"
              @click="showHint(g); $emit(g.toLowerCase(), control, target)"
            >{{ g }}</button>
          </div>
        </div>

        <div class="action-row button-grid">
          <button v-if="n >= 2" @click="$emit('bell')">Create Bell Pair</button>
          <button v-if="n === 3" @click="$emit('ghz')">GHZ State</button>
          <button @click="$emit('measure')">Measure all</button>
          <button @click="$emit('reset')">Reset</button>
          <button
            :disabled="!canUndo"
            aria-keyshortcuts="Control+Z Meta+Z"
            title="Undo (Ctrl+Z)"
            @click="$emit('undo')"
          >Undo</button>
        </div>
      </fieldset>

      <!-- What the last hovered, focused or tapped gate does. Hidden from
           screen readers, which get the same text via aria-describedby. -->
      <p class="gate-hint" aria-hidden="true">
        <template v-if="hintGate"><strong>{{ hintGate }}</strong> {{ GATE_INFO[hintGate] }}</template>
        <template v-else>Point at, focus or tap a gate to see what it does.</template>
      </p>
      <span v-for="(text, g) in GATE_INFO" :key="g" :id="descId(g)" class="visually-hidden">{{ text }}</span>

      <p class="caption">
        <strong>M</strong> measures just that qubit; <strong>Measure all</strong> measures every qubit.
        <strong>Undo</strong> steps back, even past a measurement: the simulator
        remembers the state from before, which a real quantum computer can’t do.
        <template v-if="n >= 2">
          Create Bell Pair{{ n === 3 ? ' and GHZ State start' : ' starts' }}
          from |{{ '0'.repeat(n) }}⟩, so they always give the same state.
        </template>
      </p>
    </div>
  `
};
