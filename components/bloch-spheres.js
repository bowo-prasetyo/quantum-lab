// One Bloch sphere per qubit, computed from that qubit's reduced state.
// A vector shorter than 1 means the qubit is entangled with the others.

import * as engine from '../engine.js';

function drawSphere(canvas, x, y, z) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;
  const radius = Math.min(W, H) * 0.35;
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

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // Sphere outline and equator
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 2;
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
  ctx.fillStyle = 'white';
  const north = project(0, 0, 1);
  const south = project(0, 0, -1);
  ctx.fillText('|0⟩', north.x - 10, north.y - 10);
  ctx.fillText('|1⟩', south.x - 10, south.y + 20);

  // Bloch vector
  const tip = project(x, y, z);
  ctx.strokeStyle = '#2f6fed';
  ctx.lineWidth = 4;
  line({ x: cx, y: cy }, tip);
  ctx.fillStyle = '#2f6fed';
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 6, 0, Math.PI * 2);
  ctx.fill();

  // Coordinates
  ctx.fillStyle = '#aaa';
  ctx.fillText(`x=${x.toFixed(2)}`, 10, 15);
  ctx.fillText(`y=${y.toFixed(2)}`, 10, 30);
  ctx.fillText(`z=${z.toFixed(2)}`, 10, 45);
}

export const BlochSpheres = {
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true }
  },

  template: `
    <div class="card">
      <h2>{{ n === 1 ? 'Bloch Sphere' : 'Bloch Spheres' }}</h2>
      <div class="bloch-row">
        <div v-for="q in n" :key="q">
          <p>Qubit {{ q - 1 }}</p>
          <canvas :ref="el => setCanvas(q - 1, el)" width="260" height="260"></canvas>
        </div>
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
    setCanvas(q, el) { if (el) this.canvases[q] = el; },

    draw() {
      for (let q = 0; q < this.n; q++) {
        const canvas = this.canvases[q];
        if (!canvas) continue;
        const v = engine.blochVector(this.re, this.im, q, this.n);
        drawSphere(canvas, v.x, v.y, v.z);
      }
    }
  }
};
