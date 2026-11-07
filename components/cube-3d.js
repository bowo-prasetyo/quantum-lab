// WebGL view of the 8 basis states of 3 qubits at the corners of a cube.
// Point size = probability, colour = phase. Drag (mouse, finger or pen) to
// rotate; mouse wheel or two-finger pinch to zoom.

import { phaseToRgb } from '../colors.js';

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
  props: {
    re: { type: Float64Array, required: true },
    im: { type: Float64Array, required: true }
  },

  data() {
    return {
      webglSupported: true,
      camera: { rotX: 0, rotY: 0, distance: 4 }
    };
  },

  template: `
    <div class="card">
      <h2>3D View</h2>
      <canvas
        ref="canvas"
        class="webgl-canvas"
        width="600"
        height="300"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      ></canvas>
      <p class="caption" v-if="webglSupported">
        The 8 basis states sit at the corners of a cube: point size shows
        probability and colour shows phase.
        Drag to rotate. Use the mouse wheel or pinch with two fingers to zoom.
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
    this.render();
  },

  beforeUnmount() {
    this.$refs.canvas?.removeEventListener('wheel', this.onWheel);
  },

  watch: { re() { this.render(); }, im() { this.render(); } },

  methods: {
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
      const projection = mat4Perspective(Math.PI / 3, canvas.width / canvas.height, 0.1, 100);
      const view = mat4Identity();
      view[14] = -this.camera.distance;
      const rotation = mat4Multiply(mat4RotateY(this.camera.rotY), mat4RotateX(this.camera.rotX));
      const modelView = mat4Multiply(view, rotation);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const vertices = [];
      const sizes = [];
      const colors = [];

      for (let i = 0; i < 8; i++) {
        const re = this.re[i];
        const im = this.im[i];
        // Corner of the cube: one axis per qubit (q0 = x, q1 = y, q2 = z)
        vertices.push((i >> 2) & 1 ? 1 : -1, (i >> 1) & 1 ? 1 : -1, i & 1 ? 1 : -1);
        sizes.push(5 + (re * re + im * im) * 60);
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

    onPointerDown(e) {
      // Keep receiving this pointer's events even if it leaves the canvas
      e.currentTarget.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.pinchDistance = this.pointerSpread();
    },

    onPointerMove(e) {
      const last = this.pointers.get(e.pointerId);
      if (!last) return; // mouse moving without a button pressed

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
