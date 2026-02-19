/**
 * Main Application Script
 * Initializes page functionality for the home page
 */
(function () {
  'use strict';

  // ========== SEARCH FORM ==========
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('searchInput')?.value.trim();
      if (query) {
        // Redirect to catalog page with search query
        window.location.href = `templates/catalog.html?q=${encodeURIComponent(query)}`;
      }
    });
  }

  // ========== LOGIN FORM ==========
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('loginId')?.value.trim();
      const password = document.getElementById('loginPassword')?.value.trim();

      if (!id || !password) {
        Modal.create({
          title: 'Campos requeridos',
          content: 'Por favor, completá tu tarjeta de identificación y contraseña para ingresar.',
        });
        return;
      }

      // Simulate login - redirect to dashboard
      window.location.href = `templates/dashboard.html`;
    });
  }

  // ========== ACCESSIBILITY BUTTON ==========
  const accessibilityBtn = document.getElementById('accessibilityBtn');
  if (accessibilityBtn) {
    let highContrast = false;
    accessibilityBtn.addEventListener('click', () => {
      highContrast = !highContrast;
      document.body.classList.toggle('high-contrast', highContrast);

      if (highContrast) {
        document.documentElement.style.fontSize = '18px';
      } else {
        document.documentElement.style.fontSize = '16px';
      }
    });
  }

  // ========== CHAT BUTTON ==========
  const chatBtn = document.getElementById('chatBtn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      Modal.create({
        title: 'Chat de Ayuda',
        content: `
          <p>¿Necesitás ayuda? Podés contactarnos por los siguientes medios:</p>
          <ul style="margin-top: 0.75rem; padding-left: 1.25rem; list-style: disc;">
            <li style="margin-bottom: 0.25rem;">Email: biblioteca@cresta.edu.ar</li>
            <li style="margin-bottom: 0.25rem;">Teléfono: (02983) 43-1229</li>
            <li>Presencial: Maipú 270, Tres Arroyos</li>
          </ul>
        `,
      });
    });
  }

  // ========== NAVBAR SEARCH BUTTON ==========
  const navSearchBtn = document.querySelector('.navbar__search-btn');
  if (navSearchBtn) {
    navSearchBtn.addEventListener('click', () => {
      const catalogSection = document.getElementById('catalogo');
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          document.getElementById('searchInput')?.focus();
        }, 500);
      }
    });
  }

})();
