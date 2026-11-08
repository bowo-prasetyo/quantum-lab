// Language of the page: connects i18n.js to the document and to Vue.
//
// The start language comes from detectLocale (i18n.js): ?lang= in the
// address, else the learner's saved choice (prefs.js), else the browser's
// languages, else English. Choosing a language in the top bar saves it.
// Whenever the language changes, <html lang> and dir, the page title and
// description follow, Vue re-renders every $t, and a 'localechange' event
// tells the canvases to redraw (canvas-fit.js).

import { getPref, setPref } from './prefs.js';
import { detectLocale, getLocale, setLocale, onLocaleChange, isRtl, t } from './i18n.js';

function apply(locale) {
  const html = document.documentElement;
  html.lang = locale;
  html.dir = isRtl(locale) ? 'rtl' : 'ltr';
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  window.dispatchEvent(new Event('localechange'));
}

/** Picks the start language and applies it to the page. Call once, before mounting. */
export function initLocale() {
  setLocale(detectLocale({
    search: location.search,
    saved: getPref('locale', null),
    languages: navigator.languages ?? [navigator.language]
  }));
  apply(getLocale());
  onLocaleChange(apply);
}

/**
 * The learner chose a language in the top bar: remember it and switch.
 * A ?lang= in the address would override the choice on the next visit, so
 * it is removed (keeping the rest of the address, including the route).
 */
export function chooseLocale(code) {
  setPref('locale', code);
  const url = new URL(location.href);
  if (url.searchParams.has('lang')) {
    url.searchParams.delete('lang');
    history.replaceState(history.state, '', url);
  }
  setLocale(code);
}

/**
 * Vue plugin: $t(key, params) in every template and component, re-rendered
 * when the language changes, and $locale, the language in use.
 */
export const i18nPlugin = {
  install(app) {
    const state = Vue.reactive({ locale: getLocale() });
    onLocaleChange(locale => { state.locale = locale; });
    // Reading state.locale makes every render that calls $t depend on it
    app.config.globalProperties.$t = (key, params) => t(key, params, state.locale);
    Object.defineProperty(app.config.globalProperties, '$locale', { get: () => state.locale });
  }
};
