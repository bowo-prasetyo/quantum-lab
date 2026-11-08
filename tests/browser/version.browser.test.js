// Browser test: the Help page shows the released version and links to the
// changelog, in English and in each translation.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage, newContext, test } from './helpers.js';
import { VERSION, CHANGELOG_URL } from '../../version.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

describe('version on the Help page', () => {
  test('shows the version and links to the changelog', async () => {
    const { page, errors } = await openPage(env.browser, env.base + '#/help');
    try {
      const line = page.locator('.app-version');
      assert.equal((await line.innerText()).trim(), `Glass Qubit version ${VERSION} · What’s new in each version`);
      const link = line.getByRole('link');
      assert.equal(await link.getAttribute('href'), CHANGELOG_URL);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  for (const [lang, expected] of [['id', `Glass Qubit versi ${VERSION}`], ['ja', `Glass Qubit バージョン ${VERSION}`]]) {
    test(`is translated (${lang})`, async () => {
      const page = await (await newContext(env.browser)).newPage();
      try {
        await page.goto(env.base + `?lang=${lang}#/help`);
        await page.locator('.app-version').waitFor();
        assert.ok((await page.locator('.app-version').innerText()).startsWith(expected));
      } finally {
        await page.context().close();
      }
    });
  }
});
