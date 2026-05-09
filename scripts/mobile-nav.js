document.addEventListener('DOMContentLoaded', () => {
  const navButton = document.querySelector('#nav-menu-button');
  const mobileMenu = document.querySelector('#mobile-menu');
  const mobileNav = document.querySelector('#nav-mobile');

  if (!navButton || !mobileMenu) {
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  navButton.type = 'button';
  navButton.setAttribute('aria-controls', 'mobile-menu');
  mobileMenu.hidden = true;

  const translate = (key) => {
    if (window.I18N?.t) {
      return window.I18N.t(key);
    }
    return key === 'nav_close_menu' ? 'Close menu' : 'Open menu';
  };

  const setMenuOpen = (isOpen) => {
    if (mobileNav) {
      document.documentElement.style.setProperty('--mobile-nav-height', `${mobileNav.offsetHeight}px`);
    }

    mobileMenu.classList.toggle('active', isOpen);
    overlay.classList.toggle('active', isOpen);
    navButton.classList.toggle('active', isOpen);
    navButton.setAttribute('aria-expanded', String(isOpen));
    navButton.dataset.i18nAriaLabel = isOpen ? 'nav_close_menu' : 'nav_open_menu';
    navButton.setAttribute('aria-label', translate(navButton.dataset.i18nAriaLabel));
    mobileMenu.hidden = !isOpen;
  };

  const isMenuOpen = () => mobileMenu.classList.contains('active');

  navButton.addEventListener('click', () => {
    setMenuOpen(!isMenuOpen());
  });

  overlay.addEventListener('click', () => {
    setMenuOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen()) {
      setMenuOpen(false);
      navButton.focus();
    }
  });

  document.addEventListener('click', (event) => {
    const clickedInsideMenu = mobileMenu.contains(event.target);
    const clickedNav = mobileNav?.contains(event.target);

    if (isMenuOpen() && !clickedInsideMenu && !clickedNav) {
      setMenuOpen(false);
    }
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  window.addEventListener('resize', () => {
    if (mobileNav) {
      document.documentElement.style.setProperty('--mobile-nav-height', `${mobileNav.offsetHeight}px`);
    }

    if (window.matchMedia('(min-width: 900px)').matches) {
      setMenuOpen(false);
    }
  });

  document.addEventListener('languageChanged', () => {
    setMenuOpen(isMenuOpen());
  });

  setMenuOpen(false);
});
