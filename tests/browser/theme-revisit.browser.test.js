// Browser tests for the light and dark themes, and for revisiting a lesson
// (the first prediction is shown and kept; later answers are practice).

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, newContext, assertEnglish, test } from './helpers.js';
import { LESSONS } from '../../lessons.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(400);

// A fresh browser with the given colour scheme and localStorage
async function withPage(hash, body, { colorScheme = 'dark', storage = {} } = {}) {
  const context = await newContext(env.browser, { colorScheme });
  await context.addInitScript(items => {
    for (const [k, v] of Object.entries(items)) {
      if (localStorage.getItem(k) === null) localStorage.setItem(k, v);
    }
  }, storage);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(env.base + hash);
    await page.locator('h1').first().waitFor();
    await assertEnglish(page);
    await settle(page);
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

const bodyBackground = page => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
// The colour of the probability chart's top-left pixel (its background)
const chartBackground = page => page.locator('.card:has(> h2:text-is("Probabilities")) canvas')
  .evaluate(c => [...c.getContext('2d').getImageData(2, 2, 1, 1).data.slice(0, 3)]);

describe('Themes', () => {
  test('follow the device: dark or light', async () => {
    await withPage('#/lab/1', async page => {
      assert.equal(await bodyBackground(page), 'rgb(17, 17, 17)');
      assert.deepEqual(await chartBackground(page), [0, 0, 0]);
    });
    await withPage('#/lab/1', async page => {
      assert.equal(await bodyBackground(page), 'rgb(242, 243, 245)');
      assert.deepEqual(await chartBackground(page), [255, 255, 255], 'canvases follow the theme');
    }, { colorScheme: 'light' });
  });

  test('can be chosen in the top bar, redraw the canvases, and are remembered', () =>
    withPage('#/lab/1', async page => {
      const picker = page.getByLabel('Colour theme');
      assert.equal(await picker.inputValue(), 'system');
      await picker.selectOption('light');
      await settle(page);
      assert.equal(await bodyBackground(page), 'rgb(242, 243, 245)');
      assert.deepEqual(await chartBackground(page), [255, 255, 255], 'redrawn in light colours');

      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await page.getByLabel('Colour theme').inputValue(), 'light');
      assert.equal(await bodyBackground(page), 'rgb(242, 243, 245)', 'remembered');

      await page.getByLabel('Colour theme').selectOption('system');
      await settle(page);
      assert.equal(await bodyBackground(page), 'rgb(17, 17, 17)', 'back to the device (dark)');
    }));

  test('light text colours meet WCAG AA on cards', () =>
    withPage('#/lab/2', async page => {
      await page.getByRole('button', { name: 'Explore the lab' }).click();   // shows the intro's link
      const ratios = await page.evaluate(() => {
        const lum = rgb => {
          const [r, g, b] = rgb.match(/\d+/g).map(Number).map(c => {
            c /= 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
        const color = sel => getComputedStyle(document.querySelector(sel)).color;
        const card = getComputedStyle(document.querySelector('.card')).backgroundColor;
        return {
          text: ratio(color('h2'), card),
          caption: ratio(color('.caption'), card),
          dimmed: ratio(color('.amp-table tr.zero td'), card),
          link: ratio(color('.card p a'), card)
        };
      });
      for (const [name, value] of Object.entries(ratios)) {
        assert.ok(value >= 4.5, `${name}: ${value.toFixed(2)}:1`);
      }
    }, { colorScheme: 'light' }));
});

describe('Revisiting a lesson', () => {
  const lesson = LESSONS[0];
  const right = lesson.predict.answer;
  const wrong = right === 0 ? 1 : 0;

  test('shows the first prediction, locked; practice answers don’t change the tally', () =>
    withPage(`#/lessons/${lesson.id}`, async page => {
      await page.locator('.option').nth(wrong).click();
      await page.getByText('✗ Not quite.').waitFor();

      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      const options = page.locator('.option');
      assert.ok(await options.nth(right).isDisabled(), 'locked');
      assert.match(await options.nth(wrong).getAttribute('class'), /\bwrong\b/, 'first pick shown');
      assert.match(await options.nth(right).getAttribute('class'), /\bright\b/, 'answer shown');
      assert.equal(await options.nth(wrong).getAttribute('aria-pressed'), 'true');
      assert.match(await options.nth(right).innerText(), /\(the right answer\)/);
      assert.ok(await page.getByText('Your first prediction was not quite right ✗.').isVisible());

      // Practice: answer again, right this time
      await page.getByRole('button', { name: 'Try again (practice)' }).click();
      assert.ok(await options.nth(right).isEnabled(), 'unlocked for practice');
      await options.nth(right).click();
      await page.getByText('Practice: ✓ Right!').waitFor();
      assert.ok(await page.getByText('Practice answers don’t change your tally').isVisible());

      // The tally still counts the first prediction
      await page.getByRole('link', { name: 'Lessons', exact: true }).first().click();
      await page.getByText('Your predictions: 0 of 1 right first time.').waitFor();
      assert.equal(await page.locator('.badge.wrong').count(), 1);
    }));

  test('works with predictions saved before the choice was kept', () =>
    withPage(`#/lessons/${lesson.id}`, async page => {
      assert.ok(await page.getByText('Your first prediction was right ✓.').isVisible());
      assert.ok(await page.getByText('kept only whether it was right').isVisible());
      assert.ok(await page.locator('.option').nth(right).isDisabled());
      await page.getByRole('button', { name: 'Try again (practice)' }).click();
      await page.locator('.option').nth(wrong).click();
      await page.getByText('Practice: ✗ Not quite.').waitFor();
    }, { storage: { 'quantum-lab-predictions': JSON.stringify({ [lesson.id]: true }) } }));
});
