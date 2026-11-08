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
        <p>
          The lab starts with the Quantum State table, the probabilities, shots,
          the Bloch spheres and interference. <strong>Show advanced views</strong>,
          under them, adds the density matrix, correlations, entanglement and the 3D view. They
          are already on if you have reached Part 3 of the lessons, and the lab
          remembers your choice. Lessons show whichever views they need.
        </p>
        <p>In every label, qubit 0 is the left digit: |10⟩ means qubit 0 is 1 and qubit 1 is 0.</p>
      </div>

      <div class="card">
        <h2>Layout</h2>
        <ul>
          <li>On a wide screen, the gates and the circuit editor stay on the left while you scroll the views on the right, so you see each gate’s effect as you press it. In a lesson, the steps and <strong>Check my result</strong> are there too.</li>
          <li>On a narrow screen, such as a phone, the views are in tabs above the gates (State, Probabilities, Bloch spheres and so on). Tap a tab, or use the arrow keys, to switch view.</li>
          <li><strong>Theme</strong>, at the top, switches between light and dark colours. <strong>System</strong> follows your device’s setting.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Gates and buttons</h2>
        <ul>
          <li>Each qubit (Q0, Q1, Q2) has a row of gate buttons: I, H, X, Y, Z, S and T, and <strong>M</strong>, which measures just that qubit.</li>
          <li>Point at, focus or tap a gate to see what it does, in the line under the buttons.</li>
          <li><strong>CNOT</strong> and <strong>CZ</strong> (2 or 3 qubits): choose the <strong>control</strong> and <strong>target</strong> qubits (the target can’t be the control), then press the button. For CZ, which qubit is the control doesn’t matter. The circuit editor shares the same choice.</li>
          <li><strong>Create Bell Pair</strong> and <strong>GHZ State</strong> always start from |0…0⟩, so they give the same state every time.</li>
          <li><strong>Measure all</strong> picks a result for every qubit at random and collapses the state to it. <strong>Reset</strong> returns to |0…0⟩.</li>
          <li>Measurement results appear as <strong>classical bits</strong> under the amplitude table. Reset clears them.</li>
          <li><strong>Undo</strong> (or Ctrl+Z, ⌘Z on a Mac) steps back through what you did: gates, measurements, Reset and circuit edits. It can even undo a measurement, because the simulator remembers the state from before; a real quantum computer can’t.</li>
          <li>You can press buttons as fast as you like: each operation waits for the previous one.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Circuit editor</h2>
        <ul>
          <li>The gates are laid out like the Gates panel: one row per qubit. <strong>H</strong> in row Q1 adds “H q1”; <strong>M</strong> in a row measures that qubit when the circuit runs.</li>
          <li><strong>CNOT</strong> and <strong>CZ</strong> use the control and target chosen next to them, the same choice as in the Gates panel.</li>
          <li>Add a gate by tapping or clicking it, dragging it into the circuit area (mouse, finger or pen), or focusing it and pressing Enter.</li>
          <li>Press <strong>×</strong> on a step to remove it (with the keyboard, Tab to it and press Enter). <strong>Clear</strong> removes every step. Undo brings them back.</li>
          <li><strong>Run Circuit</strong> applies every step in order, half a second apart, highlighting each one as it goes.</li>
          <li><strong>Step</strong> applies one step at a time, so you can watch each gate’s effect. Press it again for the next step; after the last step, it starts again.</li>
          <li>Run and Step start from |0…0⟩, so a circuit gives the same result every time. Untick <strong>Start from |0…0⟩</strong> to apply the circuit to the current state instead.</li>
          <li>While a circuit runs, the gate buttons wait until it finishes.</li>
        </ul>
      </div>

      <div class="card">
        <h2>3D view (3 qubits)</h2>
        <ul>
          <li>Drag with the mouse or one finger to rotate the cube.</li>
          <li>Use the mouse wheel, or pinch with two fingers, to zoom.</li>
          <li>With the keyboard: the arrow keys rotate it, and + and − zoom.</li>
          <li>On a phone, start scrolling the page outside the 3D view.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Reading the views without colour, and with a screen reader</h2>
        <ul>
          <li>Point at, tap, or focus the <strong>density matrix</strong> and use the arrow keys: the square you are on is outlined and its exact size and phase appear under it.</li>
          <li>The <strong>Shots</strong>, <strong>Interference</strong> and <strong>Entanglement</strong> views give every number they draw as text beside the drawing.</li>
          <li>Point at or tap a corner of the <strong>3D view</strong> to read its probability and phase. With the keyboard, focus it and use the arrow keys to rotate it, and + and − to zoom.</li>
          <li>With a screen reader, every action is followed by a short summary of what it did and the possible outcomes, such as “H on qubit 0. Now: |0⟩ 50%, |1⟩ 50%.” The charts have text descriptions, and the Quantum State table holds every number.</li>
          <li>The lab adds no animation of its own, and a circuit run or Show me changes the views in steps half a second apart, so you can follow along.</li>
        </ul>
      </div>

      <div class="card">
        <h2>Saving and privacy</h2>
        <ul>
          <li>Each lab size saves its state and circuit in this browser and restores them when you come back.</li>
          <li>Lessons use their own lab and don’t change your saved state.</li>
          <li>In each lesson, your <strong>first prediction</strong> is the one that counts in your tally. When you come back to a lesson it is shown, and <strong>Try again (practice)</strong> lets you answer again without changing it.</li>
          <li>Your lesson predictions, your theme, whether you have seen the welcome, and whether advanced views are on are also stored only in this browser.</li>
          <li>Nothing is sent to a server: there are no accounts and no tracking.</li>
        </ul>
      </div>
    </div>
  `
};
