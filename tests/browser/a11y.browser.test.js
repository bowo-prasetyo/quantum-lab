// Browser tests for accessibility: screen-reader announcements, contrast,
// and reading the density matrix and 3D view as text, by pointer and keyboard.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(350);
const button = (page, name, nth = 0) => page.getByRole('button', { name, exact: true }).nth(nth);
const announcement = page => page.getByTestId('announcer').innerText();
const readout = (page, card) => page.locator(`.card:has(> h2:text-is("${card}")) .readout`).innerText();

async function withPage(hash, body) {
  const { page, errors } = await openPage(env.browser, env.base + hash);
  try {
    await settle(page);
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await page.context().close();
  }
}

describe('Screen-reader announcements', () => {
  test('say what each action did and the outcomes it leaves', () =>
    withPage('#/lab/2', async page => {
      const announcer = page.getByTestId('announcer');
      assert.equal(await announcer.getAttribute('aria-live'), 'polite');

      await button(page, 'H').click();
      await settle(page);
      assert.equal(await announcement(page), 'H on qubit 0. Now: |00⟩ 50%, |10⟩ 50%.');

      await button(page, 'CNOT').click();
      await settle(page);
      assert.equal(await announcement(page), 'CNOT, control qubit 0, target qubit 1. Now: |00⟩ 50%, |11⟩ 50%.');

      await page.getByRole('button', { name: 'Measure qubit 0' }).click();
      await settle(page);
      assert.match(await announcement(page), /^Measured qubit 0: ([01])\. Now: \|\1\1⟩ 100%\.$/);

      await button(page, 'Undo').click();
      await settle(page);
      assert.equal(await announcement(page), 'Undone. Now: |00⟩ 50%, |11⟩ 50%.');

      await page.getByRole('button', { name: 'Add X on Q1', exact: true }).click();
      await settle(page);
      assert.equal(await announcement(page), 'Added X q1. The circuit has 1 step.');

      await button(page, 'Step').click();
      await settle(page);
      assert.equal(await announcement(page), 'Step 1 of 1: X q1. Now: |01⟩ 100%.');
    }));
});

describe('Contrast', () => {
  test('dimmed table rows still meet WCAG AA (4.5:1)', () =>
    withPage('#/lab/1', async page => {
      const ratio = await page.evaluate(() => {
        const rgb = el => getComputedStyle(el).color.match(/\d+/g).map(Number);
        const bg = el => getComputedStyle(el).backgroundColor.match(/\d+/g).map(Number);
        const lum = ([r, g, b]) => {
          const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const text = lum(rgb(document.querySelector('.amp-table tr.zero td')));
        const card = lum(bg(document.querySelector('.amp-table').closest('.card')));
        return (Math.max(text, card) + 0.05) / (Math.min(text, card) + 0.05);
      });
      assert.ok(ratio >= 4.5, `contrast ${ratio.toFixed(2)}:1`);
    }));
});

describe('Reading the views as text', () => {
  test('density matrix: by keyboard and by pointer', () =>
    withPage('#/lab/2', async page => {
      await button(page, 'Create Bell Pair').click();
      await settle(page);
      const canvas = page.locator('.readable-canvas');

      // Keyboard: focus starts on the top-left entry
      await canvas.focus();
      assert.equal(await readout(page, 'Density Matrix'),
        'Row and column |00⟩: size 0.500, phase 0° (the probability of |00⟩, 50%).');
      await page.keyboard.press('ArrowRight');
      assert.equal(await readout(page, 'Density Matrix'), 'Row |00⟩, column |01⟩: 0.');
      await page.keyboard.press('End');
      assert.equal(await readout(page, 'Density Matrix'), 'Row |00⟩, column |11⟩: size 0.500, phase 0°.');
      const scrolled = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.evaluate(() => scrollY), scrolled, 'arrow keys do not scroll the page');

      // Pointer: the bottom-right square (|11⟩, |11⟩)
      await canvas.scrollIntoViewIfNeeded();
      const box = await canvas.boundingBox();
      const { gridLeft, gridTop, cell } = await canvas.evaluate(c => ({
        gridLeft: Number(c.dataset.gridLeft), gridTop: Number(c.dataset.gridTop), cell: Number(c.dataset.cell)
      }));
      await page.mouse.move(box.x + gridLeft + cell * 3.5, box.y + gridTop + cell * 3.5);
      assert.equal(await readout(page, 'Density Matrix'),
        'Row and column |11⟩: size 0.500, phase 0° (the probability of |11⟩, 50%).');
    }));

  test('3D view: point at a corner to read it; arrow keys rotate', () =>
    withPage('#/lab/3', async page => {
      await button(page, 'S').click();    // nothing to see on |000⟩, but keeps the phase 0°
      await settle(page);
      const canvas = page.locator('.webgl-canvas');
      await canvas.scrollIntoViewIfNeeded();   // the mouse can only point at what is on screen
      const box = await canvas.boundingBox();

      // Where |000⟩ is drawn for a camera, from the same maths as the view
      const cornerAt = camera => page.evaluate(async ([camera, w, h]) => {
        const { projectCorners } = await import('./components/cube-3d.js');
        return projectCorners(camera, w, h)[0];
      }, [camera, box.width, box.height]);

      let c = await cornerAt({ rotX: 0, rotY: 0, distance: 4 });
      await page.mouse.move(box.x + c.x, box.y + c.y);
      assert.equal(await readout(page, '3D View'), '|000⟩: probability 100%, phase 0°.');

      // Rotate with the keyboard: |000⟩ moves, and is found where it now is
      await page.mouse.move(box.x + 2, box.y + 2);
      await canvas.focus();
      const scrolled = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.evaluate(() => scrollY), scrolled, 'arrow keys do not scroll the page');
      c = await cornerAt({ rotX: 0, rotY: 0.3, distance: 4 });
      await page.mouse.move(box.x + c.x, box.y + c.y);
      assert.equal(await readout(page, '3D View'), '|000⟩: probability 100%, phase 0°.');
    }));
});
