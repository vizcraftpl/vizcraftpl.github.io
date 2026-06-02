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
  initSectionTitleAnimations();
  const footer = document.getElementById('footer-text');
if (footer) footer.textContent = `© ${new Date().getFullYear()} ${t(data.name)}`;

}

async function init() {
  const bgCanvas = initBackground();
  const bg = initBackground();  // now an object

  const btn    = document.getElementById('bg-download-btn');
  const select = document.getElementById('bg-size-select');

  if (btn && bg) {
    btn.addEventListener('click', () => {
      const value = select?.value || 'screen';

      let exportWidth, exportHeight;

      if (value === 'screen') {
        // Just snapshot the live canvas directly
        const url = bg.canvas.toDataURL('image/png');
        triggerDownload(url, bg.canvas.width, bg.canvas.height);
        return;
      }

      // Parse "1920x1080" → [1920, 1080]
      [exportWidth, exportHeight] = value.split('x').map(Number);

      // Offscreen canvas at target resolution
      const off    = document.createElement('canvas');
      off.width    = exportWidth;
      off.height   = exportHeight;
      const offCtx = off.getContext('2d');

      // Scale factor so shapes fill the new canvas proportionally
      const scaleX = exportWidth  / bg.canvas.width;
      const scaleY = exportHeight / bg.canvas.height;

      // Draw each shape scaled to the new canvas
      for (const s of bg.shapes) {
        const scaled = {
          ...s,
          x:      s.x      * scaleX,
          y:      s.y      * scaleY,
          radius: s.radius * Math.min(scaleX, scaleY),
        };
        // drawShape normally uses the module-level ctx — pass offCtx instead
        bg.drawShape(scaled, offCtx);
      }

      triggerDownload(off.toDataURL('image/png'), exportWidth, exportHeight);
    });
  }
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
function triggerDownload(dataUrl, w, h) {
  const a   = document.createElement('a');
  a.href     = dataUrl;
  a.download = `background-${w}x${h}-${Date.now()}.png`;
  a.click();
}

document.addEventListener('DOMContentLoaded', init);