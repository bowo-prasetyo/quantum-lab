// |⟨ZᵢZⱼ⟩| for every pair of qubits: how reliably their measured bits agree
// or disagree. Not a measure of entanglement (|0…0⟩ shows 1.00 everywhere).

import * as engine from '../engine.js';

const NODES = {
  2: [{ x: 150, y: 125 }, { x: 450, y: 125 }],
  3: [{ x: 300, y: 50 }, { x: 120, y: 200 }, { x: 480, y: 200 }]
};

export const CorrelationGraph = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card">
      <h2>Correlation Graph</h2>
      <canvas ref="canvas" width="600" height="250"></canvas>
      <p class="caption">
        Each edge shows how reliably two qubits' measured bits agree or disagree
        (1.00 = always, 0.00 = unrelated). It is not a measure of entanglement:
        |{{ '0'.repeat(n) }}⟩ shows 1.00 although nothing is entangled.
      </p>
    </div>
  `,

  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
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

    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const nodes = NODES[this.n];

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const edge of this.edges()) {
        const a = nodes[edge.q1];
        const b = nodes[edge.q2];
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 1 + edge.strength * 10;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText(edge.strength.toFixed(2), (a.x + b.x) / 2, (a.y + b.y) / 2 - 8);
      }

      nodes.forEach((node, i) => {
        ctx.fillStyle = '#2f6fed';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(`Q${i}`, node.x - 8, node.y + 5);
      });
    }
  }
};
