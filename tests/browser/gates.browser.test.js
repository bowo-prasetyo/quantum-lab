// Browser tests for the CZ gate and single-qubit measurement in the lab.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const probabilities = page => page.locator('.amp-table tbody tr td:nth-child(3)').allInnerTexts();
const amplitudes = page => page.locator('.amp-table tbody tr td:nth-child(2)').allInnerTexts();
const button = (page, name, nth = 0) => page.getByRole('button', { name, exact: true }).nth(nth);
const settle = page => page.waitForTimeout(400);

describe('CZ and single-qubit measurement', () => {
  test('CZ flips the sign of |11⟩ only, with any chosen pair', async () => {
    const { page, errors } = await openPage(env.browser, env.base + '#/lab/3');
    try {
      // H on all three qubits, then CZ on qubits 2 and 0
      for (const q of [0, 1, 2]) await button(page, 'H', q).click();
      await page.getByLabel('CNOT and CZ control qubit').selectOption('2');
      await page.getByLabel('CNOT and CZ target qubit').selectOption('0');
      await button(page, 'CZ').click();
      await settle(page);
      const amps = await amplitudes(page);
      // Negative exactly where qubits 0 and 2 are both 1: |101⟩ and |111⟩
      const negative = amps.map((a, i) => a.startsWith('−') ? i : -1).filter(i => i >= 0);
      assert.deepEqual(negative, [0b101, 0b111], amps.join(' | '));
      assert.ok((await probabilities(page)).every(p => p === '12.5%'), 'probabilities unchanged');
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('M on one qubit of a Bell pair collapses both, and shows the classical bit', async () => {
    const { page, errors } = await openPage(env.browser, env.base + '#/lab/2');
    try {
      await button(page, 'Create Bell Pair').click();
      await settle(page);
      await page.getByRole('button', { name: 'Measure qubit 0' }).click();
      await settle(page);
      const probs = await probabilities(page);
      assert.ok(
        JSON.stringify(probs) === JSON.stringify(['100.0%', '0.0%', '0.0%', '0.0%']) ||
        JSON.stringify(probs) === JSON.stringify(['0.0%', '0.0%', '0.0%', '100.0%']),
        `collapsed to |00⟩ or |11⟩: ${probs}`
      );
      const bit = probs[0] === '100.0%' ? 0 : 1;
      assert.ok(await page.getByText(`Measurement: qubit 0 gave ${bit}`).isVisible(), 'measurement line');
      assert.match(await page.locator('.bits').innerText(), new RegExp(`q0 = ${bit} · q1 = –`));
      // Reset clears the bits
      await button(page, 'Reset').click();
      await settle(page);
      assert.equal(await page.locator('.bits').count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('M on one qubit of a product state leaves the other in superposition', async () => {
    const { page } = await openPage(env.browser, env.base + '#/lab/2');
    try {
      await button(page, 'H', 0).click();
      await button(page, 'H', 1).click();
      await page.getByRole('button', { name: 'Measure qubit 1' }).click();
      await settle(page);
      const probs = await probabilities(page);
      // Qubit 0 still 50/50; qubit 1 fixed
      assert.ok(
        JSON.stringify(probs) === JSON.stringify(['50.0%', '0.0%', '50.0%', '0.0%']) ||
        JSON.stringify(probs) === JSON.stringify(['0.0%', '50.0%', '0.0%', '50.0%']),
        probs.join(' ')
      );
    } finally {
      await page.context().close();
    }
  });

  test('a gate tapped right after the page opens is added (not ignored)', async () => {
    const { page } = await openPage(env.browser, env.base + '#/lab/1');
    try {
      await page.locator('.gate', { hasText: /^H$/ }).click();
      await page.waitForTimeout(300);
      assert.deepEqual((await page.locator('.circuit-step-label').allInnerTexts()).map(s => s.trim()), ['H q0']);
    } finally {
      await page.context().close();
    }
  });

  test('the circuit editor runs CZ and M steps', async () => {
    const { page, errors } = await openPage(env.browser, env.base + '#/lab/2');
    try {
      await page.locator('.gate', { hasText: /^X$/ }).click();                 // X q0
      await page.getByRole('button', { name: 'Q1', exact: true }).first().click();
      await page.locator('.gate', { hasText: /^X$/ }).click();                 // X q1
      await page.getByRole('button', { name: 'Q0', exact: true }).first().click();
      await page.locator('.gate', { hasText: /^CZ$/ }).click();                // CZ q0,q1
      await page.locator('.gate', { hasText: /^M$/ }).click();                 // M q0
      const steps = (await page.locator('.circuit-step-label').allInnerTexts()).map(s => s.trim());
      assert.deepEqual(steps, ['X q0', 'X q1', 'CZ q0,q1', 'M q0']);
      await button(page, 'Run Circuit').click();
      await page.waitForTimeout(2600);
      // |11⟩ with a minus sign, and qubit 0 measured as 1
      const amps = await amplitudes(page);
      assert.equal(amps[3], '−1.000 + 0.000i');
      assert.match(await page.locator('.bits').innerText(), /q0 = 1/);
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });
});
