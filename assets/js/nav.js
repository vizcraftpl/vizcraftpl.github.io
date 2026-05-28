// ============================================================
// NAV
// Depends on: state.js, utils.js (t)
// ============================================================

function getNavSections() {
  return [...document.querySelectorAll('[data-nav-section]')].map(s => s.id);
}

function buildLanguageSwitcher(data) {
  const languages = data.languages_available || data.languages;
  if (!languages) return;

  ['language-switcher', 'mobile-language-switcher'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';

    languages.forEach(lang => {
      const code = lang.code;
      const btn  = document.createElement('button');
      btn.className    = 'lang-btn' + (code === currentLang ? ' active' : '');
      btn.dataset.lang = code;
      btn.innerHTML    = `<span class="iconify" data-icon="${lang.flag}"></span>`;
      btn.addEventListener('click', () => {
        currentLang = code;
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.lang-btn[data-lang="${code}"]`).forEach(b => b.classList.add('active'));
        renderContent(cvData);
      });
      container.appendChild(btn);
    });
  });
}

function buildNav(data) {
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;
  navLinks.innerHTML = '';

  getNavSections().forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    const label = section.querySelector('.section-title')?.textContent.trim() || id;
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${id}" data-section="${id}">${label}</a>`;
    navLinks.appendChild(li);
  });

  const mobileNav = document.getElementById('mobile-nav-links');
  if (mobileNav) mobileNav.innerHTML = navLinks.innerHTML;

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobile-drawer');

  if (hamburger && !hamburger.dataset.bound) {
    hamburger.dataset.bound = 'true';
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      drawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  if (drawer && !drawer.dataset.bound) {
    drawer.dataset.bound = 'true';
    drawer.addEventListener('click', e => {
      if (e.target.closest('a')) {
        hamburger.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // Bind nav link clicks
  document.querySelectorAll('#nav-links a[data-section], #mobile-nav-links a[data-section]').forEach(link => {
    if (link.dataset.bound) return;
    link.dataset.bound = 'true';
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.dataset.section);
    });
  });

  // Show first section by default
  if (!currentSection) showSection(getNavSections()[0]);
}

function showSection(id) {
  currentSection = id;

  getNavSections().forEach(sid => {
    const s = document.getElementById(sid);
    if (s) s.style.display = sid === id ? '' : 'none';
  });

  document.querySelectorAll('#nav-links a, #mobile-nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.section === id);
  });
}

function updateNavActive(id) {
  showSection(id);
}

function initScrollSpy() {
  if (initScrollSpy._bound) return;
  initScrollSpy._bound = true;
  // scroll spy no longer needed — sections are shown/hidden via nav
}
