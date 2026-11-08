// Density matrix ρ = |ψ⟩⟨ψ| as a grid of squares: area = size of the entry
// relative to the largest one, colour = phase.
//
// Pointing at or tapping a square, or moving with the arrow keys once the
// matrix has keyboard focus, outlines it and gives its exact size and phase
// as text under the matrix, so colour is never the only way to read phase.

import * as engine from '../engine.js';
import { phaseToCss } from '../colors.js';
import { fitCanvas, redrawOnResize } from './canvas-fit.js';
import { percent, degrees } from '../describe.js';

const LABEL_FONT = '12px Arial, sans-serif';

export const DensityMatrix = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  data() {
    return {
      densityMax: 1,
      cursor: null   // { i, j }: the entry being read, or null
    };
  },

  computed: {
    size() {
      return 1 << this.n;
    },
    // The chosen entry as text, e.g. "Row |00⟩, column |11⟩: size 0.500, phase 0°"
    readout() {
      if (!this.cursor) return '';
      const { i, j } = this.cursor;
      const rho = engine.densityMatrix(this.re, this.im);
      const k = i * this.size + j;
      const re = rho.re[k];
      const im = rho.im[k];
      const magnitude = Math.hypot(re, im);
      const label = q => engine.basisLabel(q, this.n);
      const where = i === j ? `Row and column ${label(i)}` : `Row ${label(i)}, column ${label(j)}`;
      if (magnitude < 1e-9) return `${where}: 0.`;
      const value = `${where}: size ${magnitude.toFixed(3)}, phase ${degrees(Math.atan2(im, re))}`;
      return i === j ? `${value} (the probability of ${label(i)}, ${percent(magnitude)}).` : `${value}.`;
    }
  },

  template: `
    <div class="card">
      <h2>Density Matrix</h2>
      <canvas
        ref="canvas"
        class="readable-canvas"
        tabindex="0"
        role="img"
        aria-label="Density matrix. Use the arrow keys to read each entry. The diagonal holds the probabilities in the Quantum State table."
        @pointermove="onPointer"
        @pointerdown="onPointer"
        @focus="cursor = cursor || { i: 0, j: 0 }"
        @keydown="onKeydown"
      ></canvas>
      <p class="readout" role="status">{{ readout || 'Point at, tap or use the arrow keys on a square to read it.' }}</p>
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
  watch: { re() { this.draw(); }, im() { this.draw(); }, cursor() { this.draw(); } },

  methods: {
    // The entry under the pointer, if it is over the grid
    onPointer(e) {
      const layout = this.layout;
      if (!layout) return;
      const r = this.$refs.canvas.getBoundingClientRect();
      const j = Math.floor((e.clientX - r.left - layout.left) / layout.cell);
      const i = Math.floor((e.clientY - r.top - layout.top) / layout.cell);
      if (i >= 0 && j >= 0 && i < this.size && j < this.size) {
        if (!this.cursor || this.cursor.i !== i || this.cursor.j !== j) this.cursor = { i, j };
      }
    },

    // Arrow keys move the outlined entry; Home and End jump along the row
    onKeydown(e) {
      const { i, j } = this.cursor || { i: 0, j: 0 };
      const last = this.size - 1;
      const moves = {
        ArrowUp: [i - 1, j], ArrowDown: [i + 1, j],
        ArrowLeft: [i, j - 1], ArrowRight: [i, j + 1],
        Home: [i, 0], End: [i, last]
      };
      const move = moves[e.key];
      if (!move) return;
      e.preventDefault();
      const clamp = v => Math.max(0, Math.min(last, v));
      this.cursor = { i: clamp(move[0]), j: clamp(move[1]) };
    },

    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;

      const size = 1 << this.n;
      const labels = [...Array(size).keys()].map(i => engine.basisLabel(i, this.n));

      // Layout in CSS pixels, worked out from the width. Column labels turn
      // vertical when the cells are too narrow for them.
      let layout;
      const fit = fitCanvas(canvas, W => {
        const measure = canvas.getContext('2d');
        measure.font = LABEL_FONT;
        const labelWidth = Math.max(...labels.map(l => measure.measureText(l).width));
        const left = Math.ceil(labelWidth) + 14;
        const legend = 64;
        const grid = Math.max(80, Math.min(480, W - left - legend));
        const cell = grid / size;
        const vertical = labelWidth + 6 > cell;
        const top = vertical ? Math.ceil(labelWidth) + 14 : 32;
        layout = { left, top, grid, cell, vertical };
        return top + grid + 12;
      });
      if (!fit) return;
      const { ctx, width: W, height: H } = fit;
      const { left, top, grid, cell, vertical } = layout;
      this.layout = layout; // for finding the entry under the pointer
      // Also on the element, so tests can aim at a square
      Object.assign(canvas.dataset, { gridLeft: left, gridTop: top, cell });

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

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
      const inset = Math.min(6, cell * 0.15);
      for (const { i, j, magnitude, phase } of entries) {
        if (max === 0 || magnitude < 1e-9) continue;
        const side = (cell - inset) * Math.sqrt(magnitude / max);
        ctx.fillStyle = phaseToCss(phase);
        ctx.fillRect(
          left + j * cell + (cell - side) / 2,
          top + i * cell + (cell - side) / 2,
          side,
          side
        );
      }

      // Probabilities printed under each diagonal square, if they fit
      // (they are also in the amplitude table)
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      if (cell >= 36) {
        for (let k = 0; k < size; k++) {
          const p = entries[k * size + k].magnitude;
          if (p < 0.0005) continue;
          ctx.fillStyle = '#fff';
          ctx.fillText(p.toFixed(3), left + k * cell + cell / 2, top + k * cell + cell - 4);
        }
      }

      // Row and column labels
      ctx.fillStyle = '#ccc';
      ctx.font = LABEL_FONT;
      for (let k = 0; k < size; k++) {
        const middle = k * cell + cell / 2;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[k], left - 8, top + middle);
        if (vertical) {
          ctx.save();
          ctx.translate(left + middle, top - 8);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'left';
          ctx.fillText(labels[k], 0, 0);
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(labels[k], left + middle, top - 8);
        }
      }

      // Outline the entry being read
      if (this.cursor) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(left + this.cursor.j * cell + 1, top + this.cursor.i * cell + 1, cell - 2, cell - 2);
      }

      // Phase legend: colour bar from +π (top) to −π (bottom)
      const barX = left + grid + 16;
      const barW = 14;
      for (let y = 0; y < grid; y++) {
        ctx.fillStyle = phaseToCss(Math.PI - (2 * Math.PI * y) / grid);
        ctx.fillRect(barX, top + y, barW, 1);
      }

      ctx.fillStyle = '#ccc';
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('phase', barX + barW / 2 + 6, top - 6);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      [['π', 0], ['π/2', 0.25], ['0', 0.5], ['−π/2', 0.75], ['−π', 1]]
        .forEach(([label, f]) => ctx.fillText(label, barX + barW + 5, top + f * grid));

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }
};
