/**
 * Theme mode selector for the Kihon style guide.
 * data-kh-theme is set only for an explicit light or dark choice. With System
 * selected, CSS follows the operating system's prefers-color-scheme setting.
 */
class KihonThemeSwitcher {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'kihon-theme';
    this.attributeName = 'data-kh-theme';
    this.themeMode = 'system';
    this.mediaQuery = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    this.init();
  }

  init() {
    const stored = this.getStoredTheme();
    if (stored === 'light' || stored === 'dark') {
      this.themeMode = stored;
      document.documentElement.setAttribute(this.attributeName, stored);
    } else {
      document.documentElement.removeAttribute(this.attributeName);
    }

    document.addEventListener('click', (event) => {
      const button = event.target.closest?.('[data-kh-theme-toggle]');
      if (button) this.setTheme(button.getAttribute('data-kh-theme-toggle'));
    });

    if (this.mediaQuery) {
      const updateAppearance = () => this.updateAppearanceStatus();
      if (typeof this.mediaQuery.addEventListener === 'function') {
        this.mediaQuery.addEventListener('change', updateAppearance);
      } else if (typeof this.mediaQuery.addListener === 'function') {
        this.mediaQuery.addListener(updateAppearance);
      }
    }

    this.updateButtons();
    this.updateAppearanceStatus();
  }

  setTheme(theme) {
    if (!['system', 'light', 'dark'].includes(theme)) return;

    this.themeMode = theme;
    if (theme === 'system') {
      document.documentElement.removeAttribute(this.attributeName);
      this.removeStoredTheme();
    } else {
      document.documentElement.setAttribute(this.attributeName, theme);
      this.storeTheme(theme);
    }

    this.updateButtons();
    this.updateAppearanceStatus();
  }

  getEffectiveTheme() {
    if (this.themeMode !== 'system') return this.themeMode;
    return this.mediaQuery && this.mediaQuery.matches ? 'dark' : 'light';
  }

  getStoredTheme() {
    try {
      return window.localStorage.getItem(this.storageKey);
    } catch {
      return null;
    }
  }

  storeTheme(theme) {
    try {
      window.localStorage.setItem(this.storageKey, theme);
    } catch {
      // The theme remains active for this page even when browser storage is blocked.
    }
  }

  removeStoredTheme() {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch {
      // System mode still applies for this page when browser storage is blocked.
    }
  }

  updateButtons() {
    document.querySelectorAll('[data-kh-theme-toggle]').forEach((button) => {
      const isSelected = button.getAttribute('data-kh-theme-toggle') === this.themeMode;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('kh-active', isSelected);
    });
  }

  updateAppearanceStatus() {
    const status = document.querySelector('[data-kh-theme-status]');
    if (status) {
      status.textContent = `Selected mode: ${this.themeMode}. Current appearance: ${this.getEffectiveTheme()}.`;
    }
  }
}

if (document.readyState !== 'loading') {
  window.KihonThemeSwitcher = new KihonThemeSwitcher();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    window.KihonThemeSwitcher = new KihonThemeSwitcher();
  });
}
