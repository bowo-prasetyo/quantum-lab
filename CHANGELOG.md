# Changelog

What changed in each version of Glass Qubit. The newest version is at the top.

Glass Qubit follows [semantic versioning](https://semver.org/). For a learning app that means:

- **Major** (2.0.0): something you rely on stops working as before, such as a lesson address, a saved lab or a link.
- **Minor** (1.1.0): something new, such as a lesson, a view or a language.
- **Patch** (1.0.1): fixes and corrections.

## 1.0.0 (2026-11-08)

The first release. Glass Qubit is a free browser lab for learning how a quantum computer works: apply gates to 1, 2 or 3 qubits and see every effect at once. It needs no install and no account, and nothing leaves your browser.

**Live:** https://bowo-prasetyo.github.io/quantum-lab/

### The lab

- **One lab for 1, 2 and 3 qubits** (`#/lab/1`, `#/lab/2`, `#/lab/3`), with the same views and words at every size. Each size keeps its own state and circuit.
- **Gates:** I, H, X, Y, Z, S and T on any qubit; CNOT and CZ on any pair of qubits.
- **Measurement:** measure one qubit (M) or all of them. Results are shown as classical bits.
- **Presets:** a Bell pair and a GHZ state.
- **Workbench layout,** so you see a gate's effect where you press it. Each gate has a short description.
- **Undo,** and a **circuit editor** that you can build by tapping, dragging (mouse or touch) or using the keyboard, and run or step through.
- **Animated gates:** single-qubit gates turn the Bloch vector, and a timeline lets you step through a circuit.

### Views

- **Always shown:** the state table (amplitude, probability and phase), probabilities, Shots (repeated measurements), a Bloch sphere per qubit, and Interference.
- **Advanced views,** shown when you ask for them or once you reach Part 3 of the lessons: noise, the density matrix, the unitary matrix, correlations, Pauli expectations, entanglement and a 3D view of the basis states.
- A **Hide global phase** option.

### Noise

- **Noise and mixed states:** dephasing, amplitude damping and depolarizing noise, which can also be added as circuit steps.
- **Noisy runs,** with fidelity shown along the timeline.
- **Readout errors** in Shots, and how to correct for them.

### Lessons

25 lessons in four parts. Each one asks you to **predict** the result first, then lets you set it up, try it, check your result and read why.

| Part | Lessons |
|---|---|
| 1. One qubit | Bit flip · Superposition · Measurement collapse · Reversibility · Phase you can’t see · Phase you can see: interference · Complex phase: S, T and Y · Reading the Bloch sphere |
| 2. Two qubits | Two independent qubits · Controlled NOT · Bell pair · Entanglement on the Bloch spheres · Measuring one qubit of a Bell pair · Correlation is not entanglement |
| 3. Three qubits | GHZ state · Density matrix: probability vs coherence · Decoherence: how noise ends a superposition · Noise builds up with every step · Reading a qubit is noisy too · Reduced states and mixedness · Phase on the 3D cube · Build your own circuit |
| 4. Quantum algorithms | Deutsch–Jozsa: one question instead of three · Grover’s search: finding the marked item · Quantum teleportation |

Concepts and Help pages explain every idea and control.

### Languages

- **English, Bahasa Indonesia and Japanese (日本語).** The language follows your browser, or you can choose it in the top bar or with `?lang=id` / `?lang=ja`.
- **The Indonesian and Japanese translations are previews:** they are complete, but still awaiting review by physics-literate speakers. Corrections are welcome.

### For everyone

- A first-visit welcome. The advanced views stay out of the way until you ask for them or reach Part 3.
- Light and dark themes, which follow your system by default.
- **Accessibility:** screen-reader announcements for every change, every view readable as text, sufficient contrast, keyboard and touch support, and layouts that work at phone width.
- Your work is saved in your browser. Saved work from the three earlier simulators is brought over automatically, and their old addresses redirect here.

### Under the hood

- Static files on GitHub Pages, with no build step and no back end. Vue and Vue Router are pinned and loaded with integrity checks.
- All the physics is in one tested engine. Every pull request runs 238 unit tests and 104 browser tests, including a check that every lesson gives exactly the result it promises.

### Known limitations

- Up to 3 qubits.
- The Indonesian and Japanese translations have not been reviewed yet (see Languages).
- Whether the lab actually teaches has not yet been tested with learners; that is the next milestone in the [product vision](docs/VISION.md).

### Before 1.0

Glass Qubit merges three earlier simulators, [quantum-1qubit](https://github.com/bowo-prasetyo/quantum-1qubit), [quantum-2qubits](https://github.com/bowo-prasetyo/quantum-2qubits) and [quantum-3qubits](https://github.com/bowo-prasetyo/quantum-3qubits), following the [merge plan](docs/MERGE_PLAN.md). Those repositories are archived and their sites redirect here.
