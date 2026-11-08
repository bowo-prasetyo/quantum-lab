// The lesson path: one guided route from 1 qubit to 3-qubit entanglement.
//
// Plain data, no Vue, so the app, the unit tests (tests/lessons.test.js)
// and the browser test (tests/browser/lessons.browser.test.js) all read
// the same lessons.
//
// Only what doesn't depend on language is here. The words of each lesson
// (title, goal, why it matters, steps, the prediction's question and
// options, and what happened) are in content/en.js and its translations,
// by lesson id; lessonText(id) in content.js gives them in the current
// language. A step and its operation must still say the same thing, and the
// options keep the same order in every language, as predict.answer is an
// index into them.
//
// Each lesson:
//   id, part, n               part 1–4; n = number of qubits in its lab
//   panels                    lab panels to show (see PANELS)
//   setup                     operations run by "Set up" (always starts with reset)
//   ops                       the steps as operations, run by "Show me"
//   predict                   { answer }: the index of the right option
//   checks                    machine-checkable expected result (see lesson-checks.js)
//   returnsToStart            optional: true if the steps end in the Set up state on purpose
//   noisyRun                  optional: { channel, strength }: the steps run as a noisy run,
//                             with that noise on every qubit after each step
//   readout                   optional: { oneAsZero, zeroAsOne }: Set up switches on readout
//                             errors in the Shots view at those rates
//
// Operations: ['reset'], ['gate', name, qubit], ['cnot', control, target],
//             ['cz', control, target], ['measure'] (all qubits),
//             ['measureQubit', qubit], ['bell'], ['ghz'],
//             ['noise', channel, qubit, strength]: noise (see NOISE_CHANNELS in engine.js),
//             ['if', qubit, operation]: only if that qubit's last measurement gave 1
// Basis labels use qubit 0 as the left digit: |10⟩ means qubit 0 is 1.

export const PANELS = ['gates', 'noise', 'table', 'probabilities', 'shots', 'bloch', 'interference', 'density', 'unitary', 'correlation', 'pauli', 'entanglement', 'cube', 'editor'];

// n: the number of qubits every lesson in the part uses (null if it varies).
// Each part's title is in content/en.js (partTitle in content.js).
export const PARTS = [
  { part: 1, n: 1 },
  { part: 2, n: 2 },
  { part: 3, n: 3 },
  { part: 4, n: null }
];

const BASIC = ['gates', 'table', 'probabilities', 'bloch'];
const r = Math.SQRT1_2;


export const LESSONS = [
  // ---------------- Part 1: one qubit ----------------
  {
    id: 'bit-flip',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'X', 0], ['measure']],
    predict: { answer: 1 },
    checks: [
      { type: 'probs', values: { '|1⟩': 1 } },
      { type: 'measured', label: '|1⟩' }
    ]
  },
  {
    id: 'superposition',
    part: 1,
    n: 1,
    panels: [...BASIC, 'shots'],
    setup: [['reset']],
    ops: [['gate', 'H', 0]],
    predict: { answer: 2 },
    checks: [
      { type: 'probs', values: { '|0⟩': 0.5, '|1⟩': 0.5 } },
      { type: 'bloch', qubit: 0, x: 1, y: 0, z: 0 }
    ]
  },
  {
    id: 'collapse',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset'], ['gate', 'H', 0]],
    ops: [['measure'], ['measure']],
    predict: { answer: 1 },
    checks: [
      { type: 'collapsed' },
      { type: 'measuredMatchesState' }
    ]
  },
  {
    id: 'reversibility',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'H', 0]],
    returnsToStart: true, // the point of the lesson: H twice gives back |0⟩
    predict: { answer: 0 },
    checks: [{ type: 'probs', values: { '|0⟩': 1 } }]
  },
  {
    id: 'hidden-phase',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'Z', 0]],
    predict: { answer: 0 },
    checks: [
      { type: 'probs', values: { '|0⟩': 0.5, '|1⟩': 0.5 } },
      { type: 'amplitude', state: '|1⟩', re: -r, im: 0 },
      { type: 'bloch', qubit: 0, x: -1, y: 0, z: 0 }
    ]
  },
  {
    id: 'interference',
    part: 1,
    n: 1,
    panels: [...BASIC, 'interference'],
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'Z', 0], ['gate', 'H', 0]],
    predict: { answer: 1 },
    checks: [{ type: 'probs', values: { '|1⟩': 1 } }]
  },
  {
    id: 'complex-phase',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'S', 0]],
    predict: { answer: 0 },
    checks: [
      { type: 'amplitude', state: '|1⟩', re: 0, im: r },
      { type: 'bloch', qubit: 0, x: 0, y: 1, z: 0 }
    ]
  },
  {
    id: 'bloch-sphere',
    part: 1,
    n: 1,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'T', 0]],
    predict: { answer: 0 },
    checks: [{ type: 'bloch', qubit: 0, x: r, y: r, z: 0 }]
  },

  // ---------------- Part 2: two qubits ----------------
  {
    id: 'two-qubits',
    part: 2,
    n: 2,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['gate', 'H', 1]],
    predict: { answer: 1 },
    checks: [{ type: 'probs', values: { '|00⟩': 0.25, '|01⟩': 0.25, '|10⟩': 0.25, '|11⟩': 0.25 } }]
  },
  {
    id: 'cnot',
    part: 2,
    n: 2,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'X', 0], ['cnot', 0, 1]],
    predict: { answer: 1 },
    checks: [{ type: 'probs', values: { '|11⟩': 1 } }]
  },
  {
    id: 'bell-pair',
    part: 2,
    n: 2,
    panels: BASIC,
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['cnot', 0, 1]],
    predict: { answer: 1 },
    checks: [{ type: 'probs', values: { '|00⟩': 0.5, '|11⟩': 0.5 } }]
  },
  {
    id: 'entangled-bloch',
    part: 2,
    n: 2,
    panels: BASIC,
    setup: [['reset']],
    ops: [['bell']],
    predict: { answer: 2 },
    checks: [
      { type: 'blochLength', qubit: 0, value: 0 },
      { type: 'blochLength', qubit: 1, value: 0 }
    ]
  },
  {
    id: 'measure-one-qubit',
    part: 2,
    n: 2,
    panels: BASIC,
    setup: [['reset'], ['bell']],
    ops: [['measureQubit', 0]],
    predict: { answer: 1 },
    checks: [
      { type: 'onlyStates', states: ['|00⟩', '|11⟩'] },
      { type: 'collapsed' },
      { type: 'blochLength', qubit: 1, value: 1 }
    ]
  },
  {
    id: 'correlation-vs-entanglement',
    part: 2,
    n: 2,
    panels: [...BASIC, 'correlation', 'pauli', 'entanglement'],
    setup: [['reset']],
    ops: [],
    predict: { answer: 1 },
    checks: [
      { type: 'zz', q1: 0, q2: 1, value: 1 },
      { type: 'blochLength', qubit: 0, value: 1 },
      { type: 'blochLength', qubit: 1, value: 1 }
    ]
  },

  // ---------------- Part 3: three qubits ----------------
  {
    id: 'ghz',
    part: 3,
    n: 3,
    panels: [...BASIC, 'correlation', 'pauli'],
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 1, 2]],
    predict: { answer: 0 },
    checks: [
      { type: 'probs', values: { '|000⟩': 0.5, '|111⟩': 0.5 } },
      { type: 'blochLength', qubit: 0, value: 0 },
      { type: 'blochLength', qubit: 1, value: 0 },
      { type: 'blochLength', qubit: 2, value: 0 }
    ]
  },
  {
    id: 'density-matrix',
    part: 3,
    n: 3,
    panels: ['gates', 'table', 'probabilities', 'density'],
    setup: [['reset']],
    ops: [['ghz']],
    predict: { answer: 1 },
    checks: [
      { type: 'density', i: 0, j: 0, abs: 0.5 },
      { type: 'density', i: 7, j: 7, abs: 0.5 },
      { type: 'density', i: 0, j: 7, abs: 0.5 },
      { type: 'density', i: 7, j: 0, abs: 0.5 },
      { type: 'density', i: 0, j: 1, abs: 0 }
    ]
  },
  {
    id: 'decoherence',
    part: 3,
    n: 3,
    panels: ['gates', 'table', 'probabilities', 'density', 'noise'],
    setup: [['reset'], ['ghz']],
    ops: [['noise', 'dephasing', 0, 1]],
    predict: { answer: 1 },
    checks: [
      { type: 'probs', values: { '|000⟩': 0.5, '|111⟩': 0.5 } },
      { type: 'density', i: 0, j: 0, abs: 0.5 },
      { type: 'density', i: 0, j: 7, abs: 0 },
      { type: 'purity', value: 0.5 }
    ]
  },
  {
    id: 'noise-and-depth',
    part: 3,
    n: 3,
    panels: ['table', 'probabilities', 'density', 'noise', 'editor'],
    setup: [['reset']],
    noisyRun: { channel: 'dephasing', strength: 0.03 },
    ops: [
      ['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 1, 2],
      ['gate', 'H', 2], ['gate', 'H', 2], ['gate', 'H', 2], ['gate', 'H', 2]
    ],
    predict: { answer: 1 },
    checks: [
      { type: 'fidelity', ideal: [['ghz']], min: 0.778, max: 0.789 }
    ]
  },
  {
    id: 'noisy-readout',
    part: 3,
    n: 3,
    panels: ['gates', 'table', 'probabilities', 'shots'],
    setup: [['reset'], ['ghz']],
    readout: { oneAsZero: 0.05, zeroAsOne: 0.02 },
    ops: [],
    predict: { answer: 1 },
    checks: [
      { type: 'probs', values: { '|000⟩': 0.5, '|111⟩': 0.5 } }
    ]
  },
  {
    id: 'reduced-states',
    part: 3,
    n: 3,
    panels: [...BASIC, 'entanglement'],
    setup: [['reset']],
    ops: [['bell'], ['gate', 'H', 2]],
    predict: { answer: 1 },
    checks: [
      { type: 'blochLength', qubit: 0, value: 0 },
      { type: 'blochLength', qubit: 1, value: 0 },
      { type: 'bloch', qubit: 2, x: 1, y: 0, z: 0 }
    ]
  },
  {
    id: 'phase-cube',
    part: 3,
    n: 3,
    panels: ['gates', 'table', 'probabilities', 'cube'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'H', 2]],
    ops: [['gate', 'Z', 0]],
    predict: { answer: 1 },
    checks: [
      { type: 'probs', values: { '|000⟩': 0.125, '|001⟩': 0.125, '|010⟩': 0.125, '|011⟩': 0.125, '|100⟩': 0.125, '|101⟩': 0.125, '|110⟩': 0.125, '|111⟩': 0.125 } },
      { type: 'amplitude', state: '|000⟩', re: r / 2, im: 0 },
      { type: 'amplitude', state: '|100⟩', re: -r / 2, im: 0 }
    ]
  },
  {
    id: 'build-circuit',
    part: 3,
    n: 3,
    panels: ['table', 'probabilities', 'bloch', 'editor'],
    setup: [['reset']],
    ops: [['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 0, 2]],
    predict: { answer: 0 },
    checks: [{ type: 'probs', values: { '|000⟩': 0.5, '|111⟩': 0.5 } }]
  },

  // ---------------- Part 4: quantum algorithms ----------------
  {
    id: 'deutsch-jozsa',
    part: 4,
    n: 3,
    panels: ['gates', 'table', 'probabilities', 'shots'],
    setup: [['reset'], ['gate', 'X', 2], ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'H', 2]],
    ops: [['cnot', 0, 2], ['cnot', 1, 2], ['gate', 'H', 0], ['gate', 'H', 1]],
    predict: { answer: 1 },
    checks: [{ type: 'probs', values: { '|110⟩': 0.5, '|111⟩': 0.5 } }]
  },
  {
    id: 'grover',
    part: 4,
    n: 2,
    panels: ['gates', 'table', 'probabilities', 'interference'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'H', 1]],
    ops: [
      ['cz', 0, 1],
      ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'X', 0], ['gate', 'X', 1],
      ['cz', 0, 1],
      ['gate', 'X', 0], ['gate', 'X', 1], ['gate', 'H', 0], ['gate', 'H', 1]
    ],
    predict: { answer: 2 },
    checks: [{ type: 'probs', values: { '|11⟩': 1 } }]
  },
  {
    id: 'teleportation',
    part: 4,
    n: 3,
    panels: ['gates', 'table', 'bloch'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'T', 0], ['gate', 'H', 0]],
    ops: [
      ['gate', 'H', 1], ['cnot', 1, 2],
      ['cnot', 0, 1], ['gate', 'H', 0],
      ['measureQubit', 0], ['measureQubit', 1],
      ['if', 1, ['gate', 'X', 2]], ['if', 0, ['gate', 'Z', 2]]
    ],
    predict: { answer: 0 },
    checks: [
      { type: 'bloch', qubit: 2, x: 0, y: -r, z: r },
      { type: 'blochLength', qubit: 0, value: 1 },
      { type: 'blochLength', qubit: 1, value: 1 }
    ]
  }
];

export function lessonById(id) {
  return LESSONS.find(lesson => lesson.id === id);
}
