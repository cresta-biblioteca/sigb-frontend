/**
 * Navbar Component
 * Handles mobile toggle, dropdown menus, and scroll behavior
 *
 * Módulo ES autocontenido: no exporta nada, solo inicializa comportamiento.
 * Cargar con <script type="module" src="js/components/navbar.js"></script>
 */

import { store } from '../core/store.js';
import { authService } from '../services/authService.js';
import { Modal } from './modal.js';

const navbar = document.getElementById('navbar');
const navbarToggle = document.getElementById('navbarToggle');
const navbarMenu = document.getElementById('navbarMenu');
const dropdownItems = document.querySelectorAll('.navbar__item--dropdown');

if (!navbar || !navbarToggle || !navbarMenu) {
  throw new Error('Navbar: elementos requeridos no encontrados en el DOM.');
}

function normalizePath(pathname) {
  if (!pathname || pathname === '/') return '/index.html';
  return pathname.replace(/\/$/, '').toLowerCase();
}

function isSessionActive() {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(atob(base64));
    if (!data.exp) return true;
    return Date.now() / 1000 < data.exp;
  } catch {
    return false;
  }
}

function updateAuthNavigation() {
  const loggedIn = isSessionActive();
  const authItems = document.querySelectorAll('.navbar__item--auth');
  const privateItems = document.querySelectorAll('.navbar__item--private');
  const logoutButton = document.getElementById('logoutBtn');

  const setVisibility = (element, visible) => {
    if (!element) return;
    element.hidden = !visible;
    element.style.display = visible ? '' : 'none';
  };

  authItems.forEach((item) => {
    setVisibility(item, !loggedIn);
  });

  privateItems.forEach((item) => {
    setVisibility(item, loggedIn);
  });

  if (logoutButton && !privateItems.length) {
    setVisibility(logoutButton, loggedIn);
  }
}

function bindLogoutButton() {
  const logoutButton = document.getElementById('logoutBtn');
  if (!logoutButton || logoutButton.dataset.logoutBound === 'true') return;

  logoutButton.dataset.logoutBound = 'true';
  logoutButton.addEventListener('click', () => {
    Modal.create({
      title: 'Cerrar sesión',
      content: '¿Estás seguro que querés cerrar tu sesión?',
      onCancel: () => {},
      onConfirm: async () => {
        logoutButton.disabled = true;

        try {
          await authService.logout();
        } catch {
          // Si el backend falla, igual limpiamos la sesión local.
        } finally {
          store.clearSession();
          window.location.href = '../index.html';
        }
      },
    });
  });
}

function setActiveLinkByPath() {
  const currentPath = normalizePath(window.location.pathname);
  const links = navbarMenu.querySelectorAll('a.navbar__link');

  links.forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    const isActive = linkPath === currentPath;

    link.classList.toggle('navbar__link--active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

setActiveLinkByPath();
updateAuthNavigation();
bindLogoutButton();

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
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 10 ? '0 2px 12px rgba(0,0,0,0.15)' : 'none';
}, { passive: true });

// Close mobile menu on resize to desktop
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    navbarMenu.classList.remove('is-open');
    navbarToggle.classList.remove('is-active');
    navbarToggle.setAttribute('aria-expanded', 'false');
  }
});
