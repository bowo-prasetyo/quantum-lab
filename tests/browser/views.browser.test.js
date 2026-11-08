// Browser tests for the Shots, Interference and Entanglement views: each
// follows the lab's state, and says in words what it draws.

import { before, after, describe } from 'node:test';
import assert from 'node:assert/strict';

import { startBrowser, openPage, test } from './helpers.js';

let env;
before(async () => { env = await startBrowser(); });
after(() => env.close());

const settle = page => page.waitForTimeout(300);
const button = (page, name) => page.getByRole('button', { name, exact: true }).first();
const card = (page, heading) =>
  page.locator('.card').filter({ has: page.getByRole('heading', { name: heading, exact: true }) });

async function withLab(hash, body) {
  const { page, errors } = await openPage(env.browser, env.base + hash);
  try {
    await settle(page);
    await body(page);
    assert.deepEqual(errors, []);
  } finally {
    await page.context().close();
  }
}

describe('Shots view', () => {
  test('counts follow the probabilities, leave the state alone, and clear on a new state', () =>
    withLab('#/lab/2', async page => {
      const shots = card(page, 'Shots');
      assert.match(await shots.locator('.shots-summary').innerText(), /No shots run yet/);

      await button(page, 'Create Bell Pair').click();
      await settle(page);
      await shots.getByRole('button', { name: 'Run 1000 shots' }).click();
      const summary = await shots.locator('.shots-summary').innerText();
      assert.match(summary, /^1000 shots: \|00⟩ \d+, \|11⟩ \d+\.$/);
      const [a, b] = summary.match(/\d+(?=,|\.)/g).map(Number);
      assert.equal(a + b, 1000);
      assert.ok(a > 400 && b > 400, summary);
      assert.equal(await shots.locator('.shots-row').count(), 4);

      // The state is still the Bell pair
      assert.match(await page.locator('.amp-table').innerText(), /\|00⟩\s+0\.707/);

      await button(page, 'H').click();
      await settle(page);
      assert.match(await shots.locator('.shots-summary').innerText(), /No shots run yet/);
    }));
});

describe('Interference view', () => {
  test('H, Z, H: the paths to |0⟩ cancel and the paths to |1⟩ add up', () =>
    withLab('#/lab/1', async page => {
      const view = card(page, 'Interference');
      assert.match(await view.innerText(), /Apply a gate to see/);

      for (const g of ['H', 'Z', 'H']) {
        await button(page, g).click();
        await settle(page);
      }
      assert.match(await view.locator('.interference-step').innerText(), /H on qubit 0/);
      const rows = view.locator('.interference-row');
      assert.equal(await rows.count(), 2);
      assert.equal(await rows.nth(0).getAttribute('data-kind'), 'cancel');
      assert.match(await rows.nth(0).innerText(), /\|0⟩: the paths cancel completely/);
      assert.match(await rows.nth(0).innerText(), /Probability 0% \(50% if the paths did not interfere\)/);
      assert.equal(await rows.nth(1).getAttribute('data-kind'), 'constructive');
      assert.equal(await rows.nth(1).locator('.phasor-path').count(), 2, 'two path arrows');
      assert.match(await rows.nth(0).innerText(), /0.500 from \|0⟩ − 0.500 from \|1⟩ = 0.000/);

      // Undo goes back to the previous step's paths (Z: one path each)
      await button(page, 'Undo').click();
      await settle(page);
      assert.match(await view.locator('.interference-step').innerText(), /Z on qubit 0/);
      assert.match(await view.innerText(), /nothing interferes/);
      assert.match(await view.locator('details').innerText(), /Show where each amplitude came from/);

      // A measurement has no paths
      await button(page, 'Measure all').click();
      await settle(page);
      assert.match(await view.innerText(), /The last step was a measurement/);

      await button(page, 'Reset').click();
      await settle(page);
      assert.match(await view.innerText(), /Apply a gate to see/);
    }));
});

describe('Entanglement view', () => {
  test('tells a GHZ state from a Bell pair plus a separate qubit', () =>
    withLab('#/lab/3', async page => {
      await button(page, 'Show advanced views').click();
      const view = card(page, 'Entanglement');
      assert.match(await view.locator('.entanglement-verdict').innerText(), /^No entanglement/);
      assert.equal(await view.getByRole('img').getAttribute('aria-label'),
        'Mutual information: Q0 and Q1 0.00 bits, Q0 and Q2 0.00 bits, Q1 and Q2 0.00 bits');

      await button(page, 'GHZ State').click();
      await settle(page);
      assert.match(await view.locator('.entanglement-verdict').innerText(), /^All three qubits are entangled together/);
      assert.equal(await view.getByRole('img').getAttribute('aria-label'),
        'Mutual information: Q0 and Q1 1.00 bits, Q0 and Q2 1.00 bits, Q1 and Q2 1.00 bits');

      await button(page, 'Create Bell Pair').click();
      await settle(page);
      await page.locator('.gate-row').nth(2).getByRole('button', { name: 'H', exact: true }).click();
      await settle(page);
      assert.equal(await view.locator('.entanglement-verdict').innerText(),
        'Qubits 0 and 1 are entangled with each other; qubit 2 is separate.');
      assert.deepEqual(await view.locator('.entropy-value').allInnerTexts(),
        ['S = 1.00 (maximally entangled)', 'S = 1.00 (maximally entangled)', 'S = 0.00 (not entangled)']);
    }));
});

describe('Hide global phase', () => {
  const ampRow = (page, label) => page.locator('.amp-table tr').filter({ hasText: label });

  test('rotates the table and the interference view, says why, and is remembered', () =>
    withLab('#/lab/1', async page => {
      const box = page.getByRole('checkbox', { name: 'Hide global phase' });
      assert.equal(await box.isChecked(), false);

      // Y|0⟩ = i|1⟩: a pure global phase of 90°
      await button(page, 'Y').click();
      await settle(page);
      assert.match(await ampRow(page, '|1⟩').innerText(), /0\.000 \+ 1\.000i\s+100\.0%\s+90°/);

      await box.check();
      await settle(page);
      assert.match(await ampRow(page, '|1⟩').innerText(), /1\.000 \+ 0\.000i\s+100\.0%\s+0°/);
      assert.match(await page.locator('.global-phase').innerText(), /relative to \|1⟩, the first non-zero amplitude/);

      // H, S, H: the interference sums match the table's turned amplitudes
      await button(page, 'Reset').click();
      for (const g of ['H', 'S', 'H']) {
        await button(page, g).click();
        await settle(page);
      }
      assert.match(await ampRow(page, '|0⟩').innerText(), /0\.707 \+ 0\.000i/);
      assert.match(await card(page, 'Interference').locator('.interference-row').first().innerText(), /= 0\.707$/m);

      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await page.getByRole('checkbox', { name: 'Hide global phase' }).isChecked(), true, 'remembered');
      await page.getByRole('checkbox', { name: 'Hide global phase' }).uncheck();
      await settle(page);
      assert.match(await ampRow(page, '|0⟩').innerText(), /0\.500 \+ 0\.500i/);
    }));

  test('Grover\'s marked amplitude reads 1 instead of −1', () =>
    withLab('#/lessons/grover', async page => {
      await page.getByRole('button', { name: 'Show me' }).click();
      // Show me plays its ten steps half a second apart
      await ampRow(page, '|11⟩').filter({ hasText: '−1.000 + 0.000i' }).waitFor({ timeout: 15000 });
      await page.getByRole('checkbox', { name: 'Hide global phase' }).check();
      await settle(page);
      assert.match(await ampRow(page, '|11⟩').innerText(), /1\.000 \+ 0\.000i\s+100\.0%\s+0°/);
    }));
});

describe('Pauli Expectations view', () => {
  test('a Bell pair is correlated in every basis; GHZ keeps its link in ⟨XXX⟩', () =>
    withLab('#/lab/2', async page => {
      await button(page, 'Show advanced views').click();
      const view = card(page, 'Pauli Expectations');
      assert.match(await view.locator('.pauli-verdict').innerText(), /^Not correlated/);

      await button(page, 'Create Bell Pair').click();
      await settle(page);
      const grid = view.locator('.pauli-pair table tbody tr');
      assert.deepEqual(
        await Promise.all([0, 1, 2].map(r => grid.nth(r).locator('td').allInnerTexts())),
        [['+1.00', '0.00', '0.00'], ['0.00', '−1.00', '0.00'], ['0.00', '0.00', '+1.00']]
      );
      assert.equal(await grid.nth(1).locator('td').nth(1).getAttribute('aria-label'), 'Y0 Y1 −1.00');
      assert.match(await view.locator('.pauli-verdict').innerText(), /^Correlated/);
      assert.deepEqual(await view.locator('.pauli-singles td').allInnerTexts(), Array(6).fill('0.00'));
    }));

  test('three qubits: three pair grids, and the three-qubit strings of a GHZ state', () =>
    withLab('#/lab/3', async page => {
      await button(page, 'Show advanced views').click();
      const view = card(page, 'Pauli Expectations');
      assert.equal(await view.locator('.pauli-pair').count(), 3);
      // |000⟩: Z on every qubit always multiplies to +1
      assert.deepEqual(await view.locator('.pauli-triples li').allInnerTexts(), ['⟨ZZZ⟩ +1.00']);

      await button(page, 'GHZ State').click();
      await settle(page);
      assert.deepEqual(await view.locator('.pauli-triples li').allInnerTexts(),
        ['⟨XXX⟩ +1.00', '⟨XYY⟩ −1.00', '⟨YXY⟩ −1.00', '⟨YYX⟩ −1.00']);
      // Every pair: only ZZ, and correlated
      for (let k = 0; k < 3; k++) {
        const pair = view.locator('.pauli-pair').nth(k);
        assert.deepEqual(await pair.locator('td').allInnerTexts(),
          ['0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '+1.00']);
        assert.match(await pair.locator('.pauli-verdict').innerText(), /^Correlated/);
      }
    }));
});

describe('Unitary Matrix view', () => {
  test('shows the last gate, the whole circuit, and explains measurements', () =>
    withLab('#/lab/2', async page => {
      await button(page, 'Show advanced views').click();
      const view = card(page, 'Unitary Matrix');
      assert.match(await view.locator('.unitary-what').innerText(), /Apply a gate/);

      await page.locator('.gate-panel').getByRole('button', { name: 'CNOT', exact: true }).click();
      await settle(page);
      assert.match(await view.locator('.unitary-what').innerText(), /CNOT, control qubit 0, target qubit 1, on all 2 qubits/);
      const rows = view.locator('tbody tr');
      assert.deepEqual(
        await Promise.all([0, 1, 2, 3].map(i => rows.nth(i).locator('td').allInnerTexts())),
        [['1', '', '', ''], ['', '1', '', ''], ['', '', '', '1'], ['', '', '1', '']]
      );
      assert.equal(await rows.nth(2).locator('td').nth(3).getAttribute('aria-label'), '|10⟩ from |11⟩: 1');

      await button(page, 'Measure all').click();
      await settle(page);
      assert.match(await view.locator('.unitary-what').innerText(), /measurement\. It is not a gate/);

      // Whole circuit: empty, then H q0
      await view.getByRole('radio', { name: 'Whole circuit' }).check();
      assert.match(await view.locator('.unitary-what').innerText(), /circuit editor is empty/);
      await page.getByRole('button', { name: 'Add H on Q0' }).click();
      await settle(page);
      assert.match(await view.locator('.unitary-what').innerText(), /whole circuit: H q0\./);
      assert.deepEqual(await rows.nth(2).locator('td').allInnerTexts(), ['0.71', '', '−0.71', '']);
    }));
});

describe('Bloch sphere turns', () => {
  test('a gate shows its axis and path, then settles; Undo draws no path', () =>
    withLab('#/lab/1', async page => {
      const canvas = page.locator('.bloch-row canvas').first();
      await button(page, 'H').click();
      await page.waitForFunction(() => document.querySelector('.bloch-row canvas').dataset.turn === 'turning',
        null, { polling: 'raf', timeout: 2000 });
      await page.waitForTimeout(700);
      assert.equal(await canvas.getAttribute('data-turn'), 'done');
      assert.match(await page.locator('.bloch-turn').innerText(),
        /Last gate: H on qubit 0, a half turn \(180°\) about the axis halfway between x and z/);

      await button(page, 'Undo').click();
      await settle(page);
      assert.equal(await page.locator('.bloch-turn').count(), 0);
      assert.equal(await canvas.getAttribute('data-turn'), null);

      // CNOT isn't a turn of one sphere
      await page.goto(env.base + '#/lab/2');
      await page.locator('h1').waitFor();
      await settle(page);
      await page.locator('.gate-panel').getByRole('button', { name: 'CNOT', exact: true }).click();
      await settle(page);
      assert.equal(await page.locator('.bloch-turn').count(), 0);
    }));

  test('with reduce motion, the vector jumps but the path is still drawn', async () => {
    const context = await env.browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    try {
      await page.goto(env.base + '#/lab/1');
      await page.locator('h1').waitFor();
      await settle(page);
      await button(page, 'S').click();   // |0⟩ is on the z-axis: S shows nothing
      await settle(page);
      assert.equal(await page.locator('.bloch-turn').count(), 0, 'no path when the turn moves nothing');
      await button(page, 'H').click();
      await page.waitForTimeout(50);
      assert.equal(await page.locator('.bloch-row canvas').first().getAttribute('data-turn'), 'done');
      assert.equal(await page.locator('.bloch-turn').count(), 1);
    } finally {
      await context.close();
    }
  });
});

describe('Timeline', () => {
  test('records each step of a run, and going back puts every view there', () =>
    withLab('#/lab/2', async page => {
      assert.equal(await page.locator('.timeline').count(), 0, 'no timeline before a run');
      await page.getByRole('button', { name: 'Add H on Q0' }).click();
      await page.getByRole('button', { name: 'Add CNOT, control Q0, target Q1' }).click();
      await page.getByRole('button', { name: 'Run Circuit' }).click();
      await page.waitForTimeout(1200);

      const timeline = card(page, 'Timeline');
      assert.deepEqual(await timeline.locator('.timeline-label').allInnerTexts(), ['Start', 'H q0', 'CNOT q0→q1']);
      assert.equal(await timeline.locator('[aria-current="step"]').getAttribute('aria-label'),
        'Step 2 of 2, after CNOT q0→q1: |00⟩ 50%, |11⟩ 50%');

      // Back one frame: the state after H only
      await timeline.getByRole('button', { name: '◀ Back' }).click();
      await settle(page);
      assert.match(await timeline.locator('.timeline-status').innerText(), /^Step 1 of 2, after H q0: \|00⟩ 50%, \|10⟩ 50%$/);
      assert.match(await page.locator('.amp-table').innerText(), /\|10⟩\s+0\.707/);

      // The slider jumps to the start
      await timeline.getByRole('slider').fill('0');
      await settle(page);
      assert.match(await timeline.locator('.timeline-status').innerText(), /^Start: \|00⟩ 100%$/);

      // Step carries on from here, replacing the later frames
      await page.getByRole('button', { name: 'Step', exact: true }).click();
      await settle(page);
      assert.match(await timeline.locator('.timeline-status').innerText(), /^Step 1 of 2/);
      assert.equal(await timeline.locator('.timeline-frame').count(), 2);

      // Undo goes back to the frame before; another action ends the timeline
      await button(page, 'Undo').click();
      await settle(page);
      assert.match(await timeline.locator('.timeline-status').innerText(), /^Start/);
      await button(page, 'X').click();
      await settle(page);
      assert.equal(await page.locator('.timeline').count(), 0);
    }));
});

describe('Noise', () => {
  test('dephasing a Bell pair mixes it; the views follow; Measure all makes it pure', () =>
    withLab('#/lab/2', async page => {
      await button(page, 'Show advanced views').click();
      await button(page, 'Create Bell Pair').click();
      await settle(page);
      const noise = card(page, 'Noise');
      assert.match(await card(page, 'Density Matrix').locator('.density-purity').innerText(), /Purity Tr ρ² = 1\.000: a pure state/);

      await noise.getByRole('radio', { name: 'Dephasing' }).check();
      await noise.getByRole('slider').fill('100');
      await noise.getByRole('button', { name: 'Noise on Q0' }).click();
      await settle(page);

      assert.match(await page.locator('.mixed-notice').innerText(), /The state is mixed/);
      assert.match(await page.locator('.amp-table').innerText(), /\|00⟩\s+—\s+50\.0%\s+—/);
      assert.equal(await page.getByRole('checkbox', { name: 'Hide global phase' }).count(), 0);
      assert.match(await card(page, 'Density Matrix').locator('.density-purity').innerText(), /Purity Tr ρ² = 0\.500: a mixed state/);
      assert.match(await card(page, 'Entanglement').innerText(), /These measures only work for a pure state/);
      assert.match(await card(page, 'Interference').innerText(), /The state is mixed/);
      assert.match(await card(page, 'Unitary Matrix').locator('.unitary-what').innerText(), /Noise is not unitary/);
      // The coherence is gone: XX is 0, but ZZ still agrees
      const grid = card(page, 'Pauli Expectations').locator('.pauli-pair tbody tr');
      assert.equal(await grid.nth(0).locator('td').nth(0).innerText(), '0.00');
      assert.equal(await grid.nth(2).locator('td').nth(2).innerText(), '+1.00');
      assert.match(await page.locator('[data-testid="announcer"]').innerText(), /Dephasing noise, 100%, on qubit 0/);

      // A gate on a mixed state keeps it mixed; Measure all makes it pure
      await button(page, 'H').click();
      await settle(page);
      assert.equal(await page.locator('.mixed-notice').count(), 1);
      await button(page, 'Measure all').click();
      await settle(page);
      assert.equal(await page.locator('.mixed-notice').count(), 0);
      assert.match(await card(page, 'Density Matrix').locator('.density-purity').innerText(), /a pure state/);

      // Undo returns to the mixed state; it is saved and reloaded as mixed
      await button(page, 'Undo').click();
      await settle(page);
      assert.equal(await page.locator('.mixed-notice').count(), 1);
      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.equal(await page.locator('.mixed-notice').count(), 1, 'mixed state reloaded');
    }));

  test('amplitude damping at full strength resets a qubit to |0⟩', () =>
    withLab('#/lab/1', async page => {
      await button(page, 'Show advanced views').click();
      await button(page, 'X').click();
      await settle(page);
      const noise = card(page, 'Noise');
      await noise.getByRole('radio', { name: 'Amplitude damping' }).check();
      await noise.getByRole('slider').fill('100');
      await noise.getByRole('button', { name: 'Noise on Q0' }).click();
      await settle(page);
      assert.match(await page.locator('.amp-table').innerText(), /\|0⟩\s+—\s+100\.0%/);
      assert.match(await page.locator('.bloch-coords').innerText(), /z = 1\.00/);
    }));
});

describe('Noise steps in circuits', () => {
  test('N adds the chosen noise to the circuit; runs, the timeline and reloads keep it', () =>
    withLab('#/lab/2', async page => {
      assert.equal(await page.locator('.noise-chip').count(), 0, 'no N without the Noise panel');
      await button(page, 'Show advanced views').click();
      const noise = card(page, 'Noise');
      await noise.getByRole('radio', { name: 'Dephasing' }).check();
      await noise.getByRole('slider').fill('100');
      assert.equal(await page.locator('.noise-chip').count(), 2, 'one N per qubit');

      await page.getByRole('button', { name: 'Add H on Q0' }).click();
      await page.getByRole('button', { name: 'Add CNOT, control Q0, target Q1' }).click();
      await page.getByRole('button', { name: 'Add Dephase 100% noise on Q0' }).click();
      assert.deepEqual(await page.locator('.circuit-step-label').allInnerTexts(), ['H q0', 'CNOT q0→q1', 'Dephase 100% q0']);

      await page.getByRole('button', { name: 'Run Circuit' }).click();
      await page.waitForTimeout(1700);
      assert.deepEqual(await card(page, 'Timeline').locator('.timeline-label').allInnerTexts(),
        ['Start', 'H q0', 'CNOT q0→q1', 'Dephase 100% q0']);
      assert.equal(await page.locator('.mixed-notice').count(), 1);
      assert.match(await card(page, 'Density Matrix').locator('.density-purity').innerText(), /= 0\.500/);

      // Back one frame: the pure Bell pair
      await card(page, 'Timeline').getByRole('button', { name: '◀ Back' }).click();
      await settle(page);
      assert.equal(await page.locator('.mixed-notice').count(), 0);

      const unitary = card(page, 'Unitary Matrix');
      await unitary.getByRole('radio', { name: 'Whole circuit' }).check();
      assert.match(await unitary.locator('.unitary-what').innerText(), /noise \(N\), which is not unitary/);

      // The step keeps its own strength when the panel changes, and survives a reload
      await noise.getByRole('slider').fill('20');
      assert.equal(await page.locator('.circuit-step-label').nth(2).innerText(), 'Dephase 100% q0');
      await page.reload();
      await page.locator('h1').waitFor();
      await settle(page);
      assert.deepEqual(await page.locator('.circuit-step-label').allInnerTexts(), ['H q0', 'CNOT q0→q1', 'Dephase 100% q0']);
      assert.equal(await page.getByRole('button', { name: 'Add Dephase 20% noise on Q1' }).count(), 1, 'noise choice remembered');
    }));
});

describe('Noisy runs', () => {
  test('noise after every step: fidelity falls along the timeline; a measurement ends it', () =>
    withLab('#/lab/3', async page => {
      await button(page, 'Show advanced views').click();
      const noise = card(page, 'Noise');
      await noise.getByRole('radio', { name: 'Dephasing' }).check();
      await noise.getByRole('slider').fill('3');
      await page.getByRole('checkbox', { name: /Noisy run: Dephase 3% on every qubit/ }).check();

      await page.getByRole('button', { name: 'Add H on Q0' }).click();
      await page.getByRole('button', { name: 'Add CNOT, control Q0, target Q1' }).click();
      await page.getByRole('button', { name: 'Run Circuit' }).click();
      await page.waitForTimeout(1300);

      const timeline = card(page, 'Timeline');
      assert.equal(await timeline.locator('.fidelity').count(), 1, 'fidelity chart shown');
      const fids = await timeline.locator('.timeline-fidelity').allInnerTexts();
      assert.equal(fids[0], 'F 1.00');
      const values = fids.map(t => Number(t.slice(2)));
      assert.ok(values[1] < 1 && values[2] < values[1], `falls: ${fids}`);
      assert.match(await timeline.locator('.timeline-status').innerText(), /, fidelity 0\.\d\d$/);
      assert.match(await page.locator('[data-testid="announcer"]').innerText(), /fidelity with the noiseless run 0\.\d\d/);

      // A measurement ends the comparison
      await page.getByRole('button', { name: 'Add M on Q0' }).click();
      await page.getByRole('button', { name: 'Run Circuit' }).click();
      await page.waitForTimeout(1700);
      assert.equal((await timeline.locator('.timeline-fidelity').allInnerTexts()).at(-1), 'F —');

      // Without the box ticked, a run has no noise and no fidelity chart
      await page.getByRole('checkbox', { name: /Noisy run/ }).uncheck();
      await page.getByRole('button', { name: 'Run Circuit' }).click();
      await page.waitForTimeout(1700);
      assert.equal(await timeline.locator('.fidelity').count(), 0);
    }));
});

describe('Readout errors in Shots', () => {
  test('misreads give impossible results; mitigation works them back out', () =>
    withLab('#/lab/2', async page => {
      await button(page, 'Create Bell Pair').click();
      await settle(page);
      const shots = card(page, 'Shots');
      await shots.getByRole('checkbox', { name: 'Readout errors' }).check();
      const sliders = shots.getByRole('slider');
      await sliders.nth(0).fill('20');
      await sliders.nth(1).fill('15');
      await shots.getByRole('button', { name: 'Run 1000 shots' }).click();

      const summary = await shots.locator('.shots-summary').innerText();
      assert.match(summary, /^1000 shots, read out with errors: /);
      const count = label => Number((summary.match(new RegExp(`\\|${label}⟩ (\\d+)`)) || [0, 0])[1]);
      assert.ok(count('01') + count('10') > 50, `impossible results recorded: ${summary}`);
      assert.match(await shots.locator('.shots-readout-note').first().innerText(), /1 as 0: 20%, 0 as 1: 15%/);
      assert.equal(await shots.locator('.shots-corrected').count(), 0);

      // Correcting: estimates near 50/0/0/50, from the same counts
      await shots.getByRole('checkbox', { name: /Correct for readout errors/ }).check();
      assert.equal(await shots.locator('.shots-summary').innerText().then(t => t.startsWith(summary)), true, 'same counts');
      assert.equal(await shots.locator('.shots-corrected').count(), 4);
      const details = await shots.locator('.shots-detail').allInnerTexts();
      const corrected = details.map(t => Number(t.match(/corrected (−?[\d.]+)%/)[1].replace('−', '-')));
      assert.ok(Math.abs(corrected[0] - 50) < 12 && Math.abs(corrected[3] - 50) < 12, `${details}`);
      assert.ok(Math.abs(corrected[1]) < 10 && Math.abs(corrected[2]) < 10, `${details}`);
      assert.ok(Math.abs(corrected.reduce((a, b) => a + b) - 100) < 0.5, 'estimates add up to 100%');

      // New rates mean new counts
      await sliders.nth(1).fill('5');
      assert.match(await shots.locator('.shots-summary').innerText(), /No shots run yet/);
    }));
});

describe('Lesson: Reading a qubit is noisy too', () => {
  test('Set up switches on readout errors; Set up again restores them', () =>
    withLab('#/lessons/noisy-readout', async page => {
      const shots = page.locator('.card.shots');
      const box = shots.getByRole('checkbox', { name: 'Readout errors', exact: true });
      assert.equal(await box.isChecked(), true);
      assert.deepEqual(await shots.locator('.shots-rate output').allInnerTexts(), ['5%', '2%']);
      assert.equal(await shots.getByRole('checkbox', { name: /Correct for readout errors/ }).isChecked(), false);

      await shots.getByRole('button', { name: 'Run 1000 shots' }).click();
      const summary = await shots.locator('.shots-summary').innerText();
      const impossible = [...summary.matchAll(/\|(\d{3})⟩ (\d+)/g)]
        .filter(([, label]) => label !== '000' && label !== '111')
        .reduce((s, [, , c]) => s + Number(c), 0);
      assert.ok(impossible > 30, `results the GHZ state can't give: ${summary}`);

      // The learner turns readout errors off; Set up brings them back
      await box.uncheck();
      await page.getByRole('button', { name: 'Set up again' }).click();
      await settle(page);
      assert.equal(await box.isChecked(), true);
    }));
});
