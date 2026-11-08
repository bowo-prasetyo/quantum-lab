// Help (#/help): how to use the lab's controls. The physics is in
// Concepts and the lessons. The words are in content/en.js (and its
// translations), under help: sections of paragraphs and lists.

import { AppNav } from '../components/app-nav.js';
import { helpText } from '../content.js';

export const Help = {
  components: { AppNav },

  computed: {
    // In the current language, with button and view names filled in
    page() {
      return helpText();
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
        <template v-for="(block, b) in section.blocks" :key="b">
          <i18n-t v-if="block.p" :text="block.p" tag="p" />
          <ul v-else-if="block.ul">
            <i18n-t v-for="(item, i) in block.ul" :key="i" :text="item" tag="li" />
          </ul>
          <ol v-else-if="block.ol">
            <i18n-t v-for="(item, i) in block.ol" :key="i" :text="item" tag="li" />
          </ol>
        </template>
      </div>
    </div>
  `
};
