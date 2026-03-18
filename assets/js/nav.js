// ============================================================
// NAV
// Depends on: state.js (manualActive, lastScrollY)
//             utils.js (t)
// ============================================================

function buildLanguageSwitcher(data) {
  const languages = data.languages_available || data.languages;
  if (!languages) return;

  ['language-switcher', 'mobile-language-switcher'].forEach(id => {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';

    languages.forEach(lang => {
      const code = lang.code;
      const btn = document.createElement('button');
      btn.className = 'lang-btn' + (code === currentLang ? ' active' : '');
      btn.dataset.lang = code;
      btn.innerHTML = `<span class="iconify" data-icon="${lang.flag}" data-width="20"></span>`;
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

  document.querySelectorAll('#right-col .section').forEach(section => {
    const subsections = section.querySelectorAll('.subsection[id]');

    if (subsections.length > 0) {
      subsections.forEach(subsection => {
        const tab = section.querySelector(`.subsection-tab[data-target="${subsection.id}"]`);
        if (!tab || tab.style.display === 'none') return;
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${subsection.id}" data-subsection="${subsection.id}">${tab.textContent.trim()}</a>`;
        navLinks.appendChild(li);
      });
    } else if (section.id) {
  const li = document.createElement('li');
  const label = section.querySelector('.section-title')?.textContent.trim() || section.id;
  li.innerHTML = `<a href="#${section.id}">${label}</a>`;
  navLinks.appendChild(li);
}

  });

  // Mirror to mobile drawer
  const mobileNav = document.getElementById('mobile-nav-links');
  if (mobileNav) mobileNav.innerHTML = navLinks.innerHTML;

  // Hamburger toggle
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

  initScrollSpy();
}

function updateNavActive(targetId) {
  document.querySelectorAll('#nav-links a, #mobile-nav-links a').forEach(a => {
    const href = a.dataset.subsection || a.getAttribute('href')?.substring(1);
    a.classList.toggle('active', href === targetId);
  });
}

function initScrollSpy() {
  if (initScrollSpy._bound) return;
  initScrollSpy._bound = true;
  const sections = document.querySelectorAll('#right-col .section');

  function onScroll() {
    if (manualActive && Math.abs(window.scrollY - lastScrollY) > 50) {
      manualActive = null;
    }
    if (manualActive) {
      updateNavActive(manualActive);
      return;
    }

    let active     = null;
    let maxVisible = 0;

    sections.forEach(section => {
      const rect        = section.getBoundingClientRect();
      const visibleTop  = Math.max(rect.top, 0);
      const visibleBot  = Math.min(rect.bottom, window.innerHeight);
      const visible     = Math.max(0, visibleBot - visibleTop);
      if (visible > maxVisible) { maxVisible = visible; active = section; }
    });

    if (active) {
      const activeSub = active.querySelector('.subsection.active');
      updateNavActive(activeSub ? activeSub.id : active.id);
    }

    lastScrollY = window.scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(onScroll);
}