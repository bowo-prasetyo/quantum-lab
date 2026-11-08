// Shared set-up for the browser tests: a minimal static file server for the
// repo, a Chromium browser, and test() with a time limit of its own.

import { test as nodeTest } from 'node:test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

// How long one browser test may take before it fails as stuck. Each test
// gets this limit itself: Node's --test-timeout (in package.json) limits each
// whole test file instead, so it is set far higher, and a file can hold as
// many tests (or lessons) as it needs.
export const TEST_TIMEOUT_MS = 60_000;

/** node:test's test(), with TEST_TIMEOUT_MS as the default limit for each test. */
export function test(name, options, fn) {
  if (typeof options === 'function') [options, fn] = [{}, options];
  return nodeTest(name, { timeout: TEST_TIMEOUT_MS, ...options }, fn);
}

/** Starts the server and browser. Returns { base, browser, close }. */
export async function startBrowser() {
  const server = createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch();

  return {
    base,
    browser,
    close: async () => {
      await browser.close();
      await new Promise(resolve => server.close(resolve));
    }
  };
}

/** Opens a page in a fresh browser context, collecting page errors. */
export async function openPage(browser, url) {
  const page = await (await browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url);
  await page.locator('h1').first().waitFor();
  return { page, errors };
}
