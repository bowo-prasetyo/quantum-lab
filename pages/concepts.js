// Quantum Concepts (#/concepts): one reference for every lab size,
// merged from the three original simulators.

import { AppNav } from '../components/app-nav.js';

const SECTIONS = [
  {
    title: 'Qubits and states',
    items: [
      ['Qubit', 'The quantum version of a bit. A classical bit is 0 or 1; a qubit can be in a combination (superposition) of |0⟩ and |1⟩ until it is measured.'],
      ['Basis states', 'The classical outcomes a register can show: |0⟩ and |1⟩ for one qubit, |00⟩ to |11⟩ for two, |000⟩ to |111⟩ for three. Each added qubit doubles the number: n qubits have 2ⁿ basis states. In this lab, qubit 0 is the left digit.'],
      ['Amplitude', 'Every basis state has a complex number called its amplitude. Its squared size, |amplitude|², is the probability of measuring that state. The probabilities always add up to 100%.'],
      ['Superposition', 'A state with more than one non-zero amplitude, such as H|0⟩ = (|0⟩ + |1⟩)/√2. It is a definite state, not ignorance about a hidden value: its phases can still interfere.'],
      ['Phase', 'The angle of an amplitude in the complex plane. Phase doesn’t change probabilities on its own, but when amplitudes are combined (for example by an H gate) it decides whether they add up or cancel.'],
      ['Global phase', 'Multiplying every amplitude by the same unit complex number e^{iα} (turning every phase by the same angle) changes nothing any measurement can detect, so only differences in phase are physical. Hide global phase, under the Quantum State table, turns the state so its first non-zero amplitude is real and positive, which makes states that differ only by global phase look the same.'],
      ['Interference', 'Amplitudes from different paths adding up (constructive) or cancelling (destructive). H then H returns |0⟩ because the paths to |1⟩ cancel; H, Z, H gives |1⟩ because Z flips one sign.'],
      ['Measurement and collapse', 'Measuring picks one basis state at random, with the probabilities given by the amplitudes. The state then collapses to that result, so measuring again gives the same answer.'],
      ['Measuring one qubit', 'You can measure a single qubit (the M button). It gives 0 or 1, and only the amplitudes that disagree with the result are removed; the rest are rescaled. Other qubits keep their superposition, unless they were entangled with the measured one.']
    ]
  },
  {
    title: 'Gates',
    items: [
      ['Identity (I)', 'Leaves the qubit unchanged.'],
      ['Hadamard (H)', 'Turns |0⟩ into an equal superposition of |0⟩ and |1⟩ (and |1⟩ into one with a minus sign). Applying it twice undoes it.'],
      ['Pauli-X (X)', 'The quantum NOT: swaps |0⟩ and |1⟩.'],
      ['Pauli-Y (Y)', 'Swaps |0⟩ and |1⟩ and adds a phase: Y|0⟩ = i|1⟩.'],
      ['Pauli-Z (Z)', 'Flips the sign (phase 180°) of |1⟩; |0⟩ is unchanged.'],
      ['Phase (S)', 'Gives |1⟩ a 90° phase. S applied twice is Z.'],
      ['π/8 (T)', 'Gives |1⟩ a 45° phase. T applied twice is S. Important for universal quantum computing.'],
      ['CNOT', 'A two-qubit gate: flips the target qubit when the control qubit is 1. With H, it creates entanglement. In this lab any qubit can be the control or the target.'],
      ['Controlled-Z (CZ)', 'Flips the sign of the amplitudes where both qubits are 1. It treats both qubits the same, so it doesn’t matter which is the control. It equals H, CNOT, H on the target.'],
      ['Reversibility', 'Every gate can be undone; information is only lost when you measure.']
    ]
  },
  {
    title: 'Several qubits',
    items: [
      ['Entanglement', 'Qubits whose joint state can’t be split into a separate state for each one. Measuring one tells you about the others, and they must be described as one system.'],
      ['Bell pair', '(|00⟩ + |11⟩)/√2, made by H on qubit 0 then CNOT from qubit 0 to qubit 1. Each qubit alone is random, but the two always match.'],
      ['GHZ state', '(|000⟩ + |111⟩)/√2: all three qubits entangled, always agreeing. Made by H, then CNOT 0→1, then CNOT 1→2.'],
      ['Reduced state', 'The state of one qubit on its own, found by “tracing out” the others (a partial trace). The Bloch spheres show reduced states.'],
      ['Entanglement entropy', 'How entangled one qubit is with the rest: the von Neumann entropy of its reduced state, from 0 (not entangled) to 1 bit (maximally entangled, as in a Bell pair). For a whole register in a pure state, it is 0 exactly when the qubit can be split off.'],
      ['Mutual information', 'How much two qubits’ results tell about each other, in any basis: I = S(A) + S(B) − S(AB), from 0 to 2 bits. It counts classical and quantum links together, so it is a sign of correlation, not proof of entanglement between that pair.'],
      ['Mixed state', 'A state that can’t be written as a single ket, so its Bloch vector is shorter than 1. It can describe a random mix of states, or one part of an entangled system. In this lab the whole register is always in a pure state, so a qubit that looks mixed on its own is entangled with the others.'],
      ['Correlation is not entanglement', 'Bits that always agree can be entangled (a Bell pair) or simply classical (|00⟩). The correlation graph shows agreement; the Bloch spheres show entanglement.']
    ]
  },
  {
    title: 'Algorithms',
    items: [
      ['Oracle', 'A black box that computes a function f, usually by flipping a qubit or a phase when f(x) = 1. Quantum algorithms are often judged by how many times they need to call it.'],
      ['Phase kickback', 'When an oracle acts on a target qubit in the state (|0⟩ − |1⟩)/√2, the flip shows up as a sign on the input instead. This turns answers into phases that interference can read.'],
      ['Deutsch–Jozsa', 'Decides whether a function is constant or balanced with a single oracle call. Afterwards the input qubits read all zeros only if f is constant.'],
      ['Grover’s search', 'Finds a marked item among N in about √N rounds. Each round marks the item with a sign flip (oracle) and then reflects all amplitudes about their average (diffusion). For four items, one round is enough.'],
      ['Teleportation', 'Moves a qubit’s state to another qubit using a shared Bell pair, two measurements and two classical bits that choose the corrections. The original is destroyed in the process, so the state is never copied (the no-cloning theorem).'],
      ['Classical bits', 'The results of measurements. The lab shows them under the amplitude table. In teleportation, Bob needs Alice’s two bits to know which correction to apply.'],
      ['Deferred measurement', 'A measurement whose result controls a later gate can be replaced by a controlled gate, with the measurement moved to the end, and the outcome is the same.']
    ]
  },
  {
    title: 'The views in the lab',
    items: [
      ['Amplitude table', 'Each basis state’s amplitude, probability and phase. Zero rows are greyed out. Hide global phase, under it, shows phases relative to the first non-zero amplitude; the 3D view and the Interference view follow it.'],
      ['Probability chart', 'One bar per basis state: the chance of measuring it.'],
      ['Shots', 'Runs the current state many times (100 or 1000 shots), measuring every qubit each time, and counts the results, as a real quantum computer does. Each bar is a count; the line on it is the exact probability. The state in the lab doesn’t change.'],
      ['Interference view', 'How the last gate combined the amplitudes. Each new amplitude is a sum of paths from the old ones, drawn as arrows head to tail (colour shows phase). Arrows the same way add up (constructive), opposite ones cancel (destructive). It also gives the probability the outcome would have if the paths did not interfere.'],
      ['Bloch sphere', 'One per qubit. North pole |0⟩, south pole |1⟩, the equator is a 50/50 superposition, and the angle around is the phase. A vector of length 1 is a pure state; shorter means the qubit is entangled with the others.'],
      ['Density matrix', 'ρ = |ψ⟩⟨ψ|. The diagonal holds the probabilities; off-diagonal squares show coherence, the sign of a real superposition rather than a random mix. Square area shows size and colour shows phase.'],
      ['Correlation graph', 'For each pair of qubits, |⟨ZᵢZⱼ⟩|: 1.00 when their measured bits always agree (or always disagree), 0.00 when they agree and disagree equally often. It is not a measure of entanglement: |00⟩ shows 1.00 with nothing entangled, and a Bell pair with an extra H on one qubit is fully entangled yet shows 0.00.'],
      ['Entanglement view', 'Says which qubits are entangled with which. Entanglement entropy S, per qubit, runs from 0 (a state of its own) to 1 bit (maximally entangled). Mutual information I, per pair, runs from 0 (results unrelated in every basis) to 2 bits; it counts every kind of link, so it is 1 between any two qubits of a GHZ state.'],
      ['3D view', 'Three qubits only: the 8 basis states at the corners of a cube, sized by probability and coloured by phase.'],
      ['Circuit', 'A sequence of gates applied in order. Build one in the circuit editor and run it.']
    ]
  }
];

export const Concepts = {
  components: { AppNav },

  data() {
    return { sections: SECTIONS };
  },

  template: `
    <div class="container">
      <app-nav />

      <div class="card">
        <h1>Quantum Concepts</h1>
        <p>
          A reference for every idea used in the lab and the
          <router-link to="/lessons">lessons</router-link>.
          The same ideas apply to 1, 2 and 3 qubits.
        </p>
      </div>

      <div v-for="section in sections" :key="section.title" class="card">
        <h2>{{ section.title }}</h2>
        <dl class="concepts">
          <template v-for="[term, text] in section.items" :key="term">
            <dt>{{ term }}</dt>
            <dd>{{ text }}</dd>
          </template>
        </dl>
      </div>
    </div>
  `
};
