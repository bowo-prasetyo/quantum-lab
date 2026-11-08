// Top navigation: lab size selector, lessons and reference pages, the
// colour theme (system, light or dark; see theme.js) and the language
// (locale.js). The language picker appears only when there is more than
// one language to choose from.

import { getTheme, setTheme } from '../theme.js';
import { availableLocales, localeName } from '../i18n.js';
import { chooseLocale } from '../locale.js';

export const AppNav = {
  data() {
    return { theme: getTheme() };
  },

  computed: {
    // The pseudo-locale (a test language) is listed only while it is in use
    locales() {
      const codes = availableLocales();
      if (!codes.includes(this.$locale)) codes.push(this.$locale);
      return codes.map(code => ({ code, name: localeName(code) }));
    },
    locale: {
      get() { return this.$locale; },
      set(code) { chooseLocale(code); }
    }
  },

  watch: {
    theme(value) { setTheme(value); }
  },

  template: `
    <nav class="card nav">
      <router-link to="/lab/1" class="nav-brand" :aria-label="$t('nav.home')">
        <img src="./favicon.svg" alt="" width="28" height="28" />
        <span><span class="nav-brand-soft">Glass</span> Qubit</span>
      </router-link>

      <span class="nav-label">{{ $t('nav.labLabel') }}</span>
      <router-link
        v-for="n in [1, 2, 3]"
        :key="n"
        :to="'/lab/' + n"
        class="nav-link"
        active-class="active"
      >{{ $t('nav.lab', { count: n }) }}</router-link>

      <span class="nav-sep"></span>

      <router-link to="/lessons" class="nav-link" active-class="active">{{ $t('nav.lessons') }}</router-link>
      <router-link to="/concepts" class="nav-link" active-class="active">{{ $t('nav.concepts') }}</router-link>
      <router-link to="/help" class="nav-link" active-class="active">{{ $t('nav.help') }}</router-link>

      <label class="nav-picker">
        <span class="nav-label">{{ $t('nav.theme') }}</span>
        <select v-model="theme" :aria-label="$t('nav.themeAria')">
          <option value="system">{{ $t('nav.themeSystem') }}</option>
          <option value="light">{{ $t('nav.themeLight') }}</option>
          <option value="dark">{{ $t('nav.themeDark') }}</option>
        </select>
      </label>

      <label v-if="locales.length > 1" class="nav-picker">
        <span class="nav-label">{{ $t('nav.language') }}</span>
        <select v-model="locale" :aria-label="$t('nav.languageAria')" data-testid="language-picker">
          <option v-for="l in locales" :key="l.code" :value="l.code" :lang="l.code">{{ l.name }}</option>
        </select>
      </label>
    </nav>
  `
};
