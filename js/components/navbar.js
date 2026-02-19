/**
 * Navbar Component
 * Handles mobile toggle, dropdown menus, and scroll behavior
 */
(function () {
  'use strict';

  const navbar = document.getElementById('navbar');
  const navbarToggle = document.getElementById('navbarToggle');
  const navbarMenu = document.getElementById('navbarMenu');
  const dropdownItems = document.querySelectorAll('.navbar__item--dropdown');

  if (!navbar || !navbarToggle || !navbarMenu) return;

  // Mobile menu toggle
  navbarToggle.addEventListener('click', () => {
    const isOpen = navbarMenu.classList.toggle('is-open');
    navbarToggle.classList.toggle('is-active');
    navbarToggle.setAttribute('aria-expanded', isOpen);
  });

  // Dropdown toggle
  dropdownItems.forEach((item) => {
    const btn = item.querySelector('.navbar__link--dropdown');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', isOpen);

      // Close other dropdowns
      dropdownItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('is-open');
          const otherBtn = other.querySelector('.navbar__link--dropdown');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar__item--dropdown')) {
      dropdownItems.forEach((item) => {
        item.classList.remove('is-open');
        const btn = item.querySelector('.navbar__link--dropdown');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Close mobile menu on link click
  navbarMenu.querySelectorAll('.navbar__link:not(.navbar__link--dropdown)').forEach((link) => {
    link.addEventListener('click', () => {
      navbarMenu.classList.remove('is-open');
      navbarToggle.classList.remove('is-active');
      navbarToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Navbar shadow on scroll
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 10) {
      navbar.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)';
    } else {
      navbar.style.boxShadow = 'none';
    }
    lastScroll = currentScroll;
  }, { passive: true });

  // Close mobile menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navbarMenu.classList.remove('is-open');
      navbarToggle.classList.remove('is-active');
      navbarToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();
