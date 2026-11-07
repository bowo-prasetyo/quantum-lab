// Browser tests for the shared control → target picker and the gate
// descriptions (hint line and screen-reader descriptions).

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage } from './helpers.js';
import { GATE_INFO } from '../../components/gate-hints.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(300);
const panel = page => page.locator('.gate-panel');
const editor = page => page.locator('.card:has(> h2:text-is("Circuit Editor"))');
const radio = (scope, group, qubit) =>
  scope.getByRole('radiogroup', { name: group }).getByRole('radio', { name: qubit, exact: true });
const checked = async (scope, group) =>
  (await scope.getByRole('radiogroup', { name: group }).getByRole('radio', { checked: true }).innerText()).trim();

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

describe('Control → target picker', () => {
  test('is the same in both panels and shares one choice', () =>
    withPage('#/lab/3', async page => {
      assert.equal(await checked(panel(page), 'Control qubit'), 'Q0');
      assert.equal(await checked(panel(page), 'Target qubit'), 'Q1');

      // Choose target Q2 in the Gates panel: the circuit editor follows
      await radio(panel(page), 'Target qubit', 'Q2').click();
      assert.equal(await checked(editor(page), 'Target qubit'), 'Q2');
      await editor(page).getByRole('button', { name: 'Add CNOT, control Q0, target Q2' }).click();
      assert.deepEqual(
        (await page.locator('.circuit-step-label').allInnerTexts()).map(s => s.trim()),
        ['CNOT q0→q2']
      );

      // And the other way round
      await radio(editor(page), 'Control qubit', 'Q1').click();
      assert.equal(await checked(panel(page), 'Control qubit'), 'Q1');
    }));

  test('never lets the target be the control', () =>
    withPage('#/lab/3', async page => {
      assert.ok(await radio(panel(page), 'Target qubit', 'Q0').isDisabled(), 'the control is not a target');
      // Picking the target as control moves the target on
      await radio(panel(page), 'Control qubit', 'Q1').click();
      assert.equal(await checked(panel(page), 'Target qubit'), 'Q2');
      assert.ok(await radio(panel(page), 'Target qubit', 'Q1').isDisabled());
      assert.ok(await radio(panel(page), 'Target qubit', 'Q0').isEnabled());
    }));

  test('works with the arrow keys, skipping the control in the target row', () =>
    withPage('#/lab/3', async page => {
      await radio(panel(page), 'Target qubit', 'Q1').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await checked(panel(page), 'Target qubit'), 'Q2');
      await page.keyboard.press('ArrowRight');   // Q0 is the control: wraps to Q1
      assert.equal(await checked(panel(page), 'Target qubit'), 'Q1');
      assert.equal(await page.evaluate(() => document.activeElement.textContent.trim()), 'Q1', 'focus follows');
    }));

  test('CNOT in the Gates panel uses the chosen pair', () =>
    withPage('#/lab/2', async page => {
      await page.getByRole('button', { name: 'X', exact: true }).nth(1).click();   // X on qubit 1: |01⟩
      await radio(panel(page), 'Control qubit', 'Q1').click();                    // control Q1 → target Q0
      await page.getByRole('button', { name: 'CNOT', exact: true }).click();
      await settle(page);
      const probs = await page.locator('.amp-table tbody tr td:nth-child(3)').allInnerTexts();
      assert.deepEqual(probs, ['0.0%', '0.0%', '0.0%', '100.0%'], '|11⟩');
    }));

  test('is not shown for one qubit', () =>
    withPage('#/lab/1', async page => {
      assert.equal(await page.getByRole('radiogroup').count(), 0);
    }));
});

describe('Gate descriptions', () => {
  test('appear in the hint line on hover, focus and tap, and are given to screen readers', () =>
    withPage('#/lab/2', async page => {
      const hint = panel(page).locator('.gate-hint');
      assert.match(await hint.innerText(), /see what it does/);

      await page.getByRole('button', { name: 'H', exact: true }).first().hover();
      assert.equal(await hint.innerText(), `H ${GATE_INFO.H}`);

      await page.getByRole('button', { name: 'CZ', exact: true }).focus();
      assert.equal(await hint.innerText(), `CZ ${GATE_INFO.CZ}`);

      await page.getByRole('button', { name: 'Measure qubit 1' }).click();
      assert.equal(await hint.innerText(), `M ${GATE_INFO.M}`);

      // Screen readers: each button is described by its gate's text
      const description = await page.getByRole('button', { name: 'X', exact: true }).first()
        .evaluate(b => document.getElementById(b.getAttribute('aria-describedby')).textContent);
      assert.equal(description, GATE_INFO.X);

      // The circuit editor describes its chips the same way
      const chip = page.getByRole('button', { name: 'Add T on Q1', exact: true });
      await chip.hover();
      assert.equal(await editor(page).locator('.gate-hint').innerText(), `T ${GATE_INFO.T}`);
      assert.equal(
        await chip.evaluate(b => document.getElementById(b.getAttribute('aria-describedby')).textContent),
        GATE_INFO.T
      );
    }));
});
