// Language of the page: connects i18n.js to the document and to Vue.
//
// The start language comes from detectLocale (i18n.js): ?lang= in the
// address, else the learner's saved choice (prefs.js), else the browser's
// languages, else English. Choosing a language in the top bar saves it.
// Whenever the language changes, <html lang> and dir, the page title and
// description follow, Vue re-renders every $t, and a 'localechange' event
// tells the canvases to redraw (canvas-fit.js).

import { getPref, setPref } from './prefs.js';
import { detectLocale, getLocale, setLocale, onLocaleChange, isRtl, t, trackLocaleWith } from './i18n.js';

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
 * Splits a message into text, **bold**, *emphasis*, [link](/route) and
 * {slot} parts: "Press **Run** or see [Help](/help)" →
 *   [{ text: 'Press ' }, { bold: 'Run' }, { text: ' or see ' }, { link: 'Help', to: '/help' }]
 * Plain module function, so the unit tests can check it.
 */
export function parseMarkup(message) {
  const parts = [];
  const pattern = /\*\*(.+?)\*\*|\*([^*\s][^*]*?)\*|\[([^\]]+)\]\(([^)\s]+)\)|\{(\w+)\}/g;
  let last = 0;
  for (const m of message.matchAll(pattern)) {
    if (m.index > last) parts.push({ text: message.slice(last, m.index) });
    if (m[1] !== undefined) parts.push({ bold: m[1] });
    else if (m[2] !== undefined) parts.push({ em: m[2] });
    else if (m[3] !== undefined) parts.push({ link: m[3], to: m[4] });
    else parts.push({ slot: m[5] });
    last = m.index + m[0].length;
  }
  if (last < message.length) parts.push({ text: message.slice(last) });
  return parts;
}

/**
 * <i18n-t k="key" :params="{ ... }" tag="p">: a message that holds markup.
 * **bold** becomes <strong>, *emphasis* <em>, [text](/route) a <router-link>, and {name}
 * the slot of that name if there is one (for buttons, inputs or anything
 * else that has to sit inside a translated sentence), else params.name.
 * Renders no wrapper element unless `tag` is given. Builds Vue nodes, never
 * HTML, so a translation can't inject markup.
 */
const I18nT = {
  name: 'I18nT',
  props: {
    k: { type: String, required: true },
    params: { type: Object, default: () => ({}) },
    tag: { type: String, default: null }
  },
  render() {
    const { h, resolveComponent } = Vue;
    const RouterLink = resolveComponent('router-link');
    // t() fills in params (and picks a plural form); placeholders it has
    // no value for are left in the text, for the slots
    const children = parseMarkup(t(this.k, this.params)).map(part => {
      if (part.text !== undefined) return part.text;
      if (part.bold !== undefined) return h('strong', part.bold);
      if (part.em !== undefined) return h('em', part.em);
      if (part.link !== undefined) return h(RouterLink, { to: part.to }, () => part.link);
      return this.$slots[part.slot] ? this.$slots[part.slot]() : `{${part.slot}}`;
    });
    return this.tag ? h(this.tag, children) : children;
  }
};

/**
 * Vue plugin: $t(key, params) in every template and component, and
 * $locale, the language in use; the <i18n-t> component. Every t() and
 * format call made while Vue renders or computes depends on the language,
 * so it updates by itself when the language changes (trackLocaleWith).
 */
export const i18nPlugin = {
  install(app) {
    const state = Vue.reactive({ locale: getLocale() });
    onLocaleChange(locale => { state.locale = locale; });
    trackLocaleWith(() => state.locale);
    app.config.globalProperties.$t = t;
    Object.defineProperty(app.config.globalProperties, '$locale', { get: () => state.locale });
    app.component('i18n-t', I18nT);
  }
};
