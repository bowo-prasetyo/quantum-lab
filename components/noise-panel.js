// Noise: what a real quantum computer suffers and this lab's gates don't.
// Pick a kind of noise and a strength, then apply it to a qubit (or every
// qubit). The state becomes mixed: a density matrix rather than a list of
// amplitudes (engine.applyNoise). Emits noise(channel, qubit | 'all',
// strength from 0 to 1); the lab runs it.
//
// The choice of kind and strength belongs to the lab (props channel and
// strength, changed with the 'settings' event), because the circuit
// editor's N steps and noisy runs use it too.

import { t, formatPercent } from '../i18n.js';

// The kinds of noise (see NOISE_CHANNELS in engine.js); each one's name is
// the message 'noise.<key>' and its description 'noise.<key>Text'
const CHANNELS = ['dephasing', 'damping', 'depolarizing'];

export const NoisePanel = {
  props: {
    n: { type: Number, required: true },
    disabled: { type: Boolean, default: false },
    // The state is already mixed
    mixed: { type: Boolean, default: false },
    channel: { type: String, default: 'dephasing' },
    strength: { type: Number, default: 0.5 }  // 0 to 1
  },
  emits: ['noise', 'settings'],

  template: `
    <div class="card noise-panel">
      <h2>{{ $t('noisePanel.title') }}</h2>
      <fieldset class="plain-fieldset" :disabled="disabled">
        <div class="noise-channels" role="radiogroup" :aria-label="$t('noisePanel.kindAria')">
          <label v-for="c in CHANNELS" :key="c">
            <input type="radio" name="noise-channel" :value="c" :checked="c === channel"
              @change="$emit('settings', { channel: c, strength })"> {{ $t('noise.' + c) }}
          </label>
        </div>
        <label class="noise-strength">
          {{ $t('noisePanel.strength') }}
          <input type="range" min="0" max="100" step="1" :value="percent" :aria-valuetext="percentText"
            @input="$emit('settings', { channel, strength: Number($event.target.value) / 100 })">
          <output>{{ percentText }}</output>
        </label>
        <div class="button-grid noise-buttons">
          <button v-for="q in qubits" :key="q" class="secondary" @click="apply(q)">{{ $t('noisePanel.onQubit', { qubit: q }) }}</button>
          <button v-if="n > 1" class="secondary" @click="apply('all')">{{ $t('noisePanel.every') }}</button>
        </div>
      </fieldset>
      <p class="caption">{{ description }}</p>
      <p class="caption">
        <i18n-t v-if="mixed" k="noisePanel.mixed" :params="{ measureAll: $t('gates.measureAll'), reset: $t('gates.reset') }" />
        <template v-else>{{ $t('noisePanel.pure') }}</template>
      </p>
    </div>
  `,

  data() {
    return { CHANNELS };
  },

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    },
    percent() {
      return Math.round(this.strength * 100);
    },
    percentText() {
      return formatPercent(this.percent / 100, { digits: 0 });
    },
    description() {
      return t(`noise.${this.channel}Text`, { full: formatPercent(1, { digits: 0 }) });
    }
  },

  methods: {
    apply(qubit) {
      this.$emit('noise', this.channel, qubit, this.strength);
    }
  }
};
