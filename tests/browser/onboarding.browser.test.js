// Browser tests for the first-visit welcome, the free lab's advanced views
// switch, and the qubit-order note.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, test } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(400);
const heading = (page, name) => page.getByRole('heading', { name, exact: true });
const welcome = page => page.getByText('Welcome!', { exact: false });

// A fresh browser (nothing saved) unless `storage` presets localStorage
async function withPage(hash, body, storage = {}) {
  const context = await env.browser.newContext();
  await context.addInitScript(items => {
    for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v);
  }, storage);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(env.base + hash);
    await page.locator('h1').first().waitFor();
    await settle(page);
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

describe('Welcome', () => {
  test('a first visit is offered the lessons; Explore the lab dismisses it for good', () =>
    withPage('#/lab/1', async page => {
      assert.ok(await welcome(page).isVisible());
      await page.getByRole('button', { name: 'Explore the lab' }).click();
      assert.equal(await welcome(page).count(), 0);
      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await welcome(page).count(), 0, 'still dismissed after a reload');
    }));

  test('Start lesson 1 opens the first lesson', () =>
    withPage('#/lab/2', async page => {
      await page.getByRole('link', { name: 'Start lesson 1' }).click();
      await page.getByRole('heading', { name: 'Bit flip' }).waitFor();
      await page.goto(env.base + '#/lab/2');
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await welcome(page).count(), 0, 'not shown again');
    }));

  test('is not shown to someone who has opened the lessons, or has a saved lab', async () => {
    await withPage('#/lessons', async page => {
      await page.goto(env.base + '#/lab/1');
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await welcome(page).count(), 0, 'after the lessons');
    });
    await withPage('#/lab/1', async page => {
      await page.getByRole('button', { name: 'H', exact: true }).click();   // saves the lab
      await settle(page);
      // Forget the welcome, as for someone who used the lab before it existed
      await page.evaluate(() => localStorage.removeItem('glass-qubit-welcomed'));
      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await welcome(page).count(), 0, 'with a saved lab');
    });
  });
});

describe('Advanced views', () => {
  test('start hidden in the free lab, are one switch away, and the choice is remembered', () =>
    withPage('#/lab/3', async page => {
      for (const h of ['Quantum State', 'Probabilities', 'Shots', 'Bloch Spheres', 'Interference']) {
        assert.equal(await heading(page, h).count(), 1, h);
      }
      for (const h of ['Density Matrix', 'Unitary Matrix', 'Correlation Graph', 'Pauli Expectations', 'Entanglement', '3D View']) {
        assert.equal(await heading(page, h).count(), 0, `${h} hidden`);
      }
      assert.match(
        await page.locator('.advanced-toggle').innerText(),
        /Noise, the density matrix, the unitary matrix, correlations, Pauli expectations, entanglement and the 3D view/
      );

      const toggle = page.getByRole('button', { name: 'Show advanced views' });
      assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
      await toggle.click();
      for (const h of ['Density Matrix', 'Unitary Matrix', 'Correlation Graph', 'Pauli Expectations', 'Entanglement', '3D View']) {
        assert.equal(await heading(page, h).count(), 1, `${h} shown`);
      }
      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await heading(page, 'Density Matrix').count(), 1, 'remembered');
      await page.getByRole('button', { name: 'Hide advanced views' }).click();
      assert.equal(await heading(page, 'Density Matrix').count(), 0);
    }));

  test('are on by default once the learner reaches Part 3 of the lessons', () =>
    withPage('#/lab/1', async page => {
      assert.equal(await heading(page, 'Density Matrix').count(), 1);
    }, { 'quantum-lab-predictions': JSON.stringify({ ghz: true }) }));

  test('lessons still show the panels they list', () =>
    withPage('#/lessons/density-matrix', async page => {
      assert.equal(await heading(page, 'Density Matrix').count(), 1);
      assert.equal(await page.locator('.advanced-toggle').count(), 0, 'no switch in lessons');
    }));
});

describe('Qubit order', () => {
  test('the table says which digit is which qubit', () =>
    withPage('#/lab/3', async page => {
      assert.equal(
        (await page.locator('.qubit-order').innerText()).trim(),
        'Qubit 0 is the left digit: |100⟩ means qubit 0 is 1 and the others are 0.'
      );
    }));
});
