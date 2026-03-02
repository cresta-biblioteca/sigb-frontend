/**
 * Renderizador de Alta de Libro (Panel de Administracion) - Actualización del DOM
 * Maneja la actualización visual del modal y formulario de alta de libros
 * Encapsula toda la interacción con el DOM
 */

class AddBookRenderer {
  /**
   * Constructor
   * Cachea referencias del DOM
   */
  constructor() {
    // Modal y formulario
    this.modal = document.getElementById('addBookModal');
    this.form = document.getElementById('addBookForm');
    this.addBookBtn = document.getElementById('addBookBtn');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.cancelAddBookBtn = document.getElementById('cancelAddBookBtn');
    this.modalOverlay = this.modal?.querySelector('.modal__overlay');

    // Campos de títulos
    this.titleInput = document.getElementById('bookTitle');
    this.informativeTitleInput = document.getElementById('bookInformativeTitle');
    this.otherTitlesInput = document.getElementById('bookOtherTitles');

    // Campos de autoría
    this.authorInput = document.getElementById('bookAuthor');
    this.optionalAuthorsContainer = document.getElementById('optionalAuthorsContainer');
    this.addAuthorBtn = document.getElementById('addAuthorBtn');
    this.collaboratorsInput = document.getElementById('bookCollaborators');

    // Clasificación
    this.cduSelect = document.getElementById('bookCDU');

    // MARC21
    this.marc21Output = document.getElementById('marc21Output');
    this.copyMarcBtn = document.getElementById('copyMarcBtn');

    // Callbacks
    this.onOpenModalCallback = null;
    this.onCloseModalCallback = null;
    this.onSubmitCallback = null;
    this.onLoadCategoriesCallback = null;
    this.onUpdateMARC21Callback = null;

    // Inicializar event listeners internos
    this.initializeInternalListeners();
  }

  /**
   * Inicializa event listeners internos
   */
  initializeInternalListeners() {
    // Agregar autor
    if (this.addAuthorBtn) {
      this.addAuthorBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.addAuthorField();
      });
    }

    // Remover autores
    if (this.optionalAuthorsContainer) {
      this.optionalAuthorsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-author')) {
          e.preventDefault();
          e.target.closest('.author-item').remove();
          this.updateMARC21();
        }
      });
    }

    // Actualizar MARC21 en tiempo real
    const fieldsToWatch = [
      this.titleInput,
      this.informativeTitleInput,
      this.otherTitlesInput,
      this.authorInput,
      this.collaboratorsInput,
      this.cduSelect
    ];

    fieldsToWatch.forEach(field => {
      if (field) {
        field.addEventListener('input', () => this.updateMARC21());
        field.addEventListener('change', () => this.updateMARC21());
      }
    });

    // Escuchar cambios en autores opcionales
    if (this.optionalAuthorsContainer) {
      this.optionalAuthorsContainer.addEventListener('input', () => this.updateMARC21());
    }

    // Copiar MARC21
    if (this.copyMarcBtn) {
      this.copyMarcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.copyMARC21ToClipboard();
      });
    }
  }

  /**
   * Agrega un nuevo campo de autor opcional
   */
  addAuthorField() {
    const authorItem = document.createElement('div');
    authorItem.className = 'author-item';
    authorItem.innerHTML = `
      <input type="text" class="form-input optional-author-input" placeholder="Nombre del autor (opcional)">
      <button type="button" class="btn btn--small btn--outline remove-author" aria-label="Eliminar autor">
        Eliminar
      </button>
    `;
    
    this.optionalAuthorsContainer?.appendChild(authorItem);
    
    // Agregar listener al nuevo campo
    const input = authorItem.querySelector('.optional-author-input');
    if (input) {
      input.addEventListener('input', () => this.updateMARC21());
    }
  }

  /**
   * Obtiene todos los autores opcionales
   */
  getOptionalAuthors() {
    const inputs = this.optionalAuthorsContainer?.querySelectorAll('.optional-author-input') || [];
    return Array.from(inputs)
      .map(input => input.value.trim())
      .filter(value => value !== '');
  }

  /**
   * Obtiene todos los colaboradores
   */
  getCollaborators() {
    const text = this.collaboratorsInput?.value || '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
  }

  /**
   * Obtiene otros títulos
   */
  getOtherTitles() {
    const text = this.otherTitlesInput?.value || '';
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
  }

  /**
   * Registra callback para apertura del modal
   * @param {Function} callback - Función a ejecutar
   */
  onOpenModal(callback) {
    this.onOpenModalCallback = callback;
    if (this.addBookBtn) {
      this.addBookBtn.addEventListener('click', () => {
        this.openModal();
        callback();
      });
    }
  }

  /**
   * Registra callback para cierre del modal
   * @param {Function} callback - Función a ejecutar
   */
  onCloseModal(callback) {
    this.onCloseModalCallback = callback;

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => {
        this.closeModal();
        callback();
      });
    }

    if (this.cancelAddBookBtn) {
      this.cancelAddBookBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeModal();
        callback();
      });
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', () => {
        this.closeModal();
        callback();
      });
    }
  }

  /**
   * Registra callback para envío del formulario
   * @param {Function} callback - Función(formData)
   */
  onSubmit(callback) {
    this.onSubmitCallback = callback;
    if (this.form) {
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = this.getFormData();
        await callback(formData);
      });
    }
  }

  /**
   * Registra callback para cargar categorías
   * @param {Function} callback - Función a ejecutar
   */
  onLoadCategories(callback) {
    this.onLoadCategoriesCallback = callback;
  }

  /**
   * Registra callback para actualizar MARC21
   * @param {Function} callback - Función(formData)
   */
  onUpdateMARC21(callback) {
    this.onUpdateMARC21Callback = callback;
  }

  /**
   * Abre el modal
   */
  openModal() {
    if (this.modal) {
      this.modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      if (this.onLoadCategoriesCallback) {
        this.onLoadCategoriesCallback();
      }
    }
  }

  /**
   * Cierra el modal
   */
  closeModal() {
    if (this.modal) {
      this.modal.style.display = 'none';
      document.body.style.overflow = '';
      this.resetForm();
      this.clearErrors();
    }
  }

  /**
   * Obtiene los datos del formulario
   * @returns {Object} Datos del formulario
   */
  getFormData() {
    return {
      title: this.titleInput?.value || '',
      informativeTitle: this.informativeTitleInput?.value || '',
      otherTitles: this.getOtherTitles(),
      author: this.authorInput?.value || '',
      optionalAuthors: this.getOptionalAuthors(),
      collaborators: this.getCollaborators(),
      cdu: this.cduSelect?.value || '',
    };
  }

  /**
   * Resetea el formulario
   */
  resetForm() {
    if (this.form) {
      this.form.reset();
    }
    
    // Limpiar autores opcionales extra
    if (this.optionalAuthorsContainer) {
      const items = this.optionalAuthorsContainer.querySelectorAll('.author-item');
      if (items.length > 1) {
        items.forEach((item, index) => {
          if (index > 0) item.remove();
        });
      }
    }
    
    this.updateMARC21();
  }

  /**
   * Rellena el select de CDU
   * @param {Array} cduList - Array de CDU
   */
  fillCDU(cduList) {
    if (!this.cduSelect) return;

    const defaultOption = this.cduSelect.querySelector('option[value=""]');
    this.cduSelect.innerHTML = '';
    
    if (defaultOption) {
      this.cduSelect.appendChild(defaultOption);
    }

    cduList.forEach(cdu => {
      const option = document.createElement('option');
      option.value = cdu.code || cdu.id;
      option.textContent = cdu.code + ' - ' + (cdu.name || cdu.description);
      this.cduSelect.appendChild(option);
    });
  }

  /**
   * Actualiza la vista previa de MARC21
   */
  updateMARC21() {
    const formData = this.getFormData();
    if (this.onUpdateMARC21Callback) {
      this.onUpdateMARC21Callback(formData);
    }
  }

  /**
   * Muestra MARC21 formateado
   * @param {Object} marc21Data - Datos MARC21
   */
  showMARC21(marc21Data) {
    if (!this.marc21Output) return;

    if (!marc21Data || marc21Data.fields.length === 0) {
      this.marc21Output.textContent = 'Completa el formulario para ver la traducción a MARC21';
      return;
    }

    let marc21Text = '';
    marc21Data.fields.forEach(field => {
      marc21Text += `${field.tag} ${field.ind1}${field.ind2}`;
      if (field.subfields && field.subfields.length > 0) {
        field.subfields.forEach(sf => {
          marc21Text += ` $${sf.code} ${sf.value}`;
        });
      }
      marc21Text += '\n';
    });

    this.marc21Output.textContent = marc21Text.trim() || 'Sin datos MARC21 para mostrar';
  }

  /**
   * Copia MARC21 al portapapeles
   */
  copyMARC21ToClipboard() {
    if (!this.marc21Output) return;

    const text = this.marc21Output.textContent;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = this.copyMarcBtn.textContent;
      this.copyMarcBtn.textContent = '✓ Copiado';
      setTimeout(() => {
        this.copyMarcBtn.textContent = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }

  /**
   * Muestra errores de validación
   * @param {Object} errors - Objeto con errores por campo
   */
  showErrors(errors) {
    this.clearErrors();

    const fieldMap = {
      'title': 'bookTitle',
      'author': 'bookAuthor',
      'cdu': 'bookCDU'
    };

    Object.entries(errors).forEach(([field, message]) => {
      const elementId = fieldMap[field] || `book${field.charAt(0).toUpperCase() + field.slice(1)}`;
      const input = document.getElementById(elementId);
      
      if (input) {
        input.classList.add('form-input--error');
        
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = message;
        input.parentElement?.appendChild(errorEl);
      }
    });
  }

  /**
   * Limpia los errores de validación
   */
  clearErrors() {
    const errorElements = this.modal?.querySelectorAll('.form-error');
    errorElements?.forEach(el => el.remove());

    const errorInputs = this.modal?.querySelectorAll('.form-input--error');
    errorInputs?.forEach(el => el.classList.remove('form-input--error'));
  }

  /**
   * Muestra un mensaje de éxito
   * @param {string} message - Mensaje a mostrar
   */
  showSuccessMessage(message) {
    console.log('✅ [Admin]', message);
    alert(message);
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje a mostrar
   */
  showErrorMessage(message) {
    console.error('❌ [Admin]', message);
    alert('Error: ' + message);
  }

  /**
   * Habilita/deshabilita el botón de envío
   * @param {boolean} enabled - Estado
   */
  setSubmitButtonEnabled(enabled) {
    const submitBtn = this.form?.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !enabled;
      submitBtn.textContent = enabled ? 'Guardar Alta (Admin)' : 'Guardando alta...';
    }
  }
}
