# Product Vision: Glass Qubit

> Status: **agreed**. The product was called *Quantum Lab* until November 2026; only the name changed.

## Vision

Glass Qubit is a free, install-free browser lab where curious beginners (high-school and first-year university students, and self-learners with no physics or linear-algebra background) learn how a quantum computer works by doing it: they apply gates to one, two, then three qubits and see every effect at once, on the probabilities, on each qubit's Bloch sphere and on the full state. One guided path takes the learner from a single qubit to three-qubit entanglement, using the same simulator, visuals and vocabulary at every step, so what they learn about one qubit carries over unchanged to two and three. We will know it works when a learner who finishes the path can explain superposition, measurement, phase and interference, and entanglement in their own words, and can predict the measurement results of a small circuit before running it. Glass Qubit is not a research-grade or many-qubit simulator, a programming course, or a showcase for graphics technology. It stays small, correct, private (no accounts, no tracking, everything runs and is saved in the browser) and honest: every claim it makes about quantum mechanics or about itself is true and tested.

## What this means for decisions

When choosing what to build or change, prefer the option that:

1. **Helps a beginner understand something** over one that adds a feature or a technology.
2. **Keeps one mental model across 1, 2 and 3 qubits.** The same panels and words mean the same thing at every size.
3. **Shows only what the current lesson needs,** and reveals advanced views (density matrix, correlations, 3D cube) as the learner progresses.
4. **Is verifiable:** physics is covered by automated tests, and docs and in-app text describe what the code actually does.
5. **Stays client-only and dependency-light:** static files on GitHub Pages, no build step, no back end.

## Out of scope (for now)

- More than 3 qubits
- Noise, decoherence and error correction
- Accounts, cloud saving or analytics
- Code-based circuit languages (such as OpenQASM)
- GPU acceleration (WebGPU)
