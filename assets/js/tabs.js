// ============================================================
// TABS — subsection logic removed
// ============================================================

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
