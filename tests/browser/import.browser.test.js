// Browser test for the one-time import of the original simulators' saved
// states. Seeds each old database exactly as the old app wrote it, then
// opens the lab.

import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser } from './helpers.js';

const r = Math.SQRT1_2;
let env;

before(async () => { env = await startBrowser(); });
after(() => env.close());

// Same calls as the old simulators' db.js files
async function seedOld(page, which, value) {
  await page.evaluate(([which, value]) => new Promise((resolve, reject) => {
    const name = { 1: 'quantum-db', 2: 'quantum-db-2', 3: 'quantum-db-3' }[which];
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      if (which === 3) req.result.createObjectStore('states', { keyPath: 'qubit' });
      else req.result.createObjectStore('states');
    };
    req.onsuccess = () => {
      if (!req.result.objectStoreNames.contains('states')) {
        reject(new Error(`${name} exists without its 'states' store: the old simulator could no longer save`));
        return;
      }
      const tx = req.result.transaction('states', 'readwrite');
      if (which === 3) tx.objectStore('states').put(value);
      else tx.objectStore('states').put(value, 'qubit');
      tx.oncomplete = () => { req.result.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  }), [which, value]);
}

async function readOld(page, which) {
  return page.evaluate(which => new Promise(resolve => {
    const name = { 1: 'quantum-db', 2: 'quantum-db-2', 3: 'quantum-db-3' }[which];
    const req = indexedDB.open(name, 1);
    req.onsuccess = () => {
      const get = req.result.transaction('states').objectStore('states').get(which === 3 ? 'latest' : 'qubit');
      get.onsuccess = () => { req.result.close(); resolve(get.result); };
    };
  }), which);
}

const databases = page => page.evaluate(async () => (await indexedDB.databases()).map(d => d.name).sort());

// Lab state as shown in the amplitude table: probability column
const probabilities = page => page.locator('.amp-table tbody tr td:nth-child(3)').allInnerTexts();

async function freshPage() {
  const page = await (await env.browser.newContext()).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  // Start on a page without a lab, so nothing loads before seeding
  await page.goto(env.base + '#/lessons');
  await page.locator('h1').waitFor();
  return { page, errors };
}

async function openLab(page, n) {
  await page.goto(env.base + `#/lab/${n}`);
  await page.locator('.amp-table').waitFor();
  await page.waitForTimeout(600);
}

describe('importing from the original simulators', () => {
  test('the 3-qubit state and circuit are brought over once, and the old data is untouched', async () => {
    const { page, errors } = await freshPage();
    try {
      const old = {
        qubit: 'latest',
        re: [r, 0, 0, 0, 0, 0, 0, r],
        im: [0, 0, 0, 0, 0, 0, 0, 0],
        circuit: [{ gate: 'H', target: 0 }, { gate: 'CNOT', control: 0, target: 1 }]
      };
      await seedOld(page, 3, old);
      await openLab(page, 3);

      assert.deepEqual(await probabilities(page), ['50.0%', '0.0%', '0.0%', '0.0%', '0.0%', '0.0%', '0.0%', '50.0%']);
      assert.deepEqual((await page.locator('.circuit-step-label').allInnerTexts()).map(s => s.trim()), ['H q0', 'CNOT q0→q1']);
      const notice = await page.locator('.notice[role=status]').innerText();
      assert.match(notice, /saved state and circuit\s+from the 3-qubit simulator/);

      // Second visit: the lab's own copy is used, no notice
      await page.reload();
      await page.locator('.amp-table').waitFor();
      await page.waitForTimeout(600);
      assert.equal(await page.locator('.notice[role=status]').count(), 0, 'no notice on later visits');
      assert.equal((await probabilities(page))[7], '50.0%');

      // Changes in the lab don't touch the old data
      await page.getByRole('button', { name: 'Reset' }).click();
      await page.waitForTimeout(400);
      assert.deepEqual(await readOld(page, 3), old, 'old record unchanged');

      // After Reset, the old state is not imported again
      await page.reload();
      await page.locator('.amp-table').waitFor();
      await page.waitForTimeout(600);
      assert.equal((await probabilities(page))[0], '100.0%');

      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('1- and 2-qubit states are brought over; invalid old data is ignored', async () => {
    const { page, errors } = await freshPage();
    try {
      await seedOld(page, 1, [{ re: 0, im: 0 }, { re: 0, im: 1 }]);            // i|1⟩
      await seedOld(page, 2, [{ re: 1, im: 0 }, { re: 0, im: 0 }]);            // wrong size

      await openLab(page, 1);
      assert.deepEqual(await probabilities(page), ['0.0%', '100.0%']);
      assert.match(await page.locator('.amp-table tbody tr').nth(1).innerText(), /0\.000 \+ 1\.000i/);
      assert.match(await page.locator('.notice[role=status]').innerText(), /from the 1-qubit simulator/);

      await openLab(page, 2);
      assert.deepEqual(await probabilities(page), ['100.0%', '0.0%', '0.0%', '0.0%'], 'starts at |00⟩');
      assert.equal(await page.locator('.notice[role=status]').count(), 0, 'no notice for invalid data');

      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });

  test('the lab\'s own saved state wins over old data', async () => {
    const { page } = await freshPage();
    try {
      await openLab(page, 2);
      await page.getByRole('button', { name: 'X', exact: true }).first().click();
      await page.waitForTimeout(400);                                          // saves |10⟩
      await seedOld(page, 2, [{ re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }]);
      await openLab(page, 1);
      await openLab(page, 2);
      assert.deepEqual(await probabilities(page), ['0.0%', '0.0%', '100.0%', '0.0%'], 'still |10⟩');
      assert.equal(await page.locator('.notice[role=status]').count(), 0);
    } finally {
      await page.context().close();
    }
  });

  test('without old data, no old databases are created', async () => {
    const { page, errors } = await freshPage();
    try {
      for (const n of [1, 2, 3]) await openLab(page, n);
      assert.deepEqual(await databases(page), ['quantum-lab'],
        'creating an empty old database would break that simulator');
      assert.equal(await page.locator('.notice[role=status]').count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      await page.context().close();
    }
  });
});
