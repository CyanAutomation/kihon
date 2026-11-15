/** Local sidebar examples. Route state remains local to this page. */
document.querySelectorAll<HTMLButtonElement>('.kh-sidebar-toggle[aria-controls]').forEach((toggleButton) => {
  const sidebarId = toggleButton.getAttribute('aria-controls');
  const sidebar = sidebarId ? document.getElementById(sidebarId) : null;
  if (sidebar instanceof HTMLElement && window.KihonSidebar) {
    try {
      window.KihonSidebar.createSidebarController({
        sidebar,
        toggleButton
      });
    } catch (error) {
      console.error('[KihonSidebar] Failed to initialize sidebar controller:', error);
    }
  }
});

const demoNavigation = document.querySelector<HTMLElement>('#sidebar-demo-nav');
const sidebarStatus = document.querySelector<HTMLElement>('[data-kh-sidebar-status]');

function updateCurrentDestination() {
  if (!demoNavigation) return;

  const links = [...demoNavigation.querySelectorAll<HTMLAnchorElement>('a[href^="#sidebar-demo-"]')];
  const matchingLink = links.find((link) => link.hash === window.location.hash);
  const currentLink = matchingLink || links[0];
  if (!currentLink) return;

  for (const link of links) {
    if (link === currentLink) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }

  const destination = currentLink.textContent.trim();
  if (sidebarStatus) sidebarStatus.textContent = `Current demonstration destination: ${destination}.`;
}

window.addEventListener('hashchange', updateCurrentDestination);
updateCurrentDestination();
