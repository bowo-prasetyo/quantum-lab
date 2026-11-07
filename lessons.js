// The lesson path: one guided route from 1 qubit to 3-qubit entanglement.
//
// Plain data, no Vue, so the app, the unit tests (tests/lessons.test.js)
// and the browser test (tests/browser/lessons.browser.test.js) all read
// the same lessons.
//
// Each lesson:
//   id, part, title, n        part 1–4; n = number of qubits in its lab
//   goal, why                 what to learn and why it matters
//   panels                    lab panels to show (see PANELS)
//   setup                     operations run by "Set up" (always starts with reset)
//   steps                     instructions for the learner, in words
//   ops                       the same steps as operations, run by "Show me"
//   predict                   { question, options, answer (index) }
//   result                    what happens, shown after predicting or checking
//   checks                    machine-checkable expected result (see lesson-checks.js)
//   returnsToStart            optional: true if the steps end in the Set up state on purpose
//
// Operations: ['reset'], ['gate', name, qubit], ['cnot', control, target],
//             ['cz', control, target], ['measure'] (all qubits),
//             ['measureQubit', qubit], ['bell'], ['ghz'],
//             ['if', qubit, operation]: only if that qubit's last measurement gave 1
// Basis labels use qubit 0 as the left digit: |10⟩ means qubit 0 is 1.

export const PANELS = ['gates', 'table', 'probabilities', 'bloch', 'density', 'correlation', 'cube', 'editor'];

// n: the number of qubits every lesson in the part uses (null if it varies)
export const PARTS = [
  { part: 1, title: 'One qubit', n: 1 },
  { part: 2, title: 'Two qubits', n: 2 },
  { part: 3, title: 'Three qubits', n: 3 },
  { part: 4, title: 'Quantum algorithms', n: null }
];

const BASIC = ['gates', 'table', 'probabilities', 'bloch'];
const r = Math.SQRT1_2;


export const LESSONS = [
  // ---------------- Part 1: one qubit ----------------
  {
    id: 'bit-flip',
    part: 1,
    n: 1,
    title: 'Bit flip',
    goal: 'See how the X gate flips a qubit, like a classical NOT.',
    why: 'Quantum computers can still do ordinary logic. X is the quantum version of NOT.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press X on qubit 0.', 'Press Measure all.'],
    ops: [['gate', 'X', 0], ['measure']],
    predict: {
      question: 'The qubit starts as |0⟩. After X, what will Measure all show?',
      options: ['Always |0⟩', 'Always |1⟩', '|0⟩ or |1⟩, 50/50'],
      answer: 1
    },
    result: 'X turns |0⟩ into |1⟩, so the measurement is always |1⟩. The Bloch vector moves from the north pole to the south pole.',
    checks: [
      { type: 'probs', values: { '|1⟩': 1 } },
      { type: 'measured', label: '|1⟩' }
    ]
  },
  {
    id: 'superposition',
    part: 1,
    n: 1,
    title: 'Superposition',
    goal: 'Use the H gate to put a qubit into an equal superposition of |0⟩ and |1⟩.',
    why: 'Superposition is the starting point of almost every quantum algorithm.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Look at the probabilities and the Bloch sphere.'],
    ops: [['gate', 'H', 0]],
    predict: {
      question: 'After H, what are the chances of measuring |0⟩ and |1⟩?',
      options: ['100% |0⟩', '100% |1⟩', '50% each'],
      answer: 2
    },
    result: 'H gives both amplitudes the value 0.707, so each outcome has probability 0.707² = 50%. The Bloch vector now points along +x, on the equator.',
    checks: [
      { type: 'probs', values: { '|0⟩': 0.5, '|1⟩': 0.5 } },
      { type: 'bloch', qubit: 0, x: 1, y: 0, z: 0 }
    ]
  },
  {
    id: 'collapse',
    part: 1,
    n: 1,
    title: 'Measurement collapse',
    goal: 'See that measuring a qubit changes its state.',
    why: 'In quantum mechanics, observing is not passive. Measurement forces a definite answer.',
    panels: BASIC,
    setup: [['reset'], ['gate', 'H', 0]],
    steps: ['The qubit starts in superposition (50/50).', 'Press Measure all.', 'Press Measure all again.'],
    ops: [['measure'], ['measure']],
    predict: {
      question: 'After the first measurement, what will the second one show?',
      options: ['A new random result', 'Always the same as the first', 'Always |0⟩'],
      answer: 1
    },
    result: 'The first measurement collapses the superposition to the result it gives. The state is now |0⟩ or |1⟩ for certain, so the second measurement always agrees with the first.',
    checks: [
      { type: 'collapsed' },
      { type: 'measuredMatchesState' }
    ]
  },
  {
    id: 'reversibility',
    part: 1,
    n: 1,
    title: 'Reversibility',
    goal: 'See that applying H twice undoes it.',
    why: 'Quantum gates are reversible. No information is lost until you measure.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press H on qubit 0 again.'],
    ops: [['gate', 'H', 0], ['gate', 'H', 0]],
    returnsToStart: true, // the point of the lesson: H twice gives back |0⟩
    predict: {
      question: 'After H twice, what will Measure all show?',
      options: ['Always |0⟩', 'Always |1⟩', '|0⟩ or |1⟩, 50/50'],
      answer: 0
    },
    result: 'The second H undoes the first, returning the qubit to |0⟩. So even though one H gives a 50/50 superposition, two H gates always give |0⟩.',
    checks: [{ type: 'probs', values: { '|0⟩': 1 } }]
  },
  {
    id: 'hidden-phase',
    part: 1,
    n: 1,
    title: 'Phase you can’t see',
    goal: 'See that the Z gate changes the phase without changing the probabilities.',
    why: 'Amplitudes have a phase as well as a size. Phase is invisible to a single measurement, but it matters later.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press Z on qubit 0.', 'Compare the probabilities and the amplitude table.'],
    ops: [['gate', 'H', 0], ['gate', 'Z', 0]],
    predict: {
      question: 'Z is applied after H. What happens to the 50/50 probabilities?',
      options: ['They stay 50/50', 'They become 100% |1⟩', 'They become 100% |0⟩'],
      answer: 0
    },
    result: 'Z flips the sign of the |1⟩ amplitude (phase 180°). Probabilities are squared sizes, so they stay 50/50, but the Bloch vector turns from +x to −x.',
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
    title: 'Phase you can see: interference',
    goal: 'See phase become visible when amplitudes combine.',
    why: 'Interference is how quantum algorithms make wrong answers cancel out and right answers add up.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press Z on qubit 0.', 'Press H on qubit 0.'],
    ops: [['gate', 'H', 0], ['gate', 'Z', 0], ['gate', 'H', 0]],
    predict: {
      question: 'H then H gives |0⟩. What does H, Z, H give?',
      options: ['Always |0⟩', 'Always |1⟩', '50/50'],
      answer: 1
    },
    result: 'The last H combines the two amplitudes. Without Z, the paths to |1⟩ cancel and you get |0⟩. Z flips one sign, so now the paths to |0⟩ cancel instead, and the result is always |1⟩. The invisible phase decided the outcome.',
    checks: [{ type: 'probs', values: { '|1⟩': 1 } }]
  },
  {
    id: 'complex-phase',
    part: 1,
    n: 1,
    title: 'Complex phase: S, T and Y',
    goal: 'See that phases can be any angle, not just a sign flip.',
    why: 'Amplitudes are complex numbers. S (90°) and T (45°) set finer phases that algorithms rely on.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press S on qubit 0.', 'Look at the phase column and the Bloch sphere.'],
    ops: [['gate', 'H', 0], ['gate', 'S', 0]],
    predict: {
      question: 'After H, the Bloch vector points along +x. Where does it point after S?',
      options: ['+y', '−x', 'The north pole'],
      answer: 0
    },
    result: 'S gives |1⟩ a 90° phase (amplitude 0.707i), turning the Bloch vector a quarter turn around the z-axis, from +x to +y. The probabilities stay 50/50. Try T (45°) or Y as well.',
    checks: [
      { type: 'amplitude', state: '|1⟩', re: 0, im: r },
      { type: 'bloch', qubit: 0, x: 0, y: 1, z: 0 }
    ]
  },
  {
    id: 'bloch-sphere',
    part: 1,
    n: 1,
    title: 'Reading the Bloch sphere',
    goal: 'Connect the Bloch sphere to the state: height is probability, angle around is phase.',
    why: 'The Bloch sphere shows a qubit’s whole state in one picture, and it is used throughout the rest of the path.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press T on qubit 0.', 'Read the x, y and z values on the sphere.'],
    ops: [['gate', 'H', 0], ['gate', 'T', 0]],
    predict: {
      question: 'T is a 45° phase. Starting from +x, where does the vector end up?',
      options: ['45° around the equator, between +x and +y', 'At the south pole', 'Still at +x'],
      answer: 0
    },
    result: 'Phase gates turn the vector around the z-axis, so its height (z = 0, a 50/50 split) stays the same and it moves 45° around the equator: x = y = 0.71. North is |0⟩, south is |1⟩, the equator is 50/50, and the angle around is the phase.',
    checks: [{ type: 'bloch', qubit: 0, x: r, y: r, z: 0 }]
  },

  // ---------------- Part 2: two qubits ----------------
  {
    id: 'two-qubits',
    part: 2,
    n: 2,
    title: 'Two independent qubits',
    goal: 'See how two qubits give four basis states.',
    why: 'Each added qubit doubles the number of basis states. That growth is the source of quantum computing’s power.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press H on qubit 1.'],
    ops: [['gate', 'H', 0], ['gate', 'H', 1]],
    predict: {
      question: 'Both qubits get an H. What can Measure all show?',
      options: ['|00⟩ or |11⟩ only', 'Any of |00⟩, |01⟩, |10⟩, |11⟩, 25% each', 'Always |00⟩'],
      answer: 1
    },
    result: 'Each qubit is 50/50 on its own and they are independent, so all four combinations are equally likely: 25% each. Both Bloch vectors stay on the surface.',
    checks: [{ type: 'probs', values: { '|00⟩': 0.25, '|01⟩': 0.25, '|10⟩': 0.25, '|11⟩': 0.25 } }]
  },
  {
    id: 'cnot',
    part: 2,
    n: 2,
    title: 'Controlled NOT',
    goal: 'See how one qubit can control another.',
    why: 'Controlled gates let qubits interact. They are the building block for entanglement.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press X on qubit 0.', 'Press CNOT (control Q0, target Q1).'],
    ops: [['gate', 'X', 0], ['cnot', 0, 1]],
    predict: {
      question: 'Qubit 0 is |1⟩. What does CNOT give?',
      options: ['|10⟩', '|11⟩', '|01⟩'],
      answer: 1
    },
    result: 'CNOT flips the target only when the control is 1. Qubit 0 is 1, so qubit 1 flips: |10⟩ becomes |11⟩. Try CNOT without the X: |00⟩ stays |00⟩.',
    checks: [{ type: 'probs', values: { '|11⟩': 1 } }]
  },
  {
    id: 'bell-pair',
    part: 2,
    n: 2,
    title: 'Bell pair',
    goal: 'Create entanglement with H and CNOT.',
    why: 'Entangled qubits behave as one system. This is the resource behind quantum teleportation and many algorithms.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press CNOT (control Q0, target Q1).', 'Press Measure all a few times, setting up again in between.'],
    ops: [['gate', 'H', 0], ['cnot', 0, 1]],
    predict: {
      question: 'Which results can Measure all show?',
      options: ['Any of the four, 25% each', 'Only |00⟩ or |11⟩, 50% each', 'Only |01⟩ or |10⟩'],
      answer: 1
    },
    result: 'The state is (|00⟩ + |11⟩)/√2. Each qubit on its own is random, but they always match: |01⟩ and |10⟩ never appear. The Create Bell Pair button builds this state in one step.',
    checks: [{ type: 'probs', values: { '|00⟩': 0.5, '|11⟩': 0.5 } }]
  },
  {
    id: 'entangled-bloch',
    part: 2,
    n: 2,
    title: 'Entanglement on the Bloch spheres',
    goal: 'See how entanglement shows on each qubit’s Bloch sphere.',
    why: 'The Bloch spheres are the lab’s indicator of entanglement.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press Create Bell Pair.', 'Look at both Bloch spheres.'],
    ops: [['bell']],
    predict: {
      question: 'In a Bell pair, where do the Bloch vectors point?',
      options: ['Both along +x', 'Both at the north pole', 'Neither: they shrink to the centre'],
      answer: 2
    },
    result: 'Each qubit on its own has no definite direction: it is in a mixed state, so its vector has length 0. The whole two-qubit state is still perfectly defined. A vector shorter than 1 means that qubit is entangled with the others.',
    checks: [
      { type: 'blochLength', qubit: 0, value: 0 },
      { type: 'blochLength', qubit: 1, value: 0 }
    ]
  },
  {
    id: 'measure-one-qubit',
    part: 2,
    n: 2,
    title: 'Measuring one qubit of a Bell pair',
    goal: 'Measure only one qubit of an entangled pair, and watch the other one respond.',
    why: 'Measuring part of a system is how quantum computers read results, and how protocols such as teleportation work.',
    panels: BASIC,
    setup: [['reset'], ['bell']],
    steps: [
      'Set up has made a Bell pair: (|00⟩ + |11⟩)/√2. Both Bloch vectors are at the centre.',
      'Press M on qubit 0 to measure just that qubit.',
      'Look at both Bloch spheres, the probabilities and the classical bits.'
    ],
    ops: [['measureQubit', 0]],
    predict: {
      question: 'You measure only qubit 0. What happens to qubit 1?',
      options: ['Nothing: it is still in a superposition', 'It now has the same value as qubit 0', 'It always becomes 0'],
      answer: 1
    },
    result: 'Qubit 0 gives 0 or 1 at random, and the pair collapses to |00⟩ or |11⟩, so qubit 1 is now definitely the same value. Both Bloch vectors jump from the centre to the same pole. Measuring one qubit of a product state would leave the other untouched; here the entanglement links them. (No message can be sent this way: qubit 0’s result is random.)',
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
    title: 'Correlation is not entanglement',
    goal: 'Learn what the correlation graph measures, and why it is not entanglement.',
    why: 'Matching results can come from entanglement or from plain classical agreement. Telling them apart is a key skill.',
    panels: [...BASIC, 'correlation'],
    setup: [['reset']],
    steps: ['After Set up, the state is |00⟩. Look at the correlation graph and the Bloch spheres.', 'Then press Create Bell Pair and compare.'],
    ops: [],
    predict: {
      question: 'The state is |00⟩. What does the correlation graph show?',
      options: ['0.00: the qubits are unrelated', '1.00: the bits always agree', 'Nothing: there is no entanglement'],
      answer: 1
    },
    result: 'Both qubits are always 0, so their measured bits always agree: the graph shows 1.00. Yet nothing is entangled, and both Bloch vectors are full length. A Bell pair also shows 1.00, but its Bloch vectors shrink to the centre. Use the Bloch spheres, not the graph, to spot entanglement.',
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
    title: 'GHZ state',
    goal: 'Entangle all three qubits at once.',
    why: 'GHZ states show that entanglement can link more than two qubits. They are used in quantum error correction and sensing.',
    panels: [...BASIC, 'correlation'],
    setup: [['reset']],
    steps: ['Press H on qubit 0.', 'Press CNOT with control Q0, target Q1.', 'Press CNOT with control Q1, target Q2.'],
    ops: [['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 1, 2]],
    predict: {
      question: 'Which results can Measure all show?',
      options: ['Only |000⟩ or |111⟩', 'All eight, equally', 'Only |000⟩'],
      answer: 0
    },
    result: 'The state is (|000⟩ + |111⟩)/√2: all three qubits always agree. All three Bloch vectors shrink to the centre, because each qubit is entangled with the other two. The GHZ State button builds this in one step.',
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
    title: 'Density matrix: probability vs coherence',
    goal: 'Read the density matrix: the diagonal holds probabilities, and off-diagonal squares show superposition.',
    why: 'The density matrix tells a true superposition apart from a random mix that would give the same probabilities.',
    panels: ['gates', 'table', 'probabilities', 'density'],
    setup: [['reset']],
    steps: ['Press GHZ State.', 'Look at the density matrix.', 'Then press Measure all and look again.'],
    ops: [['ghz']],
    predict: {
      question: 'For the GHZ state, how many squares does the density matrix show?',
      options: ['2, on the diagonal', '4, in the corners', 'All 64'],
      answer: 1
    },
    result: 'Two diagonal squares hold the probabilities of |000⟩ and |111⟩ (0.5 each). Two off-diagonal squares in the opposite corners link them: that is coherence, the sign of a real superposition. After Measure all, only one diagonal square is left.',
    checks: [
      { type: 'density', i: 0, j: 0, abs: 0.5 },
      { type: 'density', i: 7, j: 7, abs: 0.5 },
      { type: 'density', i: 0, j: 7, abs: 0.5 },
      { type: 'density', i: 7, j: 0, abs: 0.5 },
      { type: 'density', i: 0, j: 1, abs: 0 }
    ]
  },
  {
    id: 'reduced-states',
    part: 3,
    n: 3,
    title: 'Reduced states and mixedness',
    goal: 'See that entanglement affects only the qubits involved.',
    why: 'In larger systems you need to know which qubits are entangled with which.',
    panels: BASIC,
    setup: [['reset']],
    steps: ['Press Create Bell Pair (this entangles qubits 0 and 1).', 'Press H on qubit 2.'],
    ops: [['bell'], ['gate', 'H', 2]],
    predict: {
      question: 'Qubits 0 and 1 are a Bell pair and qubit 2 gets an H. Which Bloch vectors stay on the surface?',
      options: ['All three', 'Only qubit 2', 'None'],
      answer: 1
    },
    result: 'Qubits 0 and 1 are entangled with each other, so their vectors shrink to the centre (mixed states). Qubit 2 is not entangled with anything: it is a pure superposition, so its vector stays on the surface at +x.',
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
    title: 'Phase on the 3D cube',
    goal: 'Watch a phase change on the 3D cube while the probabilities stay the same.',
    why: 'With more qubits, phase patterns across many basis states are what algorithms like the Quantum Fourier Transform work with.',
    panels: ['gates', 'table', 'probabilities', 'cube'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'H', 2]],
    steps: ['After Set up, all eight states are equally likely (12.5%).', 'Press Z on qubit 0.', 'Watch the cube’s colours and the phase column.'],
    ops: [['gate', 'Z', 0]],
    predict: {
      question: 'What does Z on qubit 0 change?',
      options: ['The probabilities', 'The phase of the four states where qubit 0 is 1', 'Nothing at all'],
      answer: 1
    },
    result: 'Z flips the sign of every amplitude where qubit 0 is 1 (|100⟩ to |111⟩), so those four corners change colour (phase 180°). All probabilities stay 12.5%, so the bars and point sizes don’t move.',
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
    title: 'Build your own circuit',
    goal: 'Use the circuit editor to build and run a sequence of gates.',
    why: 'Real quantum programs are circuits: fixed sequences of gates, run in order.',
    panels: ['table', 'probabilities', 'bloch', 'editor'],
    setup: [['reset']],
    steps: [
      'In the circuit editor, select Q0 and add H.',
      'Keep Q0 selected, choose CNOT target Q1, and add CNOT.',
      'Choose CNOT target Q2 and add CNOT.',
      'Press Run Circuit.'
    ],
    ops: [['gate', 'H', 0], ['cnot', 0, 1], ['cnot', 0, 2]],
    predict: {
      question: 'This circuit uses CNOT q0→q2 instead of the GHZ lesson’s q1→q2. What state does it build?',
      options: ['The same GHZ state', 'A Bell pair on qubits 0 and 1 only', 'An equal mix of all eight states'],
      answer: 0
    },
    result: 'Both circuits give (|000⟩ + |111⟩)/√2. Qubit 0 controls both CNOTs, so qubits 1 and 2 copy its value, and all three always agree. Different circuits can build the same state.',
    checks: [{ type: 'probs', values: { '|000⟩': 0.5, '|111⟩': 0.5 } }]
  },

  // ---------------- Part 4: quantum algorithms ----------------
  {
    id: 'deutsch-jozsa',
    part: 4,
    n: 3,
    title: 'Deutsch–Jozsa: one question instead of three',
    goal: 'Find out whether a hidden function is constant or balanced by calling it only once.',
    why: 'This is the first algorithm shown to beat any classical method on its problem. It runs on interference, the idea from Part 1.',
    panels: ['gates', 'table', 'probabilities'],
    setup: [['reset'], ['gate', 'X', 2], ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'H', 2]],
    steps: [
      'A hidden function f takes two bits (qubits 0 and 1) and returns one bit. It is either constant (the same answer for every input) or balanced (0 for half the inputs, 1 for the rest). Classically, you might need 3 calls to tell which.',
      'Set up has put qubits 0 and 1 in an equal superposition of all four inputs, and qubit 2 in the state (|0⟩ − |1⟩)/√2.',
      'Call the oracle once. This one computes f(x) = x₀ XOR x₁: press CNOT with control Q0, target Q2, then CNOT with control Q1, target Q2.',
      'Press H on qubit 0 and H on qubit 1, then look at qubits 0 and 1 (the first two digits).'
    ],
    ops: [['cnot', 0, 2], ['cnot', 1, 2], ['gate', 'H', 0], ['gate', 'H', 1]],
    predict: {
      question: 'This f is balanced. After one oracle call and the final H gates, what will qubits 0 and 1 show?',
      options: ['Always 00', 'Never 00', 'A random result each time'],
      answer: 1
    },
    result: 'Qubits 0 and 1 always read 11, never 00. The oracle flipped the sign of the inputs where f(x) = 1 (phase kickback through qubit 2), and the final H gates turned that phase pattern into a definite answer. A constant f always gives 00; any balanced f never does. One call settles it. Try it with no CNOTs (f = 0, constant): you get 00.',
    checks: [{ type: 'probs', values: { '|110⟩': 0.5, '|111⟩': 0.5 } }]
  },
  {
    id: 'grover',
    part: 4,
    n: 2,
    title: 'Grover’s search: finding the marked item',
    goal: 'Find which of four items is marked, using one round of Grover’s search.',
    why: 'Grover’s algorithm searches N items in about √N steps instead of N. It shows how to grow the probability of the right answer.',
    panels: ['gates', 'table', 'probabilities'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'H', 1]],
    steps: [
      'Set up has put both qubits in an equal superposition: each of the four items |00⟩, |01⟩, |10⟩, |11⟩ is 25% likely.',
      'Oracle: mark |11⟩ by flipping its sign. Press CZ (control Q0, target Q1). Check the amplitude table: |11⟩ is now −0.5, but every probability is still 25%.',
      'Diffusion (inversion about the mean): press H on both qubits, then X on both qubits.',
      'Flip the sign of |11⟩ again: press CZ.',
      'Finish the diffusion: X on both qubits, then H on both qubits.'
    ],
    ops: [
      ['cz', 0, 1],
      ['gate', 'H', 0], ['gate', 'H', 1], ['gate', 'X', 0], ['gate', 'X', 1],
      ['cz', 0, 1],
      ['gate', 'X', 0], ['gate', 'X', 1], ['gate', 'H', 0], ['gate', 'H', 1]
    ],
    predict: {
      question: 'Four items, one marked. After one round of Grover’s search, what is the chance of measuring the marked item |11⟩?',
      options: ['25%, the same as guessing', '50%', '100%'],
      answer: 2
    },
    result: 'The oracle only changes the marked item’s phase, which you can’t see in the probabilities. Diffusion then reflects every amplitude about their average: the three unmarked amplitudes cancel to 0 and the marked one grows to 1. For four items, one round finds the answer with certainty. The CZ gate flips the sign of |11⟩ only; it is the same as H, CNOT, H on the target.',
    checks: [{ type: 'probs', values: { '|11⟩': 1 } }]
  },
  {
    id: 'teleportation',
    part: 4,
    n: 3,
    title: 'Quantum teleportation',
    goal: 'Move a qubit’s state from qubit 0 to qubit 2 using a shared Bell pair, two measurements and two classical bits.',
    why: 'Teleportation is how quantum networks move quantum information. It shows entanglement used as a resource, and why a quantum state can’t simply be copied.',
    panels: ['gates', 'table', 'bloch'],
    setup: [['reset'], ['gate', 'H', 0], ['gate', 'T', 0], ['gate', 'H', 0]],
    steps: [
      'Set up has given qubit 0 (Alice’s message) a state: its Bloch vector points to (0, −0.71, 0.71).',
      'Share a Bell pair between Alice (qubit 1) and Bob (qubit 2): press H on qubit 1, then CNOT with control Q1, target Q2.',
      'Alice: press CNOT with control Q0, target Q1, then H on qubit 0.',
      'Alice measures: press M on qubit 0 and M on qubit 1. These two classical bits are what she “sends” to Bob.',
      'Bob’s corrections: if qubit 1 gave 1, press X on qubit 2. Then, if qubit 0 gave 1, press Z on qubit 2.',
      'Compare qubit 2’s Bloch sphere with where qubit 0 started.'
    ],
    ops: [
      ['gate', 'H', 1], ['cnot', 1, 2],
      ['cnot', 0, 1], ['gate', 'H', 0],
      ['measureQubit', 0], ['measureQubit', 1],
      ['if', 1, ['gate', 'X', 2]], ['if', 0, ['gate', 'Z', 2]]
    ],
    predict: {
      question: 'Alice’s two measurements give random bits. After Bob’s corrections, where does qubit 2’s Bloch vector point?',
      options: ['Where qubit 0’s pointed at the start, whatever the bits were', 'It depends on the bits Alice got', 'At the centre, because it’s entangled'],
      answer: 0
    },
    result: 'Whatever bits Alice got, Bob’s corrections leave qubit 2 in exactly the state qubit 0 started with. Qubit 0 was measured, so it no longer has the state: it moved, it wasn’t copied. Before the corrections, qubit 2 holds one of four scrambled versions of the message, and without Alice’s two bits Bob can’t tell which. So nothing travels faster than the classical bits. Try it several times: the bits change, the result doesn’t.',
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
