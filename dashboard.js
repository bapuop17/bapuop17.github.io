/*
 * BapuOP AI - Dashboard Module
 * Manages usage chart rendering, profile customization, and system keys configurations
 */

document.addEventListener('DOMContentLoaded', () => {
  initDashboardCharts();
  initDashboardMenuToggle();
  initProfileCustomizer();
  initSettingsManager();
});

/* 1. Dynamic Chart Renderer (No bloated libraries, purely beautiful responsive bars) */
function initDashboardCharts() {
  const container = document.getElementById('usage-chart');
  if (!container) return;

  // Static usage metrics for 7 days
  const data = [
    { label: 'Mon', val: 320 },
    { label: 'Tue', val: 512 },
    { label: 'Wed', val: 480 },
    { label: 'Thu', val: 780 },
    { label: 'Fri', val: 960 },
    { label: 'Sat', val: 450 },
    { label: 'Sun', val: 620 }
  ];

  const maxVal = Math.max(...data.map(d => d.val));
  container.innerHTML = '';

  data.forEach(item => {
    const pct = (item.val / maxVal) * 100;
    
    const col = document.createElement('div');
    col.className = 'chart-bar-col';
    
    col.innerHTML = `
      <div class="chart-bar-fill" style="height: 0%;" data-value="${item.val} queries" id="bar-${item.label}"></div>
      <span class="chart-bar-label">${item.label}</span>
    `;

    container.appendChild(col);

    // Trigger animation frame for transition
    setTimeout(() => {
      const fill = document.getElementById(`bar-${item.label}`);
      if (fill) fill.style.height = `${pct}%`;
    }, 150);
  });
}

/* 2. Responsive Mobile Sidebar Trigger for Dashboards */
function initDashboardMenuToggle() {
  const toggle = document.querySelector('.mobile-dashboard-toggle');
  const sidebar = document.querySelector('.dashboard-sidebar');
  const overlay = document.querySelector('.chat-overlay'); // Using common overlay if present

  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
  });

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
}

/* 3. Profile customizer state saver */
function initProfileCustomizer() {
  const profileForm = document.getElementById('profile-form');
  if (!profileForm) return;

  // Load existing profile if saved in LocalStorage
  const savedName = localStorage.getItem('bapuop_user_name') || 'Guest User';
  const savedEmail = localStorage.getItem('bapuop_user_email') || 'user@bapuop-ai.com';
  
  const nameInput = document.getElementById('profile-name-input');
  const emailInput = document.getElementById('profile-email-input');

  if (nameInput) nameInput.value = savedName;
  if (emailInput) emailInput.value = savedEmail;

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = profileForm.querySelector('button[type="submit"]');
    const org = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = 'Saving...';

    if (nameInput) localStorage.setItem('bapuop_user_name', nameInput.value);
    if (emailInput) localStorage.setItem('bapuop_user_email', emailInput.value);

    // Update global widgets if they exist
    const widgets = document.querySelectorAll('.dashboard-user-name');
    widgets.forEach(w => w.textContent = nameInput ? nameInput.value : 'Guest User');

    setTimeout(() => {
      btn.innerHTML = '✓ Profile Saved!';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = org;
      }, 2000);
    }, 1000);
  });
}

/* 4. Settings Toggles and Front-End Save */
function initSettingsManager() {
  const settingsForm = document.getElementById('settings-form');
  if (!settingsForm) return;

  // Load toggles
  const keys = ['voice_output', 'save_history', 'developer_mode'];
  keys.forEach(key => {
    const input = document.getElementById(`toggle-${key}`);
    if (input) {
      input.checked = localStorage.getItem(`bapuop_${key}`) === 'true';
      input.addEventListener('change', () => {
        localStorage.setItem(`bapuop_${key}`, input.checked);
      });
    }
  });

  // Load API Key
  const apiKeyInput = document.getElementById('settings-api-key');
  if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem('bapuop_custom_api_key') || '';
  }

  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = settingsForm.querySelector('button[type="submit"]');
    const org = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = 'Applying...';

    if (apiKeyInput) {
      localStorage.setItem('bapuop_custom_api_key', apiKeyInput.value.trim());
    }

    setTimeout(() => {
      btn.innerHTML = '✓ Settings Applied!';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = org;
      }, 2000);
    }, 1000);
  });
}
