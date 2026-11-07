// User Manual page. Content moved unchanged from the 3-qubit simulator;
// Phase 3 of the merge plan replaces it with one lesson path.

import { AppNav } from '../components/app-nav.js';

export const Manual = {
  components: { AppNav },
  template: `
    <div class="container">
      <app-nav />

      <div class="card notice">
        This manual is written for the <router-link to="/lab/3">3-qubit lab</router-link>.
        One lesson path covering 1, 2 and 3 qubits is coming next.
      </div>

            
      <div class="card">
        <h1>User Manual</h1>
      
        <p>
          This simulator demonstrates the basic behavior of a 3-qubit quantum computer.
        </p>
      
        <p>
          Unlike classical bits that can only be 0 or 1,
          quantum bits (qubits) can exist in superposition,
          can accumulate quantum phase,
          and can become entangled with one another.
        </p>
      
        <p>
          A 3-qubit system contains eight basis states:
        </p>
      
        <p>
          |000⟩, |001⟩, |010⟩, |011⟩,
          |100⟩, |101⟩, |110⟩ and |111⟩.
        </p>
      
        <p>
          The simulator allows you to experiment with:
        </p>
      
        <ul>
          <li>Single-qubit gates (H, X, Y, Z, S, T)</li>
          <li>Controlled-NOT (CNOT) operations</li>
          <li>Quantum superposition</li>
          <li>Quantum phase manipulation</li>
          <li>Measurement collapse</li>
          <li>Bell states</li>
          <li>GHZ states</li>
          <li>Two-qubit and three-qubit correlations</li>
          <li>Probability visualization</li>
          <li>Density matrix visualization</li>
          <li>Reduced density matrices</li>
          <li>Three Bloch sphere visualizations</li>
          <li>Correlation graph visualization</li>
          <li>Interactive quantum circuit editor</li>
          <li>3D WebGL state visualization</li>
          <li>Quantum phase color visualization</li>
          <li>Automatic session persistence</li>
        </ul>
      </div>
      
      <div class="card">
        <h2>Use Case 1 — Classical Bit Flip</h2>
      
        <p>
          This demonstrates how some quantum gates behave similarly
          to ordinary classical logic operations.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Understand how the Pauli-X gate flips a qubit state.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Quantum computers still contain operations resembling classical logic,
          but implemented using quantum mathematics.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press X on Qubit 0</li>
          <li>Press Measure</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The measurement always becomes |100⟩ because
          qubit 0 was flipped from 0 to 1 while
          qubits 1 and 2 remain unchanged.
        </p>
      </div>
      
      <div class="card">
        <h2>Use Case 2 — Quantum Superposition</h2>
      
        <p>
          This demonstrates one of the most important ideas in quantum computing:
          superposition.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how a qubit can mathematically exist in multiple states simultaneously.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Superposition allows quantum computers to process information
          differently from classical systems.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press Measure, then repeat 2 &rarr; 3</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Measurements randomly become either |000⟩ or |100⟩
          with approximately equal probability.
        </p>
      </div>
      
      <div class="card">
        <h2>Use Case 3 — Quantum Measurement Collapse</h2>
      
        <p>
          This demonstrates how quantum measurement changes the quantum state itself.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe wavefunction collapse after measurement.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          In quantum mechanics, observation is not passive.
          Measuring the system forces it into one classical state.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press Measure</li>
          <li>Press Measure again</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The second measurement always matches the first because
          the quantum state already collapsed.
        </p>
      </div>
      
      <div class="card">
        <h2>Use Case 4 — Double Hadamard Reversibility</h2>
      
        <p>
          This demonstrates reversible quantum computation.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how applying the same quantum gate twice
          can restore the original state.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Most quantum operations are reversible,
          unlike many ordinary classical processes.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press H on Qubit 0 again</li>
          <li>Press Measure</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The system returns to the original |000⟩ state.
        </p>
      </div>
      
      <div class="card">
        <h2>Use Case 5 — Quantum Phase Rotation</h2>
      
        <p>
          This demonstrates phase-changing quantum operations.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how Z, S, and T gates modify quantum phase
          without directly changing probabilities immediately.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Quantum phase is essential for interference,
          quantum algorithms,
          and entanglement behavior.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press Z, S, or T</li>
          <li>Observe probability changes after further operations</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Some gates mainly affect quantum phase internally,
          influencing later measurements and interference.
        </p>
      </div>

      <div class="card">
        <h2>Use Case 6 — Bell State Creation</h2>
      
        <p>
          This demonstrates quantum entanglement.
        </p>
      
        <p><strong>What Is Entanglement?</strong></p>
      
        <p>
          Entanglement happens when two qubits become strongly connected.
          After entanglement, measuring one qubit affects the overall system
          and reveals information about the other qubit as well.
        </p>
      
        <p>
          In this simulator, the two qubits become linked so that
          they always produce matching measurement results.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Create one of the most famous entangled quantum states:
          a Bell state.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Entanglement is one of the defining features of quantum computing
          and enables many quantum algorithms and communication protocols.
        </p>
      
        <p>
          Unlike ordinary classical systems,
          entangled quantum systems behave as a single combined system
          even when consisting of multiple qubits.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press CNOT</li>
          <li>Press Measure, then repeat 1 → 2 → 3 → 4</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
        
        <p>
          Measurements become either |000⟩ or |110⟩,
          while the other six basis states never appear.
        </p>
        
        <p>
          Qubit 0 and qubit 1 become entangled,
          while qubit 2 remains in the |0⟩ state.
        </p>
        
        <p>
          The generated Bell state is:
        </p>
        
        <p>
          (|000⟩ + |110⟩) / √2
        </p>
      </div>

      <div class="card">
        <h2>Use Case 7 — Controlled Operations</h2>
      
        <p>
          This demonstrates conditional quantum logic using the CNOT gate.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how one qubit can control another qubit's behavior.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Controlled operations are fundamental building blocks
          of quantum circuits and quantum algorithms.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press X on Qubit 0</li>
          <li>Press CNOT</li>
          <li>Press Measure</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The target qubit flips conditionally,
          producing the |110⟩ state.
        </p>
      </div>
      
      <div class="card">
        <h2>Use Case 8 — Probability Visualization</h2>
      
        <p>
          This demonstrates how quantum probabilities are distributed
          across multiple basis states.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Learn how probability bars represent quantum amplitudes.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          Quantum systems do not store single classical values.
          Instead, they maintain probability amplitudes for many states simultaneously.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Apply various gates</li>
          <li>Observe the probability bars</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Different basis states among
          |000⟩ through |111⟩
          gain or lose probability depending on
          the applied quantum operations.
        </p>
      </div>

      <div class="card">
      
        <h2>Use Case 9 — GHZ State Creation</h2>
      
        <p>
          This demonstrates genuine three-qubit entanglement.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Create a GHZ state involving all three qubits.
        </p>
      
        <p><strong>Why This Matters:</strong></p>
      
        <p>
          GHZ states are among the most important
          multi-qubit quantum states.
        </p>
      
        <p>
          They demonstrate correlations that cannot be
          explained using classical physics.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press GHZ State</li>
          <li>Observe the probability bars</li>
          <li>Press Measure, then repeat 1 → 2 → 3 → 4</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Measurements become either |000⟩ or |111⟩.
        </p>
      
        <p>
          All three qubits become entangled together.
        </p>
      
        <p>
          The generated state is:
        </p>
      
        <p>
          (|000⟩ + |111⟩) / √2
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 10 — Bloch Sphere Analysis</h2>
      
        <p>
          This demonstrates how each individual qubit
          can be represented by a reduced density matrix
          and visualized on a Bloch sphere.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Apply H on Qubit 0</li>
          <li>Observe the Bloch spheres</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Qubit 0 moves toward the +X direction,
          indicating a superposition state.
        </p>
      
        <p>
          The other qubits remain near the north pole,
          corresponding to |0⟩.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 11 — Density Matrix Visualization</h2>
      
        <p>
          This demonstrates the full density matrix
          of the 3-qubit quantum state.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how coherence and entanglement
          appear in matrix form.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Create a Bell state or GHZ state</li>
          <li>Observe the density matrix</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Squares on the diagonal show basis-state probabilities.
          For a GHZ state, the |000⟩ and |111⟩ diagonal squares appear
          together with two off-diagonal squares in the opposite corners.
        </p>
      
        <p>
          Off-diagonal squares indicate quantum coherence:
          the basis states are in superposition, not just a random mix.
        </p>
      
      </div>

      <div class="card">

        <h2>Use Case 12 — Correlation Graph Analysis</h2>
      
        <p>
          This demonstrates how quantum correlations appear between qubits.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Learn what the correlation graph measures, and why it is not the same as entanglement.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset and observe the Correlation Graph</li>
          <li>Press Create Bell Pair</li>
          <li>Observe the Correlation Graph again</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          After Reset, all three edges read 1.00: every qubit is 0, so every pair
          always agrees, even though nothing is entangled.
        </p>

        <p>
          After Create Bell Pair, the Q0–Q1 edge stays at 1.00 while the edges to
          Q2 drop to 0.00. Qubits 0 and 1 are now random but always match, and
          qubit 2 is unrelated to them.
        </p>

        <p>
          The graph shows agreement between measured bits, not entanglement.
          To see entanglement, use the Bloch spheres (Use Case 13).
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 13 — Entanglement and Mixed States</h2>
      
        <p>
          This demonstrates how an individual qubit can appear mixed even when
          the complete quantum system is in a pure state.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe the effect of entanglement on the Bloch spheres.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press Create Bell Pair</li>
          <li>Observe the Bloch spheres</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The Bloch vectors of qubits 0 and 1 shrink to the centre of their
          spheres, while qubit 2 stays at |0⟩ on the north pole.
        </p>
      
        <p>
          This indicates that qubits 0 and 1 each behave like a mixed state on
          their own, even though the overall three-qubit state is perfectly
          defined (a pure state). Because the full state is pure, a Bloch vector
          shorter than 1 always means that qubit is entangled with the others.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 14 — WebGL Quantum State Visualization</h2>
      
        <p>
          This demonstrates the three-dimensional visualization of the quantum state.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Understand how basis states, amplitudes and phases are represented visually.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Apply various gates</li>
          <li>Observe the WebGL Visualization</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Eight points appear at the corners of a cube,
          corresponding to the basis states |000⟩ through |111⟩.
        </p>
      
        <p>
          Larger points indicate larger probabilities.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 15 — Quantum Phase Visualization</h2>
      
        <p>
          This demonstrates how quantum phase affects the visualization.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Observe how phase-changing gates modify the colors of basis states.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Press Reset</li>
          <li>Press H on Qubit 0</li>
          <li>Press S or T</li>
          <li>Observe the WebGL Visualization</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Probability bars may remain unchanged while colors in the WebGL view change.
        </p>
      
        <p>
          This demonstrates that quantum phase can change without immediately
          affecting measurement probabilities.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 16 — 3D Camera Exploration</h2>
      
        <p>
          This demonstrates interactive exploration of the quantum-state cube.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          View the quantum state from different perspectives.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Drag over the WebGL visualization with the mouse or one finger</li>
          <li>Use the mouse wheel, or pinch with two fingers, to zoom</li>
          <li>Observe the basis-state cube from different angles</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The cube rotates and zooms smoothly, making it easier
          to inspect the quantum-state distribution.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 17 — Circuit Editor</h2>
      
        <p>
          This demonstrates how quantum operations can be assembled into reusable circuits.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Build and execute a sequence of quantum gates automatically.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Select a qubit</li>
          <li>Tap a gate, or drag it into the circuit area</li>
          <li>Add multiple circuit steps</li>
          <li>Press Run Circuit</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          Each circuit step shows its gate and target qubit, such as
          "H q0" or "CNOT q0→q1". The circuit executes sequentially and
          produces the same result as manually applying the gates one by one.
        </p>
      
      </div>
      
      <div class="card">
      
        <h2>Use Case 18 — Session Persistence</h2>
      
        <p>
          This demonstrates automatic state saving.
        </p>
      
        <p><strong>Objective:</strong></p>
      
        <p>
          Verify that the simulator remembers the current session.
        </p>
      
        <p><strong>Steps:</strong></p>
      
        <ol>
          <li>Create any quantum state</li>
          <li>Add several circuit steps</li>
          <li>Refresh the page</li>
        </ol>
      
        <p><strong>Expected Result:</strong></p>
      
        <p>
          The quantum state and circuit are automatically restored
          when the application reloads.
        </p>
      
      </div>

    </div>
  `
};
