// Density matrix ρ = |ψ⟩⟨ψ| as a grid of squares: area = size of the entry
// relative to the largest one, colour = phase.

import * as engine from '../engine.js';
import { phaseToCss } from '../colors.js';

export const DensityMatrix = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  data() {
    return { densityMax: 1 };
  },

  template: `
    <div class="card">
      <h2>Density Matrix</h2>
      <canvas ref="canvas" width="640" height="560"></canvas>
      <p class="caption">
        Row i, column j shows ρ<sub>ij</sub>.
        A square's area shows its size |ρ<sub>ij</sub>| compared with the
        largest entry ({{ densityMax.toFixed(3) }}), and its colour shows
        the phase<span v-if="n === 3"> (same colours as the 3D view)</span>.
        The diagonal holds the measurement probabilities.
      </p>
    </div>
  `,

  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const size = 1 << this.n;
      const left = 64;   // room for row labels
      const top = 48;    // room for column labels
      const grid = 480;
      const cell = grid / size;
      const labels = [...Array(size).keys()].map(i => engine.basisLabel(i, this.n));

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const rho = engine.densityMatrix(this.re, this.im);
      const entries = [];
      let max = 0;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const re = rho.re[i * size + j];
          const im = rho.im[i * size + j];
          const magnitude = Math.sqrt(re * re + im * im);
          entries.push({ i, j, magnitude, phase: Math.atan2(im, re) });
          max = Math.max(max, magnitude);
        }
      }

      this.densityMax = max;

      // Grid: diagonal cells slightly lighter so the probabilities stand out
      for (let k = 0; k < size; k++) {
        for (let m = 0; m < size; m++) {
          ctx.fillStyle = k === m ? '#1c1c1c' : '#111';
          ctx.fillRect(left + m * cell, top + k * cell, cell, cell);
        }
      }

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let k = 0; k <= size; k++) {
        ctx.beginPath();
        ctx.moveTo(left + k * cell, top);
        ctx.lineTo(left + k * cell, top + grid);
        ctx.moveTo(left, top + k * cell);
        ctx.lineTo(left + grid, top + k * cell);
        ctx.stroke();
      }

      // Entries: area ∝ |ρij| / largest entry
      for (const { i, j, magnitude, phase } of entries) {
        if (max === 0 || magnitude < 1e-9) continue;
        const side = (cell - 6) * Math.sqrt(magnitude / max);
        ctx.fillStyle = phaseToCss(phase);
        ctx.fillRect(
          left + j * cell + (cell - side) / 2,
          top + i * cell + (cell - side) / 2,
          side,
          side
        );
      }

      // Probabilities printed under each diagonal square
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (let k = 0; k < size; k++) {
        const p = entries[k * size + k].magnitude;
        if (p < 0.0005) continue;
        ctx.fillStyle = '#fff';
        ctx.fillText(p.toFixed(3), left + k * cell + cell / 2, top + k * cell + cell - 4);
      }

      // Row and column labels
      ctx.fillStyle = '#ccc';
      ctx.font = '12px Arial';
      for (let k = 0; k < size; k++) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(labels[k], left + k * cell + cell / 2, top - 8);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[k], left - 8, top + k * cell + cell / 2);
      }

      // Phase legend: colour bar from +π (top) to −π (bottom)
      const barX = left + grid + 30;
      const barW = 18;
      for (let y = 0; y < grid; y++) {
        ctx.fillStyle = phaseToCss(Math.PI - (2 * Math.PI * y) / grid);
        ctx.fillRect(barX, top + y, barW, 1);
      }

      ctx.fillStyle = '#ccc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('phase', barX + barW / 2, top - 8);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      [['π', 0], ['π/2', 0.25], ['0', 0.5], ['−π/2', 0.75], ['−π', 1]]
        .forEach(([label, f]) => ctx.fillText(label, barX + barW + 6, top + f * grid));

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }
};
