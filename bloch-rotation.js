// Every single-qubit gate turns the Bloch sphere: a gate U = e^{iα} e^{−iθ n·σ/2}
// rotates every Bloch vector of its qubit by the angle θ about the axis n
// (right-handed), whether the qubit's state is pure or mixed. The other
// qubits' vectors don't move. Used by the Bloch spheres to animate a gate
// as the turn it is; covered by tests/bloch-rotation.test.js, which checks
// each turn against the simulator.

const H_AXIS = [Math.SQRT1_2, 0, Math.SQRT1_2];

/** Axis (unit vector) and angle (radians) of each gate's turn; I has none. */
export const GATE_ROTATIONS = Object.freeze({
  X: { axis: [1, 0, 0], angle: Math.PI },
  Y: { axis: [0, 1, 0], angle: Math.PI },
  Z: { axis: [0, 0, 1], angle: Math.PI },
  H: { axis: H_AXIS, angle: Math.PI },
  S: { axis: [0, 0, 1], angle: Math.PI / 2 },
  T: { axis: [0, 0, 1], angle: Math.PI / 4 }
});

/** v turned by `angle` about the unit vector `axis` (Rodrigues' formula). */
export function rotate([x, y, z], [kx, ky, kz], angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = kx * x + ky * y + kz * z;
  // k × v
  const cx = ky * z - kz * y;
  const cy = kz * x - kx * z;
  const cz = kx * y - ky * x;
  return [
    x * c + cx * s + kx * dot * (1 - c),
    y * c + cy * s + ky * dot * (1 - c),
    z * c + cz * s + kz * dot * (1 - c)
  ];
}

/** Points along the turn of v, from the start (t = 0) to `t` (0–1) of the way. */
export function arcPoints(v, { axis, angle }, t = 1, steps = 32) {
  const count = Math.max(1, Math.round(steps * t));
  return Array.from({ length: count + 1 }, (_, k) => rotate(v, axis, angle * t * (k / count)));
}
