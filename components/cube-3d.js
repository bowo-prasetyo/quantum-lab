// WebGL view of the 8 basis states of 3 qubits at the corners of a cube.
// Point size = probability, colour = phase. Drag (mouse, finger or pen) or
// use the arrow keys to rotate; mouse wheel, pinch, or + and − to zoom.
// Pointing at or tapping a corner gives its probability and phase as text.

import { phaseToRgb } from '../colors.js';
import { redrawOnResize } from './canvas-fit.js';
import { basisLabel } from '../engine.js';
import { percent, degrees } from '../describe.js';

function mat4Perspective(fov, aspect, near, far) {
  const f = 1.0 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, (2 * far * near) * nf, 0
  ]);
}

function mat4Identity() {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
}

function mat4RotateX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]);
}

function mat4RotateY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
}

function mat4Multiply(a, b) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      o[i * 4 + j] =
        a[i * 4 + 0] * b[0 * 4 + j] +
        a[i * 4 + 1] * b[1 * 4 + j] +
        a[i * 4 + 2] * b[2 * 4 + j] +
        a[i * 4 + 3] * b[3 * 4 + j];
    }
  }
  return o;
}

// Corner of the cube for basis state i: one axis per qubit (q0 = x, q1 = y, q2 = z)
const corner = i => [(i >> 2) & 1 ? 1 : -1, (i >> 1) & 1 ? 1 : -1, i & 1 ? 1 : -1];

// The model-view and projection matrices the shader uses for this camera
function cameraMatrices(camera, aspect) {
  const projection = mat4Perspective(Math.PI / 3, aspect, 0.1, 100);
  const view = mat4Identity();
  view[14] = -camera.distance;
  const rotation = mat4Multiply(mat4RotateY(camera.rotY), mat4RotateX(camera.rotX));
  return { modelView: mat4Multiply(view, rotation), projection };
}

// Matrix × vector the way the shader does it (WebGL reads matrices column by column)
function transform(m, v) {
  return [0, 1, 2, 3].map(row => m[row] * v[0] + m[4 + row] * v[1] + m[8 + row] * v[2] + m[12 + row] * v[3]);
}

/**
 * Where each of the 8 corners appears on a width × height view, in CSS
 * pixels, and how far it is from the camera (`depth`), as the shader draws
 * them. Used to find the corner under the pointer.
 */
export function projectCorners(camera, width, height) {
  const { modelView, projection } = cameraMatrices(camera, width / height);
  return [...Array(8).keys()].map(i => {
    const world = transform(modelView, [...corner(i), 1]);
    const clip = transform(projection, world);
    return {
      x: (clip[0] / clip[3] + 1) / 2 * width,
      y: (1 - clip[1] / clip[3]) / 2 * height,
      depth: -world[2]
    };
  });
}

const VERTEX_SHADER = `
  attribute vec3 pos;
  attribute float pointSize;
  attribute vec3 color;
  uniform mat4 uModelView;
  uniform mat4 uProjection;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 world = uModelView * vec4(pos, 1.0);
    gl_Position = uProjection * world;
    gl_PointSize = pointSize / -world.z;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec3 vColor;
  void main() {
    float dx = gl_PointCoord.x - 0.5;
    float dy = gl_PointCoord.y - 0.5;
    if (dx * dx + dy * dy > 0.25) discard;
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

export const Cube3D = {
  mixins: [redrawOnResize],

  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true }
  },

  data() {
    return {
      webglSupported: true,
      camera: { rotX: 0, rotY: 0, distance: 4 },
      picked: null   // the basis state being read (pointed at or tapped), or null
    };
  },

  template: `
    <div class="card">
      <h2>3D View</h2>
      <canvas
        ref="canvas"
        class="webgl-canvas"
        tabindex="0"
        role="img"
        aria-label="3D view of the 8 basis states. Arrow keys rotate it; plus and minus zoom. The same probabilities and phases are in the Quantum State table."
        @keydown="onKeydown"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      ></canvas>
      <p v-if="webglSupported" class="readout">{{ readout || 'Point at or tap a corner to read it.' }}</p>
      <p class="caption" v-if="webglSupported">
        The 8 basis states sit at the corners of a cube: point size shows
        probability and colour shows phase.
        Drag or use the arrow keys to rotate. Use the mouse wheel, pinch with
        two fingers, or press + and − to zoom.
      </p>
      <p class="caption" v-else>WebGL is not available in this browser, so the 3D view is off.</p>
    </div>
  `,

  mounted() {
    // Active pointers: one rotates, two pinch-zoom
    this.pointers = new Map();
    this.pinchDistance = null;

    // passive: false lets onWheel stop the page from scrolling while zooming
    this.$refs.canvas.addEventListener('wheel', this.onWheel, { passive: false });

    this.init();
    this.draw();
  },

  beforeUnmount() {
    this.$refs.canvas?.removeEventListener('wheel', this.onWheel);
  },

  computed: {
    // e.g. "|101⟩: probability 12.5%, phase 90°"
    readout() {
      if (this.picked === null) return '';
      const re = this.re[this.picked];
      const im = this.im[this.picked];
      const p = re * re + im * im;
      const label = basisLabel(this.picked, 3);
      return p < 1e-12
        ? `${label}: probability 0%.`
        : `${label}: probability ${percent(p)}, phase ${degrees(Math.atan2(im, re))}.`;
    }
  },

  watch: { re() { this.render(); }, im() { this.render(); } },

  methods: {
    // Sizes the canvas to its displayed width at the screen's pixel
    // density (see canvas-fit.js), then draws. Skipped while hidden.
    draw() {
      const canvas = this.$refs.canvas;
      const width = canvas.clientWidth;
      if (!width) return;
      const height = Math.round(Math.min(300, Math.max(220, width * 0.5)));
      const dpr = window.devicePixelRatio || 1;
      canvas.style.height = `${height}px`;
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);
      if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
      if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
      // Point sizes are in device pixels and were tuned for a 300 px tall view
      this.pointScale = dpr * height / 300;
      this.render();
    },

    init() {
      const gl = this.$refs.canvas.getContext('webgl');
      if (!gl) {
        console.error('WebGL unsupported');
        this.webglSupported = false;
        return;
      }

      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(shader));
        }
        return shader;
      };

      const program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
      }

      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);

      // Kept off Vue's reactivity on purpose: plain instance properties
      this.gl = gl;
      this.program = program;
      this.buffers = {
        pos: gl.createBuffer(),
        size: gl.createBuffer(),
        color: gl.createBuffer()
      };
      this.loc = {
        mv: gl.getUniformLocation(program, 'uModelView'),
        p: gl.getUniformLocation(program, 'uProjection'),
        pos: gl.getAttribLocation(program, 'pos'),
        size: gl.getAttribLocation(program, 'pointSize'),
        color: gl.getAttribLocation(program, 'color')
      };
    },

    render() {
      const gl = this.gl;
      if (!gl) return;

      const canvas = this.$refs.canvas;
      const { modelView, projection } = cameraMatrices(this.camera, canvas.width / canvas.height);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const vertices = [];
      const sizes = [];
      const colors = [];

      for (let i = 0; i < 8; i++) {
        const re = this.re[i];
        const im = this.im[i];
        vertices.push(...corner(i));
        sizes.push((5 + (re * re + im * im) * 60) * (this.pointScale || 1));
        colors.push(...phaseToRgb(Math.atan2(im, re)));
      }

      gl.useProgram(this.program);
      gl.uniformMatrix4fv(this.loc.mv, false, modelView);
      gl.uniformMatrix4fv(this.loc.p, false, projection);

      const attribute = (buffer, location, data, components) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
      };

      attribute(this.buffers.pos, this.loc.pos, vertices, 3);
      attribute(this.buffers.size, this.loc.size, sizes, 1);
      attribute(this.buffers.color, this.loc.color, colors, 3);

      gl.drawArrays(gl.POINTS, 0, 8);
    },

    // The corner under a point on the canvas (client coordinates), or null.
    // Points are drawn bigger for likelier states, so the hit area grows too.
    cornerAt(clientX, clientY) {
      const canvas = this.$refs.canvas;
      const r = canvas.getBoundingClientRect();
      const x = clientX - r.left;
      const y = clientY - r.top;
      let best = null;
      projectCorners(this.camera, r.width, r.height).forEach((c, i) => {
        const p = this.re[i] * this.re[i] + this.im[i] * this.im[i];
        // Same size as the shader's point (device pixels → CSS pixels)
        const radius = (5 + p * 60) * (r.height / 300) / c.depth / 2;
        const distance = Math.hypot(x - c.x, y - c.y);
        if (distance <= Math.max(radius, 8) + 4 && (!best || distance < best.distance)) {
          best = { i, distance };
        }
      });
      return best ? best.i : null;
    },

    onPointerDown(e) {
      // Keep receiving this pointer's events even if it leaves the canvas
      e.currentTarget.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.pinchDistance = this.pointerSpread();
      this.downAt = { x: e.clientX, y: e.clientY };
    },

    onPointerMove(e) {
      const last = this.pointers.get(e.pointerId);
      if (!last) {
        // Mouse moving without a button pressed: read the corner under it
        const hit = this.cornerAt(e.clientX, e.clientY);
        if (hit !== null) this.picked = hit;
        return;
      }

      const current = { x: e.clientX, y: e.clientY };
      this.pointers.set(e.pointerId, current);

      if (this.pointers.size === 1) {
        this.camera.rotY += (current.x - last.x) * 0.01;
        this.camera.rotX += (current.y - last.y) * 0.01;
      } else if (this.pointers.size === 2) {
        const spread = this.pointerSpread();
        if (this.pinchDistance && spread) {
          // Fingers apart → closer camera (zoom in)
          this.setCameraDistance(this.camera.distance * (this.pinchDistance / spread));
        }
        this.pinchDistance = spread;
      }

      this.render();
    },

    onPointerUp(e) {
      this.pointers.delete(e.pointerId);
      this.pinchDistance = this.pointerSpread();
      // A tap (not a drag) reads the corner under it
      if (this.downAt && Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y) < 6) {
        const hit = this.cornerAt(e.clientX, e.clientY);
        if (hit !== null) this.picked = hit;
      }
      this.downAt = null;
    },

    // Arrow keys rotate; + and − zoom
    onKeydown(e) {
      const turn = 0.15;
      const actions = {
        ArrowLeft: () => { this.camera.rotY -= turn; },
        ArrowRight: () => { this.camera.rotY += turn; },
        ArrowUp: () => { this.camera.rotX -= turn; },
        ArrowDown: () => { this.camera.rotX += turn; },
        '+': () => this.setCameraDistance(this.camera.distance - 0.5),
        '=': () => this.setCameraDistance(this.camera.distance - 0.5),
        '-': () => this.setCameraDistance(this.camera.distance + 0.5)
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
      this.render();
    },

    pointerSpread() {
      if (this.pointers.size < 2) return null;
      const [a, b] = [...this.pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y) || null;
    },

    setCameraDistance(distance) {
      this.camera.distance = Math.max(2, Math.min(10, distance));
    },

    onWheel(e) {
      e.preventDefault();
      this.setCameraDistance(this.camera.distance + e.deltaY * 0.01);
      this.render();
    }
  }
};
