/**
 * Estado de Agregar Libro - Gestión de datos del formulario
 * Mantiene el estado del formulario y validación
 */

class AddBookState {
  constructor() {
    // Formulario
    this.formData = {
      title: '',
      informativeTitle: '',
      otherTitles: [],
      author: '',
      optionalAuthors: [],
      collaborators: [],
      cdu: '',
    };

    // Lista de categorías disponibles
    this.categories = [];

    // Lista de CDU disponibles
    this.cduList = [];

    // Estado de carga
    this.isSubmitting = false;

    // Errores de validación
    this.errors = {};

    // MARC21 generado
    this.marc21Data = null;
  }

  /**
   * Establece los datos del formulario
   * @param {Object} data - Datos del formulario
   */
  setFormData(data) {
    this.formData = { ...this.formData, ...data };
  }

  /**
   * Obtiene los datos del formulario
   * @returns {Object} Datos del formulario
   */
  getFormData() {
    return { ...this.formData };
  }

  /**
   * Establece las categorías disponibles
   * @param {Array} categories - Lista de categorías
   */
  setCategories(categories) {
    this.categories = categories || [];
  }

  /**
   * Obtiene las categorías disponibles
   * @returns {Array} Lista de categorías
   */
  getCategories() {
    return [...this.categories];
  }

  /**
   * Establece la lista de CDU disponibles
   * @param {Array} cduList - Lista de CDU
   */
  setCDUList(cduList) {
    this.cduList = cduList || [];
  }

  /**
   * Obtiene la lista de CDU disponibles
   * @returns {Array} Lista de CDU
   */
  getCDUList() {
    return [...this.cduList];
  }

  /**
   * Establece errores de validación
   * @param {Object} errors - Objeto con errores por campo
   */
  setErrors(errors) {
    this.errors = errors || {};
  }

  /**
   * Obtiene errores de validación
   * @returns {Object} Objeto con errores
   */
  getErrors() {
    return { ...this.errors };
  }

  /**
   * Establece estado de envío
   * @param {boolean} isSubmitting - Estado de envío
   */
  setIsSubmitting(isSubmitting) {
    this.isSubmitting = isSubmitting;
  }

  /**
   * Obtiene estado de envío
   * @returns {boolean}
   */
  getIsSubmitting() {
    return this.isSubmitting;
  }

  /**
   * Establece datos MARC21 generados
   * @param {Object} marc21Data - Objeto MARC21
   */
  setMARC21Data(marc21Data) {
    this.marc21Data = marc21Data;
  }

  /**
   * Obtiene datos MARC21
   * @returns {Object} Objeto MARC21
   */
  getMARC21Data() {
    return this.marc21Data;
  }

  /**
   * Resetea el estado al inicial
   */
  reset() {
    this.formData = {
      title: '',
      informativeTitle: '',
      otherTitles: [],
      author: '',
      optionalAuthors: [],
      collaborators: [],
      cdu: '',
    };
    this.errors = {};
    this.isSubmitting = false;
    this.marc21Data = null;
  }

  /**
   * Valida los datos del formulario
   * @returns {boolean} True si es válido
   */
  validate() {
    this.errors = {};

    // Título
    if (!this.formData.title || this.formData.title.trim() === '') {
      this.errors.title = 'El título es requerido';
    } else if (this.formData.title.length < 3) {
      this.errors.title = 'El título debe tener al menos 3 caracteres';
    }

    // Autor
    if (!this.formData.author || this.formData.author.trim() === '') {
      this.errors.author = 'El autor es requerido';
    } else if (this.formData.author.length < 2) {
      this.errors.author = 'El nombre del autor debe tener al menos 2 caracteres';
    }

    // CDU
    if (!this.formData.cdu) {
      this.errors.cdu = 'Debes seleccionar una clasificación CDU';
    }

    return Object.keys(this.errors).length === 0;
  }

  /**
   * Genera datos MARC21 basado en los datos del formulario
   */
  generateMARC21() {
    const data = this.getFormData();
    
    const marc21 = {
      fields: []
    };

    // Campo 245 - Información del Título
    if (data.title) {
      marc21.fields.push({
        tag: '245',
        ind1: ' ',
        ind2: '0',
        subfields: [
          { code: 'a', value: data.title },
          ...(data.informativeTitle ? [{ code: 'b', value: data.informativeTitle }] : [])
        ]
      });
    }

    // Campo 100 - Autor principal
    if (data.author) {
      marc21.fields.push({
        tag: '100',
        ind1: '1',
        ind2: ' ',
        subfields: [
          { code: 'a', value: data.author }
        ]
      });
    }

    // Campo 700 - Autores opcionales/colaboradores
    const allContributors = [...data.optionalAuthors, ...data.collaborators].filter(a => a && a.trim());
    allContributors.forEach(contributor => {
      marc21.fields.push({
        tag: '700',
        ind1: '1',
        ind2: ' ',
        subfields: [
          { code: 'a', value: contributor }
        ]
      });
    });

    // Campo 650 - CDU/Temas
    if (data.cdu) {
      marc21.fields.push({
        tag: '650',
        ind1: ' ',
        ind2: '0',
        subfields: [
          { code: 'a', value: data.cdu }
        ]
      });
    }

    // Campo 246 - Otros títulos
    if (data.otherTitles && data.otherTitles.length > 0) {
      data.otherTitles.forEach(otherTitle => {
        if (otherTitle && otherTitle.trim()) {
          marc21.fields.push({
            tag: '246',
            ind1: '3',
            ind2: ' ',
            subfields: [
              { code: 'a', value: otherTitle }
            ]
          });
        }
      });
    }

    this.setMARC21Data(marc21);
    return marc21;
  }
}
