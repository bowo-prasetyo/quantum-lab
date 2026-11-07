// Phase → colour, shared by the density matrix and the 3D view so the same
// colour always means the same phase. Phase 0 is red, π/2 yellow-green,
// ±π cyan, −π/2 violet (hue = phase in degrees).

export function phaseToRgb(phase) {
  const hue = ((phase * 180 / Math.PI) % 360 + 360) % 360;
  const s = 0.85;
  const l = 0.55;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = hue / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] :
    hp < 2 ? [x, c, 0] :
    hp < 3 ? [0, c, x] :
    hp < 4 ? [0, x, c] :
    hp < 5 ? [x, 0, c] :
             [c, 0, x];
  const m = l - c / 2;
  return [r1 + m, g1 + m, b1 + m];
}

export function phaseToCss(phase) {
  const [r, g, b] = phaseToRgb(phase).map(v => Math.round(v * 255));
  return `rgb(${r},${g},${b})`;
}
