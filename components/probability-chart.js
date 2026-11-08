// Bar chart of the measurement probability of every basis state.

import * as engine from '../engine.js';
import { fitCanvas, redrawOnResize, themeColors } from './canvas-fit.js';

export const ProbabilityChart = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card">
      <h2>Probabilities</h2>
      <canvas ref="canvas" role="img" :aria-label="summary"></canvas>
    </div>
  `,

  computed: {
    probs() {
      return engine.probabilities(this.re, this.im);
    },
    // Text alternative for screen readers, e.g. "|00⟩ 50.0%, |11⟩ 50.0%"
    summary() {
      const likely = this.probs
        .map((p, i) => [engine.basisLabel(i, this.n), p])
        .filter(([, p]) => p > 0.0005)
        .map(([label, p]) => `${label} ${(p * 100).toFixed(1)}%`);
      return `Probability chart: ${likely.join(', ')}`;
    }
  },

  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const fit = fitCanvas(canvas, w => Math.min(300, Math.max(200, w * 0.4)));
      if (!fit) return;
      const { ctx, width: W, height: H } = fit;

      const colors = themeColors();
      const probs = this.probs;
      const count = probs.length;

      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      // Spread the bars over the width; at most 70 px wide each
      const pad = 10;
      const slot = (W - 2 * pad) / count;
      const barWidth = Math.min(70, slot * 0.7);
      const baseline = H - 32;
      const maxHeight = baseline - 30; // room for the percentage above a full bar

      ctx.font = `${slot < 56 ? 11 : 13}px Arial, sans-serif`;
      ctx.textAlign = 'center';

      for (let i = 0; i < count; i++) {
        const cx = pad + slot * (i + 0.5);
        const height = probs[i] * maxHeight;

        ctx.fillStyle = colors.bar;
        ctx.fillRect(cx - barWidth / 2, baseline - height, barWidth, height);

        ctx.fillStyle = colors.text;
        ctx.fillText(engine.basisLabel(i, this.n), cx, baseline + 20);

        // Drop the decimal if the label would not fit above its bar
        let text = `${(probs[i] * 100).toFixed(1)}%`;
        if (ctx.measureText(text).width > slot - 2) text = `${Math.round(probs[i] * 100)}%`;
        ctx.fillText(text, cx, baseline - height - 8);
      }

      ctx.textAlign = 'start';
    }
  }
};
