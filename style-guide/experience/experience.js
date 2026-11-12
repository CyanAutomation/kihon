/* Small interactions for the Phase 5A style-guide references only. */

const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const syncThemeColor = () => {
  if (!themeColorMeta) return;
  themeColorMeta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--kh-color-background').trim());
};
if (themeColorMeta) {
  if (window.MutationObserver) {
    new MutationObserver(syncThemeColor).observe(document.documentElement, { attributes: true, attributeFilter: ['data-kh-theme'] });
  }
  if (window.matchMedia) {
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)');
    if (colorScheme.addEventListener) colorScheme.addEventListener('change', syncThemeColor);
    else if (colorScheme.addListener) colorScheme.addListener(syncThemeColor);
  }
  syncThemeColor();
}

const captureForm = document.querySelector('[data-session-form]');
if (captureForm) {
  captureForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.querySelector('[data-session-status]');
    if (status) status.textContent = 'Session captured in this local demonstration. No data was sent or stored.';
  });
}

const tabletShell = document.querySelector('.xp-tablet-shell');
if (tabletShell) {
  tabletShell.dataset.interactive = 'true';
  const sessionRows = Array.from(tabletShell.querySelectorAll('[data-session-title]'));
  const detailTitle = tabletShell.querySelector('[data-detail-title]');
  const detailDate = tabletShell.querySelector('[data-detail-date]');
  const detailSummary = tabletShell.querySelector('[data-detail-summary]');
  const detailDuration = tabletShell.querySelector('[data-detail-duration]');
  const search = tabletShell.querySelector('[data-session-search]');
  const emptyState = tabletShell.querySelector('[data-session-empty]');
  const backButton = tabletShell.querySelector('[data-session-back]');

  const selectSession = (row, moveFocus, openDetail = true) => {
    sessionRows.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === row)));
    detailTitle.textContent = row.dataset.sessionTitle;
    detailDate.textContent = row.dataset.sessionDate;
    detailSummary.textContent = row.dataset.sessionSummary;
    detailDuration.textContent = row.dataset.sessionDuration;
    const isCompact = window.matchMedia
      ? window.matchMedia('(max-width: 43rem)').matches
      : window.innerWidth <= 688;
    if (isCompact && openDetail) {
      tabletShell.dataset.mobileView = 'detail';
      if (moveFocus) detailTitle.focus();
    }
  };

  sessionRows.forEach((row) => {
    row.addEventListener('click', () => selectSession(row, true));
  });

  if (search) {
    search.addEventListener('input', () => {
      const term = search.value.trim().toLocaleLowerCase();
      const visibleRows = sessionRows.filter((row) => {
        const matches = row.textContent.toLocaleLowerCase().includes(term);
        row.hidden = !matches;
        return matches;
      });
      if (emptyState) emptyState.hidden = visibleRows.length > 0;
      const selected = sessionRows.find((row) => row.getAttribute('aria-pressed') === 'true');
      if (visibleRows.length && (!selected || selected.hidden)) selectSession(visibleRows[0], false, false);
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      tabletShell.dataset.mobileView = 'list';
      const selected = sessionRows.find((row) => row.getAttribute('aria-pressed') === 'true');
      if (selected) selected.focus();
    });
  }
}

const reportPeriod = document.querySelector('[data-report-period]');
const exportButton = document.querySelector('[data-export-report]');
if (reportPeriod) {
  reportPeriod.addEventListener('change', () => {
    const status = document.querySelector('[data-export-status]');
    if (status) status.textContent = 'Selected range: ' + reportPeriod.options[reportPeriod.selectedIndex].text + '. The figures on this reference screen are illustrative.';
  });
}

if (exportButton) {
  exportButton.addEventListener('click', () => {
    const csv = 'Week,Sessions\nWeek 38,2\nWeek 39,3\nWeek 40,2\nWeek 41,4\nWeek 42,3\nWeek 43,5\nWeek 44,4\nWeek 45,6\n';
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kihon-training-sample.csv';
    link.click();
    URL.revokeObjectURL(url);
    const status = document.querySelector('[data-export-status]');
    if (status) status.textContent = 'Sample CSV downloaded. A production app owns report generation and export permissions.';
  });
}
