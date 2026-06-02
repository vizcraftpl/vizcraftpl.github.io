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
if (footer) footer.textContent = `© ${new Date().getFullYear()} ${t(data.name)} | Website by Vizcraft.pl Jacek Jabłonowski`;

}

async function init() {
  const bg = initBackground();

  const btn    = document.getElementById('bg-download-btn');
  const select = document.getElementById('bg-size-select');

  if (btn && bg) {
    btn.addEventListener('click', () => {
      const value = select?.value || 'screen';

      if (value === 'screen') {
        const off    = document.createElement('canvas');
        off.width    = bg.canvas.width;
        off.height   = bg.canvas.height;
        const offCtx = off.getContext('2d');
        offCtx.fillStyle = 'rgb(13, 17, 23)';
        offCtx.fillRect(0, 0, off.width, off.height);
        offCtx.drawImage(bg.canvas, 0, 0);
        triggerDownload(off.toDataURL('image/png'), off.width, off.height);
        return;
      }

      const [exportWidth, exportHeight] = value.split('x').map(Number);

      const off    = document.createElement('canvas');
      off.width    = exportWidth;
      off.height   = exportHeight;
      const offCtx = off.getContext('2d');

      offCtx.fillStyle = 'rgb(13, 17, 23)';
      offCtx.fillRect(0, 0, exportWidth, exportHeight);

      const scaleX = exportWidth  / bg.canvas.width;
      const scaleY = exportHeight / bg.canvas.height;

      for (const s of bg.shapes) {
        const scaled = {
          ...s,
          x:      s.x      * scaleX,
          y:      s.y      * scaleY,
          radius: s.radius * Math.min(scaleX, scaleY),
        };
        bg.drawShape(scaled, offCtx);
      }

      triggerDownload(off.toDataURL('image/png'), exportWidth, exportHeight);
    });
  }

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