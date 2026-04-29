/**
 * Footer Component
 * Handles footer year update and any footer interactions
 *
 * Módulo ES autocontenido: no exporta nada, solo inicializa comportamiento.
 * Cargar con <script type="module" src="js/components/footer.js"></script>
 */

const footerBottom = document.querySelector('.footer__bottom p');
if (footerBottom) {
  footerBottom.textContent = footerBottom.textContent.replace('2024', new Date().getFullYear());
}
