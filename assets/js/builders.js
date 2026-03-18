// ============================================================
// BUILDERS
// Depends on: state.js, utils.js (t, makeCard), tabs.js (animateBarsIn)
// ============================================================

// ── Shared helper ───────────────────────────────────────────

function fitColumns(grid) {
  if (!grid) return;
  const count = grid.children.length;
  //grid.style.columnCount = w < 480 ? '1' : '2';
  grid.style.columns = count < 3 ? count : '';
}

// ── Summary ─────────────────────────────────────────────────

function buildSummary(data) {
  const text = data.professional_summary || data.summary;
  if (!text) return;
  document.getElementById('summary-text').textContent = t(text);
}

// ── Skills ──────────────────────────────────────────────────

function buildSkills(data) {
  const skills = data.skills;
  if (!skills) return;

  const grids = {
    technical: document.getElementById('skills-grid-technical'),
    soft:      document.getElementById('skills-grid-soft'),
  };

  Object.values(grids).forEach(g => { if (g) g.innerHTML = ''; });

  for (const [, skill] of Object.entries(skills)) {
    const type      = skill.type || 'technical';
    const grid      = grids[type] || grids.technical;
    const icon      = skill.icon || 'mdi:code-tags';
    const label     = t(skill.name);
    const level     = skill.level || 0;
    const subskills = skill.subskills || skill.items || [];

    if (type === 'soft') {
      subskills.forEach(s => {
        const tag = document.createElement('span');
        tag.className   = 'skill-tag';
        tag.textContent = t(s);
        grid.appendChild(tag);
      });
    } else {
      const card = makeCard('div', 'skill-card');
      card.innerHTML = `
        <span class="card-icon">
          <span class="iconify" data-icon="${icon}" data-width="24"></span>
        </span>
        <div class="card-body">
          <strong class="card-name">${label}</strong>
          <div class="skill-bar-wrap">
            <span class="skill-bar-label">${level}%</span>
            <div class="skill-bar" data-level="${level}"></div>
          </div>
          <span class="skill-items">
            ${subskills.map(s => `<span class="skill-tag">${t(s)}</span>`).join('')}
          </span>
        </div>
      `;
      grid.appendChild(card);
    }
  }

  requestAnimationFrame(() => {
    document.querySelectorAll('.skill-bar').forEach(bar => {
      bar.style.width = bar.dataset.level + '%';
    });
    Object.values(grids).forEach(fitColumns);
  });

  if (!buildSkills._resizeBound) {
    buildSkills._resizeBound = true;
    window.addEventListener('resize', () => buildSkills(cvData));
  }
}

// ── Languages ───────────────────────────────────────────────

function buildLanguages(data) {
  const languages = data.languages;
  if (!languages) return;
  const grid = document.getElementById('languages-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const [key, value] of Object.entries(languages)) {
    if (!value || typeof value.level === 'undefined') continue;
    const label       = key.replace(/\b\w/g, c => c.toUpperCase());
    const icon        = value.icon || 'circle-flags:un';
    const level       = value.level || 0;
    const proficiency = t(value.proficiency) || '';

    const card = makeCard('div', 'skill-card');
    card.innerHTML = `
      <span class="card-icon">
        <span class="iconify" data-icon="${icon}" data-width="28"></span>
      </span>
      <div class="card-body">
        <strong class="card-name">${label}</strong>
        <div class="skill-bar-wrap">
          <div class="skill-bar" data-level="${level}"></div>
        </div>
        <span class="skill-items">${proficiency}</span>
      </div>
    `;
    grid.appendChild(card);
  }

  fitColumns(grid);
  requestAnimationFrame(() => {
    grid.querySelectorAll('.skill-bar').forEach(bar => {
      bar.style.width = bar.dataset.level + '%';
    });
  });
}

// ── Certifications ──────────────────────────────────────────

function buildCertifications(data) {
  const items = data.certifications;
  if (!items || !items.length) return;
  const grid = document.getElementById('certifications-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const item of items) {
    const card = makeCard(item.url ? 'a' : 'div', 'cert-card');
    if (item.url) {
      card.href   = item.url;
      card.target = '_blank';
      card.rel    = 'noopener';
    }
    card.innerHTML = `
      <span class="card-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:certificate-outline'}" data-width="28"></span>
      </span>
      <div class="card-body">
        <strong class="card-name">${t(item.name)}</strong>
        <span class="cert-issuer">${item.issuer || ''}</span>
        <span class="cert-date">${t(item.date) || ''}</span>
      </div>
      ${item.url ? '<span class="cert-arrow">›</span>' : ''}
    `;
    grid.appendChild(card);
  }
  fitColumns(grid);
}

// ── Education ───────────────────────────────────────────────

function buildEducation(data) {
  const items = data.education;
  if (!items || !items.length) return;
  const grid = document.getElementById('education-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const item of items) {
    const card = makeCard('div', 'cert-card');
    card.innerHTML = `
      <span class="card-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:school-outline'}" data-width="28"></span>
      </span>
      <div class="card-body">
        <strong class="card-name">${t(item.degree)}</strong>
        <span class="cert-issuer">${t(item.institution)}</span>
        <span class="cert-date">${t(item.year)}</span>
      </div>
    `;
    grid.appendChild(card);
  }
  fitColumns(grid);
}

// ── Projects ────────────────────────────────────────────────

function buildProjects(data) {
  const items = data.projects;
  const tab   = document.querySelector('.subsection-tab[data-target="projects"]');
  const panel = document.getElementById('projects');

  if (!items || !items.length) {
    if (tab)   tab.style.display   = 'none';
    if (panel) panel.style.display = 'none';
    return;
  }

  if (tab)   tab.style.display   = '';
  if (panel) panel.style.display = '';

  const list = document.getElementById('projects-list');
  if (!list) return;
  list.innerHTML = '';

  for (const item of items) {
    const card  = makeCard(item.url ? 'a' : 'div', 'cert-card');
    if (item.url) {
      card.href   = item.url;
      card.target = '_blank';
      card.rel    = 'noopener';
    }
    const techs = (item.technologies || []).map(s => t(s)).join(', ');
    card.innerHTML = `
      <span class="card-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:code-braces'}" data-width="28"></span>
      </span>
      <div class="card-body">
        <strong class="card-name">${t(item.name)}</strong>
        <span class="cert-issuer">${t(item.description)}</span>
        ${techs ? `<span class="cert-date">${techs}</span>` : ''}
      </div>
      ${item.url ? '<span class="cert-arrow">›</span>' : ''}
    `;
    list.appendChild(card);
  }
  fitColumns(list);
}

// ── Experience ──────────────────────────────────────────────
function buildExperience(data) {
  const items = data.experience;
  if (!items || !items.length) return;
  const timeline = document.getElementById('experience-timeline');
  if (!timeline) return;
  timeline.innerHTML = '';

  const badge = document.getElementById('experience-count');
  if (badge) badge.textContent = items.length;

  for (const job of items) {
    const employer = document.createElement('div');
    employer.className = 'tl-employer';

    const dot = document.createElement('div');
    dot.className = 'tl-dot tl-dot--employer';
    employer.appendChild(dot);

    const card = document.createElement('div');
    card.className = 'tl-employer-card';

    // Logo or icon
    let mediaHTML = '';
    if (job.logo) {
      mediaHTML += `<img src="${job.logo}" alt="${t(job.company)}" class="tl-logo"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`;
      mediaHTML += `<span class="tl-icon-wrap" style="display:none">`;
    } else {
      mediaHTML += `<span class="tl-icon-wrap">`;
    }
    mediaHTML += `<span class="iconify" data-icon="${job.icon || 'mdi:briefcase-outline'}" data-width="20"></span></span>`;

    card.innerHTML = `
      <div class="tl-employer-head">
        <div class="tl-employer-logo">${mediaHTML}</div>
        <div class="tl-employer-meta">
          <div class="card-name tl-company">${t(job.company)}</div>
          <div class="tl-location">${t(job.location)}</div>
          <div class="tl-date">${t(job.start_date)} – ${t(job.end_date)}</div>
        </div>
      </div>
    `;

    // Positions
    if (job.positions && job.positions.length) {
      const posWrap = document.createElement('div');
      posWrap.className = 'tl-positions';

      for (const p of job.positions) {
        const pos = document.createElement('div');
        pos.className = 'tl-position';

        const dot2 = document.createElement('div');
        dot2.className = 'tl-dot tl-dot--position';

        const posBody = document.createElement('div');
        posBody.className = 'tl-position-body';

        posBody.innerHTML = `
          <div class="tl-position-head">
            <span class="card-name">${t(p.job_title)}</span>
            <span class="tl-date">${t(p.start_date)} – ${t(p.end_date)}</span>
          </div>
          ${p.responsibilities && p.responsibilities.length ? `
            <ul class="tl-responsibilities">
              ${p.responsibilities.map(r => `<li>${t(r)}</li>`).join('')}
            </ul>` : ''}
        `;

        pos.appendChild(dot2);
        pos.appendChild(posBody);
        posWrap.appendChild(pos);
      }

      card.appendChild(posWrap);
    }

    employer.appendChild(card);
    timeline.appendChild(employer);
  }

  // Set --pos-h on each position for the hover line animation
  document.querySelectorAll('.tl-logo').forEach(img => {
  img.addEventListener('load', () => {
    const ratio     = img.naturalWidth / img.naturalHeight;
    const container = img.closest('.tl-employer-logo');
    const h         = container.offsetHeight;
    container.style.width = `${(h - 12) * ratio + 12}px`;

    // center employer dot on logo
    const employer  = img.closest('.tl-employer');
    const dot       = employer.querySelector('.tl-dot--employer');
    const logoTop   = container.offsetTop;
    dot.style.top   = `${logoTop + h / 2 - 8}px`; /* ← 8 = half dot height (16px) */
  });
});
requestAnimationFrame(() => {
  document.querySelectorAll('.tl-employer').forEach(employer => {
    const container = employer.querySelector('.tl-employer-logo');
    const dot       = employer.querySelector('.tl-dot--employer');
    const logo      = employer.querySelector('.tl-logo');

    if (!logo) {
  const h = container.offsetHeight;
  container.style.width = `${h}px`;
  const employerRect  = employer.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const mid = containerRect.top - employerRect.top + containerRect.height / 2;
  dot.style.top = `${mid - 8}px`;
}

  });
});

  document.querySelectorAll('.tl-position').forEach(pos => {
  pos.style.setProperty('--pos-h', `${pos.offsetHeight}px`);
  });
  
}


// ── Section labels ──────────────────────────────────────────

function updateSectionLabels(data) {
  const labels = data.section_labels;
  if (!labels) return;
  document.querySelectorAll('.subsection-tab[data-label-key]').forEach(tab => {
    const key = tab.dataset.labelKey;
    if (labels[key]) tab.textContent = t(labels[key]);
  });
}