// The learner's prediction tally, kept only in this browser (localStorage).
// Nothing is sent anywhere. If storage is unavailable (private mode,
// blocked site data) the lessons still work; the tally just isn't kept.

const KEY = 'quantum-lab-predictions';
// The option picked first in each lesson, so a revisit can show it.
// Separate from KEY, whose { id: true | false } shape older visits saved.
const CHOICES_KEY = 'quantum-lab-prediction-choices';

function read(key = KEY) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** { lessonId: true | false } — whether the first prediction was right. */
export function loadPredictions() {
  return read();
}

/**
 * The option index picked first in a lesson, or null if not known (not
 * answered yet, or answered before the choice was kept).
 */
export function firstChoice(lessonId) {
  const choice = read(CHOICES_KEY)[lessonId];
  return Number.isInteger(choice) ? choice : null;
}

/**
 * Records the first prediction for a lesson: whether it was right and
 * which option it was. Later answers (practice) don't change it.
 */
export function recordPrediction(lessonId, correct, choice) {
  const data = read();
  if (lessonId in data) return data;
  data[lessonId] = correct;
  const choices = read(CHOICES_KEY);
  if (Number.isInteger(choice)) choices[lessonId] = choice;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
  } catch {
    // Storage unavailable: keep going without saving
  }
  return data;
}

export function clearPredictions() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(CHOICES_KEY);
  } catch {
    // ignore
  }
}
