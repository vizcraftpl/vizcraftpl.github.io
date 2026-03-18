// ============================================================
// PROFILE
// Replaces: buildHeader() + buildContact()
// Depends on: state.js, utils.js (t)
// ============================================================

function buildProfile(data) {
  // Name
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = t(data.name);

  // Contact list
  const list = document.getElementById('contact-list');
  if (!list || !data.contact) return;
  list.innerHTML = '';

  for (const [, value] of Object.entries(data.contact)) {
    const item = document.createElement(value.href ? 'a' : 'div');
    item.className = 'contact-item';
    if (value.href) {
      item.href   = value.href;
      item.target = '_blank';
      item.rel    = 'noopener';
    }
    item.innerHTML = `
      <span class="card-icon">
        <span class="iconify" data-icon="${value.icon || 'mdi:information-outline'}" data-width="16"></span>
      </span>
      <span class="contact-value">${t(value.value)}</span>
    `;
    list.appendChild(item);
  }
}