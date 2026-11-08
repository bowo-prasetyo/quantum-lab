<p align="center"><img src="brand/glass-qubit-stacked-on-light.svg#gh-light-mode-only" alt="Glass Qubit" height="150"><img src="brand/glass-qubit-stacked-on-dark.svg#gh-dark-mode-only" alt="Glass Qubit" height="150"></p>

# Glass Qubit

**A quantum lab in your browser.** Explore quantum gates, superposition, phase, entanglement, noise and measurement by pressing buttons and watching every view change. Nothing to install, no account, and nothing leaves your browser.

The name says what the lab is for: like looking through glass, you see every effect of a gate at once, on the probabilities, on each qubit's Bloch sphere and on the full state, with nothing hidden. It was called *Quantum Lab* until November 2026; the address and the repository name stay the same.

One app covers **1, 2 and 3 qubits**, with the same simulator, visuals and vocabulary at every size, so what you learn about one qubit carries over to two and three.

**Live:** https://bowo-prasetyo.github.io/quantum-lab/

### Start here

- **New to quantum computing?** Open the [lessons](https://bowo-prasetyo.github.io/quantum-lab/#/lessons). 25 short lessons take you from one qubit to entanglement, noise and three quantum algorithms. Each one asks you to predict the result before you try it.
- **Want to play?** Open the [1-qubit lab](https://bowo-prasetyo.github.io/quantum-lab/#/lab/1), press **H** and watch the probabilities and the Bloch sphere change.
- **Stuck on a control?** See [Help](https://bowo-prasetyo.github.io/quantum-lab/#/help). **Stuck on an idea?** See [Quantum Concepts](https://bowo-prasetyo.github.io/quantum-lab/#/concepts).
- **Want to change the code?** Skip to [Technology Stack](#technology-stack), [Project Structure](#project-structure) and [Running Tests](#running-tests).

The rest of this README describes what the lab does and how it is built.

It merges three earlier simulators, [1 qubit](https://github.com/bowo-prasetyo/quantum-1qubit), [2 qubits](https://github.com/bowo-prasetyo/quantum-2qubits) and [3 qubits](https://github.com/bowo-prasetyo/quantum-3qubits), following the [merge plan](docs/MERGE_PLAN.md).

---

## Status

| Merge plan phase | Status |
|---|---|
| 1. Shared engine and tests | ✅ Done |
| 2. One lab for 1, 2 and 3 qubits | ✅ Done |
| 3. One lesson path | ✅ Done |
| 4. Publish, import old saved data, redirect the old sites | ✅ Done: published on GitHub Pages, old saved states imported, the three original sites redirect here |
| 5. New content | ✅ Algorithm lessons (Deutsch–Jozsa, Grover’s search, teleportation), CZ gate, single-qubit measurement, Shots, Interference, Pauli, Entanglement and Unitary views, noise, noisy runs and readout errors |

---

## Using the Lab

The address chooses the size:

| Address | Lab |
|---|---|
| `#/lab/1` (also the start page) | 1 qubit |
| `#/lab/2` | 2 qubits |
| `#/lab/3` | 3 qubits |
| `#/lessons` | The lesson path (`#/manual`, the old User Manual address, opens it too) |
| `#/lessons/<id>` | One lesson, e.g. `#/lessons/bell-pair` |
| `#/concepts` | Quantum Concepts, for every size |
| `#/help` | How to use the lab's controls |

What each size shows:

| Panel | 1 qubit | 2 qubits | 3 qubits |
|---|---|---|---|
| Gate buttons (I, H, X, Y, Z, S, T) per qubit | ✓ | ✓ | ✓ |
| CNOT and CZ with any control and target | — | ✓ | ✓ |
| Measure one qubit (M) or all qubits; classical bits shown | ✓ | ✓ | ✓ |
| Preset states (always start from \|0…0⟩) | — | Bell | Bell, GHZ |
| Reset | ✓ | ✓ | ✓ |
| Amplitude table (amplitude, probability, phase), with a Hide global phase option | ✓ | ✓ | ✓ |
| Probability chart | 2 bars | 4 bars | 8 bars |
| Shots: counts from 100 or 1000 runs, beside the exact probabilities; optional readout errors and their mitigation | ✓ | ✓ | ✓ |
| Interference: the paths into each amplitude after the last gate | ✓ | ✓ | ✓ |
| Bloch sphere per qubit, animating each gate as its turn | 1 | 2 | 3 |
| Density matrix, with its purity (advanced view) | 2×2 | 4×4 | 8×8 |
| Unitary matrix of the last gate or the whole circuit (advanced view) | 2×2 | 4×4 | 8×8 |
| Noise: dephasing, amplitude damping, depolarizing; mixed states (advanced) | ✓ | ✓ | ✓ |
| Noise in circuits: N steps, and noisy runs with fidelity along the timeline (advanced) | ✓ | ✓ | ✓ |
| Correlation graph (advanced view) | — | 1 edge | 3 edges |
| Pauli expectations: ⟨X⟩⟨Y⟩⟨Z⟩ per qubit, 3 × 3 grid per pair, three-qubit strings (advanced view) | — | 1 grid | 3 grids + ⟨XXX⟩… |
| Entanglement: entropy per qubit, mutual information per pair (advanced view) | — | ✓ | ✓ |
| 3D basis-state cube (advanced view) | — | — | ✓ |
| Circuit editor (tap, drag or keyboard), with a step-through timeline | ✓ | ✓ | ✓ |

---

## Features

### Quantum Simulation

- 1-, 2- and 3-qubit quantum state simulation
- Complex-valued quantum amplitudes
- Single-qubit gates
- Controlled-NOT (CNOT) and controlled-Z (CZ) on any pair of qubits
- Measuring a single qubit, with partial collapse
- Bell state generation
- GHZ state generation
- Quantum superposition
- Quantum phase manipulation
- Quantum entanglement
- Quantum measurement
- Measurement collapse
- State normalization
- Noise (dephasing, amplitude damping, depolarizing) and the mixed states it creates
- Noisy circuit runs, with fidelity against the noiseless run
- Readout errors in the Shots view, and their mitigation

### Visualization

- Amplitude table (amplitude, probability and phase of each basis state)
- Probability distribution chart
- Density matrix visualization (point, tap or use the arrow keys to read any entry's size and phase as text)
- Reduced density matrix computation
- Bloch sphere visualization
- Correlation graph of measured-bit agreement between qubit pairs
- Shots: counts from 100 or 1000 simulated runs, beside the exact probabilities
- Interference: the paths that combined into each amplitude at the last gate
- Pauli expectations, and an Entanglement view (entropy per qubit, mutual information per pair)
- Unitary matrix of the last gate or of the whole circuit
- 3D WebGL basis-state visualization (rotate with the mouse, a finger or the arrow keys; point or tap to read a corner)

### Application Features

- Vue 3 CDN architecture
- Vue Router multi-page navigation
- Web Worker quantum computation
- IndexedDB persistence
- Client-side architecture
- GitHub Pages compatible
- Workbench layout: on wide screens the gates (and a lesson's steps) stay beside the views, so a gate's effect is visible as it is pressed; on phones the views are in tabs above the gates
- Charts drawn at the screen's real size and pixel density, so they stay sharp and readable on any screen
- Quantum circuit editor (tap or drag gates; works with mouse, touch and keyboard): run the whole circuit or step through it one gate at a time, from |0…0⟩ or the current state
- Undo (button or Ctrl+Z) for gates, measurements, Reset and circuit edits
- Accessible: every action is announced to screen readers with the outcomes it leaves ("H on qubit 0. Now: |0⟩ 50%, |1⟩ 50%."), charts have text descriptions, phase is never shown by colour alone, text meets WCAG AA contrast, and everything works from the keyboard
- 25 guided lessons with predictions and automatic result checks, ending with three quantum algorithms
- Quantum concepts reference
- Automatic state restoration
- Light and dark themes (following the device by default, or chosen in the top bar), canvases included
- Revisiting a lesson shows your first prediction, which is the one the tally counts; "Try again (practice)" answers again without changing it
- A welcome on the first visit that offers the lessons or free play, and advanced views (noise, density matrix, unitary matrix, correlations, Pauli expectations, entanglement, 3D view) that the free lab reveals with one switch, or by itself once the learner reaches Part 3 of the lessons

---

## Supported Quantum Gates

### Single-Qubit Gates

| Gate | Name | Description |
|------|------|-------------|
| I | Identity Gate | Leaves the qubit unchanged |
| H | Hadamard Gate | Creates superposition |
| X | Pauli-X Gate | Quantum NOT gate |
| Y | Pauli-Y Gate | Bit flip with phase rotation |
| Z | Pauli-Z Gate | Phase flip |
| S | Phase Gate | 90° phase rotation |
| T | π/8 Gate | 45° phase rotation |

### Multi-Qubit Gates

| Gate | Name | Description |
|------|------|-------------|
| CNOT | Controlled-NOT Gate | Flips the target qubit when the control qubit is \|1⟩ |
| CZ | Controlled-Z Gate | Flips the sign where both qubits are \|1⟩ (symmetric: either qubit can be the control) |

The **CNOT** and **CZ** buttons use the control and target qubits chosen next to them; any pair can be chosen. The Gates panel and the circuit editor share one control → target picker and one choice. Pointing at, focusing or tapping any gate shows a one-line description of what it does (also given to screen readers); `tests/gate-info.test.js` checks each description against the simulator.
In the Circuit Editor, a CNOT or CZ step uses that same shared control and target.

The **M** button on each qubit's row measures just that qubit. **Measure all** measures every qubit. Results appear as classical bits under the amplitude table.

---

## Quantum State Representation

An n-qubit register has 2ⁿ basis states: 2 for one qubit, 4 for two, 8 for three. In every label, qubit 0 is the **left** digit, so |10⟩ means qubit 0 is 1 and qubit 1 is 0.

The state is a list of one complex amplitude per basis state. For three qubits:

```text
|ψ⟩ =
α|000⟩ + β|001⟩ + γ|010⟩ + δ|011⟩ +
ε|100⟩ + ζ|101⟩ + η|110⟩ + θ|111⟩
```

Where:

- α through θ are complex amplitudes
- the probability of measuring a basis state is the squared size of its amplitude, for example |α|² for |000⟩
- the probabilities always add up to 1 (normalization):

```text
|α|² + |β|² + |γ|² + |δ|² +
|ε|² + |ζ|² + |η|² + |θ|² = 1
```

After noise, the register can no longer be written as one list of amplitudes. It is then a **mixed state**, held as a density matrix (see [Density Matrix Support](#density-matrix-support)).

The probability chart has one bar per basis state (2, 4 or 8); taller bars mean a more likely result. It helps you see superposition, interference, entanglement, gate effects and measurement collapse.

---

## Bell States

In the 2- and 3-qubit labs, the **Create Bell Pair** button always starts from |0…0⟩ (it resets first), then applies:

1. Hadamard gate on qubit 0
2. CNOT gate (control qubit 0, target qubit 1)

This entangles qubits 0 and 1:

| Lab | State | Measurements always give |
|---|---|---|
| 2 qubits | (\|00⟩ + \|11⟩) / √2 | \|00⟩ or \|11⟩ |
| 3 qubits | (\|000⟩ + \|110⟩) / √2 | \|000⟩ or \|110⟩ (qubit 2 stays 0) |

Each qubit on its own gives 0 or 1 at random, but qubits 0 and 1 always agree.

---

## GHZ States

The simulator can generate a three-qubit GHZ state:

```text
(|000⟩ + |111⟩) / √2
```

In the 3-qubit lab, the **GHZ State** button always starts from |000⟩ (it resets first), then applies:

1. Hadamard gate on qubit 0
2. CNOT gate (control qubit 0, target qubit 1)
3. CNOT gate (control qubit 1, target qubit 2)

The GHZ state entangles all three qubits simultaneously.

Measurements always give one of:

```text
|000⟩
|111⟩
```

---

## Density Matrix Support

The simulator computes and displays the complete density matrix of the quantum system.

In the display, each square's area shows the size of an entry compared with the largest entry, its colour shows the phase, and the diagonal shows the measurement probabilities.

The density matrix provides:

- Probability information
- Phase relationships
- Quantum coherence
- Entanglement information

Without noise, the register is in a pure state, and its density matrix is ρ = |ψ⟩⟨ψ|.
After noise (advanced views), the register itself becomes a mixed state: a random mix that only a density matrix can describe. The **purity** under the matrix, Tr ρ², is 1 for a pure state and drops as noise mixes it.

---

## Reduced Density Matrices

For each qubit, a reduced density matrix is computed by tracing out the remaining qubits.

This allows the simulator to display the local state of each individual qubit even when the system is entangled.

---

## Bloch Sphere Visualization

Each qubit is visualized on a Bloch sphere.

The Bloch vector indicates:

- State orientation
- Degree of purity
- Superposition
- Entanglement effects

Pure states lie on the sphere surface, while mixed states lie inside it.

Without noise, the whole register is in a pure state, so a qubit whose Bloch vector is shorter than 1 is entangled with the other qubits.
This makes the Bloch spheres an indicator of entanglement.
For example, in the 3-qubit lab, after **Create Bell Pair** the vectors of qubits 0 and 1 shrink to the centre, while qubit 2 stays at |0⟩.
After noise, a short vector can also come from the noise itself, so use the Entanglement view to tell the two apart.

---

## Correlation Graph

The correlation graph shows, for each pair of qubits, how reliably their measured bits agree or disagree.

Each edge shows |⟨ZᵢZⱼ⟩|, computed from the probabilities of the basis states:

- **1.00**: the two bits are always equal, or always opposite
- **0.00**: knowing one bit tells you nothing about the other

The graph measures correlation in the computational (0/1) basis only. **It is not a measure of entanglement.**
For example, in the 3-qubit lab, after **Reset** the state |000⟩ shows 1.00 on every edge, because every bit is always 0, yet nothing is entangled.
After **Create Bell Pair**, the Q0–Q1 edge stays at 1.00 while the edges to Q2 drop to 0.00.

To see entanglement, use the Entanglement view or the Bloch spheres.

---

## WebGL Visualization

In the 3-qubit lab, the 3D view (WebGL) places the eight basis states at the corners of a 3D cube.

- Point size shows each state's probability
- Colour shows the phase of its amplitude, using the same colours as the density matrix
- Drag with the mouse or one finger to rotate the cube; use the mouse wheel or a two-finger pinch to zoom

---

## Quantum Concepts Demonstrated

The simulator demonstrates:

- Qubits
- Superposition
- Quantum amplitudes
- Complex numbers
- Quantum phase
- Interference
- Entanglement
- Bell states
- GHZ states
- Density matrices
- Reduced density matrices
- Noise, decoherence and mixed states
- Fidelity
- Readout errors and their mitigation
- Oracles, phase kickback, Deutsch–Jozsa, Grover’s search and teleportation
- Bloch spheres
- Controlled operations
- Measurement collapse
- Probability distributions
- Reversible computation

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript ES Modules
- Vue 3
- Vue Router

### Library Versions

Vue and Vue Router are loaded from the jsDelivr CDN at exact, pinned versions:

| Library | Version |
|---|---|
| Vue | 3.5.44 |
| Vue Router | 4.6.4 |

Each script tag in `index.html` also carries a Subresource Integrity (`integrity`) hash, so the browser only runs the exact file that was tested.

To upgrade a library:

1. Change the version number in its URL in `index.html`
2. Compute the new hash:

   ```bash
   curl -sL <script-url> | openssl dgst -sha384 -binary | base64
   ```

3. Replace the `integrity` value with `sha384-` followed by that hash
4. Run the tests (`npm test` and `npm run test:browser`) before publishing

### Browser APIs

- Web Workers
- HTML Canvas
- WebGL
- IndexedDB

### Deployment

- GitHub Pages

---

## Project Structure

```text
quantum-lab/
├── index.html
├── .nojekyll              # Tells GitHub Pages to serve the files as they are
├── app.js                 # Creates the Vue app
├── router.js              # Routes: #/lab/:n, #/lessons, #/lessons/:id, #/concepts, #/help (#/manual → lessons)
├── lab.js                 # The lab page: state, operation queue, worker, saving
├── components/
│   ├── app-nav.js         # Lab size selector, page links and theme
│   ├── gate-panel.js      # Gates, M per qubit, CNOT and CZ (any pair), presets, Measure all, Reset, Undo
│   ├── gate-hints.js      # One-line description of each gate, shared by the Gates panel and the editor
│   ├── qubit-picker.js    # Control → target picker for CNOT and CZ
│   ├── amplitude-table.js # Quantum State table, with Hide global phase
│   ├── probability-chart.js
│   ├── shots-histogram.js # Shots, readout errors and their mitigation
│   ├── interference-view.js
│   ├── bloch-spheres.js
│   ├── density-matrix.js
│   ├── unitary-view.js    # Matrix of the last gate or the whole circuit
│   ├── correlation-graph.js
│   ├── pauli-panel.js     # Pauli expectations
│   ├── entanglement-panel.js
│   ├── cube-3d.js         # WebGL view (3 qubits)
│   ├── noise-panel.js     # Dephasing, amplitude damping, depolarizing
│   ├── circuit-editor.js  # Tap, drag (mouse or touch) or keyboard
│   ├── circuit-timeline.js # Frames of a circuit run, to step back through
│   └── canvas-fit.js      # Keeps 2D canvases sharp at any screen size
├── pages/
│   ├── lessons.js         # Lesson list
│   ├── lesson.js          # One lesson: predict, try it, check, explanation
│   ├── concepts.js        # Quantum Concepts reference
│   └── help.js            # How to use the controls
├── lessons.js             # The 25 lessons, as data
├── lesson-checks.js       # Checks a state against a lesson's expected result
├── progress.js            # Prediction tally (browser only)
├── prefs.js               # Small per-browser preferences (welcome seen, advanced views)
├── theme.js               # Light, dark or system theme
├── describe.js            # Text descriptions of a state, read out to screen readers
├── engine.js              # Simulation maths: pure functions, pure and mixed states
├── bloch-rotation.js      # Each single-qubit gate as a turn of the Bloch sphere
├── worker.js              # Background worker: runs engine.js gates, noise and measurement
├── colors.js              # Phase → colour, shared by the views
├── db.js                  # Saved state per lab size (IndexedDB)
├── import-old.js          # One-time import from the original simulators
├── styles.css
├── tests/
│   ├── *.test.js          # Unit tests (engine, lessons, gate descriptions, noise, readout, views…)
│   └── browser/
│       ├── helpers.js
│       └── *.browser.test.js  # Every lesson, controls, layout, accessibility, import… in a real browser
├── package.json           # Only configures the tests; the app has no build step
├── brand/                 # Logo files
├── docs/                  # Product vision and merge plan
└── README.md
```

---

## Running Tests

**Unit tests** use Node's built-in test runner, so there is nothing to install. With Node.js 22 or newer:

```bash
npm test
```

They cover:

- the engine: gate matrices and identities, CNOT on every pair of qubits, Bell and GHZ states, normalization, measurement statistics, density matrices, reduced states, Bloch vectors and correlations
- noise and mixed states, readout errors and their mitigation, and the maths behind the Shots, Interference, Entanglement and Unitary views
- the one-line gate descriptions and the screen-reader state descriptions: each claim is checked against the simulator
- every lesson: its data is complete, its prediction answer is valid, and running Set up then its steps gives the result it promises

**Browser tests** open every lesson in Chromium, run Set up and Show me, and confirm the app reports the expected result. They also cover the controls, the circuit editor, the layout on wide and narrow screens, accessibility, themes and onboarding, and check each lesson's panels, numbering and links, predictions and the tally, and that lessons don't change the lab's saved state. Import tests seed the original simulators' databases exactly as those apps wrote them, then check that their states are brought over once, the old data is left untouched, and no old database is ever created. They need Playwright and network access (Vue loads from the CDN):

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm run test:browser
```

GitHub Actions runs both on every pull request.

---

## Architecture

All the simulation maths lives in `engine.js`, a set of pure functions with no dependency on the page. Both the main thread and the worker use it, and it is covered by unit tests.

### Main Thread

The lab page (`lab.js`) owns the state and runs every operation through one queue, so each gate acts on the latest state however fast buttons are pressed. Each panel is a component that redraws from the state it is given.

Responsible for:

- Vue UI rendering
- Probability charts
- Density matrix rendering
- Bloch sphere rendering
- Correlation graph rendering
- WebGL visualization
- Density matrix, reduced density matrix, Bloch vector and correlation computation (using `engine.js`)
- Running Bell, GHZ and circuit sequences, one worker step at a time
- IndexedDB persistence
- User interaction

### Web Worker

Responsible for:

- Single-qubit gate operations on the state (pure or mixed)
- CNOT and CZ
- Noise
- Measurement and collapse

The worker is a module worker that imports `engine.js`.

The main thread sends the current state with each request and receives the new state back.
Gates and measurements run in the background, and the main thread computes what is displayed from the returned state.

---

## Persistence

Each lab size automatically stores its own quantum state and Circuit Editor steps using IndexedDB.

After refreshing the browser or switching sizes, both are restored. Saved data that is invalid (for example, from another version) is ignored.

The lab uses its own database (`quantum-lab`), separate from the three original simulators' databases on the same site.

**Bringing over old saved states.** The first time a lab size opens with nothing saved, it imports that size's state from the matching original simulator, plus the circuit for 3 qubits, and says so in a notice. It then saves its own copy, so the import happens only once.

- The old data (`quantum-db`, `quantum-db-2`, `quantum-db-3`) is only read, never changed or deleted.
- Invalid old data is ignored.
- If an old database doesn't exist, it isn't created. An empty one would break that simulator.

---

## Lessons

One path of 25 lessons takes a learner from a single qubit to three-qubit entanglement, noise, and on to real quantum algorithms. Each lesson:

- opens a lab with the right number of qubits, showing only the panels it needs
- asks the learner to **predict** the outcome first, and keeps a tally of predictions in the browser only
- lists the steps, with **Set up again**, **Show me** (runs the steps) and **Check my result** buttons
- explains what happened

| Part | Lessons |
|---|---|
| 1. One qubit | Bit flip · Superposition · Measurement collapse · Reversibility · Phase you can’t see · Phase you can see: interference · Complex phase: S, T and Y · Reading the Bloch sphere |
| 2. Two qubits | Two independent qubits · Controlled NOT · Bell pair · Entanglement on the Bloch spheres · Measuring one qubit of a Bell pair · Correlation is not entanglement |
| 3. Three qubits | GHZ state · Density matrix: probability vs coherence · Decoherence: how noise ends a superposition · Noise builds up with every step · Reading a qubit is noisy too · Reduced states and mixedness · Phase on the 3D cube · Build your own circuit |
| 4. Quantum algorithms | Deutsch–Jozsa: one question instead of three (3 qubits) · Grover’s search: finding the marked item (2 qubits) · Quantum teleportation (3 qubits) |

Lessons are plain data in `lessons.js`. Each one lists its steps as operations and its expected result as machine-checkable checks (see `lesson-checks.js`), so the tests can confirm every lesson says what the app really does.

---

## Product Direction

The plan was to merge the 1-, 2- and 3-qubit simulators into one guided lab, Glass Qubit. See:

- [Product vision](docs/VISION.md)
- [Merge plan](docs/MERGE_PLAN.md)

Both have been agreed.

---

## Future Improvements

Possible future enhancements:

- Quantum Fourier Transform
- Grover's search on more than four items
- Shor's algorithm demonstrations
- WebGPU acceleration
- WASM math backend
- Quantum error correction examples
- Larger qubit systems

---

## License

MIT License

---

## Assisted By

[ChatGPT](https://chatgpt.com/)
