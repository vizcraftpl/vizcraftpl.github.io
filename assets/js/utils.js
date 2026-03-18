// ============================================================
// UTILS
// Depends on: state.js (currentLang)
// ============================================================

/**
 * Translate a value for currentLang.
 * Accepts a plain string or a { en: '...', fr: '...' } object.
 * Falls back to 'en' if currentLang key is missing.
 */
function t(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[currentLang] || value['en'] || String(Object.values(value)[0] || '');
  }
  return String(value);
}

/**
 * Deep-merge sources into target.
 * Arrays are replaced (not concatenated).
 */
function mergeDeep(target, ...sources) {
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      const val = source[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if (!target[key] || typeof target[key] !== 'object') target[key] = {};
        mergeDeep(target[key], val);
      } else {
        target[key] = val;
      }
    }
  }
  return target;
}

/**
 * makeCard(tag, extraClass)
 * Creates a base .card element (or anchor if tag='a').
 * Caller adds .card-icon, .card-body, .card-name inside.
 */
function makeCard(tag = 'div', extraClass = '') {
  const el = document.createElement(tag);
  el.className = ('card ' + extraClass).trim();
  return el;
}