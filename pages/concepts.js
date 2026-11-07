// Quantum Concepts page. Content moved unchanged from the 3-qubit simulator;
// Phase 3 of the merge plan merges the concepts of all three simulators.

import { AppNav } from '../components/app-nav.js';

export const Concepts = {
  components: { AppNav },
  template: `
    <div class="container">
      <app-nav />

      <div class="card notice">
        These concepts are written for the <router-link to="/lab/3">3-qubit lab</router-link>,
        but most apply to every size.
      </div>

      <div class="card">
        
        <h2>Quantum Concepts</h2>
      
        <p>
          <strong>Quantum State</strong><br>
          The current mathematical state of the 3-qubit quantum system.
          Unlike a classical system that stores only one value,
          a quantum state can contain all eight basis states simultaneously:
          |000⟩, |001⟩, |010⟩, |011⟩, |100⟩, |101⟩, |110⟩ and |111⟩.
        </p>
      
        <p>
          <strong>Qubits</strong><br>
          A qubit is the quantum equivalent of a classical bit.
          While a classical bit can only be 0 or 1,
          a qubit may exist in a combination of both states until measured.
        </p>
      
        <p>
          <strong>Superposition</strong><br>
          A quantum system can occupy multiple basis states simultaneously.
          The amplitudes determine the probability of observing each state.
          Measurement collapses the superposition into one classical result.
        </p>
      
        <p>
          <strong>Quantum Amplitudes</strong><br>
          Each basis state has a complex-valued amplitude.
          Probabilities are calculated from the squared magnitude of these amplitudes.
          The total probability across all basis states always equals 100%.
        </p>
      
        <p>
          <strong>Entanglement</strong><br>
          Multiple qubits can become correlated in ways that classical systems cannot reproduce.
          Entangled qubits must be described as one combined quantum system rather than independent particles.
        </p>
      
        <p>
          <strong>Bell State</strong><br>
          A Bell state is a two-qubit entangled state.
          The simulator can generate:
          (|00⟩ + |11⟩) / √2
          using a Hadamard gate followed by a CNOT gate.
        </p>
      
        <p>
          <strong>GHZ State</strong><br>
          A Greenberger–Horne–Zeilinger (GHZ) state is a three-qubit entangled state.
          The simulator can generate:
          (|000⟩ + |111⟩) / √2
          using one Hadamard gate and two CNOT gates.
          In a GHZ state, all three qubits become strongly correlated.
        </p>
      
        <p>
          <strong>Identity Gate (I)</strong><br>
          Leaves the selected qubit unchanged.
          The quantum state remains exactly the same.
        </p>
      
        <p>
          <strong>Hadamard Gate (H)</strong><br>
          Creates superposition.
          It turns a definite state such as |0⟩ into an equal superposition of |0⟩ and |1⟩.
        </p>
      
        <p>
          <strong>Pauli-X Gate (X)</strong><br>
          Similar to a classical NOT gate.
          It flips |0⟩ into |1⟩ and |1⟩ into |0⟩.
        </p>
      
        <p>
          <strong>Pauli-Y Gate (Y)</strong><br>
          Flips the qubit while introducing a complex phase.
          It combines bit-flip and phase effects.
        </p>
      
        <p>
          <strong>Pauli-Z Gate (Z)</strong><br>
          Changes the quantum phase without directly changing measurement probabilities.
          This phase can affect future interference patterns.
        </p>
      
        <p>
          <strong>Phase Gate (S)</strong><br>
          Applies a 90-degree phase rotation.
          It is commonly used for phase manipulation and interference effects.
        </p>
      
        <p>
          <strong>π/8 Gate (T)</strong><br>
          Applies a 45-degree phase rotation.
          The T gate is an important component of universal quantum computation.
        </p>
      
        <p>
          <strong>CNOT Gate</strong><br>
          A controlled-NOT operation involving two qubits.
          The target qubit flips only when the control qubit is in state |1⟩.
          CNOT is one of the primary tools for creating entanglement.
        </p>
      
        <p>
          <strong>Density Matrix</strong><br>
          The density matrix provides a complete description of the quantum system.
          It contains both probability information and phase relationships between basis states.
          Pure states and mixed states can both be represented using density matrices.
        </p>
      
        <p>
          <strong>Reduced Density Matrix</strong><br>
          Each Bloch sphere is computed from a reduced density matrix obtained by tracing out the other qubits.
          This shows the local state of an individual qubit even when it is entangled with the rest of the system.
        </p>
      
        <p>
          <strong>Bloch Sphere</strong><br>
          The Bloch sphere is a geometric representation of a single qubit.
          The vector inside the sphere indicates the qubit's quantum state.
          Pure states lie on the surface, while entangled or mixed states move toward the center.
        </p>
      
        <p>
          <strong>Probability Visualization</strong><br>
          The probability chart displays the measurement probability of all eight basis states.
          Taller bars indicate a higher chance of observing that state during measurement.
        </p>

        <p>
          <strong>Correlation Graph</strong><br>
          For each pair of qubits, the graph shows how reliably their measured bits
          agree or disagree: 1.00 means always equal or always opposite, and 0.00
          means one bit tells you nothing about the other.
          It is not a measure of entanglement. After Reset, |000⟩ shows 1.00 on
          every edge although nothing is entangled. Use the Bloch spheres to see
          entanglement.
        </p>

        <p>
          <strong>WebGL Visualization</strong><br>
          The WebGL view draws the eight basis states as points on a 3D cube,
          using the browser's WebGL graphics interface.
          Point size shows probability and colour shows phase.
        </p>
      
        <p>
          <strong>Measurement</strong><br>
          Measuring the quantum system collapses the superposition into one of the eight basis states.
          The outcome appears according to the probability distribution of the current quantum state.
        </p>
      
        <p>
          <strong>Measurement Result</strong><br>
          The latest observed classical state is displayed here, such as:
          |000⟩, |001⟩, |010⟩, |011⟩, |100⟩, |101⟩, |110⟩ or |111⟩.
        </p>

        <p>
          <strong>Quantum Circuit</strong><br>
          A quantum circuit is a sequence of quantum operations applied to qubits.
          Complex quantum algorithms are built by combining many gates into circuits.
          The Circuit Editor allows gates to be arranged and executed automatically.
        </p>
        
        <p>
          <strong>Circuit Step</strong><br>
          Each step in the circuit represents one quantum operation.
          Operations are executed in order from left to right.
          Tapping or clicking a circuit step removes it from the circuit.
        </p>
        
        <p>
          <strong>Quantum Correlation</strong><br>
          Quantum correlation describes how measurement outcomes of different qubits
          are related. Entangled qubits often exhibit stronger correlations than
          independent qubits.
        </p>
        
        <p>
          <strong>Correlation Strength</strong><br>
          Each edge shows |⟨ZᵢZⱼ⟩|, the agreement between two qubits' measured bits
          in the 0/1 basis, worked out from the eight basis-state probabilities.
          It ranges from 0.00 (unrelated) to 1.00 (always equal or always opposite).
        </p>
        
        <p>
          <strong>Reduced State</strong><br>
          An individual qubit inside a multi-qubit system is described by a reduced
          quantum state. This state is obtained by mathematically ignoring the
          remaining qubits through an operation called a partial trace.
        </p>
        
        <p>
          <strong>Mixed State</strong><br>
          A mixed state represents uncertainty about a quantum system.
          Even when the overall system is perfectly known, an individual qubit can
          appear mixed if it is entangled with other qubits.
        </p>
        
        <p>
          <strong>Quantum Phase</strong><br>
          Quantum amplitudes contain both magnitude and phase.
          Two states with identical probabilities may still behave differently
          because of phase relationships that affect interference.
        </p>
        
        <p>
          <strong>Phase Visualization</strong><br>
          In the WebGL visualization, colors represent quantum phase.
          Different colors correspond to different phase angles of the complex
          amplitudes associated with each basis state.
        </p>
        
        <p>
          <strong>Basis State Cube</strong><br>
          The WebGL visualization places the eight basis states at the corners
          of a three-dimensional cube. Each corner corresponds to one classical
          binary state from |000⟩ to |111⟩.
        </p>
        
        <p>
          <strong>Amplitude Marker Size</strong><br>
          In the WebGL view, larger points indicate higher probability amplitudes.
          States with greater probability appear larger than states with very small
          amplitudes.
        </p>
        
        <p>
          <strong>3D Camera Controls</strong><br>
          The WebGL visualization supports interactive camera movement.
          Drag with the mouse or one finger to rotate the view. Use the mouse
          wheel, or pinch with two fingers, to zoom in and out.
          This lets you examine the quantum state from different angles.
        </p>
        
        <p>
          <strong>Web Worker</strong><br>
          Gate operations and measurements are performed inside a background
          worker thread, which keeps the user interface responsive. The displays,
          such as the density matrix and Bloch spheres, are computed on the page
          from the state the worker returns.
        </p>
        
        <p>
          <strong>State Persistence</strong><br>
          The simulator automatically saves the current quantum state and circuit.
          When the page is reopened, the previous session can be restored without
          rebuilding the circuit manually.
        </p>
        
        <p>
          <strong>Hilbert Space</strong><br>
          The Hilbert space is the mathematical space that contains all possible
          quantum states. A system of three qubits has 2³ = 8 basis states and
          therefore occupies an eight-dimensional Hilbert space.
        </p>
        
        <p>
          <strong>Complex Numbers</strong><br>
          Quantum amplitudes are complex numbers consisting of real and imaginary
          components. These values determine both measurement probabilities and
          phase relationships within the quantum system.
        </p>
        
        <p>
          <strong>Wavefunction Collapse</strong><br>
          Before measurement, the quantum state may exist as a superposition of
          multiple basis states. Measurement collapses the wavefunction into one
          observed classical outcome.
        </p>

      </div>
    </div>
  `
};
