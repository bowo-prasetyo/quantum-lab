// One Bloch sphere per qubit, computed from that qubit's reduced state.
// A vector shorter than 1 means the qubit is entangled with the others.
//
// A single-qubit gate is a turn of the sphere (bloch-rotation.js). After
// one, its qubit's sphere shows the turn's axis (dashed) and the path the
// vector took (dotted), and the vector turns along it over about 0.45 s.
// With "reduce motion" on, the vector jumps but the axis and path are
// still drawn. Undo, Reset and other jumps draw no path.

import * as engine from '../engine.js';
import { fitCanvas, redrawOnResize, themeColors } from './canvas-fit.js';
import { GATE_ROTATIONS, rotate, arcPoints } from '../bloch-rotation.js';

const TURN_MS = 450;
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

// Avoids printing "-0.00"
const fmt = v => {
  const s = v.toFixed(2);
  return (Number(s) === 0 ? '0.00' : s).replace('-', '−');
};

// `turn`: { axis, path } to draw the gate's axis and the vector's path
function drawSphere(canvas, x, y, z, turn = null) {
  const fit = fitCanvas(canvas, w => w);
  if (!fit) return;
  const { ctx, width: W, height: H } = fit;
  const colors = themeColors();
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

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  // Sphere outline and equator
  ctx.strokeStyle = colors.outline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Axes
  ctx.strokeStyle = colors.axis;
  line(project(-1, 0, 0), project(1, 0, 0));
  line(project(0, -1, 0), project(0, 1, 0));
  line(project(0, 0, -1), project(0, 0, 1));

  // Pole labels
  ctx.fillStyle = colors.text;
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

  // The last gate's turn: its axis (dashed) and the vector's path (dotted)
  if (turn) {
    const [ax, ay, az] = turn.axis;
    ctx.save();
    ctx.strokeStyle = colors.label;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    line(project(-1.15 * ax, -1.15 * ay, -1.15 * az), project(1.15 * ax, 1.15 * ay, 1.15 * az));
    ctx.strokeStyle = colors.vector;
    ctx.lineWidth = 2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    turn.path.forEach(([px, py, pz], k) => {
      const p = project(px, py, pz);
      if (k === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Bloch vector
  const tip = project(x, y, z);
  ctx.strokeStyle = colors.vector;
  ctx.lineWidth = 3;
  line({ x: cx, y: cy }, tip);
  ctx.fillStyle = colors.vector;
  ctx.beginPath();
  ctx.arc(tip.x, tip.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

export const BlochSpheres = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true },
    n: { type: Number, required: true },
    // The lab's last step ({ message, re, im }, the state before it) and a
    // number that changes only when a new step is applied, so Undo and
    // jumps don't replay a turn
    step: { type: Object, default: null },
    stepId: { type: Number, default: 0 }
  },

  data() {
    // The last gate's turn, in words, for the caption
    return { turnText: '' };
  },

  computed: {
    vectors() {
      return [...Array(this.n).keys()].map(q => engine.blochVector(this.re, this.im, q, this.n));
    },
    // Changes once per update, however many of these change together
    stateKey() {
      return [this.re, this.im, this.stepId];
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
      <p v-if="turnText" class="caption bloch-turn">{{ turnText }}</p>
      <p v-if="n >= 2" class="caption">
        A vector shorter than 1 means that qubit is entangled with the others.
      </p>
    </div>
  `,

  created() {
    this.canvases = [];
    this.turn = null;        // { q, from, rotation } of the last gate
    this.progress = 1;       // how far along the turn the vector is drawn (0–1)
    this.seenStepId = this.stepId;
  },
  mounted() { this.draw(); },
  beforeUnmount() { cancelAnimationFrame(this.turnFrame); },
  watch: { stateKey() { this.onState(); } },

  methods: {
    fmt,

    setCanvas(q, el) { if (el) this.canvases[q] = el; },

    // A new step turns its qubit's vector; anything else (Undo, Reset,
    // a load) just shows the new state
    onState() {
      cancelAnimationFrame(this.turnFrame);
      const fresh = this.stepId !== this.seenStepId;
      this.seenStepId = this.stepId;
      this.turn = fresh ? this.turnFor(this.step) : null;
      this.turnText = this.turn
        ? `Last gate: ${this.step.message.gate} on qubit ${this.turn.q}, ${this.turn.rotation.text}. The dashed line is the axis; the dotted arc is the path the vector took.`
        : '';

      if (!this.turn || reducedMotion()) {
        this.progress = 1;
        this.draw();
        return;
      }
      const start = performance.now();
      const frame = now => {
        this.progress = Math.min(1, (now - start) / TURN_MS);
        this.draw();
        if (this.progress < 1) this.turnFrame = requestAnimationFrame(frame);
      };
      this.progress = 0;
      this.turnFrame = requestAnimationFrame(frame);
    },

    // The turn a step makes, or null if it isn't a single-qubit turn, or
    // if the vector doesn't move (at the centre, or lying on the axis)
    turnFor(step) {
      if (!step || step.message.type !== 'gate') return null;
      const rotation = GATE_ROTATIONS[step.message.gate];
      if (!rotation) return null;
      const q = step.message.targetQubit;
      const { x, y, z } = engine.blochVector(step.re, step.im, q, this.n);
      const [kx, ky, kz] = rotation.axis;
      if (Math.hypot(ky * z - kz * y, kz * x - kx * z, kx * y - ky * x) < 1e-6) return null;
      return { q, from: [x, y, z], rotation };
    },

    draw() {
      this.vectors.forEach((v, q) => {
        const canvas = this.canvases[q];
        if (!canvas) return;
        const turn = this.turn?.q === q ? this.turn : null;
        if (!turn) {
          drawSphere(canvas, v.x, v.y, v.z);
          return;
        }
        // Part way through the turn, the vector is drawn where it has got to
        const [x, y, z] = this.progress < 1
          ? rotate(turn.from, turn.rotation.axis, turn.rotation.angle * this.progress)
          : [v.x, v.y, v.z];
        drawSphere(canvas, x, y, z, {
          axis: turn.rotation.axis,
          path: arcPoints(turn.from, turn.rotation, this.progress)
        });
        canvas.dataset.turn = this.progress < 1 ? 'turning' : 'done';
      });
      for (const canvas of this.canvases) {
        if (canvas && this.turn?.q !== this.canvases.indexOf(canvas)) delete canvas.dataset.turn;
      }
    }
  }
};
