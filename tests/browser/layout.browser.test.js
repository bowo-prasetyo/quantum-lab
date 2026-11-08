// Browser tests for the workbench layout: a gate's effect is visible where
// the gate is pressed, on wide and narrow screens, and the canvases are
// drawn at the screen's real resolution.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const DESKTOP = { viewport: { width: 1280, height: 800 } };
// A phone-sized screen with a high pixel density
const PHONE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };

async function open(options, hash) {
  const page = await (await env.browser.newContext(options)).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(env.base + hash);
  await page.locator('h1').first().waitFor();
  await page.waitForTimeout(300); // let the canvases draw
  return { page, errors };
}

// Whether an element is fully inside the window
const inView = locator => locator.evaluate(el => {
  const r = el.getBoundingClientRect();
  return r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
});

const heading = (page, name) => page.getByRole('heading', { name, exact: true });

describe('Workbench layout', () => {
  test('wide screen: gates sit beside the views and stay put while the views scroll', async () => {
    const { page, errors } = await open(DESKTOP, '#/lab/3');
    try {
      const gates = page.locator('.gate-panel');
      const table = page.locator('.amp-table');
      const gatesBox = await gates.boundingBox();
      const tableBox = await table.boundingBox();
      assert.ok(gatesBox.x + gatesBox.width <= tableBox.x, 'gates are left of the views');
      assert.ok(await inView(page.getByRole('button', { name: 'H', exact: true }).first()), 'H visible');
      assert.ok(await inView(table), 'state table visible without scrolling');

      // Scroll down to the lower views: the gates follow
      await page.getByRole('button', { name: 'Show advanced views' }).click();
      await heading(page, 'Correlation Graph').scrollIntoViewIfNeeded();
      assert.ok(await inView(page.getByRole('button', { name: 'Reset', exact: true })), 'gates still visible');
      assert.equal(await page.getByRole('tab').count(), 0, 'no view tabs on a wide screen');
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('wide screen lesson: steps, gates and the result are on one screen', async () => {
    const { page, errors } = await open(DESKTOP, '#/lessons/bell-pair');
    try {
      await heading(page, '2. Try it').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 200));
      for (const target of [
        page.getByRole('button', { name: 'Check my result' }),
        page.getByRole('button', { name: 'H', exact: true }).first(),
        page.locator('.amp-table')
      ]) {
        assert.ok(await inView(target), await target.innerText());
      }
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('narrow screen: one view at a time in tabs, above the gates', async () => {
    const { page, errors } = await open(PHONE, '#/lab/3');
    try {
      await page.getByRole('button', { name: 'Show advanced views' }).click();
      const tabs = page.getByRole('tab');
      assert.deepEqual(
        await tabs.allInnerTexts(),
        ['State', 'Probabilities', 'Shots', 'Bloch spheres', 'Interference', 'Density matrix', 'Correlations', 'Pauli', 'Entanglement', '3D']
      );
      assert.equal(await page.getByRole('tab', { selected: true }).innerText(), 'State');
      assert.equal(await heading(page, 'Quantum State').count(), 1);
      assert.equal(await heading(page, 'Probabilities').count(), 0, 'other views hidden');

      const viewsBox = await page.locator('.workbench-views').boundingBox();
      const gatesBox = await page.locator('.gate-panel').boundingBox();
      assert.ok(viewsBox.y + viewsBox.height <= gatesBox.y, 'views above the gates');

      // Click a tab, then move with the arrow keys
      await page.getByRole('tab', { name: 'Bloch spheres' }).click();
      assert.equal(await page.locator('.bloch-row canvas').count(), 3);
      assert.ok(await page.locator('.bloch-row').isVisible());
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.getByRole('tab', { selected: true }).innerText(), 'Interference');
      assert.ok(await heading(page, 'Interference').isVisible());
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent.trim()),
        'Interference',
        'focus follows the selected tab'
      );

      // No sideways scrolling, and the table's Phase column fits
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
      await page.getByRole('tab', { name: 'State' }).click();
      const table = await page.locator('.table-scroll').evaluate(t => [t.scrollWidth, t.clientWidth]);
      assert.ok(table[0] <= table[1], `table fits: ${table}`);
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('canvases are drawn at the screen\'s pixel density and redrawn when shown', async () => {
    const { page, errors } = await open(PHONE, '#/lab/2');
    try {
      await page.getByRole('tab', { name: 'Probabilities' }).click();
      await page.waitForTimeout(200);
      const chart = await page.locator('.workbench-views canvas').first().evaluate(c => ({
        pixels: c.width,
        css: c.clientWidth
      }));
      assert.ok(chart.css > 0, 'chart shown');
      assert.equal(chart.pixels, Math.round(chart.css * 3), `chart: ${JSON.stringify(chart)}`);

      // The chart's text alternative follows the state
      await page.getByRole('button', { name: 'H', exact: true }).first().click();
      await page.waitForTimeout(300);
      assert.equal(
        await page.getByRole('img', { name: /Probability chart/ }).getAttribute('aria-label'),
        'Probability chart: |00⟩ 50.0%, |10⟩ 50.0%'
      );
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });
});
