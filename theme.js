// Colour theme: 'system' (follow the device), 'light' or 'dark'.
//
// The choice is kept in this browser (prefs.js) and applied as data-theme
// on <html>, which switches the colour tokens in styles.css. index.html
// applies a saved choice before the page first paints, so there is no
// flash of the wrong theme. Whenever the colours change (a new choice, or
// the device switching between light and dark while on 'system'), a
// 'themechange' event tells the canvases to redraw (canvas-fit.js).

import { getPref, setPref } from './prefs.js';

export const THEMES = ['system', 'light', 'dark'];
const systemLight = window.matchMedia('(prefers-color-scheme: light)');

/** The learner's choice: 'system', 'light' or 'dark'. */
export function getTheme() {
  const theme = getPref('theme', 'system');
  return THEMES.includes(theme) ? theme : 'system';
}

/** The theme actually shown: 'light' or 'dark'. */
export function effectiveTheme() {
  const theme = getTheme();
  if (theme !== 'system') return theme;
  return systemLight.matches ? 'light' : 'dark';
}

function apply() {
  const theme = getTheme();
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  // The browser bar's colour follows the page background
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  window.dispatchEvent(new Event('themechange'));
}

export function setTheme(theme) {
  setPref('theme', THEMES.includes(theme) ? theme : 'system');
  apply();
}

/** Applies the saved theme and follows the device while on 'system'. */
export function initTheme() {
  apply();
  systemLight.addEventListener('change', () => {
    if (getTheme() === 'system') apply();
  });
}
