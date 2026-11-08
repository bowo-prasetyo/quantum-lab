// Lesson index (#/lessons): the whole path, grouped by part.

import { AppNav } from '../components/app-nav.js';
import { LESSONS, PARTS } from '../lessons.js';
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
        lessons: LESSONS
          .filter(l => l.part === part.part)
          .map(l => ({ ...l, number: ++number }))
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
        <h1>Lessons</h1>
        <p>
          One path from a single qubit to three-qubit entanglement, in
          {{ parts.reduce((sum, p) => sum + p.lessons.length, 0) }} short lessons.
          In each one you set up the lab, <strong>predict</strong> what will happen,
          then try it and see.
        </p>
        <p v-if="answered" class="tally">
          Your predictions: {{ correct }} of {{ answered }} right first time.
          <button class="link-button" @click="resetTally">Start over</button>
        </p>
        <p class="caption">Your predictions are stored only in this browser.</p>
      </div>

      <div v-for="part in parts" :key="part.part" class="card">
        <h2>Part {{ part.part }}: {{ part.title }}</h2>
        <ol class="lesson-list" :start="part.lessons[0].number">
          <li v-for="lesson in part.lessons" :key="lesson.id">
            <router-link :to="'/lessons/' + lesson.id">{{ lesson.title }}</router-link>
            <span
              v-if="lesson.id in predictions"
              class="badge"
              :class="predictions[lesson.id] ? 'right' : 'wrong'"
            >{{ predictions[lesson.id] ? 'predicted ✓' : 'predicted ✗' }}</span>
            <div class="caption">{{ lesson.goal }}</div>
          </li>
        </ol>
      </div>
    </div>
  `
};
