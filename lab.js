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

export const Lab = {
  components: {
    AppNav, GatePanel, ProbabilityChart, BlochSpheres, AmplitudeTable,
    DensityMatrix, CorrelationGraph, CircuitEditor,
    // Explicit tag: Vue would turn "Cube3D" into <cube3-d>
    'cube-3d': Cube3D
  },

  props: {
    n: { type: Number, required: true }
  },

  data() {
    const { re, im } = engine.zeroState(this.n);
    return {
      stateRe: re,
      stateIm: im,
      circuit: [],
      measurement: '-',
      running: false
    };
  },

  template: `
    <div class="container">
      <app-nav />

      <div class="card">
        <h1>Quantum Lab: {{ n }} {{ n === 1 ? 'qubit' : 'qubits' }}</h1>
        <p>
          {{ 1 << n }} basis states, from |{{ '0'.repeat(n) }}⟩ to |{{ '1'.repeat(n) }}⟩.
          Apply gates and watch every view change.
        </p>
      </div>

      <gate-panel
        :n="n"
        @gate="applyGate"
        @cnot="applyCNOT"
        @bell="createBellState"
        @ghz="createGHZState"
        @measure="measure"
        @reset="reset"
      />

      <amplitude-table :re="stateRe" :im="stateIm" :n="n" :measurement="measurement" />
      <probability-chart :re="stateRe" :im="stateIm" :n="n" />
      <bloch-spheres :re="stateRe" :im="stateIm" :n="n" />
      <density-matrix :re="stateRe" :im="stateIm" :n="n" />
      <correlation-graph v-if="n >= 2" :re="stateRe" :im="stateIm" :n="n" />
      <cube-3d v-if="n === 3" :re="stateRe" :im="stateIm" />

      <circuit-editor
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
    this.enqueue(async () => {
      try {
        const saved = await loadLab(this.n);
        if (saved) {
          this.stateRe = saved.re;
          this.stateIm = saved.im;
          this.circuit = saved.circuit;
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
      if (reply.measured) this.measurement = reply.measured;

      await this.save();
    },

    async save() {
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
    },

    applyGate(gate, targetQubit) {
      return this.enqueue(() => this.runOnWorker({ type: 'gate', gate, targetQubit }));
    },

    applyCNOT(control, target) {
      return this.enqueue(() => this.runOnWorker({ type: 'cnot', control, target }));
    },

    measure() {
      return this.enqueue(() => this.runOnWorker({ type: 'measure' }));
    },

    reset() {
      return this.enqueue(async () => {
        this.resetState();
        await this.save();
      });
    },

    // Presets start from |0…0⟩ so they always give the advertised state.
    createBellState() {
      return this.enqueue(async () => {
        this.resetState();
        await this.runOnWorker({ type: 'gate', gate: 'H', targetQubit: 0 });
        await this.runOnWorker({ type: 'cnot', control: 0, target: 1 });
      });
    },

    createGHZState() {
      return this.enqueue(async () => {
        this.resetState();
        await this.runOnWorker({ type: 'gate', gate: 'H', targetQubit: 0 });
        await this.runOnWorker({ type: 'cnot', control: 0, target: 1 });
        await this.runOnWorker({ type: 'cnot', control: 1, target: 2 });
      });
    },

    addStep(step) {
      this.circuit.push(step);
      this.save();
    },

    removeStep(index) {
      this.circuit.splice(index, 1);
      this.save();
    },

    // Applies the circuit's steps in order to the current state.
    runCircuit() {
      return this.enqueue(async () => {
        this.running = true;
        try {
          for (const step of [...this.circuit]) {
            await this.runOnWorker(step.gate === 'CNOT'
              ? { type: 'cnot', control: step.control, target: step.target }
              : { type: 'gate', gate: step.gate, targetQubit: step.target });
            await new Promise(r => setTimeout(r, STEP_DELAY_MS));
          }
        } finally {
          this.running = false;
        }
      });
    }
  }
};
