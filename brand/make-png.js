// Exports the PNG versions of the logo from the SVG files, using Playwright.
// Usage, from the repository root: node brand/make-png.js
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const root = resolve('.');
const url = file => 'file://' + resolve(root, file);

const browser = await chromium.launch();
const page = await browser.newPage();

async function shot(html, width, height, out) {
  await page.setViewportSize({ width, height });
  await page.setContent(`<html><body style="margin:0">${html}</body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: resolve(root, out), omitBackground: true, clip: { x: 0, y: 0, width, height } });
}

await page.goto(url('index.html')).catch(() => {}); // a file:// page, so file:// images load
await shot(`<img src="${url('favicon.svg')}" width="32" height="32">`, 32, 32, 'favicon-32.png');
await shot(`<div style="width:180px;height:180px;background:#111;display:flex;align-items:center;justify-content:center">
  <img src="${url('brand/glass-qubit-mark.svg')}" width="150" height="150"></div>`, 180, 180, 'apple-touch-icon.png');
await shot(`<img src="${url('brand/glass-qubit-mark.svg')}" width="512" height="512">`, 512, 512, 'brand/glass-qubit-mark-512.png');
await shot(`<img src="${url('brand/social-preview.svg')}" width="1280" height="640">`, 1280, 640, 'brand/social-preview.png');

await browser.close();
