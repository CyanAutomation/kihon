/**
 * Local grouped-settings demonstration for the static style guide only.
 * Kihon production styles do not persist or manage preference state.
 */
const settingsStatus = document.querySelector('[data-kh-demo-settings-status]');

function describeSetting(control) {
  if (control.type === 'checkbox') return control.checked ? 'on' : 'off';
  if (control.tagName === 'SELECT') return control.selectedOptions[0]?.textContent || 'empty';
  return control.value.trim() || 'empty';
}

for (const control of document.querySelectorAll('[data-kh-demo-setting]')) {
  const updateStatus = () => {
    const label = control.labels?.[0]?.textContent.trim() || 'Setting';
    if (settingsStatus) settingsStatus.textContent = `${label}: ${describeSetting(control)}. This value is not saved.`;
  };

  control.addEventListener(control.matches('input[type="text"]') ? 'input' : 'change', updateStatus);
}
