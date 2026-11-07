// Build a circuit step by step, then run it. Three ways to add a gate:
// drag it with a mouse (native drag and drop), drag it with a finger or pen
// (pointer events), or tap / click / press Enter on it.
//
// Run Circuit plays every step; Step applies one step at a time. Both start
// from |0…0⟩ unless "Start from |0…0⟩" is unticked. The lab tracks how many
// steps have been applied (`applied`), and the editor highlights them.

export const CircuitEditor = {
  props: {
    n: { type: Number, required: true },
    circuit: { type: Array, required: true },
    running: { type: Boolean, default: false },
    // Steps applied so far by Run or Step, or null if not stepping
    applied: { type: Number, default: null },
    // Show an Undo button here (when the lab has no gate panel to hold it)
    showUndo: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false }
  },
  emits: ['add', 'remove', 'clear', 'run', 'step', 'undo'],

  data() {
    return {
      selectedQubit: 0,
      cnotTarget: this.n > 1 ? 1 : 0,
      draggingGate: null,
      // { gate, x, y, startX, startY, moved, over } during a touch/pen drag
      touchDrag: null,
      fromZero: true
    };
  },

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    },
    zeros() {
      return '0'.repeat(this.n);
    },
    // e.g. "Step 2 of 3: CNOT q0→q1", read out by screen readers
    status() {
      if (this.applied === null || this.applied === 0) return '';
      const total = this.circuit.length;
      const last = this.circuit[this.applied - 1];
      const text = `Step ${this.applied} of ${total}${last ? ': ' + this.stepLabel(last) : ''}.`;
      return this.applied >= total && !this.running
        ? `${text} All steps applied; Step starts again.`
        : text;
    },
    paletteGates() {
      const gates = ['I', 'H', 'X', 'Y', 'Z', 'S', 'T'];
      return this.n >= 2 ? [...gates, 'CNOT', 'CZ', 'M'] : [...gates, 'M'];
    }
  },

  watch: {
    // CNOT target must differ from the selected (control) qubit
    selectedQubit(q) {
      if (this.cnotTarget === q) this.cnotTarget = (q + 1) % this.n;
    }
  },

  created() {
    // "Never" rather than 0: performance.now() counts from page load, so 0
    // would make every tap in the page's first half-second look like the
    // end of a drag, and be ignored.
    this.lastTouchDragEnd = -Infinity;
  },

  beforeUnmount() {
    this.stopGateDrag();
  },

  template: `
    <div class="card">
      <h2>Circuit Editor</h2>

      <div class="gate-palette">
        <div
          v-for="g in paletteGates"
          :key="g"
          class="gate"
          role="button"
          tabindex="0"
          :aria-label="'Add ' + g + ' gate'"
          :aria-disabled="running ? 'true' : null"
          draggable="true"
          @dragstart="draggingGate = g"
          @pointerdown="onGatePointerDown($event, g)"
          @click="onGateClick(g)"
          @keydown.enter.prevent="addGate(g)"
          @keydown.space.prevent="addGate(g)"
        >{{ g }}</div>
      </div>

      <div class="card">
        <h3>{{ n >= 2 ? 'Selected qubit (control for CNOT and CZ)' : 'Selected qubit' }}</h3>
        <button
          v-for="q in qubits"
          :key="q"
          :class="{ selected: selectedQubit === q }"
          :aria-pressed="selectedQubit === q"
          @click="selectedQubit = q"
        >Q{{ q }}</button>

        <template v-if="n >= 2">
          <h3>Target for CNOT and CZ</h3>
          <button
            v-for="q in qubits.filter(q => q !== selectedQubit)"
            :key="q"
            :class="{ selected: cnotTarget === q }"
            :aria-pressed="cnotTarget === q"
            @click="cnotTarget = q"
          >Q{{ q }}</button>
        </template>
      </div>

      <p class="caption">
        Tap or drag a gate to add it to the selected qubit (M measures that qubit).
        Press × on a step to remove it.
      </p>

      <ol
        ref="dropzone"
        class="circuit-dropzone"
        :class="{ 'drop-target': touchDrag && touchDrag.over }"
        aria-label="Circuit steps"
        @dragover.prevent
        @drop="onDrop"
      >
        <li
          v-for="(step, index) in circuit"
          :key="index"
          class="circuit-step"
          :class="{ done: isDone(index), current: isCurrent(index) }"
          :aria-current="isCurrent(index) ? 'step' : null"
        >
          <span class="circuit-step-label">{{ stepLabel(step) }}</span>
          <button
            class="circuit-step-remove"
            :aria-label="'Remove step ' + (index + 1) + ', ' + stepLabel(step)"
            :title="'Remove ' + stepLabel(step)"
            :disabled="running"
            @click="remove(index)"
          >×</button>
        </li>
        <li v-if="!circuit.length" class="circuit-empty">Empty: add gates above.</li>
      </ol>

      <label class="check-label">
        <input type="checkbox" v-model="fromZero" :disabled="running" />
        Start from |{{ zeros }}⟩
      </label>

      <div class="button-grid circuit-actions">
        <button :disabled="!circuit.length || running" @click="$emit('run', { fromZero })">
          {{ running ? 'Running…' : 'Run Circuit' }}
        </button>
        <button
          :disabled="!circuit.length || running"
          title="Apply the next step"
          @click="$emit('step', { fromZero })"
        >Step</button>
        <button :disabled="!circuit.length || running" @click="$emit('clear')">Clear</button>
        <button
          v-if="showUndo"
          :disabled="!canUndo || running"
          aria-keyshortcuts="Control+Z Meta+Z"
          @click="$emit('undo')"
        >Undo</button>
      </div>

      <p class="caption circuit-status" role="status">{{ status }}</p>

      <!-- Chip that follows the finger during a touch drag -->
      <div
        v-if="touchDrag && touchDrag.moved"
        class="drag-ghost"
        :style="{ left: touchDrag.x + 'px', top: touchDrag.y + 'px' }"
      >{{ touchDrag.gate }}</div>
    </div>
  `,

  methods: {
    // e.g. 'H q0', 'CNOT q0→q1', 'CZ q0,q1', 'M q2' (measure qubit 2)
    stepLabel(step) {
      if (step.gate === 'CNOT') return `CNOT q${step.control}→q${step.target}`;
      if (step.gate === 'CZ') return `CZ q${step.control},q${step.target}`;
      return `${step.gate} q${step.target}`;
    },

    isDone(index) {
      return this.applied !== null && index < this.applied;
    },

    isCurrent(index) {
      return this.applied !== null && index === this.applied - 1;
    },

    // Removes a step, then keeps keyboard focus in the list: on the step
    // that took its place, the one before, or the palette if none is left.
    remove(index) {
      this.$emit('remove', index);
      this.$nextTick(() => {
        const buttons = this.$el.querySelectorAll('.circuit-step-remove');
        const next = buttons[index] || buttons[index - 1] || this.$el.querySelector('.gate');
        next?.focus();
      });
    },

    addGate(gate) {
      if (this.running) return;
      this.$emit('add', gate === 'CNOT' || gate === 'CZ'
        ? { gate, control: this.selectedQubit, target: this.cnotTarget }
        : { gate, target: this.selectedQubit });
    },

    // Mouse: native HTML5 drag and drop
    onDrop() {
      if (!this.draggingGate) return;
      this.addGate(this.draggingGate);
      this.draggingGate = null;
    },

    // Tap, click, or keyboard
    onGateClick(gate) {
      // A touch drag that ends near the gate can also fire a click;
      // don't add the gate twice.
      if (performance.now() - this.lastTouchDragEnd < 500) return;
      this.addGate(gate);
    },

    // Touch and pen: follow the pointer and add the gate if it is released
    // over the circuit area.
    onGatePointerDown(e, gate) {
      if (e.pointerType === 'mouse') return;

      this.touchDrag = {
        gate,
        x: e.clientX,
        y: e.clientY,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        over: false
      };

      window.addEventListener('pointermove', this.onGatePointerMove);
      window.addEventListener('pointerup', this.onGatePointerUp);
      window.addEventListener('pointercancel', this.stopGateDrag);
    },

    onGatePointerMove(e) {
      const drag = this.touchDrag;
      if (!drag) return;

      drag.x = e.clientX;
      drag.y = e.clientY;
      if (Math.hypot(drag.x - drag.startX, drag.y - drag.startY) > 8) drag.moved = true;
      drag.over = this.isOverDropzone(e.clientX, e.clientY);
    },

    onGatePointerUp(e) {
      const drag = this.touchDrag;
      this.stopGateDrag();

      if (!drag || !drag.moved) return; // a tap: the click handler adds it

      this.lastTouchDragEnd = performance.now();
      if (this.isOverDropzone(e.clientX, e.clientY)) this.addGate(drag.gate);
    },

    stopGateDrag() {
      this.touchDrag = null;
      window.removeEventListener('pointermove', this.onGatePointerMove);
      window.removeEventListener('pointerup', this.onGatePointerUp);
      window.removeEventListener('pointercancel', this.stopGateDrag);
    },

    isOverDropzone(x, y) {
      const zone = this.$refs.dropzone;
      if (!zone) return false;
      const r = zone.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    }
  }
};
