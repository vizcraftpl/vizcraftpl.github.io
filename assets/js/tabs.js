// ============================================================
// TABS
// Depends on: state.js (manualActive, lastScrollY)
//             nav.js (updateNavActive)
// ============================================================

function animateBarsIn(container) {
  const bars = container.querySelectorAll('.skill-bar');
  bars.forEach(bar => { bar.style.width = '0%'; });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bars.forEach(bar => { bar.style.width = bar.dataset.level + '%'; });
    });
  });
}

function activateSubsection(targetId, scroll = false) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const parentSection = target.closest('.section');
  if (!parentSection) return;

  parentSection.querySelectorAll('.subsection-tab').forEach(t => t.classList.remove('active'));
  parentSection.querySelectorAll('.subsection').forEach(s => s.classList.remove('active'));

  const tab = parentSection.querySelector(`.subsection-tab[data-target="${targetId}"]`);
  if (tab) tab.classList.add('active');
  target.classList.add('active');
  animateBarsIn(target);
  updateNavActive(targetId);

  manualActive = targetId;
  lastScrollY  = window.scrollY;

  if (scroll) {
    const top = parentSection.getBoundingClientRect().top + window.scrollY - 32;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function initSubsectionTabs() {
  // Ensure each section has one active tab + subsection
  document.querySelectorAll('.section').forEach(section => {
    const tabs       = section.querySelectorAll('.subsection-tab');
    const subsections = section.querySelectorAll('.subsection');
    if (!section.querySelector('.subsection.active') && subsections.length) {
      subsections[0].classList.add('active');
      if (tabs[0]) tabs[0].classList.add('active');
    }
  });

  // Tab click
  document.querySelectorAll('.subsection-tab').forEach(tab => {
    if (tab.dataset.bound) return;
    tab.dataset.bound = 'true';
    tab.addEventListener('click', () => {
      activateSubsection(tab.dataset.target);
    });
  });


  // Nav link click (both desktop + mobile)
  document.querySelectorAll('#nav-links a[data-subsection], #mobile-nav-links a[data-subsection]').forEach(link => {
    if (link.dataset.bound) return;
    link.dataset.bound = 'true';
    link.addEventListener('click', e => {
      e.preventDefault();
      activateSubsection(link.dataset.subsection, true);
    });
  });

}

function initSectionTitleAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.section-title').forEach(el => observer.observe(el));
}