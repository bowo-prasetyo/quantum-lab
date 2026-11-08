// Browser test: opens every lesson in a real browser, runs its Set up and
// "Show me", and confirms the app itself reports the expected result. Also
// checks predictions, the panels each lesson shows, and the lesson index.
//
// Run with:  npm run test:browser
// Needs:     npm install, then: npx playwright install chromium
// The pages load Vue from the jsDelivr CDN, so this needs network access.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { LESSONS } from '../../lessons.js';
import { lessonText } from '../../content.js';
import { startBrowser, openPage as open, test } from './helpers.js';

// Panel key → heading the lab shows for it
const PANEL_HEADINGS = {
  gates: 'Gates',
  noise: 'Noise',
  table: 'Quantum State',
  probabilities: 'Probabilities',
  shots: 'Shots',
  interference: 'Interference',
  density: 'Density Matrix',
  unitary: 'Unitary Matrix',
  correlation: 'Correlation Graph',
  pauli: 'Pauli Expectations',
  entanglement: 'Entanglement',
  cube: '3D View',
  editor: 'Circuit Editor'
};

let env;
let base;

before(async () => {
  env = await startBrowser();
  base = env.base;
});

after(() => env.close());

const openPage = hash => open(env.browser, base + hash);

describe('every lesson in the browser', () => {
  for (const [index, lesson] of LESSONS.entries()) {
    const { title } = lessonText(lesson.id);
    test(`${index + 1}. ${title}`, async () => {
      const { page, errors } = await openPage(`#/lessons/${lesson.id}`);
      try {
        assert.equal(await page.locator('h1').innerText(), title);
        assert.ok(
          (await page.locator('.caption').first().innerText()).includes(`Lesson ${index + 1} of ${LESSONS.length}`),
          'lesson number'
        );

        // Previous and next links point to the neighbouring lessons
        const nav = page.locator('.lesson-nav a');
        if (index > 0) {
          assert.equal(await nav.first().getAttribute('href'), `#/lessons/${LESSONS[index - 1].id}`, 'previous link');
        }
        assert.equal(
          await nav.last().getAttribute('href'),
          index < LESSONS.length - 1 ? `#/lessons/${LESSONS[index + 1].id}` : '#/lab/3',
          'next link'
        );

        // Only the lesson's panels are shown
        for (const [panel, heading] of Object.entries(PANEL_HEADINGS)) {
          const shown = await page.getByRole('heading', { name: heading, exact: true }).count();
          const wanted = lesson.panels.includes(panel) &&
            !(['correlation', 'pauli', 'entanglement'].includes(panel) && lesson.n < 2) && !(panel === 'cube' && lesson.n < 3);
          assert.equal(shown, wanted ? 1 : 0, `panel "${heading}"`);
        }
        const blochSpheres = await page.locator('.bloch-row canvas').count();
        assert.equal(blochSpheres, lesson.panels.includes('bloch') ? lesson.n : 0, 'Bloch spheres');

        // Predicting the right answer is confirmed, and the explanation appears
        await page.locator('.option').nth(lesson.predict.answer).click();
        await assert.doesNotReject(page.getByText('✓ Right!').waitFor({ timeout: 2000 }));
        assert.ok(await page.getByRole('heading', { name: '3. What happened' }).isVisible());

        // Show me: the app runs the steps and reports the expected result
        if (lesson.ops.length) {
          await page.getByRole('button', { name: 'Show me' }).click();
        } else {
          await page.getByRole('button', { name: 'Check my result' }).click();
        }
        const verdict = page.locator('.check-result');
        await verdict.waitFor({ timeout: 15000 });
        const text = await verdict.innerText();
        assert.ok(text.includes('That’s the expected result'), `check result:\n${text}`);
        assert.equal(await page.locator('.check-result li', { hasText: '✗' }).count(), 0, text);

        assert.deepEqual(errors, [], 'page errors');
      } finally {
        await page.context().close();
      }
    });
  }
});

describe('lesson flow', () => {
  test('a wrong prediction is marked, and the tally shows on the lesson list', async () => {
    const lesson = LESSONS[0];
    const wrong = lesson.predict.answer === 0 ? 1 : 0;
    const { page, errors } = await openPage(`#/lessons/${lesson.id}`);
    try {
      await page.locator('.option').nth(wrong).click();
      await page.getByText('✗ Not quite.').waitFor({ timeout: 2000 });
      await page.getByRole('link', { name: 'Lessons', exact: true }).first().click();
      await page.getByText('Your predictions: 0 of 1 right first time.').waitFor({ timeout: 2000 });
      assert.equal(await page.locator('.lesson-list li').count(), LESSONS.length);
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('"Check my result" says "Not yet" before the steps are done', async () => {
    const lesson = LESSONS.find(l => l.id === 'superposition');
    const { page } = await openPage(`#/lessons/${lesson.id}`);
    try {
      await page.getByRole('button', { name: 'Check my result' }).click();
      await page.locator('.check-result.fail').waitFor({ timeout: 5000 });
      // Doing the step by hand then passes
      await page.getByRole('button', { name: 'H', exact: true }).first().click();
      await page.getByRole('button', { name: 'Check my result' }).click();
      await page.locator('.check-result.pass').waitFor({ timeout: 5000 });
    } finally {
      await page.context().close();
    }
  });

  test('a lesson does not change the saved state of the lab', async () => {
    const { page } = await openPage('#/lab/1');
    try {
      await page.getByRole('button', { name: 'X', exact: true }).first().click();
      await page.waitForTimeout(500);
      await page.goto(base + '#/lessons/superposition');
      await page.getByRole('button', { name: 'Show me' }).click();
      await page.locator('.check-result.pass').waitFor({ timeout: 10000 });
      await page.goto(base + '#/lab/1');
      await page.locator('.amp-table').waitFor();
      await page.waitForTimeout(500);
      const firstRow = await page.locator('.amp-table tbody tr').nth(1).innerText();
      assert.match(firstRow, /100\.0%/, 'the lab still has |1⟩ from before the lesson');
    } finally {
      await page.context().close();
    }
  });

  test('the old #/manual address opens the lessons', async () => {
    const { page } = await openPage('#/manual');
    try {
      await page.getByRole('heading', { name: 'Lessons', exact: true }).waitFor();
      assert.ok(page.url().endsWith('#/lessons'));
    } finally {
      await page.context().close();
    }
  });
});
