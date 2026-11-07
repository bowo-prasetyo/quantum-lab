// The lab page for 1, 2 or 3 qubits (route #/lab/:n).
//
// Owns the state, the operation queue, the worker and saving. The panels
// are components that redraw from the state they are given.

import * as engine from './engine.js';
import { saveLab, loadLab } from './db.js';
import { AppNav } from './components/app-nav.js';
import { GatePanel } from './components/gate-panel.js';
import { ProbabilityChart } from './components/probability-chart.js';
import { BlochSpheres } from './components/bloch-spheres.js';
import { AmplitudeTable } from './components/amplitude-table.js';
import { DensityMatrix } from './components/density-matrix.js';
import { CorrelationGraph } from './components/correlation-graph.js';
import { Cube3D } from './components/cube-3d.js';
import { CircuitEditor } from './components/circuit-editor.js';

const STEP_DELAY_MS = 500; // pause between circuit steps so changes are visible
const HISTORY_LIMIT = 100; // undo steps kept (this session only, not saved)

// Two columns from this width up (keep in step with "Workbench" in styles.css)
const WIDE_QUERY = '(min-width: 1000px)';

// The views, in display order, with their tab labels on narrow screens
const VIEWS = [
  { key: 'table', label: 'State' },
  { key: 'probabilities', label: 'Probabilities' },
  { key: 'bloch', label: 'Bloch spheres' },
  { key: 'density', label: 'Density matrix' },
  { key: 'correlation', label: 'Correlations' },
  { key: 'cube', label: '3D' }
];

// Circuit editor step → worker message
function stepToMessage(step) {
  if (step.gate === 'CNOT') return { type: 'cnot', control: step.control, target: step.target };
  if (step.gate === 'CZ') return { type: 'cz', control: step.control, target: step.target };
  if (step.gate === 'M') return { type: 'measureQubit', targetQubit: step.target };
  return { type: 'gate', gate: step.gate, targetQubit: step.target };
}

export const Lab = {
  components: {
    AppNav, GatePanel, ProbabilityChart, BlochSpheres, AmplitudeTable,
    DensityMatrix, CorrelationGraph, CircuitEditor,
    // Explicit tag: Vue would turn "Cube3D" into <cube3-d>
    'cube-3d': Cube3D
  },

  props: {
    n: { type: Number, required: true },
    // Inside a lesson: no navigation or heading
    embedded: { type: Boolean, default: false },
    // Panels to show (see PANELS in lessons.js); null shows all for this size
    panels: { type: Array, default: null },
    // Save and restore state for this size; lessons use false
    persist: { type: Boolean, default: true }
  },

  data() {
    const { re, im } = engine.zeroState(this.n);
    return {
      stateRe: re,
      stateIm: im,
      circuit: [],
      measurement: '-',
      // Classical bits from measurements: { qubit: 0 | 1 }
      bits: {},
      running: false,
      importedFrom: null,  // name of the old simulator a state was brought over from
      narrow: !window.matchMedia(WIDE_QUERY).matches,
      // Circuit steps applied so far by Run or Step, or null if not stepping
      stepIndex: null,
      historyLength: 0,    // undo steps available (the history itself isn't reactive)
      activeView: 'table'  // the view tab shown on narrow screens
    };
  },

  // Layout (see "Workbench" in styles.css):
  //   wide screens (≥ 1000 px): the controls (gates, circuit editor, and a
  //     lesson's steps, passed in the "side" slot) stay in a sticky column
  //     on the left while the views fill the right, so a gate's effect is
  //     visible the moment it is pressed;
  //   narrow screens: one column, with the views in tabs (one view at a
  //     time) above the gates, like a calculator's display above its keys.
  template: `
    <div :class="{ container: !embedded, wide: !embedded }">
      <template v-if="!embedded">
        <app-nav />

        <div class="card">
          <h1>Glass Qubit: {{ n }} {{ n === 1 ? 'qubit' : 'qubits' }}</h1>
          <p>
            {{ 1 << n }} basis states, from |{{ '0'.repeat(n) }}⟩ to |{{ '1'.repeat(n) }}⟩.
            Apply gates and watch every view change.
            New here? Start with the <router-link to="/lessons">lessons</router-link>.
          </p>
        </div>
      </template>

      <div v-if="importedFrom" class="card notice" role="status">
        Welcome back! We brought over your saved state{{ circuit.length ? ' and circuit' : '' }}
        from the {{ importedFrom }}.
        <button class="link-button" @click="importedFrom = null">Dismiss</button>
      </div>

      <div class="workbench">
        <div class="workbench-controls">
          <div v-if="$slots.side" class="workbench-side">
            <slot name="side" />
          </div>

          <div class="workbench-tools">
            <gate-panel
              v-if="show('gates')"
              :n="n"
              :disabled="running"
              :can-undo="historyLength > 0"
              @undo="undo"
              @gate="applyGate"
              @cnot="applyCNOT"
              @cz="applyCZ"
              @measure-qubit="measureQubit"
              @bell="createBellState"
              @ghz="createGHZState"
              @measure="measure"
              @reset="reset"
            />

            <circuit-editor
              v-if="show('editor')"
              :n="n"
              :circuit="circuit"
              :running="running"
              :applied="stepIndex"
              :show-undo="!show('gates')"
              :can-undo="historyLength > 0"
              @add="addStep"
              @remove="removeStep"
              @clear="clearCircuit"
              @run="runCircuit"
              @step="stepCircuit"
              @undo="undo"
            />
          </div>
        </div>

        <div class="workbench-views">
          <div
            v-if="tabbed"
            class="view-tabs"
            role="tablist"
            aria-label="Views"
            @keydown="onTabKeydown"
          >
            <button
              v-for="v in views"
              :key="v.key"
              :id="'view-tab-' + v.key"
              class="view-tab"
              role="tab"
              :aria-selected="String(v.key === currentView)"
              :aria-controls="'view-' + v.key"
              :tabindex="v.key === currentView ? 0 : -1"
              @click="activeView = v.key"
            >{{ v.label }}</button>
          </div>

          <section v-if="show('table')" v-bind="viewAttrs('table')">
            <amplitude-table :re="stateRe" :im="stateIm" :n="n" :measurement="measurement" :bits="bits" />
          </section>
          <section v-if="show('probabilities')" v-bind="viewAttrs('probabilities')">
            <probability-chart :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="show('bloch')" v-bind="viewAttrs('bloch')">
            <bloch-spheres :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="show('density')" v-bind="viewAttrs('density')">
            <density-matrix :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="n >= 2 && show('correlation')" v-bind="viewAttrs('correlation')">
            <correlation-graph :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="n === 3 && show('cube')" v-bind="viewAttrs('cube')">
            <cube-3d :re="stateRe" :im="stateIm" />
          </section>
        </div>
      </div>
    </div>
  `,

  computed: {
    // The views this lab shows, in order, with their tab labels
    views() {
      return VIEWS
        .filter(v => this.show(v.key))
        .filter(v => !(v.key === 'correlation' && this.n < 2) && !(v.key === 'cube' && this.n !== 3))
        .map(v => ({ key: v.key, label: v.key === 'bloch' && this.n === 1 ? 'Bloch sphere' : v.label }));
    },

    // Tabs only on narrow screens, and only if there is more than one view
    tabbed() {
      return this.narrow && this.views.length > 1;
    },

    // The chosen tab, or the first view if the chosen one isn't shown here
    currentView() {
      const keys = this.views.map(v => v.key);
      return keys.includes(this.activeView) ? this.activeView : keys[0];
    }
  },

  created() {
    // Undo history: snapshots taken before each action (see remember())
    this.history = [];
    window.addEventListener('keydown', this.onKeydown);

    this.wideQuery = window.matchMedia(WIDE_QUERY);
    this.onWideChange = e => { this.narrow = !e.matches; };
    this.wideQuery.addEventListener('change', this.onWideChange);

    // Every operation runs through this queue, one at a time, and each
    // starts only after the previous worker reply has arrived. So it always
    // acts on the latest state, however fast the buttons are pressed.
    this.queue = Promise.resolve();
    this.pending = new Map();
    this.nextId = 0;

    this.worker = new Worker('./worker.js', { type: 'module' });

    this.worker.onmessage = (e) => {
      const resolve = this.pending.get(e.data.id);
      this.pending.delete(e.data.id);
      if (resolve) resolve(e.data);
    };

    // If the worker throws, release waiting operations so the queue
    // does not get stuck.
    this.worker.onerror = (e) => {
      console.error('Quantum worker error:', e.message);
      for (const resolve of this.pending.values()) resolve(null);
      this.pending.clear();
    };
  },

  mounted() {
    if (!this.persist) return;

    this.enqueue(async () => {
      try {
        const saved = await loadLab(this.n);
        if (saved) {
          this.stateRe = saved.re;
          this.stateIm = saved.im;
          this.circuit = saved.circuit;
          if (saved.importedFrom) this.importedFrom = saved.importedFrom;
        }
      } catch (err) {
        console.warn('Could not load saved state:', err);
      }
    });
  },

  beforeUnmount() {
    this.worker.terminate();
    this.wideQuery.removeEventListener('change', this.onWideChange);
    window.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    // Adds a task to the end of the queue. A failed task is logged and
    // does not block the tasks after it.
    enqueue(task) {
      this.queue = this.queue.then(task).catch(err => console.error(err));
      return this.queue;
    },

    // Sends the current state to the worker and stores the result.
    async runOnWorker(message) {
      const id = this.nextId++;
      const reply = await new Promise(resolve => {
        this.pending.set(id, resolve);
        this.worker.postMessage({
          ...message,
          id,
          qubitCount: this.n,
          re: this.stateRe,
          im: this.stateIm
        });
      });

      if (!reply) return;

      this.stateRe = reply.re;
      this.stateIm = reply.im;

      if (reply.measured) {
        // Measuring every qubit gives every bit
        this.measurement = reply.measured;
        const digits = reply.measured.replace(/[|⟩]/g, '');
        this.bits = Object.fromEntries([...digits].map((d, q) => [q, Number(d)]));
      } else if (reply.bit !== undefined) {
        this.measurement = `qubit ${reply.qubit} gave ${reply.bit}`;
        this.bits = { ...this.bits, [reply.qubit]: reply.bit };
      }

      await this.save();
    },

    show(panel) {
      return !this.panels || this.panels.includes(panel);
    },

    // Attributes for a view's wrapper: a tab panel on narrow screens
    viewAttrs(key) {
      if (!this.tabbed) return { class: 'lab-view' };
      return {
        class: 'lab-view',
        id: 'view-' + key,
        role: 'tabpanel',
        'aria-labelledby': 'view-tab-' + key,
        hidden: key !== this.currentView
      };
    },

    // Arrow keys, Home and End move between view tabs (WAI-ARIA tabs pattern)
    onTabKeydown(e) {
      const keys = this.views.map(v => v.key);
      const i = keys.indexOf(this.currentView);
      const next = {
        ArrowRight: (i + 1) % keys.length,
        ArrowLeft: (i - 1 + keys.length) % keys.length,
        Home: 0,
        End: keys.length - 1
      }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      this.activeView = keys[next];
      this.$nextTick(() => document.getElementById('view-tab-' + keys[next])?.focus());
    },

    async save() {
      if (!this.persist) return;
      try {
        await saveLab(this.n, this.stateRe, this.stateIm, this.circuit);
      } catch (err) {
        console.warn('Could not save state:', err);
      }
    },

    resetState() {
      const { re, im } = engine.zeroState(this.n);
      this.stateRe = re;
      this.stateIm = im;
      this.measurement = '-';
      this.bits = {};
    },

    // ----- Undo -----

    /** Saves the current state, circuit and step position for Undo. */
    remember() {
      this.history.push({
        re: this.stateRe,          // state arrays are replaced, never changed in place
        im: this.stateIm,
        measurement: this.measurement,
        bits: { ...this.bits },
        circuit: this.circuit.map(step => ({ ...step })),
        stepIndex: this.stepIndex
      });
      if (this.history.length > HISTORY_LIMIT) this.history.shift();
      this.historyLength = this.history.length;
    },

    forgetHistory() {
      this.history = [];
      this.historyLength = 0;
    },

    /** Goes back to before the last action: a gate, a measurement, a circuit edit or a run. */
    undo() {
      return this.enqueue(async () => {
        const last = this.history.pop();
        this.historyLength = this.history.length;
        if (!last) return;
        this.stateRe = last.re;
        this.stateIm = last.im;
        this.measurement = last.measurement;
        this.bits = last.bits;
        this.circuit.splice(0, this.circuit.length, ...last.circuit);
        this.stepIndex = last.stepIndex;
        await this.save();
      });
    },

    // Ctrl+Z (Cmd+Z on a Mac) undoes, except while typing in a form field
    onKeydown(e) {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z') return;
      if (e.target.closest?.('input, select, textarea, [contenteditable]')) return;
      if (this.running || !this.historyLength) return;
      e.preventDefault();
      this.undo();
    },

    // ----- Actions from the gate panel -----

    // Runs a learner's action through the queue, remembering the state
    // before it for Undo. Any action ends step-by-step play of the circuit.
    act(task) {
      return this.enqueue(async () => {
        this.remember();
        this.stepIndex = null;
        await task();
      });
    },

    applyGate(gate, targetQubit) {
      return this.act(() => this.runOnWorker({ type: 'gate', gate, targetQubit }));
    },

    applyCNOT(control, target) {
      return this.act(() => this.runOnWorker({ type: 'cnot', control, target }));
    },

    applyCZ(control, target) {
      return this.act(() => this.runOnWorker({ type: 'cz', control, target }));
    },

    measure() {
      return this.act(() => this.runOnWorker({ type: 'measure' }));
    },

    measureQubit(qubit) {
      return this.act(() => this.runOnWorker({ type: 'measureQubit', targetQubit: qubit }));
    },

    reset() {
      return this.act(async () => {
        this.resetState();
        await this.save();
      });
    },

    // Presets start from |0…0⟩ so they always give the advertised state.
    createBellState() {
      return this.act(() => this.bellSteps());
    },

    createGHZState() {
      return this.act(() => this.ghzSteps());
    },

    // Preset sequences; call only from inside a queued task
    async bellSteps() {
      this.resetState();
      await this.runOnWorker({ type: 'gate', gate: 'H', targetQubit: 0 });
      await this.runOnWorker({ type: 'cnot', control: 0, target: 1 });
    },

    async ghzSteps() {
      this.resetState();
      await this.runOnWorker({ type: 'gate', gate: 'H', targetQubit: 0 });
      await this.runOnWorker({ type: 'cnot', control: 0, target: 1 });
      await this.runOnWorker({ type: 'cnot', control: 1, target: 2 });
    },

    // ----- Circuit editor -----
    // Edits are applied at once (not queued) so the list updates as the
    // learner taps; each can be undone.

    addStep(step) {
      this.remember();
      this.stepIndex = null;
      this.circuit.push(step);
      this.save();
    },

    removeStep(index) {
      this.remember();
      this.stepIndex = null;
      this.circuit.splice(index, 1);
      this.save();
    },

    clearCircuit() {
      if (!this.circuit.length) return;
      this.remember();
      this.stepIndex = null;
      this.circuit.splice(0);
      this.save();
    },

    /**
     * Plays every step, half a second apart, highlighting each as it is
     * applied. Starts from |0…0⟩ unless fromZero is false, so running the
     * same circuit twice gives the same result. One Undo reverts the run.
     */
    runCircuit({ fromZero = true } = {}) {
      return this.enqueue(async () => {
        if (!this.circuit.length) return;
        this.remember();
        this.running = true;
        try {
          if (fromZero) this.resetState();
          this.stepIndex = 0;
          const steps = [...this.circuit];
          for (let i = 0; i < steps.length; i++) {
            if (i) await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            await this.runOnWorker(stepToMessage(steps[i]));
            this.stepIndex = i + 1;
          }
        } finally {
          this.running = false;
        }
        await this.save();
      });
    },

    /**
     * Applies the next step. The first press (or the first after the last
     * step, or after any other action) starts again, from |0…0⟩ unless
     * fromZero is false. Each step can be undone.
     */
    stepCircuit({ fromZero = true } = {}) {
      return this.enqueue(async () => {
        if (!this.circuit.length) return;
        this.remember();
        if (this.stepIndex === null || this.stepIndex >= this.circuit.length) {
          if (fromZero) this.resetState();
          this.stepIndex = 0;
        }
        await this.runOnWorker(stepToMessage(this.circuit[this.stepIndex]));
        this.stepIndex++;
        await this.save();
      });
    },

    // ----- Lessons -----

    /**
     * Runs lesson operations (see lessons.js) through the queue:
     * ['reset'], ['gate', name, q], ['cnot', c, t], ['cz', c, t], ['measure'],
     * ['measureQubit', q], ['bell'], ['ghz'], and ['if', q, op], which runs op
     * only if the last measurement of qubit q gave 1.
     * `delay` pauses between steps so the learner can follow along; the
     * controls are held meanwhile, as during a circuit run.
     * Clears the circuit editor first if `clearCircuit` is set.
     * Operations that start with a reset (Set up, Show me) begin afresh,
     * so Undo can't step back to before them.
     */
    runOps(ops, { delay = 0, clearCircuit = false } = {}) {
      return this.enqueue(async () => {
        if (ops[0]?.[0] === 'reset') this.forgetHistory();
        else this.remember();
        this.stepIndex = null;
        if (clearCircuit) this.circuit.splice(0);
        this.running = delay > 0;
        try {
          for (const op of ops) {
            await this.runOp(op);
            if (delay) await new Promise(r => setTimeout(r, delay));
          }
        } finally {
          this.running = false;
        }
        await this.save();
      });
    },

    // One lesson operation; call only from inside a queued task
    async runOp([kind, a, b]) {
      if (kind === 'reset') this.resetState();
      else if (kind === 'gate') await this.runOnWorker({ type: 'gate', gate: a, targetQubit: b });
      else if (kind === 'cnot') await this.runOnWorker({ type: 'cnot', control: a, target: b });
      else if (kind === 'cz') await this.runOnWorker({ type: 'cz', control: a, target: b });
      else if (kind === 'measure') await this.runOnWorker({ type: 'measure' });
      else if (kind === 'measureQubit') await this.runOnWorker({ type: 'measureQubit', targetQubit: a });
      else if (kind === 'if') { if (this.bits[a] === 1) await this.runOp(b); }
      else if (kind === 'bell') await this.bellSteps();
      else if (kind === 'ghz') await this.ghzSteps();
      else throw new Error(`Unknown operation: ${kind}`);
    },

    /** Replaces the circuit editor's steps (lesson "Show me"). */
    setCircuit(steps) {
      return this.enqueue(async () => {
        this.circuit.splice(0, this.circuit.length, ...steps);
        await this.save();
      });
    },

    /** Snapshot for checking a lesson result. */
    getState() {
      return { re: this.stateRe, im: this.stateIm, n: this.n, measured: this.measurement, bits: { ...this.bits } };
    }
  }
};
