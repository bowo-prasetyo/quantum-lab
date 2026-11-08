// What each gate does, in one line, shared by the Gates panel and the
// circuit editor so a gate is described the same way everywhere.
//
// Each component shows the description of the gate last hovered, focused or
// tapped in a hint line (so it also works on touch screens, which have no
// hover), and links every gate button to its description with
// aria-describedby for screen readers. Keep in step with pages/concepts.js.

import { t } from '../i18n.js';

// The gates described, in the order they appear. Each description is the
// message 'gate.<name>' in locales/en.js; reading GATE_INFO[gate] gives it
// in the current language (a getter, so it follows a change of language).
export const GATE_NAMES = Object.freeze(['I', 'H', 'X', 'Y', 'Z', 'S', 'T', 'M', 'N', 'CNOT', 'CZ']);

export const GATE_INFO = Object.freeze(Object.defineProperties({}, Object.fromEntries(
  GATE_NAMES.map(gate => [gate, { enumerable: true, get: () => t(`gate.${gate}`) }])
)));

/**
 * Component mixin: `hintGate` is the gate whose description is shown;
 * call showHint(gate) on hover, focus and tap. descId(gate) is the id of
 * the gate's hidden description, unique to this component.
 * Render the descriptions with:
 *   <span v-for="(text, g) in GATE_INFO" :id="descId(g)" class="visually-hidden">{{ text }}</span>
 */
export const gateHints = {
  data() {
    return { hintGate: null };
  },

  computed: {
    GATE_INFO: () => GATE_INFO
  },

  methods: {
    showHint(gate) {
      this.hintGate = gate;
    },
    descId(gate) {
      return `gate-desc-${this.$.uid}-${gate}`;
    }
  }
};
