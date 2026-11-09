/**
 * Theme mode selector for the Kihon style guide.
 * Dark is the default. Explicit Light and System choices set data-kh-theme,
 * with System following the operating system's prefers-color-scheme setting.
 */
class KihonThemeSwitcher {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'kihon-theme';
    this.attributeName = 'data-kh-theme';
    this.themeMode = 'dark';
    this.mediaQuery = window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    this.init();
  }

  init() {
    const stored = this.getStoredTheme();
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
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
    document.documentElement.setAttribute(this.attributeName, theme);
    this.storeTheme(theme);

    this.updateButtons();
    this.updateAppearanceStatus();
  }

  getEffectiveTheme() {
    if (this.themeMode !== 'system') return this.themeMode;
    return !this.mediaQuery || this.mediaQuery.matches ? 'dark' : 'light';
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
