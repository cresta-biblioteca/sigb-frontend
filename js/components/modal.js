/**
 * Modal Component
 * Reusable modal dialog utility
 *
 * Exportado como módulo ES. Importar en el page script que lo necesite:
 *   import { Modal } from '../components/modal.js';
 */
const Modal = (function () {
  'use strict';

  function create({ title = '', content = '', onConfirm = null, onCancel = null }) {
    // Remove existing modal
    const existing = document.getElementById('modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2000;
      background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center;
      animation: fadeIn 0.2s ease;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white; border-radius: 12px; padding: 2rem;
      max-width: 440px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      animation: slideUp 0.25s ease;
    `;

    modal.innerHTML = `
      <h3 style="margin-bottom: 1rem; font-size: 1.125rem; color: #212529;">${title}</h3>
      <div style="margin-bottom: 1.5rem; color: #495057; font-size: 0.9375rem; line-height: 1.6;">${content}</div>
      <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
        ${onCancel ? '<button id="modal-cancel" style="padding: 0.5rem 1.25rem; border: 1.5px solid #dee2e6; border-radius: 8px; background: white; color: #495057; cursor: pointer; font-weight: 500;">Cancelar</button>' : ''}
        <button id="modal-confirm" style="padding: 0.5rem 1.25rem; border: none; border-radius: 8px; background: #0F2B5B; color: white; cursor: pointer; font-weight: 600;">Aceptar</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Event listeners
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    confirmBtn.addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close();
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (onCancel) onCancel();
        close();
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        close();
        document.removeEventListener('keydown', handler);
      }
    });
  }

  function close() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
    }
  }

  return { create, close };
})();

export { Modal };
