document.addEventListener('DOMContentLoaded', () => {
  const navButton = document.querySelector('#nav-menu-button');
  const mobileMenu = document.querySelector('#mobile-menu');

  navButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
});