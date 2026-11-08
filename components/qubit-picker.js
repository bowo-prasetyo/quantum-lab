// Control → target picker for CNOT and CZ, used by both the Gates panel and
// the circuit editor, so the two always look and behave the same and show
// the same choice (the lab keeps one pair for both).
//
// Two radio groups of Q0, Q1, … chips, one row each (control above target). The target can't be the control: the
// control's chip is disabled in the target row, and picking as control the
// qubit that was the target moves the target to the next qubit.
// Arrow keys move within a group (WAI-ARIA radio group pattern).

export const QubitPicker = {
  props: {
    n: { type: Number, required: true },
    control: { type: Number, required: true },
    target: { type: Number, required: true }
  },
  emits: ['change'],

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    }
  },

  template: `
    <div class="qubit-picker">
      <div class="picker-group" role="radiogroup" :aria-label="$t('picker.controlAria')">
        <span class="picker-label" aria-hidden="true">{{ $t('picker.control') }}</span>
        <button
          v-for="q in qubits"
          :key="q"
          class="picker-chip"
          role="radio"
          :aria-checked="String(q === control)"
          :tabindex="q === control ? 0 : -1"
          @click="setControl(q)"
          @keydown="onKeydown($event, 'control')"
        >Q{{ q }}</button>
      </div>
      <div class="picker-group" role="radiogroup" :aria-label="$t('picker.targetAria')">
        <span class="picker-label" aria-hidden="true">{{ $t('picker.target') }}</span>
        <button
          v-for="q in qubits"
          :key="q"
          class="picker-chip"
          role="radio"
          :aria-checked="String(q === target)"
          :tabindex="q === target ? 0 : -1"
          :disabled="q === control"
          :title="q === control ? $t('picker.isControl', { qubit: q }) : null"
          @click="setTarget(q)"
          @keydown="onKeydown($event, 'target')"
        >Q{{ q }}</button>
      </div>
    </div>
  `,

  methods: {
    setControl(q) {
      const target = q === this.target ? (q + 1) % this.n : this.target;
      this.$emit('change', { control: q, target });
    },

    setTarget(q) {
      if (q === this.control) return;
      this.$emit('change', { control: this.control, target: q });
    },

    // Arrow keys pick the next or previous qubit in the group, skipping the
    // disabled one, and move focus with the choice
    onKeydown(e, group) {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const current = group === 'control' ? this.control : this.target;
      let q = current;
      do {
        q = (q + step + this.n) % this.n;
      } while (group === 'target' && q === this.control);
      if (group === 'control') this.setControl(q);
      else this.setTarget(q);
      const groupEl = e.currentTarget.parentElement;
      this.$nextTick(() => groupEl.querySelectorAll('.picker-chip')[q]?.focus());
    }
  }
};
