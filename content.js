// The words of the lessons, Quantum Concepts and Help in the current
// language (content/<code>.js through contentText in i18n.js), with the
// names of buttons and views filled in from the interface's own messages.
// A lesson step written "Press {measureAll}." therefore always names the
// button exactly as it reads, in every language. Plain functions, so the
// unit tests can use them; called while Vue renders, they follow a change
// of language by themselves.

import { t, fill, contentText } from './i18n.js';

/**
 * The placeholders content may use, and the message each one shows. A
 * placeholder not listed here is left in the text, where the tests and the
 * pseudo-locale show it up.
 */
export const BUTTONS = Object.freeze({
  // Gates panel
  measureAll: () => t('gates.measureAll'),
  bell: () => t('gates.bell'),
  ghz: () => t('gates.ghz'),
  reset: () => t('gates.reset'),
  undo: () => t('gates.undo'),
  // Circuit editor and timeline
  run: () => t('editor.run'),
  step: () => t('editor.step'),
  clear: () => t('editor.clear'),
  fromZero: () => t('editor.fromZero', { zero: '|0…0⟩' }),
  back: () => t('timeline.back'),
  forward: () => t('timeline.forward'),
  // Lessons
  setUp: () => t('lesson.setUp'),
  showMe: () => t('lesson.showMe'),
  check: () => t('lesson.check'),
  practise: () => t('lesson.practise'),
  // Views and their controls
  hideGlobalPhase: () => t('table.hideGlobalPhase'),
  run100: () => t('shots.run', { count: 100, shots: '100' }),
  run1000: () => t('shots.run', { count: 1000, shots: '1000' }),
  readout: () => t('shots.readout'),
  mitigate: () => t('shots.mitigate'),
  showAdvanced: () => t('lab.showAdvanced'),
  // Noise panel
  dephasing: () => t('noise.dephasing'),
  damping: () => t('noise.damping'),
  depolarizing: () => t('noise.depolarizing'),
  noiseQ0: () => t('noisePanel.onQubit', { qubit: 0 }),
  noiseEvery: () => t('noisePanel.every'),
  // The top bar
  lab1: () => t('nav.lab', { count: 1 }),
  lab2: () => t('nav.lab', { count: 2 }),
  lab3: () => t('nav.lab', { count: 3 }),
  theme: () => t('nav.theme'),
  themeSystem: () => t('nav.themeSystem'),
  concepts: () => t('nav.concepts'),
  help: () => t('nav.help'),
  // Headings of views and panels
  stateTable: () => t('table.title'),
  shotsView: () => t('shots.title'),
  timelineView: () => t('timeline.title'),
  pauliView: () => t('pauli.title'),
  unitaryView: () => t('unitary.title'),
  interferenceView: () => t('interference.title'),
  entanglementView: () => t('entanglement.title'),
  gatesPanel: () => t('gates.title'),
  noisePanel: () => t('noisePanel.title')
});

/** Every placeholder's text in the current language: { measureAll: 'Measure all', … }. */
export function buttonLabels() {
  return Object.fromEntries(Object.entries(BUTTONS).map(([name, label]) => [name, label()]));
}

// Fills every string in a piece of content, at any depth
function fillAll(value, labels) {
  if (typeof value === 'string') return fill(value, labels);
  if (Array.isArray(value)) return value.map(v => fillAll(v, labels));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillAll(v, labels)]));
  return value;
}

const FIELDS = ['title', 'goal', 'why', 'steps', 'question', 'options', 'result'];

/**
 * A lesson's words: { title, goal, why, steps, question, options, result }.
 * Each field comes from the current language if it has it, else English.
 */
export function lessonText(id) {
  const labels = buttonLabels();
  return Object.fromEntries(FIELDS.map(field => [field, fillAll(contentText(['lessons', id, field]), labels)]));
}

/** The title of a part of the lesson path (1–4). */
export function partTitle(part) {
  return fillAll(contentText(['parts', String(part)]), buttonLabels());
}

/** Quantum Concepts: { title, intro, sections: [{ title, items: [[term, text]] }] }. */
export function conceptsText() {
  const labels = buttonLabels();
  return Object.fromEntries(['title', 'intro', 'sections'].map(k => [k, fillAll(contentText(['concepts', k]), labels)]));
}

/** Help: { title, intro, sections: [{ title, blocks: [{ p } | { ul } | { ol }] }] }. */
export function helpText() {
  const labels = buttonLabels();
  return Object.fromEntries(['title', 'intro', 'sections'].map(k => [k, fillAll(contentText(['help', k]), labels)]));
}
