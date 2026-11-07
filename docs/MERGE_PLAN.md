# Merge Plan: One Quantum Lab from Three Simulators

> Status: **agreed** (all five recommendations accepted). It follows [the product vision](VISION.md). Phases 1–3 are done; Phase 4 is next.

## Summary

Today there are three separate apps: [1 qubit](https://bowo-prasetyo.github.io/quantum-1qubit/), [2 qubits](https://bowo-prasetyo.github.io/quantum-2qubits/) and [3 qubits](https://bowo-prasetyo.github.io/quantum-3qubits/). They started from the same code but each has its own simulation engine, its own visuals, its own manual and its own saved data.

The plan is to merge them into **one app with a qubit selector (1, 2 or 3)** and **one guided lesson path**, built on the 3-qubit engine. The work is done in five phases, each a reviewable PR (or a few), and the live apps keep working at every step. The old URLs end up redirecting to the right place in the new app.

## Decisions needed before starting

| # | Decision | Recommendation | Why |
|---|---|---|---|
| 1 | Where the merged app lives | **A new repo, `quantum-lab`**, seeded with this repo's history | A URL ending in `quantum-3qubits` would be misleading for 1- and 2-qubit lessons. GitHub redirects a renamed repository's page and git URLs, but not its GitHub Pages site, so redirect pages are needed either way. A new repo keeps the old sites running until the redirects are ready. |
| 2 | Audience | **Beginners:** high school, first-year university and self-learners | Matches the vision; sets the reading level for lessons. |
| 3 | Preset buttons (Bell, GHZ) | **Always reset to \|0…0⟩ first,** and say so | Today the 2-qubit Bell button resets and the 3-qubit one doesn't. One rule removes the inconsistency and guarantees the advertised state. |
| 4 | Tooling | **Keep the no-build setup:** plain ES modules, pinned Vue from the CDN | Easy to contribute to and deploy. Adds only what's needed for tests (Node's built-in test runner, no dependencies). |
| 5 | The three old repos | **Replace each site with a redirect page, then archive the repo** | Keeps every old link working and avoids maintaining three copies. |

## What the merged app looks like

### One lab, three sizes

| Panel | 1 qubit | 2 qubits | 3 qubits |
|---|---|---|---|
| Gate buttons (I, H, X, Y, Z, S, T) per qubit | ✓ | ✓ | ✓ |
| CNOT with **any** control and target | — | ✓ | ✓ |
| Preset states | — | Bell | Bell, GHZ |
| Measure / Reset | ✓ | ✓ | ✓ |
| Probability chart | ✓ (2 bars) | ✓ (4 bars) | ✓ (8 bars) |
| Bloch sphere per qubit | 1 | 2 | 3 |
| Amplitude table (amplitude, probability, phase) | ✓ | ✓ | ✓ |
| Density matrix | 2×2 | 4×4 | 8×8 |
| Correlation graph | — | 1 edge | 3 edges |
| 3D basis-state cube | — | — | ✓ |
| Circuit editor (tap, drag, keyboard) | ✓ | ✓ | ✓ |

- The URL selects the size: `#/lab/1`, `#/lab/2`, `#/lab/3`.
- The amplitude table replaces today's raw JSON state display, which beginners can't read.
- Each size saves its own state and circuit.

### Code layout (no build step)

```text
quantum-lab/
├── index.html
├── app.js              # Vue app and routes: #/lab/:n, #/lessons, #/lessons/:id, #/concepts
├── engine.js           # Pure simulation maths for n = 1–3 (no DOM, no Vue)
├── worker.js           # Thin module worker: runs engine.js gates and measurement
├── store.js            # IndexedDB: one record per size; one-time import of old saved data
├── components/         # ProbabilityChart, BlochSphere, AmplitudeTable, DensityMatrix,
│                       # CorrelationGraph, Cube3D, CircuitEditor, GatePanel
├── lessons.js          # Lesson content as data
├── styles.css
├── tests/
│   ├── engine.test.mjs # node --test, no dependencies
│   └── lessons.spec.js # Browser checks that each lesson's expected result is true
└── .github/workflows/test.yml
```

### What each app contributes

| From | Keep |
|---|---|
| 3 qubits | Simulation engine (already takes the number of qubits as a parameter), all visualizations, circuit editor, touch support |
| 2 qubits | The operation queue, so every gate acts on the latest state however fast buttons are pressed; saved-state validation |
| 1 qubit | The single-qubit lessons, the clearest part of all three manuals |
| All | The "Objective / Why it matters / Steps / Expected result" lesson format |

## One lesson path

The three manuals have 36 use cases between them (10 + 8 + 18), and many repeat: "Classical Bit Flip" appears in all three. They become one path of about 18 lessons:

| Part | Lessons |
|---|---|
| **1. One qubit** | Bit flip (X) · Superposition (H) · Measurement collapse · Reversibility (H, H) · Phase you can't see (H, Z) · **Phase you can see: interference** (H, Z, H always gives 1; new) · Complex phase (Y, S, T) · Reading the Bloch sphere |
| **2. Two qubits** | Two independent qubits · Controlled NOT · Bell pair · Entanglement on the Bloch spheres · Correlation is not entanglement |
| **3. Three qubits** | GHZ state · Density matrix: probability vs coherence · Reduced states and mixedness · Phase on the 3D cube · Build your own circuit |

Each lesson:

- has a **Set up** button that switches to the right size and starting state
- shows only the panels the lesson needs
- asks the learner to **predict** the outcome before running it
- ends with a short explanation

Tool help (camera controls, persistence) moves to a Help page instead of being counted as lessons.

## Phases

Each phase ends with the live apps still working.

### Phase 1: Shared engine and tests (in this repo, no visible change)

- Move the maths into `engine.js`: gates, CNOT for any pair, measurement, probabilities, density matrix, reduced states, Bloch vectors, correlations.
- `worker.js` becomes a thin wrapper around `engine.js`; the page uses the same functions for its views.
- Add `node --test` tests and a GitHub Actions workflow. Cover at least:
  - H\|0⟩, X\|0⟩ and Y\|0⟩ = i\|1⟩
  - S² = Z, T² = S and HZH = X
  - CNOT on every ordered pair of qubits
  - Bell and GHZ states
  - normalization after random circuits
  - Bloch vectors of reduced states
  - ⟨ZᵢZⱼ⟩
  - measurement statistics, using a seeded random generator

**Done when:** CI is green, and the existing browser checks still pass with identical behaviour.

### Phase 2: One lab for 1, 2 and 3 qubits

- Split the UI into the components above. The engine and components work for any n from 1 to 3, replacing the places where the 3-qubit UI assumes exactly 3 qubits (8 basis states, fixed bit positions, 3-digit labels).
- Add routes `#/lab/1`, `#/lab/2` and `#/lab/3`, and adopt the 2-qubit operation queue.
- Allow CNOT on any control/target pair, in the buttons and in the editor.
- Add the amplitude table; preset buttons reset first (decision 3).

**Done when:** every feature in the parity checklist below works at each size, with no page errors, on desktop and on touch.

### Phase 3: One lesson path

- Write `lessons.js` from the three manuals, following the lesson map above, with Set up buttons and prediction questions.
- Make one Concepts page from the three.

**Done when:** an automated browser test runs each lesson's Set up and confirms its stated expected result, so the lessons can't drift from the app again.

### Phase 4: Move to the final home and redirect

- Create `quantum-lab` (decision 1), keeping this repo's history, and publish it on GitHub Pages.
- **Saved data:** all three apps share the origin `bowo-prasetyo.github.io`, so on first load the new app can import saved states from `quantum-db`, `quantum-db-2` and `quantum-db-3`. It validates them, imports them once, and leaves the old data untouched.
- **Redirects:** replace each old site's `index.html` with a small redirect page to `#/lab/N`. Map `#/manual` to that size's part of the lessons. Include a visible link as a fallback.
- Update the READMEs to point to the new home, then archive the old repos (decision 5).

**Done when:** all three old URLs, including `#/manual`, land on the right page, and a saved state from each old app appears in the new one.

### Phase 5: New content (after the merge)

Candidates, each as its own lesson: quantum teleportation (3 qubits), the Deutsch–Jozsa algorithm, and Grover's search on 2 qubits.

## Feature parity checklist

Nothing a learner can do today should be lost.

- [ ] 1 qubit: Bloch sphere with x/y/z readout · 7 gates · Measure · Reset · state restored after reload
- [ ] 2 qubits: gates on each qubit, including I · CNOT · Bell State · results shown as kets (`|10⟩`) · rapid presses applied in order · bad saved data ignored
- [ ] 3 qubits: probability chart · 3 Bloch spheres · density matrix with phase legend · correlation graph · 3D cube with rotate and zoom (mouse and touch) · Bell and GHZ presets · circuit editor (tap, drag, keyboard) · circuit restored after reload · WebGL availability shown
- [ ] All: pinned Vue with integrity hashes · works at phone width · no page errors

## How we'll know it worked

The app stays private, so this uses no analytics.

- **Learning:** every lesson has a prediction question, and the learner sees their own tally, stored only in their browser. Before and after the merge, ask a handful of beginners to explain the four core ideas and predict three small circuits.
- **Quality:** CI is green on every PR, there are no known physics or documentation errors, and every lesson's expected result is checked automatically.

## Risks

| Risk | Mitigation |
|---|---|
| The merge grows into a rewrite | Phases are small PRs; Phase 1 changes no behaviour; the parity checklist sets the bar |
| Regressions in the physics | Engine tests run in CI before any UI work |
| Broken links from the old sites | Redirect pages with a visible fallback link; checked as part of Phase 4 |
| Lessons drift from the app again | Automated test of each lesson's expected result |
| Learners lose saved work | One-time import from the old IndexedDB databases, which are left untouched |
