// Noise: what a real quantum computer suffers and this lab's gates don't.
// Pick a kind of noise and a strength, then apply it to a qubit (or every
// qubit). The state becomes mixed: a density matrix rather than a list of
// amplitudes (engine.applyNoise). Emits noise(channel, qubit | 'all',
// strength from 0 to 1); the lab runs it.

const CHANNELS = [
  {
    key: 'dephasing',
    name: 'Dephasing',
    text: 'Loses phase, as stray fields jostle the qubit. Off-diagonal squares of the density matrix that differ in this qubit shrink by the strength, and its Bloch vector shrinks towards the z-axis. Probabilities don’t change, but interference stops working.'
  },
  {
    key: 'damping',
    name: 'Amplitude damping',
    text: 'Loses energy, as an excited atom decays: |1⟩ falls to |0⟩ with the given probability, so the Bloch vector is pulled towards the north pole. At 100% the qubit is reset to |0⟩.'
  },
  {
    key: 'depolarizing',
    name: 'Depolarizing',
    text: 'Random errors: the Bloch vector shrinks towards the centre by the strength, as an X, Y or Z flip at random would do. At 100% the qubit is completely random.'
  }
];

export const NoisePanel = {
  props: {
    n: { type: Number, required: true },
    disabled: { type: Boolean, default: false },
    // The state is already mixed
    mixed: { type: Boolean, default: false }
  },
  emits: ['noise'],

  template: `
    <div class="card noise-panel">
      <h2>Noise</h2>
      <fieldset class="plain-fieldset" :disabled="disabled">
        <div class="noise-channels" role="radiogroup" aria-label="Kind of noise">
          <label v-for="c in CHANNELS" :key="c.key">
            <input type="radio" name="noise-channel" :value="c.key" v-model="channel"> {{ c.name }}
          </label>
        </div>
        <label class="noise-strength">
          Strength
          <input type="range" min="0" max="100" step="5" v-model.number="percent" :aria-valuetext="percent + '%'">
          <output>{{ percent }}%</output>
        </label>
        <div class="button-grid noise-buttons">
          <button v-for="q in qubits" :key="q" class="secondary" @click="apply(q)">Noise on Q{{ q }}</button>
          <button v-if="n > 1" class="secondary" @click="apply('all')">Every qubit</button>
        </div>
      </fieldset>
      <p class="caption">{{ description }}</p>
      <p class="caption">
        <template v-if="mixed">
          The state is now <strong>mixed</strong>: no single list of amplitudes
          describes it. The density matrix, Bloch spheres, probabilities and Pauli
          expectations show it; the views that need amplitudes say so.
          Measure all or Reset makes it pure again.
        </template>
        <template v-else>
          Noise makes the state mixed, which only a density matrix can describe.
          Real qubits suffer all three kinds, all the time.
        </template>
      </p>
    </div>
  `,

  data() {
    return { CHANNELS, channel: 'dephasing', percent: 50 };
  },

  computed: {
    qubits() {
      return [...Array(this.n).keys()];
    },
    description() {
      return CHANNELS.find(c => c.key === this.channel).text;
    }
  },

  methods: {
    apply(qubit) {
      this.$emit('noise', this.channel, qubit, this.percent / 100);
    }
  }
};
