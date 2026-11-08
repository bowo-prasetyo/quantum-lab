// |⟨ZᵢZⱼ⟩| for every pair of qubits: how reliably their measured bits agree
// or disagree. Not a measure of entanglement (|0…0⟩ shows 1.00 everywhere).

import * as engine from '../engine.js';
import { fitCanvas, redrawOnResize, themeColors } from './canvas-fit.js';

// Node positions as fractions of the width and height
const NODES = {
  2: [{ x: 0.25, y: 0.5 }, { x: 0.75, y: 0.5 }],
  3: [{ x: 0.5, y: 0.2 }, { x: 0.2, y: 0.8 }, { x: 0.8, y: 0.8 }]
};

export const CorrelationGraph = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card">
      <h2>Correlation Graph</h2>
      <canvas ref="canvas" role="img" :aria-label="summary"></canvas>
      <p class="caption">
        Each edge shows how reliably two qubits' measured bits agree or disagree
        (1.00 = always, 0.00 = as often one way as the other). It is not a measure
        of entanglement: |{{ '0'.repeat(n) }}⟩ shows 1.00 although nothing is
        entangled, and an entangled pair can show 0.00.
      </p>
    </div>
  `,

  computed: {
    edges() {
      const result = [];
      for (let q1 = 0; q1 < this.n; q1++) {
        for (let q2 = q1 + 1; q2 < this.n; q2++) {
          result.push({
            q1,
            q2,
            strength: Math.abs(engine.zzCorrelation(this.re, this.im, q1, q2, this.n))
          });
        }
      }
      return result;
    },
    summary() {
      return 'Correlation graph: ' +
        this.edges.map(e => `Q${e.q1} and Q${e.q2} ${e.strength.toFixed(2)}`).join(', ');
    }
  },

  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const fit = fitCanvas(canvas, w => Math.min(250, Math.max(180, w * 0.42)));
      if (!fit) return;
      const { ctx, width: W, height: H } = fit;
      const colors = themeColors();
      const nodes = NODES[this.n].map(p => ({ x: p.x * W, y: p.y * H }));

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'center';

      for (const edge of this.edges) {
        const a = nodes[edge.q1];
        const b = nodes[edge.q2];
        ctx.strokeStyle = colors.bar;
        ctx.lineWidth = 1 + edge.strength * 8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = colors.text;
        ctx.fillText(edge.strength.toFixed(2), (a.x + b.x) / 2, (a.y + b.y) / 2 - 10);
      }

      ctx.textBaseline = 'middle';
      nodes.forEach((node, i) => {
        ctx.fillStyle = colors.vector;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(`Q${i}`, node.x, node.y);
      });

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
    }
  }
};
