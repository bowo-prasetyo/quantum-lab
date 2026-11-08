// Small per-browser preferences (localStorage): whether the welcome has been
// seen, and whether the free lab shows its advanced views. Nothing is sent
// anywhere. If storage is unavailable (private mode, blocked site data) the
// lab still works; the preference just isn't remembered.

const PREFIX = 'glass-qubit-';

/** The saved value of a preference, or `fallback` if there is none. */
export function getPref(name, fallback) {
  try {
    const value = localStorage.getItem(PREFIX + name);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function setPref(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
  } catch {
    // Storage unavailable: keep going without saving
  }
}
