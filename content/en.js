// The words of the lessons, Quantum Concepts and Help, in English: the
// source language. Each language has a file like this (content/<code>.js,
// registered in locales/index.js); anything it leaves out is shown in English.
// The language-free parts of the lessons (operations, checks, panels, the
// index of the right answer) are in lessons.js.
//
// Text may hold **bold**, *emphasis* and [links](/route), and the names of
// buttons and views as placeholders such as {measureAll}: each is filled in
// from the interface's own message (see BUTTONS in content.js), so a lesson
// always names a button exactly as the button reads.
//
//   parts      the title of each part of the lesson path
//   lessons    by lesson id: title, goal, why, steps, question, options
//              (in the order of lessons.js: the answer is an index), result
//   concepts   title, intro, sections of [term, text] items
//   help       title, intro, sections of blocks: { p }, { ul: [...] } or { ol: [...] }

export default {
  parts: {
    '1': 'One qubit',
    '2': 'Two qubits',
    '3': 'Three qubits',
    '4': 'Quantum algorithms'
  },
  lessons: {
    'bit-flip': {
      title: 'Bit flip',
      goal: 'See how the X gate flips a qubit, like a classical NOT.',
      why: 'Quantum computers can still do ordinary logic. X is the quantum version of NOT.',
      steps: [
        'Press X on qubit 0.',
        'Press {measureAll}.'
      ],
      question: 'The qubit starts as |0⟩. After X, what will {measureAll} show?',
      options: [
        'Always |0⟩',
        'Always |1⟩',
        '|0⟩ or |1⟩, 50/50'
      ],
      result: 'X turns |0⟩ into |1⟩, so the measurement is always |1⟩. The Bloch vector moves from the north pole to the south pole.'
    },
    superposition: {
      title: 'Superposition',
      goal: 'Use the H gate to put a qubit into an equal superposition of |0⟩ and |1⟩.',
      why: 'Superposition is the starting point of almost every quantum algorithm.',
      steps: [
        'Press H on qubit 0.',
        'Look at the probabilities and the Bloch sphere.',
        'In the {shotsView} view, press {run100} a few times.'
      ],
      question: 'After H, what are the chances of measuring |0⟩ and |1⟩?',
      options: [
        '100% |0⟩',
        '100% |1⟩',
        '50% each'
      ],
      result: 'H gives both amplitudes the value 0.707, so each outcome has probability 0.707² = 50%. The Bloch vector now points along +x, on the equator. Each shot gives 0 or 1 at random, so 100 shots give roughly 50 of each, never exactly the same twice.'
    },
    collapse: {
      title: 'Measurement collapse',
      goal: 'See that measuring a qubit changes its state.',
      why: 'In quantum mechanics, observing is not passive. Measurement forces a definite answer.',
      steps: [
        'The qubit starts in superposition (50/50).',
        'Press {measureAll}.',
        'Press {measureAll} again.'
      ],
      question: 'After the first measurement, what will the second one show?',
      options: [
        'A new random result',
        'Always the same as the first',
        'Always |0⟩'
      ],
      result: 'The first measurement collapses the superposition to the result it gives. The state is now |0⟩ or |1⟩ for certain, so the second measurement always agrees with the first.'
    },
    reversibility: {
      title: 'Reversibility',
      goal: 'See that applying H twice undoes it.',
      why: 'Quantum gates are reversible. No information is lost until you measure.',
      steps: [
        'Press H on qubit 0.',
        'Press H on qubit 0 again.'
      ],
      question: 'After H twice, what will {measureAll} show?',
      options: [
        'Always |0⟩',
        'Always |1⟩',
        '|0⟩ or |1⟩, 50/50'
      ],
      result: 'The second H undoes the first, returning the qubit to |0⟩. So even though one H gives a 50/50 superposition, two H gates always give |0⟩.'
    },
    'hidden-phase': {
      title: 'Phase you can’t see',
      goal: 'See that the Z gate changes the phase without changing the probabilities.',
      why: 'Amplitudes have a phase as well as a size. Phase is invisible to a single measurement, but it matters later.',
      steps: [
        'Press H on qubit 0.',
        'Press Z on qubit 0.',
        'Compare the probabilities and the amplitude table.'
      ],
      question: 'Z is applied after H. What happens to the 50/50 probabilities?',
      options: [
        'They stay 50/50',
        'They become 100% |1⟩',
        'They become 100% |0⟩'
      ],
      result: 'Z flips the sign of the |1⟩ amplitude (phase 180°). Probabilities are squared sizes, so they stay 50/50, but the Bloch vector turns from +x to −x.'
    },
    interference: {
      title: 'Phase you can see: interference',
      goal: 'See phase become visible when amplitudes combine.',
      why: 'Interference is how quantum algorithms make wrong answers cancel out and right answers add up.',
      steps: [
        'Press H on qubit 0.',
        'Press Z on qubit 0.',
        'Press H on qubit 0.',
        'Look at the {interferenceView} view: it shows the two paths into each outcome of the last H.'
      ],
      question: 'H then H gives |0⟩. What does H, Z, H give?',
      options: [
        'Always |0⟩',
        'Always |1⟩',
        '50/50'
      ],
      result: 'The last H combines the two amplitudes. Without Z, the paths to |1⟩ cancel and you get |0⟩. Z flips one sign, so now the paths to |0⟩ cancel instead, and the result is always |1⟩. The invisible phase decided the outcome. The Interference view draws it: the two arrows into |0⟩ point opposite ways and cancel, the two into |1⟩ point the same way and add up.'
    },
    'complex-phase': {
      title: 'Complex phase: S, T and Y',
      goal: 'See that phases can be any angle, not just a sign flip.',
      why: 'Amplitudes are complex numbers. S (90°) and T (45°) set finer phases that algorithms rely on.',
      steps: [
        'Press H on qubit 0.',
        'Press S on qubit 0.',
        'Look at the phase column and the Bloch sphere.'
      ],
      question: 'After H, the Bloch vector points along +x. Where does it point after S?',
      options: [
        '+y',
        '−x',
        'The north pole'
      ],
      result: 'S gives |1⟩ a 90° phase (amplitude 0.707i), turning the Bloch vector a quarter turn around the z-axis, from +x to +y. The probabilities stay 50/50. Try T (45°) or Y as well.'
    },
    'bloch-sphere': {
      title: 'Reading the Bloch sphere',
      goal: 'Connect the Bloch sphere to the state: height is probability, angle around is phase.',
      why: 'The Bloch sphere shows a qubit’s whole state in one picture, and it is used throughout the rest of the path.',
      steps: [
        'Press H on qubit 0.',
        'Press T on qubit 0.',
        'Read the x, y and z values under the sphere.'
      ],
      question: 'T is a 45° phase. Starting from +x, where does the vector end up?',
      options: [
        '45° around the equator, between +x and +y',
        'At the south pole',
        'Still at +x'
      ],
      result: 'Phase gates turn the vector around the z-axis, so its height (z = 0, a 50/50 split) stays the same and it moves 45° around the equator: x = y = 0.71. North is |0⟩, south is |1⟩, the equator is 50/50, and the angle around is the phase.'
    },
    'two-qubits': {
      title: 'Two independent qubits',
      goal: 'See how two qubits give four basis states.',
      why: 'Each added qubit doubles the number of basis states. That fast growth is one reason quantum computers can do things classical ones find hard.',
      steps: [
        'Press H on qubit 0.',
        'Press H on qubit 1.'
      ],
      question: 'Both qubits get an H. What can {measureAll} show?',
      options: [
        '|00⟩ or |11⟩ only',
        'Any of |00⟩, |01⟩, |10⟩, |11⟩, 25% each',
        'Always |00⟩'
      ],
      result: 'Each qubit is 50/50 on its own and they are independent, so all four combinations are equally likely: 25% each. Both Bloch vectors stay on the surface.'
    },
    cnot: {
      title: 'Controlled NOT',
      goal: 'See how one qubit can control another.',
      why: 'Controlled gates let qubits interact. They are the building block for entanglement.',
      steps: [
        'Press X on qubit 0.',
        'Press CNOT (control Q0, target Q1).'
      ],
      question: 'Qubit 0 is |1⟩. What does CNOT give?',
      options: [
        '|10⟩',
        '|11⟩',
        '|01⟩'
      ],
      result: 'CNOT flips the target only when the control is 1. Qubit 0 is 1, so qubit 1 flips: |10⟩ becomes |11⟩. Try CNOT without the X: |00⟩ stays |00⟩.'
    },
    'bell-pair': {
      title: 'Bell pair',
      goal: 'Create entanglement with H and CNOT.',
      why: 'Entangled qubits behave as one system. This is the resource behind quantum teleportation and many algorithms.',
      steps: [
        'Press H on qubit 0.',
        'Press CNOT (control Q0, target Q1).',
        'Press {measureAll} and note the result. Then press {setUp}, repeat both steps, and repeat a few more times.'
      ],
      question: 'Which results can {measureAll} show?',
      options: [
        'Any of the four, 25% each',
        'Only |00⟩ or |11⟩, 50% each',
        'Only |01⟩ or |10⟩'
      ],
      result: 'The state is (|00⟩ + |11⟩)/√2. Each qubit on its own is random, but they always match: |01⟩ and |10⟩ never appear. The {bell} button builds this state in one step.'
    },
    'entangled-bloch': {
      title: 'Entanglement on the Bloch spheres',
      goal: 'See how entanglement shows on each qubit’s Bloch sphere.',
      why: 'The Bloch spheres are the lab’s indicator of entanglement.',
      steps: [
        'Press {bell}.',
        'Look at both Bloch spheres.'
      ],
      question: 'In a Bell pair, where do the Bloch vectors point?',
      options: [
        'Both along +x',
        'Both at the north pole',
        'Neither: they shrink to the centre'
      ],
      result: 'Each qubit on its own has no definite direction: it is in a mixed state (on its own, it behaves like a coin toss with no phase to speak of), so its vector has length 0. The whole two-qubit state is still perfectly defined. A vector shorter than 1 means that qubit is entangled with the others.'
    },
    'measure-one-qubit': {
      title: 'Measuring one qubit of a Bell pair',
      goal: 'Measure only one qubit of an entangled pair, and watch the other one respond.',
      why: 'Measuring part of a system is how quantum computers read results, and how protocols such as teleportation work.',
      steps: [
        'Set up has made a Bell pair: (|00⟩ + |11⟩)/√2. Both Bloch vectors are at the centre.',
        'Press M on qubit 0 to measure just that qubit.',
        'Look at both Bloch spheres, the probabilities and the classical bits.'
      ],
      question: 'You measure only qubit 0. What happens to qubit 1?',
      options: [
        'Nothing: it is still in a superposition',
        'It now has the same value as qubit 0',
        'It always becomes 0'
      ],
      result: 'Qubit 0 gives 0 or 1 at random, and the pair collapses to |00⟩ or |11⟩, so qubit 1 is now definitely the same value. Both Bloch vectors jump from the centre to the same pole. Measuring one qubit of a product state would leave the other untouched; here the entanglement links them. (No message can be sent this way: qubit 0’s result is random.)'
    },
    'correlation-vs-entanglement': {
      title: 'Correlation is not entanglement',
      goal: 'Learn what the correlation graph measures, and why it is not entanglement.',
      why: 'Matching results can come from entanglement or from plain classical agreement. Telling them apart is a key skill.',
      steps: [
        'After Set up, the state is |00⟩. Look at the correlation graph and the Bloch spheres.',
        'Then press {bell} and compare.',
        'Look at the Entanglement and {pauliView} views for both states too.'
      ],
      question: 'The state is |00⟩. What does the correlation graph show?',
      options: [
        '0.00: the bits agree as often as not',
        '1.00: the bits always agree',
        'Nothing: there is no entanglement'
      ],
      result: 'Both qubits are always 0, so their measured bits always agree: the graph shows 1.00. Yet nothing is entangled, and both Bloch vectors are full length. A Bell pair also shows 1.00, but its Bloch vectors shrink to the centre. It works the other way too: a Bell pair with an extra H on qubit 1 is still fully entangled, yet the graph shows 0.00. Use the Bloch spheres or the {entanglementView} view, not the correlation graph, to spot entanglement: the {entanglementView} view says “No entanglement” for |00⟩ and “maximally entangled” for both Bell pairs. The {pauliView} view shows why the correlation graph is not enough: it reads only the ZZ cell, while a Bell pair is correlated in every basis (XX = +1, YY = −1, ZZ = +1).'
    },
    ghz: {
      title: 'GHZ state',
      goal: 'Entangle all three qubits at once.',
      why: 'GHZ states show that entanglement can link more than two qubits. They are used in quantum error correction and sensing.',
      steps: [
        'Press H on qubit 0.',
        'Press CNOT with control Q0, target Q1.',
        'Press CNOT with control Q1, target Q2.'
      ],
      question: 'Which results can {measureAll} show?',
      options: [
        'Only |000⟩ or |111⟩',
        'All eight, equally',
        'Only |000⟩'
      ],
      result: 'The state is (|000⟩ + |111⟩)/√2: all three qubits always agree. All three Bloch vectors shrink to the centre, because each qubit is entangled with the other two. The {ghz} button builds this in one step. In the {pauliView} view, each pair shows only ZZ = +1, like plain classical agreement; the three-way link appears only in the three-qubit values, such as ⟨XXX⟩ = +1.'
    },
    'density-matrix': {
      title: 'Density matrix: probability vs coherence',
      goal: 'Read the density matrix: the diagonal holds probabilities, and off-diagonal squares show superposition.',
      why: 'The density matrix tells a true superposition apart from a random mix that would give the same probabilities.',
      steps: [
        'Press {ghz}.',
        'Look at the density matrix.',
        'Then press {measureAll} and look again.'
      ],
      question: 'For the GHZ state, how many squares does the density matrix show?',
      options: [
        '2, on the diagonal',
        '4, in the corners',
        'All 64'
      ],
      result: 'Two diagonal squares hold the probabilities of |000⟩ and |111⟩ (0.5 each). Two off-diagonal squares in the opposite corners link them: that is coherence, the sign of a real superposition. After {measureAll}, only one diagonal square is left.'
    },
    decoherence: {
      title: 'Decoherence: how noise ends a superposition',
      goal: 'See noise turn a GHZ superposition into a plain random mix, while the probabilities stay the same.',
      why: 'Real qubits are never perfectly isolated. Noise destroying coherence, called decoherence, is the main obstacle to building quantum computers.',
      steps: [
        'Set up has made the GHZ state (|000⟩ + |111⟩)/√2. Note the four squares of the density matrix: two on the diagonal, two in the corners.',
        'In the {noisePanel} panel, choose {dephasing} and set the strength to 100%.',
        'Press {noiseQ0}, then look at the density matrix and the probabilities again.'
      ],
      question: 'Full-strength dephasing hits qubit 0. What happens to the density matrix?',
      options: [
        'Nothing changes',
        'The two corner squares vanish; the diagonal stays',
        'Only |000⟩ is left'
      ],
      result: 'The corner squares, the coherence between |000⟩ and |111⟩, vanish; the diagonal stays at 0.5 each. The probabilities haven’t changed, but the state is no longer a superposition: it is a random mix, as if a coin had already decided between |000⟩ and |111⟩. The purity under the matrix drops from 1 to 0.5. Noise on just one qubit was enough to destroy the coherence of all three, which is why large entangled states are so fragile.'
    },
    'noise-and-depth': {
      title: 'Noise builds up with every step',
      goal: 'Run a circuit on simulated noisy hardware and watch its fidelity fall with every step, even steps that cancel out.',
      why: 'Every gate on real hardware takes time, and the qubits decohere meanwhile. That limits how long a useful circuit can be, and it is why quantum error correction matters.',
      steps: [
        'Set up has chosen {dephasing} at 3% in the {noisePanel} panel and ticked Noisy run in the circuit editor: after every step, each qubit gets a little noise.',
        'Build the GHZ circuit: H on Q0, CNOT Q0→Q1, CNOT Q1→Q2.',
        'Then add H on Q2 four times. Without noise, each pair of H gates cancels, so the circuit still makes the GHZ state.',
        'Press {run}, then read the fidelity curve in the {timelineView}.'
      ],
      question: 'The four extra H gates cancel out in pairs. With noise after every step, how does the final fidelity compare with the fidelity right after the three GHZ gates?',
      options: [
        'The same: the extra gates cancel',
        'Lower: every step adds noise',
        'Higher: the extra gates undo some noise'
      ],
      result: 'Fidelity falls at every step: about 0.92 after the three GHZ gates, and about 0.78 after the four extra ones, even though they cancel and the noiseless circuit makes the same GHZ state. The noise doesn’t cancel: it builds up with the number of steps. On real hardware this limits a circuit’s depth, and it is why quantum error correction, which spends extra qubits to catch errors, is needed for long computations.'
    },
    'noisy-readout': {
      title: 'Reading a qubit is noisy too',
      goal: 'See readout errors record results the state can never give, and correct for them after the fact.',
      why: 'On real hardware, even a perfect state can be read out wrongly. Correcting for readout errors (mitigation) is a standard step in every experiment.',
      steps: [
        'Set up has made the GHZ state (|000⟩ + |111⟩)/√2 and switched on readout errors in the {shotsView} view: each 1 is read as 0 5% of the time, and each 0 as 1 2% of the time.',
        'Press {run1000} and look for results other than |000⟩ and |111⟩.',
        'Tick {mitigate} and compare the purple bars with the lines.',
        'Press {run100} a few times with the correction on, and watch the estimates scatter.'
      ],
      question: 'The GHZ state can only give |000⟩ or |111⟩, but readout errors are on. What will 1000 shots record?',
      options: [
        'Only |000⟩ and |111⟩',
        'Mostly |000⟩ and |111⟩, plus a few results the state can never give',
        'All eight results about equally'
      ],
      result: 'Roughly one shot in ten records a result such as |001⟩ or |110⟩, which the GHZ state can never give: one of its bits was misread. The state itself never changed, as the table shows; only the recording did. Correcting for readout errors works the counts back through the known error rates, and the impossible results drop to about 0% while |000⟩ and |111⟩ return to about 50%. With only 100 shots the corrected estimates scatter, and can even dip below 0%, because undoing the errors also amplifies the random scatter in the counts.'
    },
    'reduced-states': {
      title: 'Reduced states and mixedness',
      goal: 'See that entanglement affects only the qubits involved.',
      why: 'In larger systems you need to know which qubits are entangled with which.',
      steps: [
        'Press {bell} (this entangles qubits 0 and 1).',
        'Press H on qubit 2.'
      ],
      question: 'Qubits 0 and 1 are a Bell pair and qubit 2 gets an H. Which Bloch vectors stay on the surface?',
      options: [
        'All three',
        'Only qubit 2',
        'None'
      ],
      result: 'Qubits 0 and 1 are entangled with each other, so their vectors shrink to the centre (mixed states). Qubit 2 is not entangled with anything: it is a pure superposition, so its vector stays on the surface at +x. The Entanglement view names it: qubits 0 and 1 are entangled with each other; qubit 2 is separate. Compare the GHZ state, where all three are entangled together.'
    },
    'phase-cube': {
      title: 'Phase on the 3D cube',
      goal: 'Watch a phase change on the 3D cube while the probabilities stay the same.',
      why: 'With more qubits, phase patterns across many basis states are what algorithms like the Quantum Fourier Transform work with.',
      steps: [
        'After Set up, all eight states are equally likely (12.5%).',
        'Press Z on qubit 0.',
        'Watch the cube’s colours and the phase column.'
      ],
      question: 'What does Z on qubit 0 change?',
      options: [
        'The probabilities',
        'The phase of the four states where qubit 0 is 1',
        'Nothing at all'
      ],
      result: 'Z flips the sign of every amplitude where qubit 0 is 1 (|100⟩ to |111⟩), so those four corners change colour (phase 180°). All probabilities stay 12.5%, so the bars and point sizes don’t move.'
    },
    'build-circuit': {
      title: 'Build your own circuit',
      goal: 'Use the circuit editor to build and run a sequence of gates.',
      why: 'Real quantum programs are circuits: fixed sequences of gates, run in order.',
      steps: [
        'In the circuit editor, add H from row Q0.',
        'Choose control Q0 and target Q1, and add CNOT.',
        'Keep control Q0, choose target Q2, and add CNOT.',
        'Press {run}.'
      ],
      question: 'This circuit uses CNOT q0→q2 instead of the GHZ lesson’s q1→q2. What state does it build?',
      options: [
        'The same GHZ state',
        'A Bell pair on qubits 0 and 1 only',
        'An equal mix of all eight states'
      ],
      result: 'Both circuits give (|000⟩ + |111⟩)/√2. Qubit 0 controls both CNOTs, so qubits 1 and 2 copy its value, and all three always agree. Different circuits can build the same state.'
    },
    'deutsch-jozsa': {
      title: 'Deutsch–Jozsa: one question instead of three',
      goal: 'Find out whether a hidden function is constant or balanced by calling it only once.',
      why: 'It extends Deutsch’s algorithm (1985), the first to beat every deterministic classical method on its problem. It runs on interference, the idea from Part 1.',
      steps: [
        'The puzzle: a hidden function f takes two bits (qubits 0 and 1) and returns one bit. It is either constant (the same answer for every input) or balanced (0 for half the inputs, 1 for the rest). Classically, you might need 3 calls to tell which. Here you need one.',
        'Set up has put qubits 0 and 1 in an equal superposition of all four inputs, and qubit 2 in the state (|0⟩ − |1⟩)/√2.',
        'Call the oracle once. This one computes f(x) = x₀ XOR x₁: press CNOT with control Q0, target Q2, then CNOT with control Q1, target Q2.',
        'Press H on qubit 0 and H on qubit 1. Then run 100 shots and look at qubits 0 and 1: the first two digits of each result.'
      ],
      question: 'This f is balanced. After one oracle call and the final H gates, what will qubits 0 and 1 show?',
      options: [
        'Always 00',
        'Never 00',
        'A random result each time'
      ],
      result: 'Qubits 0 and 1 always read 11, never 00. The oracle flipped the sign of the inputs where f(x) = 1. It did this through qubit 2: its special state turns the oracle’s bit flip into a sign on the input (phase kickback), and the final H gates turned that phase pattern into a definite answer. A constant f always gives 00; any balanced f never does. One call settles it. Try it with no CNOTs (f = 0, constant): you get 00.'
    },
    grover: {
      title: 'Grover’s search: finding the marked item',
      goal: 'Find which of four items is marked, using one round of Grover’s search.',
      why: 'Grover’s algorithm searches N items in about √N steps instead of N. It shows how to grow the probability of the right answer.',
      steps: [
        'Set up has put both qubits in an equal superposition: each of the four items |00⟩, |01⟩, |10⟩, |11⟩ is 25% likely.',
        'Oracle: mark |11⟩ by flipping its sign. Press CZ (control Q0, target Q1). Check the amplitude table: |11⟩ is now −0.5, but every probability is still 25%.',
        'Diffusion, part 1: press H on both qubits, then X on both qubits. (Steps 3 to 5 together reflect every amplitude about their average, which grows the marked one.)',
        'Diffusion, part 2: flip the sign of |11⟩ again: press CZ.',
        'Diffusion, part 3: X on both qubits, then H on both qubits.'
      ],
      question: 'Four items, one marked. After one round of Grover’s search, what is the chance of measuring the marked item |11⟩?',
      options: [
        '25%, the same as guessing',
        '50%',
        '100%'
      ],
      result: 'The oracle only changes the marked item’s phase, which you can’t see in the probabilities. Diffusion then reflects every amplitude about their average: the three unmarked amplitudes cancel to 0 and the marked one grows to size 1. (The table shows −1: this circuit builds the diffusion with an overall minus sign, a global phase that no measurement can detect. Tick {hideGlobalPhase} under the table and it reads 1.) For four items, one round finds the answer with certainty. The CZ gate flips the sign of |11⟩ only; it is the same as H, CNOT, H on the target.'
    },
    teleportation: {
      title: 'Quantum teleportation',
      goal: 'Move a qubit’s state from qubit 0 to qubit 2 using a shared Bell pair, two measurements and two classical bits.',
      why: 'Teleportation is how quantum networks move quantum information. It shows entanglement used as a resource, and why a quantum state can’t simply be copied.',
      steps: [
        'Set up has given qubit 0 (Alice’s message) a state: its Bloch vector points to x = 0, y = −0.71, z = 0.71, halfway between the north pole and −y.',
        'Share a Bell pair between Alice (qubit 1) and Bob (qubit 2): press H on qubit 1, then CNOT with control Q1, target Q2.',
        'Alice: press CNOT with control Q0, target Q1, then H on qubit 0.',
        'Alice measures: press M on qubit 0 and M on qubit 1. These two classical bits are what she “sends” to Bob.',
        'Bob’s corrections: if qubit 1 gave 1, press X on qubit 2. Then, if qubit 0 gave 1, press Z on qubit 2.',
        'Compare qubit 2’s Bloch sphere with where qubit 0 started.'
      ],
      question: 'Alice’s two measurements give random bits. After Bob’s corrections, where does qubit 2’s Bloch vector point?',
      options: [
        'Where qubit 0’s pointed at the start, whatever the bits were',
        'It depends on the bits Alice got',
        'At the centre, because it’s entangled'
      ],
      result: 'Whatever bits Alice got, Bob’s corrections leave qubit 2 in exactly the state qubit 0 started with. Qubit 0 was measured, so it no longer has the state: it moved, it wasn’t copied. Before the corrections, qubit 2 holds one of four scrambled versions of the message, and without Alice’s two bits Bob can’t tell which. So nothing travels faster than the classical bits. Try it several times: the bits change, the result doesn’t.'
    }
  },
  concepts: {
    title: 'Quantum Concepts',
    intro: 'A reference for every idea used in the lab and the [lessons](/lessons). The same ideas apply to 1, 2 and 3 qubits. Sections go from the basics to algorithms; each view in the lab is described at the end. For how to use the controls, see [{help}](/help).',
    sections: [
      {
        title: 'Qubits and states',
        items: [
          [
            'Qubit',
            'The quantum version of a bit. A classical bit is 0 or 1; a qubit can be in a combination (superposition) of |0⟩ and |1⟩ until it is measured.'
          ],
          [
            'Basis states',
            'The classical outcomes a register can show: |0⟩ and |1⟩ for one qubit, |00⟩ to |11⟩ for two, |000⟩ to |111⟩ for three. Each added qubit doubles the number: n qubits have 2ⁿ basis states. In this lab, qubit 0 is the left digit.'
          ],
          [
            'Amplitude',
            'Every basis state has a complex number called its amplitude. Its squared size, |amplitude|², is the probability of measuring that state. The probabilities always add up to 100%.'
          ],
          [
            'Superposition',
            'A state with more than one non-zero amplitude, such as H|0⟩ = (|0⟩ + |1⟩)/√2. It is a definite state, not ignorance about a hidden value: its phases can still interfere.'
          ],
          [
            'Phase',
            'The angle of an amplitude in the complex plane. Phase doesn’t change probabilities on its own, but when amplitudes are combined (for example by an H gate) it decides whether they add up or cancel.'
          ],
          [
            'Global phase',
            'Turning every amplitude’s phase by the same angle (multiplying them all by e^(iα)) changes nothing any measurement can detect, so only differences in phase are physical. {hideGlobalPhase}, under the {stateTable} table, turns the state so its first non-zero amplitude is real and positive, which makes states that differ only by global phase look the same.'
          ],
          [
            'Interference',
            'Amplitudes from different paths adding up (constructive) or cancelling (destructive). H then H returns |0⟩ because the paths to |1⟩ cancel; H, Z, H gives |1⟩ because Z flips one sign.'
          ],
          [
            'Measurement and collapse',
            'Measuring picks one basis state at random, with the probabilities given by the amplitudes. The state then collapses to that result, so measuring again gives the same answer.'
          ],
          [
            'Bloch sphere',
            'A picture of one qubit’s state as an arrow (the Bloch vector) in a ball. North pole is |0⟩, south pole is |1⟩, points on the equator are 50/50 superpositions, and the angle around the equator is the phase. The lab draws one per qubit; see The views in the lab, below.'
          ],
          [
            'Measuring one qubit',
            'You can measure a single qubit (the M button). It gives 0 or 1, and only the amplitudes that disagree with the result are removed; the rest are rescaled. Other qubits keep their superposition, unless they were entangled with the measured one.'
          ]
        ]
      },
      {
        title: 'Gates',
        items: [
          [
            'Identity (I)',
            'Leaves the qubit unchanged.'
          ],
          [
            'Hadamard (H)',
            'Turns |0⟩ into an equal superposition of |0⟩ and |1⟩ (and |1⟩ into one with a minus sign). Applying it twice undoes it.'
          ],
          [
            'Pauli-X (X)',
            'The quantum NOT: swaps |0⟩ and |1⟩.'
          ],
          [
            'Pauli-Y (Y)',
            'Swaps |0⟩ and |1⟩ and adds a phase: Y|0⟩ = i|1⟩.'
          ],
          [
            'Pauli-Z (Z)',
            'Flips the sign (phase 180°) of |1⟩; |0⟩ is unchanged.'
          ],
          [
            'Phase (S)',
            'Gives |1⟩ a 90° phase. S applied twice is Z.'
          ],
          [
            'π/8 (T)',
            'Gives |1⟩ a 45° phase. T applied twice is S. Together with H and CNOT, it is enough to build any quantum computation, to any accuracy you need.'
          ],
          [
            'CNOT',
            'A two-qubit gate: flips the target qubit when the control qubit is 1. With H, it creates entanglement. In this lab any qubit can be the control or the target.'
          ],
          [
            'Controlled-Z (CZ)',
            'Flips the sign of the amplitudes where both qubits are 1. It treats both qubits the same, so it doesn’t matter which is the control. It equals H, CNOT, H on the target.'
          ],
          [
            'Gates as turns',
            'Every single-qubit gate turns the Bloch sphere: X, Y and Z are half turns about their axes, H a half turn about the axis halfway between x and z, S a quarter turn and T an eighth of a turn about z. The Bloch spheres animate each gate as its turn.'
          ],
          [
            'Unitary matrix',
            'The matrix of a gate on the whole register: column j is what the gate does to basis state |j⟩. Its columns have length 1 and are at right angles to each other (U†U = I), which is why probabilities still add up to 1 and why the gate can be undone. A measurement or noise has no such matrix.'
          ],
          [
            'Reversibility',
            'Every gate can be undone; information is only lost when you measure.'
          ]
        ]
      },
      {
        title: 'Several qubits',
        items: [
          [
            'Entanglement',
            'Qubits whose joint state can’t be split into a separate state for each one. Measuring one tells you about the others, and they must be described as one system.'
          ],
          [
            'Bell pair',
            '(|00⟩ + |11⟩)/√2, made by H on qubit 0 then CNOT from qubit 0 to qubit 1. Each qubit alone is random, but the two always match.'
          ],
          [
            'GHZ state',
            '(|000⟩ + |111⟩)/√2: all three qubits entangled, always agreeing. Made by H, then CNOT 0→1, then CNOT 1→2.'
          ],
          [
            'Reduced state',
            'The state of one qubit on its own, found by “tracing out” the others (a partial trace). The Bloch spheres show reduced states.'
          ],
          [
            'Entanglement entropy',
            'How entangled one qubit is with the rest: the von Neumann entropy of its reduced state, from 0 (not entangled) to 1 bit (maximally entangled, as in a Bell pair). For a whole register in a pure state, it is 0 exactly when the qubit can be split off.'
          ],
          [
            'Mutual information',
            'How much two qubits’ results tell about each other, in any basis: I = S(A) + S(B) − S(AB), where S is the entropy of qubit A, of qubit B and of the pair together. It runs from 0 to 2 bits. It counts classical and quantum links together, so it is a sign of correlation, not proof of entanglement between that pair.'
          ],
          [
            'Correlation is not entanglement',
            'Bits that always agree can be entangled (a Bell pair) or simply classical (|00⟩). The correlation graph shows agreement; the Entanglement view and the Bloch spheres show entanglement.'
          ]
        ]
      },
      {
        title: 'Noise and real hardware',
        items: [
          [
            'Mixed state',
            'A state that can’t be written as a single list of amplitudes, so its Bloch vector is shorter than 1. It can describe a random mix of states, or one part of an entangled system. Without noise, this lab’s register is always in a pure state, so a qubit that looks mixed on its own is entangled with the others. After noise, the register itself is mixed, and a short Bloch vector can come from noise too.'
          ],
          [
            'Purity',
            'How far a state is from a random mix, shown under the density matrix as Tr ρ²: 1 for a pure state, less once noise has mixed it, down to 1/2ⁿ for a completely random one.'
          ],
          [
            'Noise and decoherence',
            'Real qubits are disturbed by their surroundings. Dephasing loses phase, amplitude damping loses energy (|1⟩ decays to |0⟩), and depolarizing noise makes random X, Y or Z errors. Each can be applied in the lab. Noise fades the off-diagonal (coherence) entries of the density matrix, turning a superposition into a random mix: decoherence. It is the main obstacle to building quantum computers.'
          ],
          [
            'Fidelity',
            'How close a state is to a target pure state |φ⟩: F = ⟨φ|ρ|φ⟩, from 1 (the same) down to 0. In a noisy run, the {timelineView} compares each step with the same circuit run without noise, so you can watch noise build up with the number of steps, even steps that cancel out.'
          ],
          [
            'Readout error',
            'Reading a qubit out can record the wrong bit even though the qubit landed on the right one: a classical error in the measurement, not in the quantum state. On real hardware a 1 is read as 0 more often (typically a few percent), because the qubit can decay while it is read.'
          ],
          [
            'Readout error mitigation',
            'Undoing readout errors after the fact. If you know how often each bit is misread, you can work backwards from the recorded counts to estimate the true probabilities (mathematically, by multiplying by the inverse of the table of error rates, called the confusion matrix). No quantum error correction is needed, but working backwards also amplifies random scatter, so with few shots an estimate can even dip below 0.'
          ]
        ]
      },
      {
        title: 'Algorithms',
        items: [
          [
            'Oracle',
            'A black box that computes a function f, usually by flipping a qubit or a phase when f(x) = 1. Quantum algorithms are often judged by how many times they need to call it.'
          ],
          [
            'Phase kickback',
            'When an oracle acts on a target qubit in the state (|0⟩ − |1⟩)/√2, the flip shows up as a sign on the input instead. This turns answers into phases that interference can read.'
          ],
          [
            'Deutsch–Jozsa',
            'Decides whether a function is constant or balanced with a single oracle call. Afterwards the input qubits read all zeros only if f is constant.'
          ],
          [
            'Grover’s search',
            'Finds a marked item among N in about √N rounds. Each round marks the item with a sign flip (oracle) and then reflects all amplitudes about their average (diffusion). For four items, one round is enough.'
          ],
          [
            'Teleportation',
            'Moves a qubit’s state to another qubit using a shared Bell pair, two measurements and two classical bits that choose the corrections. The original is destroyed in the process, so the state is never copied (the no-cloning theorem).'
          ],
          [
            'Classical bits',
            'The results of measurements. The lab shows them under the amplitude table. In teleportation, Bob needs Alice’s two bits to know which correction to apply.'
          ],
          [
            'Deferred measurement',
            'A measurement whose result controls a later gate can be replaced by a controlled gate, with the measurement moved to the end, and the outcome is the same.'
          ]
        ]
      },
      {
        title: 'The views in the lab',
        items: [
          [
            'Amplitude table',
            'Each basis state’s amplitude, probability and phase. Zero rows are greyed out. {hideGlobalPhase}, under it, shows phases relative to the first non-zero amplitude; the 3D view and the Interference view follow it.'
          ],
          [
            'Probability chart',
            'One bar per basis state: the chance of measuring it.'
          ],
          [
            'Shots',
            'Runs the current state many times (100 or 1000 shots), measuring every qubit each time, and counts the results, as a real quantum computer does. Each bar is a count; the line on it is the exact probability. The state in the lab doesn’t change. Tick {readout} to record some bits wrongly, as real hardware does, and {mitigate} to work the counts back to estimates of the true probabilities.'
          ],
          [
            'Interference view',
            'How the last gate combined the amplitudes. Each new amplitude is a sum of paths from the old ones, drawn as arrows head to tail (colour shows phase). Arrows the same way add up (constructive), opposite ones cancel (destructive). It also gives the probability the outcome would have if the paths did not interfere.'
          ],
          [
            'Bloch sphere',
            'One per qubit. North pole |0⟩, south pole |1⟩, the equator is a 50/50 superposition, and the angle around is the phase. A vector of length 1 is a pure state. A shorter one means the qubit is mixed: entangled with the others or, after noise, partly randomised.'
          ],
          [
            'Density matrix',
            'A grid that describes the whole state, pure or mixed (for a pure state, ρ = |ψ⟩⟨ψ|). The diagonal holds the probabilities; off-diagonal squares show coherence, the sign of a real superposition rather than a random mix. Square area shows size and colour shows phase. Its purity is shown under it.'
          ],
          [
            'Correlation graph',
            'For each pair of qubits, |⟨ZᵢZⱼ⟩|: 1.00 when their measured bits always agree (or always disagree), 0.00 when they agree and disagree equally often. It is not a measure of entanglement: |00⟩ shows 1.00 with nothing entangled, and a Bell pair with an extra H on one qubit is fully entangled yet shows 0.00.'
          ],
          [
            'Pauli expectations',
            'The average result ⟨P⟩, from −1 to +1, of measuring each Pauli string: ⟨X⟩, ⟨Y⟩, ⟨Z⟩ for each qubit (its Bloch vector), a 3 × 3 grid such as ⟨X₀X₁⟩ for each pair, and, for three qubits, strings such as ⟨XXX⟩. If a pair’s grid is not the product of its single values, the pair is correlated. A Bell pair is correlated in every basis (XX = +1, YY = −1, ZZ = +1); a GHZ state’s three-way link shows only in ⟨XXX⟩. Measuring all of them is how experiments read out a state (state tomography).'
          ],
          [
            'Entanglement view',
            'Says which qubits are entangled with which. Entanglement entropy S, per qubit, runs from 0 (a state of its own) to 1 bit (maximally entangled). Mutual information I, per pair, runs from 0 (results unrelated in every basis) to 2 bits; it counts every kind of link, so it is 1 between any two qubits of a GHZ state.'
          ],
          [
            '3D view',
            'Three qubits only: the 8 basis states at the corners of a cube, sized by probability and coloured by phase.'
          ],
          [
            'Circuit',
            'A sequence of gates applied in order. Build one in the circuit editor and run it.'
          ],
          [
            'Timeline',
            'After a circuit run or step, one frame per step, each drawn as its probabilities. Going to a frame puts every view back in that state.'
          ],
          [
            'Unitary Matrix view',
            'The matrix of the last gate, or of the whole circuit in the editor, on all qubits. Each cell shows an entry, coloured by phase as in the density matrix.'
          ]
        ]
      }
    ]
  },
  help: {
    title: 'Help',
    intro: 'How to use the lab. For the ideas behind it, see [{concepts}](/concepts); to learn step by step, follow the [lessons](/lessons).',
    sections: [
      {
        title: 'Quick start',
        blocks: [
          {
            ol: [
              'Open the [1-qubit lab](/lab/1). The qubit starts as |0⟩.',
              'Press **H** on Q0. The probabilities become 50/50 and the Bloch sphere’s arrow moves to the equator.',
              'Press **{measureAll}**. You get 0 or 1 at random, and the state collapses to it.',
              'Press **{undo}** to go back to before the measurement, or **{reset}** to start again from |0⟩.'
            ]
          },
          {
            p: 'Every view updates as soon as you press a gate. The sections below explain each control.'
          }
        ]
      },
      {
        title: 'Choosing a size',
        blocks: [
          {
            p: 'Use **{lab1}**, **{lab2}** or **{lab3}** at the top. Each size keeps its own state and circuit.'
          },
          {
            p: 'The lab starts with the {stateTable} table, the probabilities, shots, the Bloch spheres and interference. **{showAdvanced}**, below these views, adds the {noisePanel} panel, the density matrix, the unitary matrix, correlations, Pauli expectations, entanglement and the 3D view. They are already on if you have reached Part 3 of the lessons, and the lab remembers your choice. Lessons show whichever views they need.'
          },
          {
            p: 'In every label, qubit 0 is the left digit: |10⟩ means qubit 0 is 1 and qubit 1 is 0.'
          }
        ]
      },
      {
        title: 'Layout',
        blocks: [
          {
            ul: [
              'On a wide screen, the gates and the circuit editor stay on the left while you scroll the views on the right, so you see each gate’s effect as you press it. In a lesson, the steps and **{check}** are there too.',
              'On a narrow screen, such as a phone, the views are in tabs above the gates (State, Probabilities, Bloch spheres and so on). Tap a tab, or use the arrow keys, to switch view.',
              '**{theme}**, at the top, switches between light and dark colours. **{themeSystem}** follows your device’s setting.'
            ]
          }
        ]
      },
      {
        title: 'Gates and buttons',
        blocks: [
          {
            ul: [
              'Each qubit (Q0, Q1, Q2) has a row of gate buttons: I, H, X, Y, Z, S and T, and **M**, which measures just that qubit.',
              'Point at, focus or tap a gate to see what it does, in the line under the buttons.',
              '**CNOT** and **CZ** (2 or 3 qubits): choose the **control** and **target** qubits (the target can’t be the control), then press the button. For CZ, which qubit is the control doesn’t matter. The circuit editor shares the same choice.',
              '**{bell}** and **{ghz}** always start from |0…0⟩, so they give the same state every time.',
              '**{measureAll}** picks a result for every qubit at random and collapses the state to it. **{reset}** returns to |0…0⟩.',
              'Measurement results appear as **classical bits** under the amplitude table. {reset} clears them.',
              '**{undo}** (or Ctrl+Z, ⌘Z on a Mac) steps back through what you did: gates, measurements, {reset} and circuit edits. It can even undo a measurement, because the simulator remembers the state from before; a real quantum computer can’t.',
              'You can press buttons as fast as you like: each operation waits for the previous one.'
            ]
          }
        ]
      },
      {
        title: 'Circuit editor',
        blocks: [
          {
            ul: [
              'The gates are laid out like the {gatesPanel} panel: one row per qubit. **H** in row Q1 adds “H q1”; **M** in a row measures that qubit when the circuit runs.',
              '**CNOT** and **CZ** use the control and target chosen next to them, the same choice as in the {gatesPanel} panel.',
              'Add a gate by tapping or clicking it, dragging it into the circuit area (mouse, finger or pen), or focusing it and pressing Enter.',
              'Press **×** on a step to remove it (with the keyboard, Tab to it and press Enter). **{clear}** removes every step. {undo} brings them back.',
              '**{run}** applies every step in order, half a second apart, highlighting each one as it goes.',
              '**{step}** applies one step at a time, so you can watch each gate’s effect. Press it again for the next step; after the last step, it starts again.',
              'Run and {step} start from |0…0⟩, so a circuit gives the same result every time. Untick **{fromZero}** to apply the circuit to the current state instead.',
              'While a circuit runs, the gate buttons wait until it finishes.',
              'After a run or a step, the **{timelineView}** under the editor shows the state after each step. Pick a frame, drag the slider or use {back} and {forward} to put the lab back there; every view follows, and {step} carries on from that point. Measurements keep the results they gave. Editing the circuit, or pressing any other button, starts a new timeline.'
            ]
          }
        ]
      },
      {
        title: 'Lessons',
        blocks: [
          {
            ol: [
              '**Predict.** Pick the answer you expect before trying anything. It’s fine to guess: your first answer goes in your tally, which only you see.',
              '**Try it.** Follow the steps in the lab beside them. **{setUp}** puts the lab back to the lesson’s starting state; **{showMe}** runs the steps for you, slowly; **{check}** says whether the lab now shows the expected result, and what is missing if not.',
              '**What happened** appears once you have predicted, or once your result checks out, and explains it.'
            ]
          },
          {
            p: 'Each lesson shows only the views it needs. Use the links at the bottom to go to the previous or next lesson.'
          }
        ]
      },
      {
        title: 'Shots and readout errors',
        blocks: [
          {
            ul: [
              'The **{shotsView}** view runs the current state 100 or 1000 times, measuring every qubit each time, and counts the results, as a real quantum computer does. The line on each bar is the exact probability. The state in the lab doesn’t change.',
              'Tick **{readout}** and set how often a 1 is read as 0 and a 0 as 1. The counts are then what was recorded, misreads included, while the state stays as it is.',
              'Tick **{mitigate}** to add purple bars: estimates of the true probabilities, worked back from the counts. See [{concepts}](/concepts) for why they can scatter.'
            ]
          }
        ]
      },
      {
        title: 'Noise (advanced)',
        blocks: [
          {
            ul: [
              'Choose **{dephasing}** (loses phase), **{damping}** (loses energy, falling to |0⟩) or **{depolarizing}** (random errors), set the strength, then press **{noiseQ0}** (or another qubit) or **{noiseEvery}**.',
              'Noise makes the state **mixed**: a random mix that only a density matrix can describe. The density matrix (with its purity), Bloch spheres, probabilities, shots and Pauli expectations show it. The table shows probabilities but no amplitudes, and the Interference and Entanglement views pause, saying why.',
              'With advanced views on, the circuit editor has an **N** chip in each qubit’s row. It adds the noise chosen in the {noisePanel} panel (kind and strength, such as “Dephase 10% q1”) as a step, so noise can be part of a circuit and of its timeline. Each N step keeps the strength it was added with.',
              'Tick **Noisy run** in the circuit editor to run on simulated noisy hardware: Run and {step} add the chosen noise to every qubit after each step. The {timelineView} then shows each frame’s **fidelity** (how close it is, from 1 down to 0) to the same circuit run without noise, and a curve of it falling step by step. After a measurement, fidelity shows —, because there is no single noiseless state to compare with.',
              'Gates keep working on a mixed state. **{measureAll}** or **{reset}** makes it pure again, and {undo} steps back past noise like anything else.'
            ]
          }
        ]
      },
      {
        title: '3D view (3 qubits)',
        blocks: [
          {
            ul: [
              'Drag with the mouse or one finger to rotate the cube.',
              'Use the mouse wheel, or pinch with two fingers, to zoom.',
              'With the keyboard: the arrow keys rotate it, and + and − zoom.',
              'On a phone, start scrolling the page outside the 3D view.'
            ]
          }
        ]
      },
      {
        title: 'Reading the views without colour, and with a screen reader',
        blocks: [
          {
            ul: [
              'Point at, tap, or focus the **density matrix** and use the arrow keys: the square you are on is outlined and its exact size and phase appear under it.',
              'The **{shotsView}**, **{interferenceView}** and **{entanglementView}** views give every number they draw as text beside the drawing. The **{pauliView}** view is a set of tables: each cell prints its signed value, and the colour (blue positive, orange negative) only repeats it.',
              'Point at or tap a corner of the **3D view** to read its probability and phase. With the keyboard, focus it and use the arrow keys to rotate it, and + and − to zoom.',
              'With a screen reader, every action is followed by a short summary of what it did and the possible outcomes, such as “H on qubit 0. Now: |0⟩ 50%, |1⟩ 50%.” The charts have text descriptions, and the {stateTable} table holds every number.',
              'The only animation is a Bloch vector turning as a single-qubit gate is applied, for under half a second. With your device set to reduce motion, it jumps instead; the turn’s axis and path are drawn either way, and a caption says the turn in words. A circuit run or {showMe} changes the views in steps half a second apart, so you can follow along.',
              'The **{unitaryView}** and **{timelineView}** are tables and buttons: each matrix entry and each frame has its value as text.'
            ]
          }
        ]
      },
      {
        title: 'Saving and privacy',
        blocks: [
          {
            ul: [
              'Each lab size saves its state and circuit in this browser and restores them when you come back.',
              'Lessons use their own lab and don’t change your saved state.',
              'In each lesson, your **first prediction** is the one that counts in your tally. When you come back to a lesson it is shown, and **{practise}** lets you answer again without changing it.',
              'Your lesson predictions, your theme, whether you have seen the welcome, whether advanced views are on, and whether global phase is hidden are also stored only in this browser.',
              'Nothing is sent to a server: there are no accounts and no tracking.'
            ]
          }
        ]
      }
    ]
  }
};
