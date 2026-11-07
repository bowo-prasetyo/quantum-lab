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
      importedFrom: null   // name of the old simulator a state was brought over from
    };
  },

  template: `
    <div :class="{ container: !embedded }">
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

      <gate-panel
        v-if="show('gates')"
        :n="n"
        @gate="applyGate"
        @cnot="applyCNOT"
        @cz="applyCZ"
        @measure-qubit="measureQubit"
        @bell="createBellState"
        @ghz="createGHZState"
        @measure="measure"
        @reset="reset"
      />

      <amplitude-table v-if="show('table')" :re="stateRe" :im="stateIm" :n="n" :measurement="measurement" :bits="bits" />
      <probability-chart v-if="show('probabilities')" :re="stateRe" :im="stateIm" :n="n" />
      <bloch-spheres v-if="show('bloch')" :re="stateRe" :im="stateIm" :n="n" />
      <density-matrix v-if="show('density')" :re="stateRe" :im="stateIm" :n="n" />
      <correlation-graph v-if="n >= 2 && show('correlation')" :re="stateRe" :im="stateIm" :n="n" />
      <cube-3d v-if="n === 3 && show('cube')" :re="stateRe" :im="stateIm" />

      <circuit-editor
        v-if="show('editor')"
        :n="n"
        :circuit="circuit"
        :running="running"
        @add="addStep"
        @remove="removeStep"
        @run="runCircuit"
      />
    </div>
  `,

  created() {
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

    applyGate(gate, targetQubit) {
      return this.enqueue(() => this.runOnWorker({ type: 'gate', gate, targetQubit }));
    },

    applyCNOT(control, target) {
      return this.enqueue(() => this.runOnWorker({ type: 'cnot', control, target }));
    },

    applyCZ(control, target) {
      return this.enqueue(() => this.runOnWorker({ type: 'cz', control, target }));
    },

    measure() {
      return this.enqueue(() => this.runOnWorker({ type: 'measure' }));
    },

    measureQubit(qubit) {
      return this.enqueue(() => this.runOnWorker({ type: 'measureQubit', targetQubit: qubit }));
    },

    reset() {
      return this.enqueue(async () => {
        this.resetState();
        await this.save();
      });
    },

    // Presets start from |0…0⟩ so they always give the advertised state.
    createBellState() {
      return this.enqueue(() => this.bellSteps());
    },

    createGHZState() {
      return this.enqueue(() => this.ghzSteps());
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

    addStep(step) {
      this.circuit.push(step);
      this.save();
    },

    removeStep(index) {
      this.circuit.splice(index, 1);
      this.save();
    },

    /**
     * Runs lesson operations (see lessons.js) through the queue:
     * ['reset'], ['gate', name, q], ['cnot', c, t], ['cz', c, t], ['measure'],
     * ['measureQubit', q], ['bell'], ['ghz'], and ['if', q, op], which runs op
     * only if the last measurement of qubit q gave 1.
     * `delay` pauses between steps so the learner can follow along.
     * Clears the circuit editor first if `clearCircuit` is set.
     */
    runOps(ops, { delay = 0, clearCircuit = false } = {}) {
      return this.enqueue(async () => {
        if (clearCircuit) this.circuit.splice(0);
        for (const op of ops) {
          await this.runOp(op);
          if (delay) await new Promise(r => setTimeout(r, delay));
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
    },

    // Applies the circuit's steps in order to the current state.
    runCircuit() {
      return this.enqueue(async () => {
        this.running = true;
        try {
          for (const step of [...this.circuit]) {
            await this.runOnWorker(stepToMessage(step));
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          }
        } finally {
          this.running = false;
        }
      });
    }
  }
};
