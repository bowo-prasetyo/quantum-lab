// Lesson index (#/lessons): the whole path, grouped by part.

import { AppNav } from '../components/app-nav.js';
import { LESSONS, PARTS } from '../lessons.js';
import { lessonText, partTitle } from '../content.js';
import { loadPredictions, clearPredictions } from '../progress.js';
import { setPref } from '../prefs.js';

export const Lessons = {
  components: { AppNav },

  data() {
    return { predictions: loadPredictions() };
  },

  // Someone who has seen the lessons doesn't need the lab's welcome
  mounted() {
    setPref('welcomed', true);
  },

  computed: {
    parts() {
      let number = 0;
      return PARTS.map(part => ({
        ...part,
        title: partTitle(part.part),
        lessons: LESSONS
          .filter(l => l.part === part.part)
          .map(l => ({ id: l.id, ...lessonText(l.id), number: ++number }))
      }));
    },
    answered() {
      return Object.keys(this.predictions).length;
    },
    correct() {
      return Object.values(this.predictions).filter(Boolean).length;
    }
  },

  methods: {
    resetTally() {
      clearPredictions();
      this.predictions = {};
    }
  },

  template: `
    <div class="container">
      <app-nav />

      <div class="card">
        <h1>{{ $t('lessons.title') }}</h1>
        <i18n-t k="lessons.intro" tag="p" :params="{ count: parts.reduce((sum, p) => sum + p.lessons.length, 0) }" />
        <p v-if="answered" class="tally">
          {{ $t('lessons.tally', { correct, count: answered }) }}
          <button class="link-button" @click="resetTally">{{ $t('lessons.startOver') }}</button>
        </p>
        <p class="caption">{{ $t('lessons.stored') }}</p>
      </div>

      <div v-for="part in parts" :key="part.part" class="card">
        <h2>{{ $t('lessons.part', { part: part.part, title: part.title }) }}</h2>
        <ol class="lesson-list" :start="part.lessons[0].number">
          <li v-for="lesson in part.lessons" :key="lesson.id">
            <router-link :to="'/lessons/' + lesson.id">{{ lesson.title }}</router-link>
            <span
              v-if="lesson.id in predictions"
              class="badge"
              :class="predictions[lesson.id] ? 'right' : 'wrong'"
            >{{ $t(predictions[lesson.id] ? 'lessons.predictedRight' : 'lessons.predictedWrong') }}</span>
            <i18n-t :text="lesson.goal" tag="div" class="caption" />
          </li>
        </ol>
      </div>
    </div>
  `
};
