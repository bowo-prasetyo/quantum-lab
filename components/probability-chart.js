// Bar chart of the measurement probability of every basis state.

import * as engine from '../engine.js';

export const ProbabilityChart = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card">
      <h2>Probabilities</h2>
      <canvas ref="canvas" width="800" height="300"></canvas>
    </div>
  `,

  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width;
      const probs = engine.probabilities(this.re, this.im);
      const count = probs.length;

      ctx.clearRect(0, 0, W, canvas.height);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, canvas.height);

      // Spread the bars over the width; at most 70 px wide each
      const slot = (W - 40) / count;
      const barWidth = Math.min(70, slot * 0.75);
      const baseline = 250;
      const maxHeight = 200;

      ctx.font = '13px Arial';
      ctx.textAlign = 'center';

      for (let i = 0; i < count; i++) {
        const cx = 20 + slot * i + slot / 2;
        const height = probs[i] * maxHeight;

        ctx.fillStyle = '#4caf50';
        ctx.fillRect(cx - barWidth / 2, baseline - height, barWidth, height);

        ctx.fillStyle = '#fff';
        ctx.fillText(engine.basisLabel(i, this.n), cx, baseline + 22);
        ctx.fillText((probs[i] * 100).toFixed(1) + '%', cx, baseline - height - 8);
      }

      ctx.textAlign = 'start';
    }
  }
};
