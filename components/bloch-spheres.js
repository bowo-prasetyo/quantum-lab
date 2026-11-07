// One Bloch sphere per qubit, computed from that qubit's reduced state.
// A vector shorter than 1 means the qubit is entangled with the others.

import * as engine from '../engine.js';
import { fitCanvas, redrawOnResize } from './canvas-fit.js';

// Avoids printing "-0.00"
const fmt = v => {
  const s = v.toFixed(2);
  return (Number(s) === 0 ? '0.00' : s).replace('-', '−');
};

function drawSphere(canvas, x, y, z) {
  const fit = fitCanvas(canvas, w => w);
  if (!fit) return;
  const { ctx, width: W, height: H } = fit;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.38;
  const perspective = 0.35;

  const project = (px, py, pz) => ({
    x: cx + (px + py * perspective) * radius,
    y: cy - (pz + py * perspective) * radius
  });

  const line = (a, b) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Sphere outline and equator
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Axes
  ctx.strokeStyle = '#555';
  line(project(-1, 0, 0), project(1, 0, 0));
  line(project(0, -1, 0), project(0, 1, 0));
  line(project(0, 0, -1), project(0, 0, 1));

  // Pole labels
  ctx.fillStyle = '#fff';
  ctx.font = '13px Arial, sans-serif';
  ctx.textAlign = 'center';
  const north = project(0, 0, 1);
  const south = project(0, 0, -1);
  ctx.textBaseline = 'bottom';
  ctx.fillText('|0⟩', north.x, north.y - 4);
  ctx.textBaseline = 'top';
  ctx.fillText('|1⟩', south.x, south.y + 4);
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';

  // Bloch vector
  const tip = project(x, y, z);
  ctx.strokeStyle = '#2f6fed';
  ctx.lineWidth = 3;
  line({ x: cx, y: cy }, tip);
  ctx.fillStyle = '#2f6fed';
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export const BlochSpheres = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  computed: {
    vectors() {
      return [...Array(this.n).keys()].map(q => engine.blochVector(this.re, this.im, q, this.n));
    }
  },

  // The coordinates are text under each sphere, so they stay readable at
  // any size and screen readers can read them.
  template: `
    <div class="card">
      <h2>{{ n === 1 ? 'Bloch Sphere' : 'Bloch Spheres' }}</h2>
      <div class="bloch-row">
        <figure v-for="(v, q) in vectors" :key="q" class="bloch-cell">
          <figcaption>Qubit {{ q }}</figcaption>
          <canvas :ref="el => setCanvas(q, el)" role="img"
            :aria-label="'Bloch sphere of qubit ' + q"></canvas>
          <p class="bloch-coords">x = {{ fmt(v.x) }} · y = {{ fmt(v.y) }} · z = {{ fmt(v.z) }}</p>
        </figure>
      </div>
      <p v-if="n >= 2" class="caption">
        A vector shorter than 1 means that qubit is entangled with the others.
      </p>
    </div>
  `,

  created() { this.canvases = []; },
  mounted() { this.draw(); },
  watch: { re() { this.draw(); }, im() { this.draw(); } },

  methods: {
    fmt,

    setCanvas(q, el) { if (el) this.canvases[q] = el; },

    draw() {
      this.vectors.forEach((v, q) => {
        const canvas = this.canvases[q];
        if (canvas) drawSphere(canvas, v.x, v.y, v.z);
      });
    }
  }
};
