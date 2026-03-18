// ============================================================
// STATE — loaded first, shared across all modules via globals
// ============================================================

const DATA_FOLDER = 'assets/data';

let cvData       = null;   // raw merged YAML object
let currentLang  = 'en';   // active language code
let manualActive = null;   // subsection id locked by user click
let lastScrollY  = 0;      // last scroll position (scroll-spy debounce)