// The languages the app can show. To add one, create locales/<code>.js
// with the same keys as en.js and register it here (see docs/I18N.md).
//
// Each entry:
//   name      the language's name in that language, shown in the picker
//   messages  its translated messages
//   intl      optional: the locale Intl uses for plurals, digits and lists,
//             when it differs from the code
//   pseudo    optional: a test language, offered only when chosen with ?lang=

import en from './en.js';
import { pseudoMessages } from './pseudo.js';

export const DEFAULT_LOCALE = 'en';

export const LOCALES = {
  // British English, like the text (colour, centre): lists without a comma before "and"
  en: { name: 'English', messages: en, intl: 'en-GB' },
  // Numbers, percentages and lists follow German rules (0,707, 50 %), so a
  // number shown with a decimal point hasn't been formatted for the language
  'en-XA': { name: 'Pseudo (en-XA)', messages: pseudoMessages(en), intl: 'de-DE', pseudo: true }
};
