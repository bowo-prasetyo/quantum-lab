// Quantum Concepts (#/concepts): one reference for every lab size,
// merged from the three original simulators. The words are in
// content/en.js (and its translations), under concepts.

import { AppNav } from '../components/app-nav.js';
import { conceptsText } from '../content.js';

export const Concepts = {
  components: { AppNav },

  computed: {
    // In the current language, with button and view names filled in
    page() {
      return conceptsText();
    }
  },

  template: `
    <div class="container">
      <app-nav />

      <div class="card">
        <h1>{{ page.title }}</h1>
        <i18n-t :text="page.intro" tag="p" />
      </div>

      <div v-for="section in page.sections" :key="section.title" class="card">
        <h2>{{ section.title }}</h2>
        <dl class="concepts">
          <template v-for="[term, text] in section.items" :key="term">
            <dt>{{ term }}</dt>
            <i18n-t :text="text" tag="dd" />
          </template>
        </dl>
      </div>
    </div>
  `
};
