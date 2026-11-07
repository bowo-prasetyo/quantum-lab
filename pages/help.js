// Help (#/help): how to use the lab's controls. The physics is in
// Concepts and the lessons.

import { AppNav } from '../components/app-nav.js';

export const Help = {
  components: { AppNav },

  template: `
    <div class="container">
      <app-nav />

      <div class="card">
        <h1>Help</h1>
        <p>
          How to use the lab. For the ideas behind it, see
          <router-link to="/concepts">Concepts</router-link>; to learn step by step,
          follow the <router-link to="/lessons">lessons</router-link>.
        </p>
      </div>

      <div class="card">
        <h2>Choosing a size</h2>
        <p>
          Use <strong>1 qubit</strong>, <strong>2 qubits</strong> or <strong>3 qubits</strong>
          at the top. Each size keeps its own state and circuit.
        </p>
      </div>

      <div class="card">
        <h2>Layout</h2>
        <ul>
          <li>On a wide screen, the gates and the circuit editor stay on the left while you scroll the views on the right, so you see each gate’s effect as you press it. In a lesson, the steps and <strong>Check my result</strong> are there too.</li>
          <li>On a narrow screen, such as a phone, the views are in tabs above the gates (State, Probabilities, Bloch spheres and so on). Tap a tab, or use the arrow keys, to switch view.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Gates and buttons</h2>
        <ul>
          <li>Each qubit (Q0, Q1, Q2) has a row of gate buttons: I, H, X, Y, Z, S and T, and <strong>M</strong>, which measures just that qubit.</li>
          <li><strong>CNOT</strong> and <strong>CZ</strong> (2 or 3 qubits): choose the control and target qubits, then press the button. For CZ, which qubit is the control doesn’t matter.</li>
          <li><strong>Create Bell Pair</strong> and <strong>GHZ State</strong> always start from |0…0⟩, so they give the same state every time.</li>
          <li><strong>Measure all</strong> picks a result for every qubit at random and collapses the state to it. <strong>Reset</strong> returns to |0…0⟩.</li>
          <li>Measurement results appear as <strong>classical bits</strong> under the amplitude table. Reset clears them.</li>
          <li>You can press buttons as fast as you like: each operation waits for the previous one.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Circuit editor</h2>
        <ul>
          <li>Choose the <strong>selected qubit</strong>. For CNOT and CZ it is the control; choose the <strong>target</strong> too.</li>
          <li><strong>M</strong> in the circuit measures the selected qubit when the circuit runs.</li>
          <li>Add a gate by tapping or clicking it, dragging it into the circuit area (mouse, finger or pen), or focusing it and pressing Enter.</li>
          <li>Tap or click a step to remove it.</li>
          <li><strong>Run Circuit</strong> applies the steps in order to the current state, half a second apart.</li>
        </ul>
      </div>

      <div class="card">
        <h2>3D view (3 qubits)</h2>
        <ul>
          <li>Drag with the mouse or one finger to rotate the cube.</li>
          <li>Use the mouse wheel, or pinch with two fingers, to zoom.</li>
          <li>On a phone, start scrolling the page outside the 3D view.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Saving and privacy</h2>
        <ul>
          <li>Each lab size saves its state and circuit in this browser and restores them when you come back.</li>
          <li>Lessons use their own lab and don’t change your saved state.</li>
          <li>Your lesson predictions are also stored only in this browser.</li>
          <li>Nothing is sent to a server: there are no accounts and no tracking.</li>
        </ul>
      </div>
    </div>
  `
};
