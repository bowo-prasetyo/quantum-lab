// One lesson (#/lessons/:id): goal, prediction, steps and an embedded lab
// showing only the panels the lesson needs.

import { AppNav } from '../components/app-nav.js';
import { Lab } from '../lab.js';
import { LESSONS, PARTS, lessonById } from '../lessons.js';
import { evaluateChecks } from '../lesson-checks.js';
import { loadPredictions, recordPrediction, firstChoice } from '../progress.js';
import { setPref } from '../prefs.js';

// Pause between steps in "Show me": 600 ms, shorter for long lessons so
// the whole run takes about 6 seconds at most
const showMeDelay = steps => Math.min(600, Math.round(6000 / Math.max(steps, 1)));

// Lesson operations → circuit editor steps
function toStep([kind, a, b, c]) {
  if (kind === 'cnot') return { gate: 'CNOT', control: a, target: b };
  if (kind === 'cz') return { gate: 'CZ', control: a, target: b };
  if (kind === 'measureQubit') return { gate: 'M', target: a };
  if (kind === 'noise') return { gate: 'N', channel: a, target: b, strength: c };
  return { gate: a, target: b };
}

export const Lesson = {
  components: { AppNav, Lab },

  props: {
    id: { type: String, required: true }
  },

  data() {
    const lesson = lessonById(this.id);
    return {
      lesson,
      chosen: null,             // index of the option picked this visit (first answer or practice)
      // The first prediction, from an earlier visit or earlier in this one:
      // right or not (undefined if none yet), and which option (null if not known)
      firstCorrect: lesson ? loadPredictions()[lesson.id] : undefined,
      firstPick: lesson ? firstChoice(lesson.id) : null,
      practice: false,          // answering again for practice; doesn't change the tally
      // The lab's state when "Check my result" (or Show me) last checked it,
      // or null; checkResult is worked out from it, so its text follows a
      // change of language
      checkedState: null,
      busy: false
    };
  },

  computed: {
    // Found by id: this.lesson is a reactive copy, so indexOf would miss it
    index() {
      return LESSONS.findIndex(l => l.id === this.lesson.id);
    },
    part() {
      return PARTS.find(p => p.part === this.lesson.part);
    },
    previous() {
      return LESSONS[this.index - 1] || null;
    },
    next() {
      return LESSONS[this.index + 1] || null;
    },
    predicted() {
      return this.chosen !== null;
    },
    answeredBefore() {
      return this.firstCorrect !== undefined;
    },
    // Options are locked once answered, until "Try again (practice)"
    locked() {
      return this.predicted || (this.answeredBefore && !this.practice);
    },
    // The option shown as the learner's: this visit's pick, or else the first pick
    shownPick() {
      if (this.predicted) return this.chosen;
      return this.locked ? this.firstPick : null;
    },
    shownRight() {
      return this.predicted ? this.chosen === this.lesson.predict.answer : this.firstCorrect;
    },
    // The explanation is shown once the learner has predicted or succeeded
    showResult() {
      return this.predicted || this.answeredBefore || (this.checkResult && this.checkResult.pass);
    },
    usesEditor() {
      return this.lesson.panels.includes('editor');
    },
    // { pass, results } for the last check, or null
    checkResult() {
      return this.checkedState ? evaluateChecks(this.lesson.checks, this.checkedState) : null;
    },
    lessonCount() {
      return LESSONS.length;
    }
  },

  mounted() {
    // Someone who has opened a lesson doesn't need the lab's welcome
    setPref('welcomed', true);
    if (this.lesson) this.setUp();
  },

  methods: {
    choose(i) {
      if (this.locked) return;
      this.chosen = i;
      if (this.answeredBefore) return; // practice: the first answer stands
      const correct = i === this.lesson.predict.answer;
      recordPrediction(this.lesson.id, correct, i);
      this.firstCorrect = correct;
      this.firstPick = i;
    },

    // Answer again without changing the recorded first prediction
    practiseAgain() {
      this.practice = true;
      this.chosen = null;
      this.$nextTick(() => this.$el.querySelector('.option')?.focus());
    },

    // A lesson that runs on noisy hardware chooses its noise and turns on
    // noisy runs (without changing the free lab's remembered choice); one
    // about readout sets the Shots view's readout errors
    prepareNoise() {
      const lab = this.$refs.lab;
      if (this.lesson.noisyRun) lab.setNoise(this.lesson.noisyRun, { remember: false });
      lab.setNoisyRun(!!this.lesson.noisyRun);
      lab.setReadoutPreset(this.lesson.readout ?? null);
    },

    async setUp() {
      this.checkedState = null;
      this.busy = true;
      try {
        this.prepareNoise();
        await this.$refs.lab.runOps(this.lesson.setup, { clearCircuit: true });
      } finally {
        this.busy = false;
      }
    },

    // Runs the lesson's steps for the learner, slowly enough to follow
    async showMe() {
      this.checkedState = null;
      this.busy = true;
      try {
        this.prepareNoise();
        await this.$refs.lab.runOps(this.lesson.setup, { clearCircuit: true });
        if (this.usesEditor) {
          // Teach the editor: fill in the circuit, then run it
          await this.$refs.lab.setCircuit(this.lesson.ops.map(toStep));
          await this.$refs.lab.runCircuit();
        } else {
          await this.$refs.lab.runOps(this.lesson.ops, { delay: showMeDelay(this.lesson.ops.length) });
        }
      } finally {
        this.busy = false;
      }
      this.check();
    },

    async check() {
      // Wait for any queued operations to finish first
      await this.$refs.lab.queue;
      // Frozen: Vue needn't watch inside it
      this.checkedState = Object.freeze(this.$refs.lab.getState());
    }
  },

  template: `
    <div class="container wide">
      <app-nav />

      <div v-if="!lesson" class="card">
        <h1>{{ $t('lesson.notFound') }}</h1>
        <p><router-link to="/lessons">{{ $t('lesson.seeAll') }}</router-link></p>
      </div>

      <template v-else>
        <div class="lesson-intro">
          <div class="card">
            <p class="caption">
              <router-link to="/lessons">{{ $t('nav.lessons') }}</router-link>
              · {{ $t('lessons.part', { part: part.part, title: part.title }) }} · {{ $t('lesson.position', { k: index + 1, total: lessonCount }) }}
            </p>
            <h1>{{ lesson.title }}</h1>
            <i18n-t k="lesson.goal" tag="p" :params="{ goal: lesson.goal }" />
            <i18n-t k="lesson.why" tag="p" :params="{ why: lesson.why }" />
          </div>

          <div class="card predict">
            <h2>{{ $t('lesson.predict') }}</h2>
            <p>{{ lesson.predict.question }}</p>
            <div class="options">
              <button
                v-for="(option, i) in lesson.predict.options"
                :key="i"
                class="option"
                :class="{
                  chosen: shownPick === i,
                  right: locked && i === lesson.predict.answer,
                  wrong: locked && shownPick === i && i !== lesson.predict.answer
                }"
                :disabled="locked"
                :aria-pressed="shownPick === i ? 'true' : null"
                @click="choose(i)"
              >{{ option }}<span v-if="locked && i === lesson.predict.answer" class="visually-hidden"> {{ $t('lesson.rightAnswer') }}</span><span v-if="locked && shownPick === i && i !== lesson.predict.answer" class="visually-hidden"> {{ $t('lesson.yourAnswer') }}</span></button>
            </div>

            <!-- Practice answer -->
            <template v-if="practice">
              <p v-if="predicted" class="verdict" role="status">
                {{ $t(shownRight ? 'lesson.practiceRight' : 'lesson.practiceWrong') }}
              </p>
              <p class="caption">{{ $t('lesson.practiceNote') }}</p>
            </template>

            <!-- First answer, just now -->
            <p v-else-if="predicted" class="verdict" role="status">
              {{ $t(shownRight ? 'lesson.right' : 'lesson.wrong') }}
            </p>

            <!-- First answer, on an earlier visit -->
            <p v-else-if="answeredBefore" class="verdict revisit">
              {{ $t(shownRight ? 'lesson.firstRight' : 'lesson.firstWrong') }}
              <span v-if="firstPick === null" class="caption">{{ $t('lesson.keptOnly') }}</span>
            </p>

            <p v-else class="caption">{{ $t('lesson.pick') }}</p>

            <button v-if="locked" class="secondary practice-button" @click="practiseAgain">{{ $t('lesson.practise') }}</button>
          </div>
        </div>

        <!-- The steps, Check and the explanation sit in the lab's sticky
             column next to the gates, so the learner can follow them, act
             and see the result without scrolling. -->
        <lab
          ref="lab"
          :n="lesson.n"
          :panels="lesson.panels"
          :persist="false"
          embedded
        >
          <template #side>
            <div class="card">
              <h2>{{ $t('lesson.tryIt') }}</h2>
              <ol>
                <li v-for="(step, i) in lesson.steps" :key="i">{{ step }}</li>
              </ol>
              <button :disabled="busy" @click="setUp">{{ $t('lesson.setUp') }}</button>
              <button :disabled="busy || !lesson.ops.length" @click="showMe">{{ $t('lesson.showMe') }}</button>
              <button :disabled="busy" @click="check">{{ $t('lesson.check') }}</button>

              <div v-if="checkResult" class="check-result" :class="checkResult.pass ? 'pass' : 'fail'" role="status">
                <i18n-t v-if="checkResult.pass" k="lesson.pass" tag="p" />
                <i18n-t v-else k="lesson.fail" tag="p" :params="{ showMe: $t('lesson.showMe') }" />
                <ul>
                  <li v-for="(r, i) in checkResult.results" :key="i">{{ r.pass ? '✓' : '✗' }} {{ r.text }}</li>
                </ul>
              </div>
            </div>

            <div class="card" v-if="showResult">
              <h2>{{ $t('lesson.whatHappened') }}</h2>
              <p>{{ lesson.result }}</p>
            </div>
          </template>
        </lab>

        <div class="card lesson-nav">
          <router-link v-if="previous" :to="'/lessons/' + previous.id">← {{ previous.title }}</router-link>
          <span v-else></span>
          <router-link v-if="next" :to="'/lessons/' + next.id">{{ next.title }} →</router-link>
          <router-link v-else to="/lab/3">{{ $t('lesson.finished') }}</router-link>
        </div>
      </template>
    </div>
  `
};
