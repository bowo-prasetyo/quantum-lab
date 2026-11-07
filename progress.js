// The learner's prediction tally, kept only in this browser (localStorage).
// Nothing is sent anywhere. If storage is unavailable (private mode,
// blocked site data) the lessons still work; the tally just isn't kept.

const KEY = 'quantum-lab-predictions';

function read() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || '{}');
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** { lessonId: true | false } — whether the first prediction was right. */
export function loadPredictions() {
  return read();
}

/** Records the first prediction for a lesson; later answers don't change it. */
export function recordPrediction(lessonId, correct) {
  const data = read();
  if (lessonId in data) return data;
  data[lessonId] = correct;
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage unavailable: keep going without saving
  }
  return data;
}

export function clearPredictions() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
