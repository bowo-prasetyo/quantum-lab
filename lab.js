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
import { ShotsHistogram } from './components/shots-histogram.js';
import { InterferenceView } from './components/interference-view.js';
import { EntanglementPanel } from './components/entanglement-panel.js';
import { PauliPanel } from './components/pauli-panel.js';
import { UnitaryView } from './components/unitary-view.js';
import { CircuitTimeline } from './components/circuit-timeline.js';
import { circuitStepApply } from './components/unitary-view.js';
import { NoisePanel } from './components/noise-panel.js';
import { CircuitEditor, stepLabel } from './components/circuit-editor.js';
import { describeState, measurementText } from './describe.js';
import { t, formatNumber, formatPercent, formatList, capitalize } from './i18n.js';
import { getPref, setPref } from './prefs.js';
import { loadPredictions } from './progress.js';
import { lessonById } from './lessons.js';

const STEP_DELAY_MS = 500; // pause between circuit steps so changes are visible
const HISTORY_LIMIT = 100; // undo steps kept (this session only, not saved)

// Two columns from this width up (keep in step with "Workbench" in styles.css)
const WIDE_QUERY = '(min-width: 1000px)';

// Views the free lab keeps behind "Show advanced views" until the learner
// asks for them or reaches Part 3 of the lessons, where they are taught
// (VISION: reveal advanced views as the learner progresses). Lessons show
// whatever panels they list.
const ADVANCED = ['noise', 'density', 'unitary', 'correlation', 'pauli', 'entanglement', 'cube'];

// Whether the learner has answered a prediction in Part 3 or later
const reachedAdvancedLessons = () =>
  Object.keys(loadPredictions()).some(id => (lessonById(id)?.part ?? 0) >= 3);

// The views, in display order; each tab label on narrow screens is the
// message 'view.<key>' (a plural by the number of qubits, for Bloch spheres)
const VIEWS = ['table', 'probabilities', 'shots', 'bloch', 'interference', 'density', 'unitary', 'correlation', 'pauli', 'entanglement', 'cube'];

// The remembered noise choice, or the default if none (or a bad one) is saved
function savedNoise() {
  const channel = getPref('noise-channel', 'dephasing');
  const strength = getPref('noise-strength', 0.5);
  return {
    channel: Object.hasOwn(engine.NOISE_CHANNELS, channel) ? channel : 'dephasing',
    strength: typeof strength === 'number' && strength >= 0 && strength <= 1 ? strength : 0.5
  };
}

// Circuit editor step → worker message
function stepToMessage(step) {
  if (step.gate === 'CNOT') return { type: 'cnot', control: step.control, target: step.target };
  if (step.gate === 'CZ') return { type: 'cz', control: step.control, target: step.target };
  if (step.gate === 'M') return { type: 'measureQubit', targetQubit: step.target };
  if (step.gate === 'N') return { type: 'noise', channel: step.channel, targetQubit: step.target, strength: step.strength };
  return { type: 'gate', gate: step.gate, targetQubit: step.target };
}

export const Lab = {
  components: {
    AppNav, GatePanel, ProbabilityChart, BlochSpheres, AmplitudeTable,
    DensityMatrix, CorrelationGraph, CircuitEditor, ShotsHistogram,
    InterferenceView, EntanglementPanel, PauliPanel, UnitaryView, CircuitTimeline, NoisePanel,
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
      // After noise the state is mixed: its density matrix { re, im, size }
      // (frozen, so Vue leaves it alone), and stateRe/stateIm hold amplitudes
      // √p with the same probabilities (engine.probabilityAmplitudes) for the
      // views that only read probabilities. null while the state is pure.
      stateRho: null,
      circuit: [],
      measurement: '-',
      // Classical bits from measurements: { qubit: 0 | 1 }
      bits: {},
      // The last operation and the state before it, for the Interference
      // view: { message, re, im }, or null after a reset or a load
      lastStep: null,
      stepSerial: 0,       // counts steps applied, so views can tell a new step from Undo
      running: false,
      importedFrom: null,  // name of the old simulator a state was brought over from
      narrow: !window.matchMedia(WIDE_QUERY).matches,
      // Circuit steps applied so far by Run or Step, or null if not stepping
      stepIndex: null,
      // The states the last run went through: frame k is the state after
      // k steps (see snapshot()). Emptied by any other action or an edit.
      frames: [],
      // CNOT and CZ control → target, shared by the Gates panel and the
      // circuit editor so both show the same choice
      pair: { control: 0, target: this.n > 1 ? 1 : 0 },
      historyLength: 0,    // undo steps available (the history itself isn't reactive)
      announcement: '',    // last screen-reader announcement
      // The Noise panel's choice, used by its buttons, the circuit editor's
      // N steps and noisy runs
      noise: savedNoise(),
      // Run and Step add that noise to every qubit after each step
      noisyRun: false,
      // A lesson's readout errors for the Shots view (see setReadoutPreset)
      readoutPreset: null,
      // Show amplitudes with the global phase removed (table, 3D view, interference)
      hideGlobalPhase: getPref('hide-global-phase', false),
      // Free lab only: show the density matrix, correlations, Pauli expectations, entanglement and 3D view
      showAdvanced: getPref('advanced-views', null) ?? reachedAdvancedLessons(),
      // First visit: offer the lessons (set once nothing saved is found)
      welcome: false,
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
      <!-- Tells screen-reader users what each action did and what the state
           is now ("H on qubit 0. Now: |0⟩ 50%, |1⟩ 50%."). Not shown on screen:
           sighted users see it in the views. -->
      <p class="visually-hidden" role="status" aria-live="polite" data-testid="announcer">{{ announcement }}</p>

      <template v-if="!embedded">
        <app-nav />

        <div class="card" :class="{ welcome }">
          <h1>{{ $t('lab.title', { count: n }) }}</h1>

          <!-- First visit: a choice between the lessons and free play -->
          <template v-if="welcome">
            <i18n-t k="lab.welcomeLead" tag="p" class="welcome-lead" />
            <p>{{ $t('lab.welcomeNew') }}</p>
            <div class="button-grid welcome-actions">
              <router-link to="/lessons/bit-flip" class="button-link" @click="dismissWelcome">{{ $t('lab.startLesson1') }}</router-link>
              <button class="secondary" @click="dismissWelcome">{{ $t('lab.explore') }}</button>
            </div>
          </template>

          <i18n-t v-else k="lab.intro" tag="p"
            :params="{ count: 1 << n, first: '|' + '0'.repeat(n) + '⟩', last: '|' + '1'.repeat(n) + '⟩' }" />
        </div>
      </template>

      <div v-if="importedFrom" class="card notice" role="status">
        {{ $t(circuit.length ? 'lab.importedWithCircuit' : 'lab.imported', { count: n }) }}
        <button class="link-button" @click="importedFrom = null">{{ $t('lab.dismiss') }}</button>
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
              :control="pair.control"
              :target="pair.target"
              @pair="pair = $event"
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

            <noise-panel
              v-if="show('noise')"
              :n="n"
              :disabled="running"
              :mixed="!!stateRho"
              :channel="noise.channel"
              :strength="noise.strength"
              @noise="applyNoise"
              @settings="setNoise"
            />

            <circuit-editor
              v-if="show('editor')"
              :n="n"
              :circuit="circuit"
              :running="running"
              :applied="stepIndex"
              :control="pair.control"
              :target="pair.target"
              @pair="pair = $event"
              :show-undo="!show('gates')"
              :noise="show('noise') ? noise : null"
              :noisy-run="noisyRun"
              @noisy-run="noisyRun = $event"
              :can-undo="historyLength > 0"
              @add="addStep"
              @remove="removeStep"
              @clear="clearCircuit"
              @run="runCircuit"
              @step="stepCircuit"
              @undo="undo"
            />

            <circuit-timeline
              v-if="show('editor') && frames.length > 1"
              :n="n"
              :frames="frames"
              :circuit="circuit"
              :at="stepIndex"
              :running="running"
              @go="goToFrame"
            />
          </div>
        </div>

        <div class="workbench-views">
          <div
            v-if="tabbed"
            class="view-tabs"
            role="tablist"
            :aria-label="$t('lab.viewsAria')"
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
            <amplitude-table :re="shown.re" :im="shown.im" :n="n" :measurement="measurement" :bits="bits" :mixed="!!stateRho"
              :global-phase-hidden="hideGlobalPhase" :reference="shown.reference"
              @toggle-global-phase="toggleGlobalPhase" />
          </section>
          <section v-if="show('probabilities')" v-bind="viewAttrs('probabilities')">
            <probability-chart :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="show('shots')" v-bind="viewAttrs('shots')">
            <shots-histogram :re="stateRe" :im="stateIm" :n="n" :preset="readoutPreset" />
          </section>
          <section v-if="show('bloch')" v-bind="viewAttrs('bloch')">
            <bloch-spheres :re="stateRe" :im="stateIm" :rho="stateRho" :n="n" :step="lastStep" :step-id="stepSerial" />
          </section>
          <section v-if="show('interference')" v-bind="viewAttrs('interference')">
            <interference-view :n="n" :step="lastStep" :hide-global-phase="hideGlobalPhase" :mixed="!!stateRho" />
          </section>
          <section v-if="show('density')" v-bind="viewAttrs('density')">
            <density-matrix :re="stateRe" :im="stateIm" :rho="stateRho" :n="n" />
          </section>
          <section v-if="show('unitary')" v-bind="viewAttrs('unitary')">
            <unitary-view :n="n" :step="lastStep" :circuit="circuit" />
          </section>
          <section v-if="n >= 2 && show('correlation')" v-bind="viewAttrs('correlation')">
            <correlation-graph :re="stateRe" :im="stateIm" :n="n" />
          </section>
          <section v-if="n >= 2 && show('pauli')" v-bind="viewAttrs('pauli')">
            <pauli-panel :re="stateRe" :im="stateIm" :rho="stateRho" :n="n" />
          </section>
          <section v-if="n >= 2 && show('entanglement')" v-bind="viewAttrs('entanglement')">
            <entanglement-panel :re="stateRe" :im="stateIm" :n="n" :mixed="!!stateRho" />
          </section>
          <section v-if="n === 3 && show('cube')" v-bind="viewAttrs('cube')">
            <cube-3d :re="shown.re" :im="shown.im" :mixed="!!stateRho" />
          </section>

          <!-- Free lab: the advanced views are one switch away -->
          <div v-if="!panels" class="card advanced-toggle">
            <p>
              <i18n-t k="lab.advancedViews" :params="{ list: advancedNames }" />
              <template v-if="!showAdvanced">{{ ' ' + $t('lab.advancedWhy') }}</template>
            </p>
            <button
              class="secondary"
              :aria-pressed="String(showAdvanced)"
              @click="toggleAdvanced"
            >{{ $t(showAdvanced ? 'lab.hideAdvanced' : 'lab.showAdvanced') }}</button>
          </div>
        </div>
      </div>
    </div>
  `,

  computed: {
    // The state as the views that show phase draw it: as it is, or with
    // its global phase removed. Probabilities, Bloch spheres, the density
    // matrix and entanglement don't depend on global phase, so they keep
    // the state as it is.
    shown() {
      if (!this.hideGlobalPhase) return { re: this.stateRe, im: this.stateIm, reference: -1 };
      return engine.withoutGlobalPhase(this.stateRe, this.stateIm);
    },

    // e.g. "Noise, the density matrix, the unitary matrix, correlations, … and the 3D view"
    advancedNames() {
      const keys = ['noise', 'density', 'unitary'];
      if (this.n >= 2) keys.push('correlation', 'pauli', 'entanglement');
      if (this.n === 3) keys.push('cube');
      return capitalize(formatList(keys.map(k => t(`advanced.${k}`))));
    },

    // The views this lab shows, in order, with their tab labels
    views() {
      return VIEWS
        .filter(key => this.show(key))
        .filter(key => !(['correlation', 'pauli', 'entanglement'].includes(key) && this.n < 2) && !(key === 'cube' && this.n !== 3))
        .map(key => ({ key, label: t(`view.${key}`, { count: this.n }) }));
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
          this.stateRho = saved.rho ? Object.freeze(saved.rho) : null;
          this.circuit = saved.circuit;
          if (saved.importedFrom) this.importedFrom = saved.importedFrom;
        }
        // Someone with a saved lab has been here before
        if (!this.embedded && !saved && !getPref('welcomed', false)) this.welcome = true;
        else if (saved) setPref('welcomed', true);
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
    // `record: false` keeps the last step as it was (for the noise a noisy
    // run adds after each step, so the views still show that step).
    async runOnWorker(message, { record = true } = {}) {
      const id = this.nextId++;
      // Frozen: Vue needn't watch inside it, and the arrays are never changed
      const before = Object.freeze({ message, re: this.stateRe, im: this.stateIm, rho: this.stateRho });
      const reply = await new Promise(resolve => {
        this.pending.set(id, resolve);
        this.worker.postMessage({
          ...message,
          id,
          qubitCount: this.n,
          re: this.stateRe,
          im: this.stateIm,
          rho: this.stateRho
        });
      });

      if (!reply) return;

      this.stateRe = reply.re;
      this.stateIm = reply.im;
      this.stateRho = reply.rho ? Object.freeze(reply.rho) : null;
      if (record) {
        this.lastStep = before;
        this.stepSerial++;
      }

      if (reply.measured) {
        // Measuring every qubit gives every bit
        this.measurement = reply.measured;
        const digits = reply.measured.replace(/[|⟩]/g, '');
        this.bits = Object.fromEntries([...digits].map((d, q) => [q, Number(d)]));
      } else if (reply.bit !== undefined) {
        this.measurement = { qubit: reply.qubit, bit: reply.bit };
        this.bits = { ...this.bits, [reply.qubit]: reply.bit };
      }

      await this.save();
    },

    show(panel) {
      if (this.panels) return this.panels.includes(panel);
      return this.showAdvanced || !ADVANCED.includes(panel);
    },

    /**
     * Sets the kind and strength of noise ({ channel, strength }),
     * remembered unless `remember` is false (lessons).
     */
    setNoise({ channel, strength }, { remember = true } = {}) {
      this.noise = { channel, strength };
      if (!remember) return;
      setPref('noise-channel', channel);
      setPref('noise-strength', strength);
    },

    /**
     * Sets the Shots view's readout errors ({ oneAsZero, zeroAsOne }, or
     * null to leave them to the learner). A fresh copy each time, so the
     * view applies it again on every Set up (lessons).
     */
    setReadoutPreset(rates) {
      this.readoutPreset = rates ? { ...rates } : null;
    },

    /** Turns noisy runs on or off (lessons). */
    setNoisyRun(on) {
      this.noisyRun = on;
    },

    // Whether Run and Step add noise after each step
    isNoisyRun() {
      return this.noisyRun && this.show('noise');
    },

    // The noise a noisy run adds after a step: the chosen noise on every
    // qubit. Call only from inside a queued task.
    async idleNoise() {
      for (let q = 0; q < this.n; q++) {
        await this.runOnWorker({ type: 'noise', channel: this.noise.channel, targetQubit: q, strength: this.noise.strength }, { record: false });
      }
    },

    toggleGlobalPhase() {
      this.hideGlobalPhase = !this.hideGlobalPhase;
      setPref('hide-global-phase', this.hideGlobalPhase);
      this.announcement = '';
      this.$nextTick(() => {
        this.announcement = t(this.hideGlobalPhase ? 'announce.globalPhaseHidden' : 'announce.globalPhaseShown');
      });
    },

    toggleAdvanced() {
      this.showAdvanced = !this.showAdvanced;
      setPref('advanced-views', this.showAdvanced);
    },

    dismissWelcome() {
      this.welcome = false;
      setPref('welcomed', true);
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
        await saveLab(this.n, this.stateRe, this.stateIm, this.circuit, this.stateRho);
      } catch (err) {
        console.warn('Could not save state:', err);
      }
    },

    resetState() {
      const { re, im } = engine.zeroState(this.n);
      this.stateRe = re;
      this.stateIm = im;
      this.stateRho = null;
      this.measurement = '-';
      this.bits = {};
      this.lastStep = null;
    },

    // ----- Undo -----

    /** Saves the current state, circuit and step position for Undo. */
    remember() {
      this.history.push({
        re: this.stateRe,          // state arrays are replaced, never changed in place
        im: this.stateIm,
        rho: this.stateRho,
        measurement: this.measurement,
        bits: { ...this.bits },
        lastStep: this.lastStep,
        circuit: this.circuit.map(step => ({ ...step })),
        stepIndex: this.stepIndex,
        frames: this.frames        // replaced, never changed in place
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
        this.stateRho = last.rho;
        this.measurement = last.measurement;
        this.bits = last.bits;
        this.lastStep = last.lastStep;
        this.circuit.splice(0, this.circuit.length, ...last.circuit);
        this.stepIndex = last.stepIndex;
        this.frames = last.frames;
        await this.save();
        this.announce(t('announce.undone'));
      });
    },

    // ----- Screen-reader announcements -----

    /** Announces what just happened, followed by the state it left. */
    announce(what) {
      const text = t('announce.now', { what, state: describeState(this.stateRe, this.stateIm, this.n) });
      // Clear first, so the same message twice in a row is read twice
      this.announcement = '';
      this.$nextTick(() => { this.announcement = text; });
    },

    // Announces a change to the circuit, which leaves the state as it is
    announceCircuit(what) {
      const count = this.circuit.length;
      this.announcement = '';
      this.$nextTick(() => {
        this.announcement = t('announce.circuit', { what, count });
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
    // `what` describes it for screen readers: text, or a function called
    // afterwards (for measurement results).
    act(task, what) {
      return this.enqueue(async () => {
        this.remember();
        this.stepIndex = null;
        this.frames = [];
        await task();
        this.announce(typeof what === 'function' ? what() : what);
      });
    },

    applyGate(gate, targetQubit) {
      return this.act(() => this.runOnWorker({ type: 'gate', gate, targetQubit }),
        t('announce.gate', { gate, qubit: targetQubit }));
    },

    applyCNOT(control, target) {
      return this.act(() => this.runOnWorker({ type: 'cnot', control, target }),
        t('announce.cnot', { control, target }));
    },

    applyCZ(control, target) {
      return this.act(() => this.runOnWorker({ type: 'cz', control, target }),
        t('announce.cz', { control, target }));
    },

    measure() {
      return this.act(() => this.runOnWorker({ type: 'measure' }),
        () => t('announce.measureAll', { result: measurementText(this.measurement) }));
    },

    measureQubit(qubit) {
      return this.act(() => this.runOnWorker({ type: 'measureQubit', targetQubit: qubit }),
        () => t('announce.measureQubit', { qubit, bit: this.bits[qubit] }));
    },

    /** Noise on one qubit, or on every qubit ('all'). Makes the state mixed. */
    applyNoise(channel, qubit, strength) {
      const qubits = qubit === 'all' ? [...Array(this.n).keys()] : [qubit];
      return this.act(async () => {
        for (const q of qubits) {
          await this.runOnWorker({ type: 'noise', channel, targetQubit: q, strength });
        }
      }, t(qubit === 'all' ? 'announce.noiseAll' : 'announce.noiseQubit', {
        channel: t(`noise.${channel}`), percent: formatPercent(strength, { digits: 0 }), qubit
      }));
    },

    reset() {
      return this.act(async () => {
        this.resetState();
        await this.save();
      }, t('announce.reset'));
    },

    // Presets start from |0…0⟩ so they always give the advertised state.
    createBellState() {
      return this.act(() => this.bellSteps(), t('announce.bell'));
    },

    createGHZState() {
      return this.act(() => this.ghzSteps(), t('announce.ghz'));
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
      this.frames = [];
      this.circuit.push(step);
      this.save();
      this.announceCircuit(t('announce.added', { step: stepLabel(step) }));
    },

    removeStep(index) {
      this.remember();
      this.stepIndex = null;
      this.frames = [];
      const [removed] = this.circuit.splice(index, 1);
      this.save();
      this.announceCircuit(t('announce.removed', { step: stepLabel(removed) }));
    },

    clearCircuit() {
      if (!this.circuit.length) return;
      this.remember();
      this.stepIndex = null;
      this.frames = [];
      this.circuit.splice(0);
      this.save();
      this.announceCircuit(t('announce.cleared'));
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
          let ideal = this.idealStart();
          this.frames = [this.snapshot(ideal)];
          const steps = [...this.circuit];
          const noisy = this.isNoisyRun();
          for (let i = 0; i < steps.length; i++) {
            if (i) await new Promise(r => setTimeout(r, STEP_DELAY_MS));
            await this.runOnWorker(stepToMessage(steps[i]));
            if (noisy) await this.idleNoise();
            ideal = this.nextIdeal(ideal, steps[i]);
            this.stepIndex = i + 1;
            this.frames = [...this.frames, this.snapshot(ideal)];
          }
        } finally {
          this.running = false;
        }
        await this.save();
        const f = this.frames.at(-1)?.fidelity;
        const noisy = f !== null && f !== undefined && f < 0.9995;
        this.announce(t(noisy ? 'announce.finishedNoisy' : 'announce.finished', {
          count: this.circuit.length, fidelity: noisy ? formatNumber(f, { digits: 2 }) : ''
        }));
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
          this.frames = [this.snapshot(this.idealStart())];
        }
        const step = this.circuit[this.stepIndex];
        const ideal = this.frames[this.stepIndex]?.ideal ?? null;
        await this.runOnWorker(stepToMessage(step));
        if (this.isNoisyRun()) await this.idleNoise();
        this.stepIndex++;
        // Stepping on from an earlier frame replaces the frames after it
        this.frames = [...this.frames.slice(0, this.stepIndex), this.snapshot(this.nextIdeal(ideal, step))];
        await this.save();
        this.announce(t('announce.step', { k: this.stepIndex, total: this.circuit.length, step: stepLabel(step) }));
      });
    },

    // ----- Timeline -----

    /**
     * The current state as a timeline frame. `ideal` is the state the same
     * steps give without noise ({ re, im }, or null once a measurement has
     * made it ambiguous); the frame keeps it and its fidelity with the
     * current state.
     */
    snapshot(ideal = null) {
      return Object.freeze({
        re: this.stateRe,
        im: this.stateIm,
        rho: this.stateRho,
        measurement: this.measurement,
        bits: { ...this.bits },
        lastStep: this.lastStep,
        ideal,
        fidelity: ideal ? engine.fidelity(ideal, this.stateRe, this.stateIm, this.stateRho) : null
      });
    },

    // The noiseless run starts from the current state, if it is pure
    idealStart() {
      return this.stateRho ? null : { re: this.stateRe, im: this.stateIm };
    },

    // The noiseless state after one more step: gates apply, noise is left
    // out, and a measurement ends the comparison (its result is random,
    // so there is no single noiseless state to compare with)
    nextIdeal(ideal, step) {
      if (!ideal || step.gate === 'M') return null;
      if (step.gate === 'N') return ideal;
      return circuitStepApply(step, this.n)(ideal.re, ideal.im);
    },

    /**
     * Puts the lab back in frame k of the last run. Moving one frame
     * forward replays that step's Bloch turn; other jumps don't.
     * Can be undone.
     */
    goToFrame(k) {
      return this.enqueue(async () => {
        const frame = this.frames[k];
        if (!frame || this.running) return;
        const oneForward = this.stepIndex !== null && k === this.stepIndex + 1;
        this.remember();
        this.stateRe = frame.re;
        this.stateIm = frame.im;
        this.stateRho = frame.rho;
        this.measurement = frame.measurement;
        this.bits = { ...frame.bits };
        this.lastStep = frame.lastStep;
        if (oneForward) this.stepSerial++;
        this.stepIndex = k;
        await this.save();
        this.announce(k === 0 ? t('announce.backToStart')
          : t('announce.step', { k, total: this.circuit.length, step: stepLabel(this.circuit[k - 1]) }));
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
        this.frames = [];
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
        if (delay) this.announce(t('announce.showMe'));
      });
    },

    // One lesson operation; call only from inside a queued task
    async runOp([kind, a, b, c]) {
      if (kind === 'reset') this.resetState();
      else if (kind === 'gate') await this.runOnWorker({ type: 'gate', gate: a, targetQubit: b });
      else if (kind === 'cnot') await this.runOnWorker({ type: 'cnot', control: a, target: b });
      else if (kind === 'cz') await this.runOnWorker({ type: 'cz', control: a, target: b });
      else if (kind === 'measure') await this.runOnWorker({ type: 'measure' });
      else if (kind === 'measureQubit') await this.runOnWorker({ type: 'measureQubit', targetQubit: a });
      else if (kind === 'noise') await this.runOnWorker({ type: 'noise', channel: a, targetQubit: b, strength: c });
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
      return { re: this.stateRe, im: this.stateIm, rho: this.stateRho, n: this.n, measured: this.measurement, bits: { ...this.bits } };
    }
  }
};
