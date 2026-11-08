// Build a circuit step by step, then run it. Three ways to add a gate:
// drag it with a mouse (native drag and drop), drag it with a finger or pen
// (pointer events), or tap / click / press Enter on it.
//
// The palette is laid out like the Gates panel: one row per qubit, so H in
// row Q1 adds "H q1". CNOT and CZ use the lab's control → target pair, chosen
// with the same picker as in the Gates panel. Each gate is described in a
// hint line and to screen readers (see gate-hints.js).
//
// Run Circuit plays every step; Step applies one step at a time. Both start
// from |0…0⟩ unless "Start from |0…0⟩" is unticked. The lab tracks how many
// steps have been applied (`applied`), and the editor highlights them.

import { QubitPicker } from './qubit-picker.js';
import { gateHints } from './gate-hints.js';

// Noise steps' names, by channel (see NOISE_CHANNELS in engine.js)
export const NOISE_STEP_NAMES = Object.freeze({ dephasing: 'Dephase', damping: 'Damp', depolarizing: 'Depolarize' });

/**
 * A circuit step as text: 'H q0', 'CNOT q0→q1', 'CZ q0,q1', 'M q2' (measure
 * qubit 2), 'Dephase 10% q1' (noise: { gate: 'N', target, channel, strength }).
 */
export function stepLabel(step) {
  if (step.gate === 'CNOT') return `CNOT q${step.control}→q${step.target}`;
  if (step.gate === 'CZ') return `CZ q${step.control},q${step.target}`;
  if (step.gate === 'N') return `${NOISE_STEP_NAMES[step.channel]} ${Math.round(step.strength * 100)}% q${step.target}`;
  return `${step.gate} q${step.target}`;
}

const SINGLE_GATES = ['I', 'H', 'X', 'Y', 'Z', 'S', 'T', 'M'];
const PAIR_GATES = ['CNOT', 'CZ'];

export const CircuitEditor = {
  components: { QubitPicker },
  mixins: [gateHints],

  props: {
    n: { type: Number, required: true },
    circuit: { type: Array, required: true },
    // CNOT and CZ control and target (shared with the Gates panel)
    control: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    running: { type: Boolean, default: false },
    // Steps applied so far by Run or Step, or null if not stepping
    applied: { type: Number, default: null },
    // Show an Undo button here (when the lab has no gate panel to hold it)
    showUndo: { type: Boolean, default: false },
    canUndo: { type: Boolean, default: false },
    // The Noise panel's choice, { channel, strength }, which an N chip adds;
    // null when noise isn't offered (then there are no N chips)
    noise: { type: Object, default: null },
    // Run and Step add that noise to every qubit after each step
    noisyRun: { type: Boolean, default: false }
  },
  emits: ['add', 'remove', 'clear', 'run', 'step', 'undo', 'pair', 'noisy-run'],

  data() {
    return {
      singleGates: SINGLE_GATES,
      pairGates: PAIR_GATES,
      // The palette chip being dragged with a mouse: { gate, target? }
      draggingGate: null,
      // { spec, x, y, startX, startY, moved, over } during a touch/pen drag
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
    pairLabel() {
      return `control Q${this.control}, target Q${this.target}`;
    },
    // e.g. "Dephase 10%"
    noiseText() {
      if (!this.noise) return '';
      return `${NOISE_STEP_NAMES[this.noise.channel]} ${Math.round(this.noise.strength * 100)}%`;
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

      <!-- Palette: a row of gates per qubit, then CNOT and CZ for the chosen pair -->
      <div
        v-for="q in qubits"
        :key="q"
        class="gate-row palette-row"
        :class="{ 'with-noise': noise }"
        role="group"
        :aria-label="'Add to qubit ' + q"
      >
        <span class="gate-row-label" aria-hidden="true">Q{{ q }}</span>
        <div
          v-for="g in singleGates"
          :key="g"
          class="gate"
          role="button"
          tabindex="0"
          :aria-label="'Add ' + g + ' on Q' + q"
          :aria-describedby="descId(g)"
          :aria-disabled="running ? 'true' : null"
          draggable="true"
          @dragstart="draggingGate = { gate: g, target: q }"
          @pointerenter="showHint(g)"
          @focus="showHint(g)"
          @pointerdown="onGatePointerDown($event, { gate: g, target: q })"
          @click="onGateClick({ gate: g, target: q })"
          @keydown.enter.prevent="addGate({ gate: g, target: q })"
          @keydown.space.prevent="addGate({ gate: g, target: q })"
        >{{ g }}</div>
        <div
          v-if="noise"
          class="gate noise-chip"
          role="button"
          tabindex="0"
          :aria-label="'Add ' + noiseText + ' noise on Q' + q"
          :aria-describedby="descId('N')"
          :aria-disabled="running ? 'true' : null"
          draggable="true"
          @dragstart="draggingGate = { gate: 'N', target: q }"
          @pointerenter="showHint('N')"
          @focus="showHint('N')"
          @pointerdown="onGatePointerDown($event, { gate: 'N', target: q })"
          @click="onGateClick({ gate: 'N', target: q })"
          @keydown.enter.prevent="addGate({ gate: 'N', target: q })"
          @keydown.space.prevent="addGate({ gate: 'N', target: q })"
        >N</div>
      </div>

      <div v-if="n >= 2" class="cnot-row palette-pair">
        <qubit-picker :n="n" :control="control" :target="target" @change="$emit('pair', $event)" />
        <div class="palette-pair-gates">
          <div
            v-for="g in pairGates"
            :key="g"
            class="gate"
            role="button"
            tabindex="0"
            :aria-label="'Add ' + g + ', ' + pairLabel"
            :aria-describedby="descId(g)"
            :aria-disabled="running ? 'true' : null"
            draggable="true"
            @dragstart="draggingGate = { gate: g }"
            @pointerenter="showHint(g)"
            @focus="showHint(g)"
            @pointerdown="onGatePointerDown($event, { gate: g })"
            @click="onGateClick({ gate: g })"
            @keydown.enter.prevent="addGate({ gate: g })"
            @keydown.space.prevent="addGate({ gate: g })"
          >{{ g }}</div>
        </div>
      </div>

      <p class="gate-hint" aria-hidden="true">
        <template v-if="hintGate"><strong>{{ hintGate }}</strong> {{ GATE_INFO[hintGate] }}</template>
        <template v-else>Point at, focus or tap a gate to see what it does.</template>
      </p>
      <span v-for="(text, g) in GATE_INFO" :key="g" :id="descId(g)" class="visually-hidden">{{ text }}</span>

      <p class="caption">
        Tap or drag a gate to add it to the circuit: each row adds to its qubit
        (M measures it<template v-if="noise">; N adds the noise chosen in the
        Noise panel, now {{ noiseText }}</template>)<template v-if="n >= 2">, and CNOT and CZ use the control
        and target chosen above, the same pair as in the Gates panel</template>.
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
      <label v-if="noise" class="check-label">
        <input type="checkbox" :checked="noisyRun" :disabled="running"
          @change="$emit('noisy-run', $event.target.checked)" />
        Noisy run: {{ noiseText }} on every qubit after each step, as on real hardware
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

      <!-- Visual only: the lab announces each step, with the state it gives -->
      <p class="caption circuit-status">{{ status }}</p>

      <!-- Chip that follows the finger during a touch drag -->
      <div
        v-if="touchDrag && touchDrag.moved"
        class="drag-ghost"
        :style="{ left: touchDrag.x + 'px', top: touchDrag.y + 'px' }"
      >{{ chipLabel(touchDrag.spec) }}</div>
    </div>
  `,

  methods: {
    stepLabel,

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

    // A palette chip as text, e.g. 'H q1' or 'CNOT q0→q2'
    chipLabel(spec) {
      return this.stepLabel(this.toStep(spec));
    },

    // Palette chip { gate, target? } → circuit step. N takes the Noise
    // panel's choice at the moment it is added.
    toStep({ gate, target }) {
      if (PAIR_GATES.includes(gate)) return { gate, control: this.control, target: this.target };
      if (gate === 'N') return { gate, target, channel: this.noise.channel, strength: this.noise.strength };
      return { gate, target };
    },

    addGate(spec) {
      if (this.running) return;
      this.showHint(spec.gate);
      this.$emit('add', this.toStep(spec));
    },

    // Mouse: native HTML5 drag and drop
    onDrop() {
      if (!this.draggingGate) return;
      this.addGate(this.draggingGate);
      this.draggingGate = null;
    },

    // Tap, click, or keyboard
    onGateClick(spec) {
      // A touch drag that ends near the gate can also fire a click;
      // don't add the gate twice.
      if (performance.now() - this.lastTouchDragEnd < 500) return;
      this.addGate(spec);
    },

    // Touch and pen: follow the pointer and add the gate if it is released
    // over the circuit area.
    onGatePointerDown(e, spec) {
      if (e.pointerType === 'mouse') return;

      this.touchDrag = {
        spec,
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
      if (this.isOverDropzone(e.clientX, e.clientY)) this.addGate(drag.spec);
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
