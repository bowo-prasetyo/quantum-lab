// Pseudo-localization: a fake language made from English, for testing.
//
// Open the app with ?lang=en-XA (e.g. index.html?lang=en-XA#/lab/1) and
// every translated message looks like "[Ļéššöñš ~~~]": still readable, but
// any English text left on screen has not been made translatable yet, the
// brackets show where text is cut off, and the extra ~ (about a third
// longer) shows layouts that break when a translation is longer than the
// English. Placeholders such as {count} are kept as they are.

const ACCENTED = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'đ', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ',
  k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ö', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ',
  u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Đ', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ',
  K: 'Ķ', L: 'Ļ', M: 'Ṁ', N: 'Ñ', O: 'Ö', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ',
  U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž'
};

/** One message in pseudo-language, keeping {placeholders} intact. */
export function pseudoText(text) {
  const accented = text
    .split(/(\{\w+\})/)
    .map(part => (/^\{\w+\}$/.test(part) ? part : part.replace(/[A-Za-z]/g, ch => ACCENTED[ch])))
    .join('');
  const padding = '~'.repeat(Math.max(1, Math.round(text.length * 0.35)));
  return `[${accented} ${padding}]`;
}

/** A whole message table in pseudo-language (plural forms included). */
export function pseudoMessages(messages) {
  return Object.fromEntries(Object.entries(messages).map(([key, message]) => [
    key,
    typeof message === 'string'
      ? pseudoText(message)
      : Object.fromEntries(Object.entries(message).map(([form, text]) => [form, pseudoText(text)]))
  ]));
}
