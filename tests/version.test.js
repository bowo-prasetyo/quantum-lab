// The released version must be the same everywhere it appears, and the
// changelog must describe it. Run with: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { VERSION, CHANGELOG_URL } from '../version.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the version is a semantic version', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
});

test('package.json has the same version as version.js', async () => {
  assert.equal(JSON.parse(await read('package.json')).version, VERSION);
});

test('CHANGELOG.md starts with a dated section for this version', async () => {
  const changelog = await read('CHANGELOG.md');
  const first = changelog.match(/^## (\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\)$/m);
  assert.ok(first, 'a "## x.y.z (YYYY-MM-DD)" heading');
  assert.equal(first[1], VERSION, 'the newest section is this version');
  assert.ok(!Number.isNaN(Date.parse(first[2])), 'a real date');
});

test('the changelog link points at CHANGELOG.md in this repository', () => {
  assert.equal(CHANGELOG_URL, 'https://github.com/bowo-prasetyo/quantum-lab/blob/main/CHANGELOG.md');
});
