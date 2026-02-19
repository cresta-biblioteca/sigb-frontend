/**
 * Footer Component
 * Handles footer year update and any footer interactions
 */
(function () {
  'use strict';

  // Update footer year dynamically
  const footerBottom = document.querySelector('.footer__bottom p');
  if (footerBottom) {
    const currentYear = new Date().getFullYear();
    footerBottom.textContent = footerBottom.textContent.replace('2024', currentYear);
  }
})();
