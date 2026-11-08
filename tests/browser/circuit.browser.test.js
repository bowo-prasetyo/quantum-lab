// Browser tests for Undo and the circuit editor's Run, Step, Clear and
// step removal.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage, test } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const probabilities = page => page.locator('.amp-table tbody tr td:nth-child(3)').allInnerTexts();
const button = (page, name, nth = 0) => page.getByRole('button', { name, exact: true }).nth(nth);
// The circuit editor's palette chip for a gate on a qubit (0 by default);
// CNOT and CZ use the chosen control → target pair
const paletteGate = (page, name, qubit = 0) => ['CNOT', 'CZ'].includes(name)
  ? page.getByRole('button', { name: new RegExp(`^Add ${name}, `) })
  : page.getByRole('button', { name: `Add ${name} on Q${qubit}`, exact: true });
const steps = async page => (await page.locator('.circuit-step-label').allInnerTexts()).map(s => s.trim());
const settle = page => page.waitForTimeout(300);

// Runs a test body on a fresh page and checks it logged no errors
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

describe('Undo', () => {
  test('undoes gates one at a time, and is off when there is nothing to undo', () =>
    withPage('#/lab/1', async page => {
      assert.ok(await button(page, 'Undo').isDisabled(), 'nothing to undo yet');
      await button(page, 'H').click();
      await button(page, 'Z').click();
      await settle(page);
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['50.0%', '50.0%'], 'back to H|0⟩');
      assert.match((await page.locator('.amp-table tbody tr').nth(1).innerText()), /0\.707 \+ 0\.000i/);
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['100.0%', '0.0%'], 'back to |0⟩');
      assert.ok(await button(page, 'Undo').isDisabled());
    }));

  test('undoes a measurement, bringing back the superposition and clearing its bit', () =>
    withPage('#/lab/2', async page => {
      await button(page, 'Create Bell Pair').click();
      await page.getByRole('button', { name: 'Measure qubit 0' }).click();
      await settle(page);
      assert.equal(await page.locator('.bits').count(), 1);
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '0.0%', '50.0%']);
      assert.equal(await page.locator('.bits').count(), 0, 'classical bit gone');
      assert.ok(await page.getByText('Measurement: -').isVisible());
    }));

  test('Ctrl+Z undoes, and Reset can be undone', () =>
    withPage('#/lab/1', async page => {
      await button(page, 'X').click();
      await button(page, 'Reset').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['100.0%', '0.0%']);
      await page.locator('body').press('Control+z');
      await settle(page);
      assert.deepEqual(await probabilities(page), ['0.0%', '100.0%'], 'back to X|0⟩ = |1⟩');
    }));
});

describe('Circuit editor', () => {
  test('Run Circuit starts from |0…0⟩, so running twice gives the same result', () =>
    withPage('#/lab/1', async page => {
      await paletteGate(page, 'X').click();
      await button(page, 'Run Circuit').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['0.0%', '100.0%']);
      await button(page, 'Run Circuit').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['0.0%', '100.0%'], 'still |1⟩, not X applied twice');

      // Unticked: the circuit acts on the current state
      await page.getByLabel('Start from |0⟩').uncheck();
      await button(page, 'Run Circuit').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['100.0%', '0.0%'], 'X on |1⟩ gives |0⟩');
    }));

  test('Step applies one step at a time, highlights it, and starts again after the last', () =>
    withPage('#/lab/2', async page => {
      await paletteGate(page, 'H').click();
      await paletteGate(page, 'CNOT').click();
      assert.deepEqual(await steps(page), ['H q0', 'CNOT q0→q1']);

      await button(page, 'Step').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '50.0%', '0.0%'], 'after H');
      assert.equal(await page.locator('.circuit-step.current .circuit-step-label').innerText(), 'H q0');
      assert.equal(await page.locator('.circuit-status').innerText(), 'Step 1 of 2: H q0.');

      await button(page, 'Step').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '0.0%', '50.0%'], 'Bell pair');
      assert.match(await page.locator('.circuit-status').innerText(), /^Step 2 of 2: CNOT q0→q1\. All steps applied/);
      assert.equal(await page.locator('.circuit-step.done').count(), 2);

      // Undo steps back one step, position included
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '50.0%', '0.0%']);
      assert.equal(await page.locator('.circuit-status').innerText(), 'Step 1 of 2: H q0.');

      // A gate pressed by hand ends stepping; the next Step starts again
      await button(page, 'X', 1).click();
      await settle(page);
      assert.equal(await page.locator('.circuit-step.done').count(), 0);
      await button(page, 'Step').click();
      await settle(page);
      assert.equal(await page.locator('.circuit-status').innerText(), 'Step 1 of 2: H q0.');
      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '50.0%', '0.0%'], 'from |00⟩ again');
    }));

  test('steps can be removed with the keyboard, cleared, and brought back with Undo', () =>
    withPage('#/lab/1', async page => {
      for (const g of ['H', 'X', 'Z']) await paletteGate(page, g).click();
      const removeX = page.getByRole('button', { name: 'Remove step 2, X q0' });
      await removeX.focus();
      await page.keyboard.press('Enter');
      assert.deepEqual(await steps(page), ['H q0', 'Z q0']);
      assert.equal(
        await page.evaluate(() => document.activeElement.getAttribute('aria-label')),
        'Remove step 2, Z q0',
        'focus moves to the step that took its place'
      );

      await button(page, 'Clear').click();
      assert.deepEqual(await steps(page), []);
      assert.ok(await page.getByText('Empty: add gates above.').isVisible());
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await steps(page), ['H q0', 'Z q0'], 'Clear undone');
      await button(page, 'Undo').click();
      await settle(page);
      assert.deepEqual(await steps(page), ['H q0', 'X q0', 'Z q0'], 'removal undone');
    }));

  test('the gate buttons wait while a circuit runs', () =>
    withPage('#/lab/1', async page => {
      for (let i = 0; i < 3; i++) await paletteGate(page, 'H').click();
      await button(page, 'Run Circuit').click();
      await page.waitForTimeout(100);
      assert.ok(await button(page, 'X').isDisabled(), 'gate buttons disabled');
      assert.ok(await button(page, 'Undo').isDisabled(), 'Undo disabled');
      assert.ok(await page.getByRole('button', { name: 'Running…' }).isDisabled());
      await page.getByRole('button', { name: 'Run Circuit' }).waitFor({ timeout: 5000 });
      assert.ok(await button(page, 'X').isEnabled(), 'enabled again afterwards');
    }));
});
