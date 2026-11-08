// Browser tests for the language of the page (locale.js, i18n.js): the
// start language, <html lang>, the language picker, and the pseudo-locale.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, newContext, ENGLISH, test } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

// A fresh browser with the given browser language and localStorage
async function withPage(path, body, { locale = ENGLISH, storage = {} } = {}) {
  const context = await newContext(env.browser, { locale });
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
    await page.goto(env.base + path);
    await page.locator('h1').first().waitFor();
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

const htmlLang = page => page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]);
const navLinks = page => page.locator('nav .nav-link').allTextContents();
const picker = page => page.getByTestId('language-picker');

describe('Language', () => {
  test('English by default, with <html lang> set and no picker while English is the only language', () =>
    withPage('#/lab/1', async page => {
      assert.deepEqual(await htmlLang(page), ['en', 'ltr']);
      assert.deepEqual(await navLinks(page), ['1 qubit', '2 qubits', '3 qubits', 'Lessons', 'Concepts', 'Help']);
      assert.equal(await page.title(), 'Glass Qubit: a quantum lab in your browser');
      assert.equal(await picker(page).count(), 0);
    }));

  test('a browser language the app does not have falls back to English', () =>
    withPage('#/lab/2', async page => {
      assert.deepEqual(await htmlLang(page), ['en', 'ltr']);
      assert.ok((await navLinks(page)).includes('Lessons'));
    }, { locale: 'fr-FR' }));

  test('?lang=en-XA shows the pseudo-locale everywhere the nav is translated', () =>
    withPage('?lang=en-XA#/lab/1', async page => {
      assert.deepEqual(await htmlLang(page), ['en-XA', 'ltr']);
      const links = await navLinks(page);
      assert.match(links[0], /^⟦1 ǫúƀíţ ~+⟧$/, 'plural form for 1');
      assert.match(links[1], /^⟦2 ǫúƀíţš ~+⟧$/, 'plural form for 2');
      assert.match(links[3], /^⟦Ļéššöñš ~+⟧$/);
      assert.match(await page.getByRole('link', { name: /Ĝļášš Ǫúƀíţ/ }).getAttribute('aria-label'), /^⟦/);
      assert.match(await page.title(), /^⟦Ĝļášš Ǫúƀíţ/);
      assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /^⟦Ļéáŕñ/);
      assert.match(await page.locator('h1').first().textContent(), /^⟦Ĝļášš Ǫúƀíţ: 1 ǫúƀíţ/);
    }));

  test('the picker switches language at once, keeps the route, and is remembered', () =>
    withPage('?lang=en-XA#/lessons', async page => {
      const select = picker(page);
      assert.equal(await select.inputValue(), 'en-XA');
      assert.deepEqual(await select.locator('option').allTextContents(), ['English', 'Pseudo (en-XA)']);

      await select.selectOption('en');
      assert.deepEqual(await htmlLang(page), ['en', 'ltr']);
      assert.ok((await navLinks(page)).includes('Lessons'), 'nav re-rendered in English');
      assert.equal(await page.title(), 'Glass Qubit: a quantum lab in your browser');
      const url = new URL(page.url());
      assert.equal(url.search, '', '?lang= removed so the choice sticks');
      assert.equal(url.hash, '#/lessons', 'route kept');
      assert.equal(await page.evaluate(() => localStorage.getItem('glass-qubit-locale')), '"en"');

      await page.reload();
      await page.locator('h1').first().waitFor();
      assert.deepEqual(await htmlLang(page), ['en', 'ltr']);
      assert.equal(await picker(page).count(), 0, 'pseudo-locale no longer offered');
    }));

  test('a saved pseudo-locale is ignored; only ?lang= can choose it', () =>
    withPage('#/lab/1', async page => {
      assert.deepEqual(await htmlLang(page), ['en', 'ltr']);
    }, { storage: { 'glass-qubit-locale': '"en-XA"' } }));

  test('every view follows a change of language at once, numbers included', () =>
    withPage('?lang=en-XA#/lab/2', async page => {
      const rows = page.locator('.gate-panel .gate-row');
      await rows.first().getByRole('button', { name: 'H', exact: true }).click();
      await page.getByRole('button', { name: /Ṁéášúŕé ǫúƀíţ 0/ }).click();
      await page.waitForTimeout(400);
      // German number style in the pseudo-locale, and words from its messages
      const table = page.locator('.amp-table');
      assert.match(await table.innerText(), /0,000 \+ 0,000í|1,000 \+ 0,000í/);
      assert.match(await table.innerText(), /100,0\u00a0%/);
      assert.match(await page.getByTestId('announcer').textContent(), /^⟦⟦Ṁéášúŕéđ ǫúƀíţ 0: [01]/, 'announcement in the language');
      assert.match(await page.locator('.card', { has: table }).innerText(), /ǫúƀíţ 0 ĝáṽé [01]/, 'single-qubit result put into words');

      await picker(page).selectOption('en');
      await page.waitForTimeout(300);
      assert.match(await table.innerText(), /1\.000 \+ 0\.000i/, 'numbers switch to English style');
      assert.match(await page.locator('.card', { has: table }).innerText(), /Measurement: qubit 0 gave [01]/);
      assert.equal(await page.locator('.gate-panel h2').textContent(), 'Gates');
      assert.match(await page.locator('.bloch-coords').first().textContent(), /^x = 0\.00 · y = 0\.00 · z = (1|−1)\.00$/);
    }));

  test('a lesson’s check results follow a change of language', () =>
    withPage('?lang=en-XA#/lessons/bit-flip', async page => {
      await page.getByRole('button', { name: /Šĥöŵ ɱé/ }).click();
      const result = page.locator('.check-result');
      await result.waitFor();
      assert.match(await result.innerText(), /100,0\u00a0%/);
      await picker(page).selectOption('en');
      await page.waitForTimeout(300);
      assert.match(await result.innerText(), /That’s the expected result[\s\S]*Probabilities: \|1⟩ 100\.0%/);
    }));

  test('lessons, Concepts and Help are translated, with button names from the buttons', () =>
    withPage('?lang=en-XA#/lessons/bit-flip', async page => {
      assert.match(await page.locator('h1').first().textContent(), /^⟦Ɓíţ ƒļíþ/);
      const steps = page.locator('.workbench-side ol li');
      assert.match(await steps.nth(1).textContent(), /⟦Ṁéášúŕé áļļ ~+⟧/, 'the step names the button as the button reads');
      assert.equal(await page.getByRole('button', { name: /^⟦Ṁéášúŕé áļļ ~+⟧$/ }).count(), 1);

      await picker(page).selectOption('en');
      await page.waitForTimeout(300);
      assert.equal(await page.locator('h1').first().textContent(), 'Bit flip');
      assert.equal(await steps.nth(1).textContent(), 'Press Measure all.');

      await page.goto(env.base + '?lang=en-XA#/help');
      await page.locator('h1').first().waitFor();
      assert.match(await page.locator('h1').first().textContent(), /^⟦Ĥéļþ/);
      const link = page.locator('.card a[href="#/concepts"]').first();
      assert.match(await link.textContent(), /Çöñçéþţš/, 'links keep their targets');
      await page.goto(env.base + '?lang=en-XA#/concepts');
      await page.locator('h1').first().waitFor();
      assert.match(await page.locator('dt').first().textContent(), /^⟦Ǫúƀíţ/);
    }));

  test('canvases still draw after a language change', () =>
    withPage('?lang=en-XA#/lab/1', async page => {
      await picker(page).selectOption('en');
      await page.waitForTimeout(300);
      const painted = await page.locator('canvas').first().evaluate(c => {
        const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const first = data.slice(0, 4).join();
        for (let k = 0; k < data.length; k += 4) if (data.slice(k, k + 4).join() !== first) return true;
        return false;
      });
      assert.ok(painted);
    }));
});
