// Browser tests for the language of the page (locale.js, i18n.js): the
// start language, <html lang>, the language picker, and the pseudo-locale.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

// A fresh browser with the given browser language and localStorage
async function withPage(path, body, { locale = 'en-US', storage = {} } = {}) {
  const context = await env.browser.newContext({ locale });
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
      assert.match(links[0], /^\[1 ǫúƀíţ ~+\]$/, 'plural form for 1');
      assert.match(links[1], /^\[2 ǫúƀíţš ~+\]$/, 'plural form for 2');
      assert.match(links[3], /^\[Ļéššöñš ~+\]$/);
      assert.match(await page.getByRole('link', { name: /Ĝļášš Ǫúƀíţ/ }).getAttribute('aria-label'), /^\[/);
      assert.match(await page.title(), /^\[Ĝļášš Ǫúƀíţ/);
      assert.match(await page.locator('meta[name="description"]').getAttribute('content'), /^\[Ļéáŕñ/);
      // Text not yet made translatable stays in English
      assert.match(await page.locator('h1').first().textContent(), /^Glass Qubit/);
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
