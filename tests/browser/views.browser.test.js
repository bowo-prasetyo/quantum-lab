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
