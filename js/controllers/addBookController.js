/**
 * Controlador de Alta de Libro (Panel de Administracion) - Orquestación de lógica
 * Coordina entre AddBookState, LibroService y AddBookRenderer
 * Maneja la lógica de negocio para alta de nuevos libros desde administración
 */

class AddBookController {
  /**
   * Constructor
   * @param {AddBookState} state - Instancia de AddBookState
   * @param {LibroService} service - Instancia de LibroService
   * @param {AddBookRenderer} renderer - Instancia de AddBookRenderer
   */
  constructor(state, service, renderer) {
    this.state = state;
    this.service = service;
    this.renderer = renderer;

    this.init();
  }

  /**
   * Inicialización del controlador
   */
  init() {
    try {
      console.log('🚀 Inicializando controlador de alta de libro (admin)...');

      // Configurar event listeners
      this.setupEventListeners();

      console.log('✅ Controlador de alta de libro (admin) inicializado');
    } catch (error) {
      console.error('❌ Error al inicializar el controlador:', error);
      this.renderer.showErrorMessage('Error al inicializar el formulario');
    }
  }

  /**
   * Configura los event listeners
   */
  setupEventListeners() {
    // Apertura del modal
    this.renderer.onOpenModal(() => {
      this.handleOpenModal();
    });

    // Cierre del modal
    this.renderer.onCloseModal(() => {
      this.handleCloseModal();
    });

    // Envío del formulario
    this.renderer.onSubmit((formData) => {
      this.handleSubmit(formData);
    });

    // Actualización de MARC21
    this.renderer.onUpdateMARC21((formData) => {
      this.handleUpdateMARC21(formData);
    });

    // Cargar CDU
    this.renderer.onLoadCategories(() => {
      this.loadCDU();
    });
  }

  /**
   * Maneja la apertura del modal
   */
  async handleOpenModal() {
    console.log('📖 Abriendo modal de alta de libro (admin)');
    
    // Cargar CDU si aún no está cargada
    if (this.state.getCDUList().length === 0) {
      await this.loadCDU();
    } else {
      // Si ya están cargadas, solo llenar el select
      this.renderer.fillCDU(this.state.getCDUList());
    }
  }

  /**
   * Maneja el cierre del modal
   */
  handleCloseModal() {
    console.log('❌ Cerrando modal de alta de libro (admin)');
    this.state.reset();
    this.renderer.clearErrors();
  }

  /**
   * Carga la lista de CDU disponibles
   */
  async loadCDU() {
    try {
      console.log('📚 Cargando CDU...');
      
      // Crear CDU de ejemplo (en producción vendrían de la API)
      const cduList = [
        { code: '000', name: 'Generalidades', description: 'Generalidades, Informática' },
        { code: '100', name: 'Filosofía y psicología', description: 'Filosofía, Epistemología, Ontología' },
        { code: '200', name: 'Religión', description: 'Religión, Teología, Espiritualidad' },
        { code: '300', name: 'Ciencias sociales', description: 'Sociología, Antropología, Política' },
        { code: '400', name: 'Lengua', description: 'Filología, Lingüística, Lenguas' },
        { code: '500', name: 'Ciencias naturales', description: 'Matemáticas, Física, Biología' },
        { code: '600', name: 'Tecnología', description: 'Ingeniería, Informática, Tecnología aplicada' },
        { code: '700', name: 'Artes', description: 'Artes visuales, Música, Literatura' },
        { code: '800', name: 'Literatura', description: 'Bellas letras, Narrativa, Poesía' },
        { code: '900', name: 'Historia y geografía', description: 'Historia, Geografía, Biografías' }
      ];
      
      // En un futuro, esto vendría de la API:
      // const cduList = await this.service.loadCDU();
      
      // Guardar en estado
      this.state.setCDUList(cduList);
      
      // Mostrar en el select
      this.renderer.fillCDU(cduList);
      
      console.log('✅ CDU cargadas:', cduList.length);
    } catch (error) {
      console.error('❌ Error al cargar CDU:', error);
      this.renderer.showErrorMessage('No se pudieron cargar las clasificaciones CDU');
    }
  }

  /**
   * Maneja la actualización de MARC21
   * @param {Object} formData - Datos del formulario
   */
  handleUpdateMARC21(formData) {
    try {
      // Actualizar datos en el estado
      this.state.setFormData(formData);
      
      // Generar MARC21
      const marc21 = this.state.generateMARC21();
      
      // Mostrar en la UI
      this.renderer.showMARC21(marc21);
    } catch (error) {
      console.error('❌ Error al generar MARC21:', error);
    }
  }

  /**
   * Maneja el envío del formulario
   * @param {Object} formData - Datos del formulario
   */
  async handleSubmit(formData) {
    try {
      console.log('📝 Enviando formulario de alta (admin)...');

      // Actualizar estado del formulario
      this.state.setFormData(formData);

      // Validar datos
      if (!this.state.validate()) {
        const errors = this.state.getErrors();
        console.warn('⚠️ Errores de validación:', errors);
        this.renderer.showErrors(errors);
        return;
      }

      // Limpiar errores previos
      this.renderer.clearErrors();

      // Deshabilitar botón de envío
      this.state.setIsSubmitting(true);
      this.renderer.setSubmitButtonEnabled(false);

      // Generar MARC21 final
      const marc21 = this.state.generateMARC21();
      const dataToSend = {
        ...this.state.getFormData(),
        marc21: marc21,
        origenPanel: 'administracion'
      };

      // Enviar datos al servidor
      const response = await this.service.createLibro(dataToSend);

      if (response) {
        console.log('✅ Libro dado de alta exitosamente (admin):', response);
        this.renderer.showSuccessMessage('Libro dado de alta correctamente desde administración');
        
        // Cerrar modal después de un pequeño delay
        setTimeout(() => {
          this.renderer.closeModal();
          this.state.reset();
          
          // Disparar evento para actualizar el catálogo
          window.dispatchEvent(new Event('bookAdded'));
        }, 1000);
      }

    } catch (error) {
      console.error('❌ Error al dar de alta el libro (admin):', error);
      this.renderer.showErrorMessage(error.message || 'Error al dar de alta el libro desde administración. Intenta de nuevo.');
    } finally {
      // Habilitar botón de envío
      this.state.setIsSubmitting(false);
      this.renderer.setSubmitButtonEnabled(true);
    }
  }
}
