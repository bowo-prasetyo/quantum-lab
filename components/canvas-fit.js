// Keeps 2D canvases sharp and their text readable on every screen.
//
// A canvas used to be drawn at a fixed size (say 800 × 300) and then shrunk
// by CSS, so on a phone its 13 px labels came out about 5 px tall. Instead,
// fitCanvas sizes the canvas to the width it is displayed at, times the
// screen's pixel density, and the drawing code works in CSS pixels: a 12 px
// label is 12 px on any screen, and the layout adapts to the width.

/**
 * Sizes `canvas` to its displayed width. `heightFor(width)` returns the
 * drawing's height in CSS pixels for that width.
 *
 * Returns { ctx, width, height } in CSS pixels, or null if the canvas is not
 * displayed (for example on a hidden view tab). It is drawn again once it
 * is shown, through redrawOnResize.
 */
export function fitCanvas(canvas, heightFor) {
  const width = canvas.clientWidth;
  if (!width) return null;

  const height = Math.round(heightFor(width));
  const dpr = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);

  canvas.style.height = `${height}px`;
  // Setting width or height clears the canvas, so only when they change
  if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
  if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

/**
 * The canvas colours of the current theme (the --canvas-* tokens in
 * styles.css), read when drawing so the canvases follow the theme.
 */
export function themeColors() {
  const style = getComputedStyle(document.documentElement);
  const token = name => style.getPropertyValue(`--canvas-${name}`).trim();
  return {
    bg: token('bg'),
    text: token('text'),
    label: token('label'),
    outline: token('outline'),
    axis: token('axis'),
    cell: token('cell'),
    cellDiag: token('cell-diag'),
    grid: token('grid'),
    bar: token('bar'),
    vector: token('vector')
  };
}

/**
 * Component mixin: calls the component's draw() whenever one of its
 * canvases changes size (window resized, layout changed, tab shown), or
 * the colour theme changes (theme.js).
 * The redraw waits for the next frame, so a canvas that changes its own
 * height while drawing does not trigger a ResizeObserver loop error.
 */
export const redrawOnResize = {
  mounted() {
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => this.draw());
    });
    for (const canvas of this.$el.querySelectorAll('canvas')) {
      this.resizeObserver.observe(canvas);
    }
    this.onThemeChange = () => this.draw();
    window.addEventListener('themechange', this.onThemeChange);
  },

  beforeUnmount() {
    window.removeEventListener('themechange', this.onThemeChange);
    this.resizeObserver.disconnect();
    cancelAnimationFrame(this.resizeFrame);
  }
};
