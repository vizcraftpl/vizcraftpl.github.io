// ============================================================
// ENTRY POINT
// Depends on: all other modules
// Load order: state → utils → loader → background →
//             nav → profile → tabs → builders → main
// ============================================================

function renderContent(data) {
  updateSectionLabels(data);
  buildProfile(data);
  buildNav(data);
  buildSummary(data);
  buildSkills(data);
  buildLanguages(data);
  buildCertifications(data);
  buildEducation(data);
  buildExperience(data);
  buildProjects(data);
  initSubsectionTabs();
  initSectionTitleAnimations();
  const footer = document.getElementById('footer-text');
if (footer) footer.textContent = `© ${new Date().getFullYear()} ${t(data.name)}`;

}

async function init() {
  initBackground();
  try {
    cvData = await loadAllYAML();
  } catch (err) {
    console.error('Failed to load YAML data:', err);
    return;
  }
  document.title = t(cvData.name) || 'CV';
  buildLanguageSwitcher(cvData);
  renderContent(cvData);
}

document.addEventListener('DOMContentLoaded', init);