// Mobile navigation and section-preserving language links.
const menuButton = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('#primary-nav');

if (menuButton && primaryNav) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    primaryNav.classList.toggle('is-open', !isOpen);
  });

  primaryNav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement && !event.target.hasAttribute('data-language-switch')) {
      menuButton.setAttribute('aria-expanded', 'false');
      primaryNav.classList.remove('is-open');
    }
  });
}

// Keep the current section when switching between the matching language versions.
document.querySelectorAll('[data-language-switch]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (!window.location.hash) return;
    event.preventDefault();
    window.location.assign(`${link.href}${window.location.hash}`);
  });
});
