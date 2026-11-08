// Browser tests for the Shots, Interference and Entanglement views: each
// follows the lab's state, and says in words what it draws.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(300);
const button = (page, name) => page.getByRole('button', { name, exact: true }).first();
const card = (page, heading) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });

async function withLab(hash, body) {
  const { page, errors } = await openPage(env.browser, env.base + hash);
  try {
    await settle(page);
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await page.context().close();
  }
}

describe('Shots view', () => {
  test('counts follow the probabilities, leave the state alone, and clear on a new state', () =>
    withLab('#/lab/2', async page => {
      const shots = card(page, 'Shots');
      assert.match(await shots.locator('.shots-summary').innerText(), /No shots run yet/);

      await button(page, 'Create Bell Pair').click();
      await settle(page);
      await shots.getByRole('button', { name: 'Run 1000 shots' }).click();
      const summary = await shots.locator('.shots-summary').innerText();
      assert.match(summary, /^1000 shots: \|00⟩ \d+, \|11⟩ \d+\.$/);
      const [a, b] = summary.match(/\d+(?=,|\.)/g).map(Number);
      assert.equal(a + b, 1000);
      assert.ok(a > 400 && b > 400, summary);
      assert.equal(await shots.locator('.shots-row').count(), 4);

      // The state is still the Bell pair
      assert.match(await page.locator('.amp-table').innerText(), /\|00⟩\s+0\.707/);

      await button(page, 'H').click();
      await settle(page);
      assert.match(await shots.locator('.shots-summary').innerText(), /No shots run yet/);
    }));
});

describe('Interference view', () => {
  test('H, Z, H: the paths to |0⟩ cancel and the paths to |1⟩ add up', () =>
    withLab('#/lab/1', async page => {
      const view = card(page, 'Interference');
      assert.match(await view.innerText(), /Apply a gate to see/);

      for (const g of ['H', 'Z', 'H']) {
        await button(page, g).click();
        await settle(page);
      }
      assert.match(await view.locator('.interference-step').innerText(), /H on qubit 0/);
      const rows = view.locator('.interference-row');
      assert.equal(await rows.count(), 2);
      assert.equal(await rows.nth(0).getAttribute('data-kind'), 'cancel');
      assert.match(await rows.nth(0).innerText(), /\|0⟩: the paths cancel completely/);
      assert.match(await rows.nth(0).innerText(), /Probability 0% \(50% if the paths did not interfere\)/);
      assert.equal(await rows.nth(1).getAttribute('data-kind'), 'constructive');
      assert.equal(await rows.nth(1).locator('.phasor-path').count(), 2, 'two path arrows');
      assert.match(await rows.nth(0).innerText(), /0.500 from \|0⟩ − 0.500 from \|1⟩ = 0.000/);

      // Undo goes back to the previous step's paths (Z: one path each)
      await button(page, 'Undo').click();
      await settle(page);
      assert.match(await view.locator('.interference-step').innerText(), /Z on qubit 0/);
      assert.match(await view.innerText(), /nothing interferes/);
      assert.match(await view.locator('details').innerText(), /Show where each amplitude came from/);

      // A measurement has no paths
      await button(page, 'Measure all').click();
      await settle(page);
      assert.match(await view.innerText(), /The last step was a measurement/);

      await button(page, 'Reset').click();
      await settle(page);
      assert.match(await view.innerText(), /Apply a gate to see/);
    }));
});

describe('Entanglement view', () => {
  test('tells a GHZ state from a Bell pair plus a separate qubit', () =>
    withLab('#/lab/3', async page => {
      await button(page, 'Show advanced views').click();
      const view = card(page, 'Entanglement');
      assert.match(await view.locator('.entanglement-verdict').innerText(), /^No entanglement/);
      assert.equal(await view.getByRole('img').getAttribute('aria-label'),
        'Mutual information: Q0 and Q1 0.00 bits, Q0 and Q2 0.00 bits, Q1 and Q2 0.00 bits');

      await button(page, 'GHZ State').click();
      await settle(page);
      assert.match(await view.locator('.entanglement-verdict').innerText(), /^All three qubits are entangled together/);
      assert.equal(await view.getByRole('img').getAttribute('aria-label'),
        'Mutual information: Q0 and Q1 1.00 bits, Q0 and Q2 1.00 bits, Q1 and Q2 1.00 bits');

      await button(page, 'Create Bell Pair').click();
      await settle(page);
      await page.locator('.gate-row').nth(2).getByRole('button', { name: 'H', exact: true }).click();
      await settle(page);
      assert.equal(await view.locator('.entanglement-verdict').innerText(),
        'Qubits 0 and 1 are entangled with each other; qubit 2 is separate.');
      assert.deepEqual(await view.locator('.entropy-value').allInnerTexts(),
        ['S = 1.00 (maximally entangled)', 'S = 1.00 (maximally entangled)', 'S = 0.00 (not entangled)']);
    }));
});

describe('Hide global phase', () => {
  const ampRow = (page, label) => page.locator('.amp-table tr').filter({ hasText: label });

  test('rotates the table and the interference view, says why, and is remembered', () =>
    withLab('#/lab/1', async page => {
      const box = page.getByRole('checkbox', { name: 'Hide global phase' });
      assert.equal(await box.isChecked(), false);

      // Y|0⟩ = i|1⟩: a pure global phase of 90°
      await button(page, 'Y').click();
      await settle(page);
      assert.match(await ampRow(page, '|1⟩').innerText(), /0\.000 \+ 1\.000i\s+100\.0%\s+90°/);

      await box.check();
      await settle(page);
      assert.match(await ampRow(page, '|1⟩').innerText(), /1\.000 \+ 0\.000i\s+100\.0%\s+0°/);
      assert.match(await page.locator('.global-phase').innerText(), /relative to \|1⟩, the first non-zero amplitude/);

      // H, S, H: the interference sums match the table's turned amplitudes
      await button(page, 'Reset').click();
      for (const g of ['H', 'S', 'H']) {
        await button(page, g).click();
        await settle(page);
      }
      assert.match(await ampRow(page, '|0⟩').innerText(), /0\.707 \+ 0\.000i/);
      assert.match(await card(page, 'Interference').locator('.interference-row').first().innerText(), /= 0\.707$/m);

      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await page.getByRole('checkbox', { name: 'Hide global phase' }).isChecked(), true, 'remembered');
      await page.getByRole('checkbox', { name: 'Hide global phase' }).uncheck();
      await settle(page);
      assert.match(await ampRow(page, '|0⟩').innerText(), /0\.500 \+ 0\.500i/);
    }));

  test('Grover\'s marked amplitude reads 1 instead of −1', () =>
    withLab('#/lessons/grover', async page => {
      await page.getByRole('button', { name: 'Show me' }).click();
      // Show me plays its ten steps half a second apart
      await ampRow(page, '|11⟩').filter({ hasText: '−1.000 + 0.000i' }).waitFor({ timeout: 15000 });
      await page.getByRole('checkbox', { name: 'Hide global phase' }).check();
      await settle(page);
      assert.match(await ampRow(page, '|11⟩').innerText(), /1\.000 \+ 0\.000i\s+100\.0%\s+0°/);
    }));
});
