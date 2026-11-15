/**
 * Button interaction demonstrations for the static style guide only.
 * Production button state remains the consuming application's responsibility.
 */
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;

  if (target.closest('[data-kh-demo-disabled-link]')) {
    event.preventDefault();
    return;
  }

  const actionButton = target.closest('[data-kh-demo-action]');
  if (actionButton) {
    const status = document.querySelector<HTMLElement>('[data-kh-demo-action-status]');
    if (status) {
      const count = Number(status.dataset.actionCount || 0) + 1;
      status.dataset.actionCount = String(count);
      status.textContent = `Example action completed ${count} times.`;
    }
  }

  const loadingButton = target.closest('[data-kh-demo-loading]') as HTMLButtonElement | null;
  if (loadingButton && !loadingButton.disabled) {
    const status = document.querySelector<HTMLElement>('[data-kh-demo-loading-status]');
    const originalLabel = loadingButton.textContent;

    loadingButton.disabled = true;
    loadingButton.classList.add('kh-button--loading');
    loadingButton.textContent = 'Saving…';
    if (status) status.textContent = 'Saving changes…';

    window.setTimeout(() => {
      loadingButton.disabled = false;
      loadingButton.classList.remove('kh-button--loading');
      loadingButton.textContent = originalLabel;
      if (status) status.textContent = 'Changes saved.';
    }, 1200);
  }
});
