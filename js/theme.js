/*
 * BapuOP AI - Theme Module
 * Handles Light/Dark mode state management, persistence, and synchronization
 */

(function () {
  const THEME_KEY = 'bapuop_theme';

  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark'; // Default to dark mode
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    
    // Update theme toggle icons across pages if they exist
    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');
    
    if (theme === 'light') {
      sunIcons.forEach(el => el.style.display = 'none');
      moonIcons.forEach(el => el.style.display = 'block');
    } else {
      sunIcons.forEach(el => el.style.display = 'block');
      moonIcons.forEach(el => el.style.display = 'none');
    }
  }

  function toggleTheme() {
    const currentTheme = getSavedTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  // Initialize theme instantly to avoid screen flash
  const initialTheme = getSavedTheme();
  applyTheme(initialTheme);

  // Expose toggle function on window load
  window.addEventListener('DOMContentLoaded', () => {
    applyTheme(getSavedTheme());
    
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', toggleTheme);
    });
  });

  // Export functions to global scope
  window.ThemeManager = {
    getTheme: getSavedTheme,
    toggle: toggleTheme,
    apply: applyTheme
  };
})();
