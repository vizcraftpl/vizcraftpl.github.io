// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const DATA_FOLDER = 'data';
let currentLang = 'en';
let cvData = null;
let manualActive = null;
let lastScrollY  = 0;

// ─────────────────────────────────────────────
// YAML LOADER
// ─────────────────────────────────────────────

/** Deep-merge sources into target (arrays are replaced, not concatenated). */
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

async function loadAllYAML() {
  // 1. Read the manifest produced by settings.yaml (or fall back to a known list)
  //    We fetch the folder listing via settings.yaml which declares all sibling files.
  const settingsRes  = await fetch(`${DATA_FOLDER}/settings.yaml`);
  const settingsText = await settingsRes.text();
  const settings     = jsyaml.load(settingsText);

  // settings.yaml must contain:  data_files: [experience.yaml, education.yaml, ...]
  const files = (settings.data_files || []).map(f => `${DATA_FOLDER}/${f}`);

  const parts = await Promise.all(
    files.map(async url => {
      const res  = await fetch(url);
      const text = await res.text();
      return jsyaml.load(text) || {};
    })
  );

  return mergeDeep({ ...settings }, ...parts);
}

// ─────────────────────────────────────────────
// LANGUAGE SWITCHER
// ─────────────────────────────────────────────
function buildLanguageSwitcher(yamlData) {
  const switcher = document.getElementById('language-switcher');
  const mobileSwitcher = document.getElementById('mobile-language-switcher');
  if (!yamlData.languages_available) return;

  [switcher, mobileSwitcher].forEach(container => {
    if (!container) return;
    container.innerHTML = '';

    yamlData.languages_available.forEach(lang => {
      const btn = document.createElement('button');
      btn.className = 'lang-btn' + (lang.code === currentLang ? ' active' : '');
      btn.innerHTML = `
        <span class="iconify" data-icon="${lang.flag}" data-width="20"></span>
        <span>${lang.name}</span>
      `;
      btn.addEventListener('click', () => {
        currentLang = lang.code;
        renderContent(cvData);
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll(`.lang-btn`).forEach(b => {
          if (b.textContent.trim().includes(lang.name)) b.classList.add('active');
        });
      });
      container.appendChild(btn);
    });
  });
}

function fitSidenavLinks() {
  [
    { links: document.getElementById('nav-links'), switcher: null },
    { links: document.getElementById('mobile-nav-links'), switcher: document.querySelector('#mobile-drawer .language-switcher') },
  ].forEach(({ links, switcher }) => {
    if (!links) return;

    const items = links.querySelectorAll('li');
    const count = items.length;
    if (!count) return;

    const gap        = count > 1 ? (count - 1) * 4.8 : 0;
    const available  = links.clientHeight - gap - 8;
    const itemHeight = available / count;

    const basePx    = 16;
    const fontSize  = Math.min(Math.max(itemHeight * 0.45 / basePx, 0.65), 1);
    const paddingPx = (itemHeight - fontSize * basePx * 1.2) / 2;

    items.forEach(li => {
      const a = li.querySelector('a');
      if (!a) return;
      a.style.fontSize      = `${fontSize}rem`;
      a.style.paddingTop    = `${Math.max(paddingPx, 2)}px`;
      a.style.paddingBottom = `${Math.max(paddingPx, 2)}px`;
    });

    if (switcher) {
      switcher.querySelectorAll('.lang-btn').forEach(btn => {
        btn.style.fontSize = `${fontSize}rem`;
        btn.style.padding  = `${Math.max(paddingPx, 2)}px ${Math.max(paddingPx * 1.5, 4)}px`;
      });
    }
  });
}



// ─────────────────────────────────────────────
// ANIMATED GEOMETRIC BACKGROUND
// ─────────────────────────────────────────────
function initBackground() {
  const canvas = document.getElementById('bg-canvas');
  const ctx    = canvas.getContext('2d');
  let shapes   = [];

  const COLORS = [
  'rgba(173,20,87,0.22)',
  'rgba(173,20,87,0.12)',
  'rgba(255,255,255,0.06)',
  'rgba(173,20,87,0.30)',
  'rgba(255,255,255,0.05)',
];
const STROKE_COLORS = [
  'rgba(173,20,87,0.55)',
  'rgba(255,255,255,0.12)',
  'rgba(173,20,87,0.38)',
];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeShape() {
    return {
      x:             rand(0, canvas.width),
      y:             rand(0, canvas.height),
      radius:        rand(28, 130),
      sides:         Math.floor(rand(3, 7)),     // triangle → hexagon
      rotation:      rand(0, Math.PI * 2),
      rotSpeed:      rand(-0.0008, 0.0008),
      vx:            rand(-0.12, 0.12),
      vy:            rand(-0.12, 0.12),
      fill:          COLORS[Math.floor(rand(0, COLORS.length))],
      stroke:        STROKE_COLORS[Math.floor(rand(0, STROKE_COLORS.length))],
      filled:        Math.random() > 0.35,
    };
  }

  function spawnShapes(n = 48) {
    shapes = Array.from({ length: n }, makeShape);
  }

  function drawShape(s) {
    ctx.beginPath();
    for (let i = 0; i < s.sides; i++) {
      const angle = s.rotation + (i / s.sides) * Math.PI * 2;
      const px = s.x + s.radius * Math.cos(angle);
      const py = s.y + s.radius * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (s.filled) { ctx.fillStyle = s.fill; ctx.fill(); }
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of shapes) {
      s.x        += s.vx;
      s.y        += s.vy;
      s.rotation += s.rotSpeed;
      // wrap around edges
      if (s.x < -s.radius)              s.x = canvas.width  + s.radius;
      if (s.x >  canvas.width  + s.radius) s.x = -s.radius;
      if (s.y < -s.radius)              s.y = canvas.height + s.radius;
      if (s.y >  canvas.height + s.radius) s.y = -s.radius;
      drawShape(s);
    }
    requestAnimationFrame(tick);
  }

  resize();
  spawnShapes();
  tick();
  window.addEventListener('resize', () => { resize(); spawnShapes(); });
}

// ─────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────
function buildNav(data) {
  const sidenavName = document.getElementById('sidenav-name');
  if (sidenavName) sidenavName.textContent = t(data.name);

  const navLinks = document.getElementById('nav-links');
  navLinks.innerHTML = '';

  const sections = document.querySelectorAll('#main-content .section');
  sections.forEach(section => {
    const subsections = section.querySelectorAll('.subsection');

    if (subsections.length > 0) {
      subsections.forEach(subsection => {
        const subsectionId = subsection.id;
        const tabButton = section.querySelector(`.subsection-tab[data-target="${subsectionId}"]`);
        if (subsectionId && tabButton) {
          const li = document.createElement('li');
          li.innerHTML = `<a href="#${subsectionId}" data-subsection="${subsectionId}">${tabButton.textContent}</a>`;
          navLinks.appendChild(li);
        }
      });
    } else {
      const sectionTitle = section.querySelector('.section-title');
      if (section.id && sectionTitle) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#${section.id}">${sectionTitle.textContent}</a>`;
        navLinks.appendChild(li);
      }
    }
  });

  // Mirror to mobile
  document.getElementById('mobile-nav-links').innerHTML = navLinks.innerHTML;

  // Hamburger
  const hamburger = document.getElementById('hamburger');
  const drawer    = document.getElementById('mobile-drawer');

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    drawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  drawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Scroll-based active highlight
  function onScroll() {
    if (manualActive && Math.abs(window.scrollY - lastScrollY) > 50) {
      manualActive = null;
    }

    if (manualActive) {
      updateNavActive(manualActive);
      return;
    }

    let active = null;
    let maxVisible = 0;

    sections.forEach(section => {
      const rect        = section.getBoundingClientRect();
      const visibleTop  = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, window.innerHeight);
      const visible     = Math.max(0, visibleBottom - visibleTop);

      if (visible > maxVisible) {
        maxVisible = visible;
        active     = section;
      }
    });

    if (active) {
      const activeSubsection = active.querySelector('.subsection.active');
      updateNavActive(activeSubsection ? activeSubsection.id : active.id);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  requestAnimationFrame(onScroll);
}



function buildHeader(data) {
  // Mobile header name only
  const headerName = document.getElementById('header-name');
  if (headerName) {
    headerName.textContent = t(data.name);
  }
}

function buildContact(data) {
  const contact = data.contact;
  if (!contact) return;
  const grid = document.getElementById('contact-grid');
  grid.innerHTML = '';

  for (const [key, value] of Object.entries(contact)) {
    const item = document.createElement(value.href ? 'a' : 'div');
    item.className = 'contact-item';
    if (value.href) {
      item.href = value.href;
      item.target = '_blank';
      item.rel = 'noopener';
    }
    
    item.innerHTML = `
      <span class="skill-icon">
        <span class="iconify" data-icon="${value.icon || 'mdi:information-outline'}" data-width="20"></span>
      </span>
      <span class="contact-value">${t(value.value)}</span>
    `;
    grid.appendChild(item);
  }
}


function buildSummary(data) {
  const text = data.professional_summary || data.summary;
  if (!text) return;
  document.getElementById('summary-text').textContent = t(text);
}

function buildSkills(data) {
  const skills = data.skills;
  if (!skills) return;
  const grid = document.getElementById('skills-grid');
  grid.innerHTML = '';

  for (const [key, value] of Object.entries(skills)) {
    const label     = t(value.name) || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const icon      = value.icon || 'mdi:star-outline';
    const level     = value.level || 0;
    const subskills = (value.subskills || []).map(s => t(s));

    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <span class="skill-icon">
        <span class="iconify" data-icon="${icon}" data-width="24"></span>
      </span>
      <div class="skill-body">
        <strong class="skill-name">${label}</strong>
        <div class="skill-bar-wrap">
          <span class="skill-bar-label">${level}%</span>
          <div class="skill-bar" data-level="${level}"></div>
        </div>
        <span class="skill-items">${subskills.join(', ')}</span>
      </div>
    `;
    grid.appendChild(card);
  }

  requestAnimationFrame(() => {
    document.querySelectorAll('#skills-grid .skill-bar').forEach(bar => {
      bar.style.width = bar.dataset.level + '%';
    });
  });
}



function buildLanguages(data) {
  const languages = data.languages;
  if (!languages) return;
  const grid = document.getElementById('languages-grid');
  grid.innerHTML = '';

  for (const [key, value] of Object.entries(languages)) {
    const label = key.replace(/\b\w/g, c => c.toUpperCase());
    const icon = value.icon || 'circle-flags:un';
    const level = value.level || 0;
    const proficiency = t(value.proficiency) || '';

    const card = document.createElement('div');
    card.className = 'skill-card';
    card.innerHTML = `
      <span class="skill-icon">
        <span class="iconify" data-icon="${icon}" data-width="28"></span>
      </span>
      <div class="skill-body">
        <strong class="skill-name">${label}</strong>
        <div class="skill-bar-wrap">
          <div class="skill-bar" data-level="${level}"></div>
        </div>
        <span class="skill-items">${proficiency}</span>
      </div>
    `;
    grid.appendChild(card);
  }

  requestAnimationFrame(() => {
    document.querySelectorAll('#languages-grid .skill-bar').forEach(bar => {
      bar.style.width = bar.dataset.level + '%';
    });
  });
}

// ─────────────────────────────────────────────────────────
// CERTIFICATIONS
// ─────────────────────────────────────────────────────────
function buildCertifications(data) {
  const items = data.certifications;
  if (!items || !items.length) return;
  const grid = document.getElementById('certifications-grid');
  grid.innerHTML = '';

  for (const item of items) {
    const card = document.createElement(item.url ? 'a' : 'div');
    card.className = 'cert-card';
    if (item.url) {
      card.href = item.url;
      card.target = '_blank';
      card.rel = 'noopener';
    }
    card.innerHTML = `
      <span class="cert-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:certificate-outline'}" data-width="28"></span>
      </span>
      <div class="cert-body">
        <strong class="cert-name">${t(item.name)}</strong>
        <span class="cert-issuer">${item.issuer}</span>
        <span class="cert-date">${t(item.date)}</span>
      </div>
      ${item.url ? '<span class="cert-arrow">↗</span>' : ''}
    `;
    grid.appendChild(card);
  }
}


// ─────────────────────────────────────────────────────────
// EDUCATION
// ─────────────────────────────────────────────────────────
function buildEducation(data) {
  const items = data.education;
  if (!items || !items.length) return;
  const list = document.getElementById('education-list');
  list.innerHTML = '';

  for (const item of items) {
    const card = document.createElement('div');
    card.className = 'cert-card';
    card.innerHTML = `
      <span class="cert-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:school-outline'}" data-width="28"></span>
      </span>
      <div class="cert-body">
        <strong class="cert-name">${t(item.degree)}</strong>
        <span class="cert-issuer">${t(item.institution)}</span>
        <span class="cert-date">${t(item.year)}</span>
      </div>
    `;
    list.appendChild(card);
  }
}


// ─────────────────────────────────────────────────────────
// EXPERIENCE
// ─────────────────────────────────────────────────────────
function renderResponsibilities(items) {
  if (!items || !items.length) return '';
  let html = '<ul class="tl-responsibilities">';
  for (const r of items) {
    html += `<li>${t(r)}</li>`;
  }
  html += '</ul>';
  return html;
}

function renderPositions(positions) {
  let html = '<div class="tl-positions">';
  for (const p of positions) {
    html += '<div class="tl-position">';
    html += '<div class="tl-dot tl-dot--position"></div>';
    html += '<div class="tl-position-body">';
    html += '<div class="tl-position-head">';
    html += `<strong class="tl-pos-title">${t(p.job_title)}</strong>`;
    html += `<span class="tl-date">${t(p.start_date)} – ${t(p.end_date)}</span>`;
    html += '</div>';
    html += renderResponsibilities(p.responsibilities);
    html += '</div>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}


function buildExperience(data) {
  const items = data.experience;
  if (!items || !items.length) return;

  const timeline = document.getElementById('experience-timeline');
  timeline.innerHTML = '';

  const badge = document.getElementById('experience-count');
  if (badge) badge.textContent = items.length;

  for (const job of items) {
    const single    = job.positions.length === 1;
    const dateRange = t(job.start_date) + ' – ' + t(job.end_date);
    const position  = single ? job.positions[0] : null;

    const employer = document.createElement('div');
    employer.className = 'tl-employer';

    const dot = document.createElement('div');
    dot.className = 'tl-dot tl-dot--employer';
    employer.appendChild(dot);

    const card = document.createElement('div');
    card.className = 'tl-employer-card';

    let mediaHTML = '';
    if (job.logo) {
      mediaHTML += '<img src="' + job.logo + '" alt="' + t(job.company) + '" class="tl-logo"';
      mediaHTML += ' onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">';
      mediaHTML += '<span class="tl-icon-wrap" style="display:none">';
    } else {
      mediaHTML += '<span class="tl-icon-wrap">';
    }
    mediaHTML += '<span class="iconify" data-icon="' + (job.icon || 'mdi:briefcase-outline') + '" data-width="20"></span>';
    mediaHTML += '</span>';

    let headHTML = '<div class="tl-employer-head">';
    headHTML += '<div class="tl-employer-logo">' + mediaHTML + '</div>';
    headHTML += '<div class="tl-employer-meta">';
    headHTML += '<div class="tl-company">' + t(job.company) + '</div>';
    headHTML += '<div class="tl-location">' + t(job.location) + '</div>';

    if (single && position) {
      headHTML += '<div class="tl-title-inline">' + t(position.job_title) + '</div>';
      headHTML += '<div class="tl-date">' + t(position.start_date) + ' – ' + t(position.end_date) + '</div>';
    } else {
      headHTML += '<div class="tl-date">' + dateRange + '</div>';
    }

    headHTML += '</div></div>';
    card.innerHTML = headHTML;

    if (single && position && position.responsibilities) {
      let respHTML = '<ul class="tl-responsibilities">';
      for (const r of position.responsibilities) {
        respHTML += '<li>' + t(r) + '</li>';
      }
      respHTML += '</ul>';
      card.innerHTML += respHTML;
    }

    if (!single) {
      let posHTML = '<div class="tl-positions">';
      for (const p of job.positions) {
        posHTML += '<div class="tl-position">';
        posHTML += '<div class="tl-dot tl-dot--position"></div>';
        posHTML += '<div class="tl-position-body">';
        posHTML += '<div class="tl-position-head">';
        posHTML += '<strong class="tl-pos-title">' + t(p.job_title) + '</strong>';
        posHTML += '<span class="tl-date">' + t(p.start_date) + ' – ' + t(p.end_date) + '</span>';
        posHTML += '</div>';
        if (p.responsibilities) {
          posHTML += '<ul class="tl-responsibilities">';
          for (const r of p.responsibilities) {
            posHTML += '<li>' + t(r) + '</li>';
          }
          posHTML += '</ul>';
        }
        posHTML += '</div></div>';
      }
      posHTML += '</div>';
      card.innerHTML += posHTML;
    }

    employer.appendChild(card);
    timeline.appendChild(employer);
  }
}



function updateNavActive(targetId) {
  document.querySelectorAll('.sidenav-links a, #mobile-nav-links a').forEach(a => {
    const aTarget = a.dataset.subsection || a.getAttribute('href')?.substring(1);
    a.classList.toggle('active', aTarget === targetId);
  });
}

function updateSectionLabels(data) {
  const labels = data.section_labels;
  if (!labels) return;
  
  document.querySelectorAll('.subsection-tab[data-label-key]').forEach(tab => {
    const key = tab.dataset.labelKey;
    if (labels[key]) {
      tab.textContent = t(labels[key]);
    }
  });
}
// ─────────────────────────────────────────────
// TRANSLATION HELPER
// ─────────────────────────────────────────────
function t(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value[currentLang]) return value[currentLang];
  if (typeof value === 'object' && value.en) return value.en; // fallback
  return String(value);
}

// ─────────────────────────────────────────────
// UPDATE SECTION LABELS
// ─────────────────────────────────────────────
function updateSectionLabels(data) {
  const labels = data.section_labels;
  if (!labels) return;
  
  document.querySelectorAll('.subsection-tab[data-label-key]').forEach(tab => {
    const key = tab.dataset.labelKey;
    if (labels[key]) {
      tab.textContent = t(labels[key]);
    }
  });
}

// ─────────────────────────────────────────────
// UPDATE NAV ACTIVE STATE
// ─────────────────────────────────────────────
function updateNavActive(targetId) {
  const allLinks = document.querySelectorAll('.sidenav-links a, #mobile-nav-links a');
  allLinks.forEach(a => a.classList.remove('active'));
  allLinks.forEach(a => {
    if (a.getAttribute('href') === `#${targetId}`) {
      a.classList.add('active');
    }
  });
}

// ─────────────────────────────────────────────
// SUBSECTION TABS
// ─────────────────────────────────────────────
function initSubsectionTabs() {
  document.querySelectorAll('.section').forEach(section => {
    const subsections = section.querySelectorAll('.subsection');
    const tabs        = section.querySelectorAll('.subsection-tab');
    const hasActive   = section.querySelector('.subsection.active');
    if (!hasActive && subsections.length > 0) {
      subsections[0].classList.add('active');
      if (tabs[0]) tabs[0].classList.add('active');
    }
  });

  document.querySelectorAll('.subsection-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId      = tab.dataset.target;
      const parentSection = tab.closest('.section');
      parentSection.querySelectorAll('.subsection-tab').forEach(t => t.classList.remove('active'));
      parentSection.querySelectorAll('.subsection').forEach(s => s.classList.remove('active'));
      tab.classList.add('active');
      const target = parentSection.querySelector(`#${targetId}`);
      target.classList.add('active');
      animateBarsIn(target);
      updateNavActive(targetId);
    });
  });

  document.querySelectorAll('.sidenav-links a[data-subsection], #mobile-nav-links a[data-subsection]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId        = link.dataset.subsection;
      const targetSubsection = document.getElementById(targetId);
      if (!targetSubsection) return;

      const parentSection = targetSubsection.closest('.section');
      parentSection.querySelectorAll('.subsection-tab').forEach(t => t.classList.remove('active'));
      parentSection.querySelectorAll('.subsection').forEach(s => s.classList.remove('active'));
      parentSection.querySelector(`.subsection-tab[data-target="${targetId}"]`).classList.add('active');
      targetSubsection.classList.add('active');
      animateBarsIn(targetSubsection);

      const top = parentSection.getBoundingClientRect().top + window.scrollY - 32;
      window.scrollTo({ top, behavior: 'smooth' });

      manualActive = targetId;
      lastScrollY  = window.scrollY;

      updateNavActive(targetId);
    });
  });
}

// ─────────────────────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────────────────────
function buildProjects(data) {
  const items = data.projects;
  const tab = document.querySelector('.subsection-tab[data-target="projects"]');
  const panel = document.getElementById('projects');

  if (!items || !items.length) {
    if (tab) tab.style.display = 'none';
    if (panel) panel.style.display = 'none';
    return;
  }

  if (tab) tab.style.display = '';
  if (panel) panel.style.display = '';

  const list = document.getElementById('projects-list');
  list.innerHTML = '';

  for (const item of items) {
    const card = document.createElement(item.url ? 'a' : 'div');
    card.className = 'cert-card';
    if (item.url) {
      card.href = item.url;
      card.target = '_blank';
      card.rel = 'noopener';
    }
    const techs = (item.technologies || []).join(', ');
    card.innerHTML = `
      <span class="cert-icon">
        <span class="iconify" data-icon="${item.icon || 'mdi:code-braces'}" data-width="28"></span>
      </span>
      <div class="cert-body">
        <strong class="cert-name">${t(item.name)}</strong>
        <span class="cert-issuer">${t(item.description)}</span>
        ${techs ? `<span class="cert-date">${techs}</span>` : ''}
      </div>
      ${item.url ? '<span class="cert-arrow">↗</span>' : ''}
    `;
    list.appendChild(card);
  }
}
// ─────────────────────────────────────────────
// SECTION TITLE ANIMATIONS
// ─────────────────────────────────────────────
function initSectionTitleAnimations() {
  const titles = document.querySelectorAll('.section-title');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  titles.forEach(t => observer.observe(t));
}

// ─────────────────────────────────────────────
// ANIMATE SKILL BARS
// ─────────────────────────────────────────────
function animateBarsIn(container) {
  const bars = container.querySelectorAll('.skill-bar');
  bars.forEach(bar => {
    bar.style.width = '0%';
  });
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      bars.forEach(bar => {
        bar.style.width = bar.dataset.level + '%';
      });
    });
  });
}


// ─────────────────────────────────────────────
// RENDER CONTENT
// ─────────────────────────────────────────────
function renderContent(yamlData) {
  updateSectionLabels(yamlData);
  buildNav(yamlData);
  buildHeader(yamlData);
  buildContact(yamlData);
  buildSummary(yamlData);
  buildSkills(yamlData);
  buildLanguages(yamlData);
  buildCertifications(yamlData);
  buildEducation(yamlData);
  buildExperience(yamlData);
  buildProjects(yamlData);
  initSubsectionTabs();
  initSectionTitleAnimations();

  requestAnimationFrame(fitSidenavLinks);
}

window.addEventListener('resize', fitSidenavLinks);
// ─────────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────────
async function init() {
  initBackground();

  try {
    cvData = await loadAllYAML();   // ← was: await loadYAML()
  } catch (err) {
    console.error('Failed to load YAML data:', err);
    return;
  }

  document.title = t(cvData.name) || 'CV';

  buildLanguageSwitcher(cvData);
  renderContent(cvData);
}

document.addEventListener('DOMContentLoaded', init);