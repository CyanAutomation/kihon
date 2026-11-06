/**
 * Kihon Theme Switcher
 * Provides theme selection controls and manages data-kh-theme attribute
 */

class KihonThemeSwitcher {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'kihon-theme';
    this.attributeName = 'data-kh-theme';
    this.init();
  }

  init() {
    // Restore persisted theme preference if available
    const stored = this.getStoredTheme();
    if (stored) {
      this.setTheme(stored);
    }

    // Listen for theme toggle buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-kh-theme-toggle]')) {
        const theme = e.target.getAttribute('data-kh-theme-toggle');
        this.setTheme(theme || 'system');
      }
    });

    // Listen for system preference changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', () => {
        if (!this.getStoredTheme()) {
          // Only respond to system changes if user hasn't explicitly chosen a theme
          this.updateButtons();
        }
      });
    }

    this.updateButtons();
  }

  /**
   * Set the theme and persist the preference.
   */
  setTheme(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute(this.attributeName);
      localStorage.removeItem(this.storageKey);
    } else if (theme === 'light' || theme === 'dark') {
      document.documentElement.setAttribute(this.attributeName, theme);
      localStorage.setItem(this.storageKey, theme);
    }

    this.updateButtons();
  }

  /**
   * Get the currently active theme.
   */
  getActiveTheme() {
    const attribute = document.documentElement.getAttribute(this.attributeName);
    if (attribute) {
      return attribute;
    }

    // Return system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  /**
   * Get the stored theme preference.
   */
  getStoredTheme() {
    return localStorage.getItem(this.storageKey);
  }

  /**
   * Update theme toggle buttons to reflect current theme.
   */
  updateButtons() {
    const active = this.getActiveTheme();
    const stored = this.getStoredTheme();

    document.querySelectorAll('[data-kh-theme-toggle]').forEach((button) => {
      const theme = button.getAttribute('data-kh-theme-toggle');
      const isActive = stored ? theme === stored : theme === active;

      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.classList.toggle('kh-active', isActive);
    });
  }
}

// Auto-initialize if document is ready
if (document.readyState !== 'loading') {
  window.KihonThemeSwitcher = new KihonThemeSwitcher();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    window.KihonThemeSwitcher = new KihonThemeSwitcher();
  });
}
