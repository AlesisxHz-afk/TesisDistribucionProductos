// index.js - JavaScript principal para Agrícola Alaya S.A.C - MODIFICADO

// ===== VARIABLES GLOBALES =====
let currentProductIndex = 0;
let productsPerView = 3;
let products = [];
let scrollObserver;
let productCarousel;
let totalSlides = 0;
let lastScrollTop = 0;
let mainHeader = null;
let navbar = null;
let topBar = null;
let isNavbarHidden = false;

// ===== CONTENIDO DE LOS MODALES =====
const modalContent = {
  'Sobre Nosotros': `
    <div class="modal-content-section">
      <h5><i class="fas fa-building me-2"></i>Nuestra Historia</h5>
      <p><strong>Agrícola Alaya S.A.C</strong> fue fundada en 2018 con la visión de convertirse en un referente 
      en la producción agrícola sostenible en la región Lambayeque. Desde nuestros humildes comienzos, hemos 
      crecido hasta convertirnos en una empresa líder en el sector agroindustrial.</p>
      
      <p>Nuestra pasión por la agricultura y el compromiso con la calidad nos han permitido establecer 
      relaciones duraderas con clientes en todo el Perú, ofreciendo productos frescos y de la más alta calidad.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-bullseye me-2"></i>Misión</h5>
      <p>Producir y comercializar productos agrícolas de excelente calidad, utilizando técnicas sostenibles 
      y tecnologías innovadoras que garanticen la satisfacción de nuestros clientes y contribuyan al desarrollo 
      económico de nuestra región.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-eye me-2"></i>Visión</h5>
      <p>Ser reconocidos como la empresa líder en producción agrícola sostenible en el norte del Perú, 
      destacándonos por nuestra innovación, calidad y compromiso con el medio ambiente y la comunidad.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-handshake me-2"></i>Nuestros Valores</h5>
      <ul class="legal-list">
        <li><strong>Calidad:</strong> Nos esforzamos por ofrecer productos de la más alta calidad</li>
        <li><strong>Sostenibilidad:</strong> Implementamos prácticas agrícolas responsables con el medio ambiente</li>
        <li><strong>Innovación:</strong> Adoptamos nuevas tecnologías para mejorar nuestros procesos</li>
        <li><strong>Compromiso:</strong> Con nuestros clientes, empleados y comunidad</li>
        <li><strong>Integridad:</strong> Actuamos con honestidad y transparencia en todas nuestras operaciones</li>
      </ul>
    </div>
  `,
  
  'Quiénes Somos': `
    <div class="modal-content-section">
      <h5><i class="fas fa-users me-2"></i>Nuestro Equipo</h5>
      <p>Contamos con un equipo de profesionales altamente capacitados en agronomía, ingeniería agrícola 
      y gestión empresarial. Nuestros especialistas tienen años de experiencia en el sector y están 
      comprometidos con la excelencia en cada etapa de nuestro proceso productivo.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-map-marked-alt me-2"></i>Nuestra Ubicación</h5>
      <p>Estamos ubicados estratégicamente en Olmos, Lambayeque, una zona privilegiada para la agricultura 
      gracias a su clima favorable y suelos fértiles. Contamos con instalaciones modernas y tecnología 
      de punta para garantizar la calidad de nuestros productos.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-leaf me-2"></i>Nuestros Cultivos</h5>
      <p>Especializados en el cultivo de productos agrícolas de alta calidad, utilizamos técnicas 
      sostenibles y respetuosas con el medio ambiente. Nuestro enfoque en la innovación nos permite 
      ofrecer productos frescos y nutritivos durante todo el año.</p>
    </div>
  `,
  
  'Atención al Cliente': `
    <div class="modal-content-section">
      <h5><i class="fas fa-headset me-2"></i>Canales de Atención</h5>
      <p>En Agrícola Alaya S.A.C, nuestro compromiso es brindar la mejor experiencia a nuestros clientes. 
      Estamos disponibles para atender sus consultas, sugerencias y necesidades a través de los siguientes canales:</p>
      
      <ul class="contact-info-list">
        <li>
          <i class="fas fa-phone-alt"></i>
          <strong>Teléfono:</strong> +51 984 134 872<br>
          <small>Lunes a Domingo: 7:00 AM - 10:00 PM</small>
        </li>
        <li>
          <i class="fas fa-envelope"></i>
          <strong>Correo Electrónico:</strong> avargas@agricolaalaya.com<br>
          <small>Respondemos en menos de 24 horas hábiles</small>
        </li>
        <li>
          <i class="fab fa-whatsapp"></i>
          <strong>WhatsApp:</strong> +51 984 134 872<br>
          <small>Atención rápida para consultas y pedidos</small>
        </li>
      </ul>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-clock me-2"></i>Horarios de Atención</h5>
      <ul class="legal-list">
        <li><strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM (Oficina)</li>
        <li><strong>Lunes a Domingo:</strong> 7:00 AM - 10:00 PM (Teléfono/WhatsApp)</li>
        <li><strong>Emergencias:</strong> Disponibles 24/7 para urgencias con nuestros cultivos</li>
      </ul>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-comments me-2"></i>Servicio al Cliente</h5>
      <p>Nuestro equipo de atención al cliente está capacitado para:</p>
      <ul class="legal-list">
        <li>Responder consultas sobre nuestros productos</li>
        <li>Asesorar en la selección de cultivos</li>
        <li>Gestionar pedidos especiales</li>
        <li>Recibir sugerencias y comentarios</li>
        <li>Resolver cualquier inquietud o problema</li>
      </ul>
    </div>
  `,
  
  'Términos y Condiciones': `
    <div class="modal-content-section">
      <h5><i class="fas fa-gavel me-2"></i>Condiciones Generales</h5>
      <p>Al utilizar nuestros servicios y realizar pedidos con Agrícola Alaya S.A.C, usted acepta los siguientes términos y condiciones:</p>
      
      <ol class="legal-list">
        <li><strong>Pedidos y Confirmación:</strong> Todos los pedidos están sujetos a disponibilidad de producto. La confirmación del pedido se realizará una vez verificada la existencia del producto solicitado.</li>
        <li><strong>Precios:</strong> Los precios están expresados en soles peruanos (S/) e incluyen IGV. Nos reservamos el derecho de modificar los precios sin previo aviso, excepto para pedidos ya confirmados.</li>
        <li><strong>Formas de Pago:</strong> Aceptamos transferencias bancarias, depósitos y otros métodos de pago que se anuncien en nuestro sitio web o sean comunicados directamente.</li>
        <li><strong>Entregas:</strong> Los tiempos de entrega son estimados y pueden variar según condiciones climáticas, disponibilidad y ubicación del cliente. Realizamos entregas principalmente en la región Lambayeque y zonas aledañas.</li>
      </ol>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-exchange-alt me-2"></i>Devoluciones y Garantías</h5>
      <ol class="legal-list">
        <li><strong>Garantía de Calidad:</strong> Garantizamos la calidad y frescura de todos nuestros productos al momento de la entrega.</li>
        <li><strong>Devoluciones:</strong> Aceptamos devoluciones dentro de las 24 horas posteriores a la entrega, siempre que el producto presente defectos de calidad o no corresponda con lo pedido.</li>
        <li><strong>Reclamos:</strong> Para realizar un reclamo, contacte a nuestro servicio al cliente dentro de las 48 horas posteriores a la entrega.</li>
      </ol>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-exclamation-triangle me-2"></i>Responsabilidades</h5>
      <ol class="legal-list">
        <li><strong>Fuerza Mayor:</strong> No nos hacemos responsables por retrasos o incumplimientos causados por eventos de fuerza mayor como desastres naturales, condiciones climáticas extremas, huelgas o eventos fuera de nuestro control.</li>
        <li><strong>Uso de la Información:</strong> Toda la información proporcionada en nuestro sitio web es para fines informativos. Nos esforzamos por mantenerla actualizada, pero no garantizamos su exactitud completa.</li>
        <li><strong>Modificaciones:</strong> Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones serán efectivas inmediatamente después de su publicación en nuestro sitio web.</li>
      </ol>
    </div>
  `,
  
  'Política de Privacidad': `
    <div class="modal-content-section">
      <h5><i class="fas fa-shield-alt me-2"></i>Protección de Datos Personales</h5>
      <p>En Agrícola Alaya S.A.C nos comprometemos a proteger la privacidad de nuestros clientes y usuarios. 
      Esta política describe cómo recopilamos, usamos y protegemos su información personal.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-database me-2"></i>Información que Recopilamos</h5>
      <p>Podemos recopilar la siguiente información cuando usted interactúa con nosotros:</p>
      <ul class="legal-list">
        <li><strong>Información de contacto:</strong> Nombre, dirección, teléfono, correo electrónico</li>
        <li><strong>Información de identificación:</strong> DNI/RUC para fines de facturación</li>
        <li><strong>Información de transacciones:</strong> Historial de pedidos, preferencias de productos</li>
        <li><strong>Información de comunicación:</strong> Registro de consultas y correspondencia</li>
      </ul>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-user-check me-2"></i>Uso de la Información</h5>
      <p>Utilizamos su información personal para los siguientes fines:</p>
      <ol class="legal-list">
        <li>Procesar y entregar sus pedidos</li>
        <li>Brindarle atención al cliente y soporte</li>
        <li>Enviar información sobre nuestros productos y servicios (solo con su consentimiento)</li>
        <li>Cumplir con obligaciones legales y regulatorias</li>
        <li>Mejorar nuestros productos y servicios</li>
      </ol>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-lock me-2"></i>Seguridad de la Información</h5>
      <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal 
      contra accesos no autorizados, alteración, divulgación o destrucción.</p>
      
      <ul class="legal-list">
        <li>Acceso restringido a la información personal</li>
        <li>Sistemas de encriptación para datos sensibles</li>
        <li>Protocolos de seguridad para transferencia de datos</li>
        <li>Capacitación a nuestro personal en protección de datos</li>
      </ul>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-user-lock me-2"></i>Sus Derechos</h5>
      <p>Usted tiene derecho a:</p>
      <ul class="legal-list">
        <li>Acceder a su información personal</li>
        <li>Rectificar información inexacta o incompleta</li>
        <li>Solicitar la eliminación de sus datos personales</li>
        <li>Oponerse al tratamiento de sus datos para fines de marketing</li>
        <li>Retirar su consentimiento en cualquier momento</li>
      </ul>
      <p>Para ejercer estos derechos, contacte a: <strong>protecciondedatos@agricolaalaya.com</strong></p>
    </div>
  `,
  
  'Contáctanos': `
    <div class="modal-content-section">
      <h5><i class="fas fa-address-card me-2"></i>Información de Contacto</h5>
      <p>Estamos aquí para atenderle. Puede contactarnos a través de los siguientes medios:</p>
      
      <ul class="contact-info-list">
        <li>
          <i class="fas fa-map-marker-alt"></i>
          <strong>Dirección:</strong><br>
          Carretera Panamericana Norte Km 780<br>
          Olmos, Lambayeque - Perú
        </li>
        <li>
          <i class="fas fa-phone-alt"></i>
          <strong>Teléfonos:</strong><br>
          Oficina: +51 984 134 872<br>
          WhatsApp: +51 984 134 872
        </li>
        <li>
          <i class="fas fa-envelope"></i>
          <strong>Correos Electrónicos:</strong><br>
          General: info@agricolaalaya.com<br>
          Ventas: ventas@agricolaalaya.com<br>
          Director: avargas@agricolaalaya.com
        </li>
        <li>
          <i class="fas fa-clock"></i>
          <strong>Horarios de Atención:</strong><br>
          Oficina: Lunes a Viernes 8:00 AM - 6:00 PM<br>
          Teléfono: Lunes a Domingo 7:00 AM - 10:00 PM<br>
          Visitas: Solo con cita previa
        </li>
      </ul>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-comment-dots me-2"></i>Formulario de Contacto</h5>
      <p>Para consultas específicas, puede utilizar nuestro formulario de contacto en línea o escribirnos directamente a nuestro correo electrónico.</p>
      <p>Nos comprometemos a responder todas las consultas en un plazo máximo de 24 horas hábiles.</p>
    </div>
    
    <div class="modal-content-section">
      <h5><i class="fas fa-map-pin me-2"></i>Visítanos</h5>
      <p>Si desea visitar nuestras instalaciones, por favor coordine una cita previa a través de nuestro teléfono o correo electrónico. 
      Estaremos encantados de mostrarle nuestro trabajo y procesos.</p>
    </div>
  `
};

// ===== FUNCIONES PRINCIPALES =====

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Agrícola Alaya S.A.C - Inicializando...');
    
    // Obtener referencias a encabezado, navbar y top-bar
    mainHeader = document.querySelector('.main-header');
    navbar = document.querySelector('.navbar');
    topBar = document.querySelector('.top-bar');
    
    // Ajustar padding-top del body según la altura del encabezado fijo
    adjustBodyPadding();
    window.addEventListener('resize', adjustBodyPadding);
    
    // Verificar si estamos en la página de galería
    const isGaleriaPage = document.querySelector('.galeria-hero') !== null;
    
    // Inicializar todos los módulos
    initScrollEffects();
    initNavbarScroll();
    initScrollTopButton();
    initSmoothScroll();
    initCarouselAnimations();
    initFooterAnimations();
    initModals();
    
    // Solo cargar productos si NO estamos en la página de galería
    // (la galería tiene su propio sistema de carga)
    if (!isGaleriaPage) {
        loadProducts();
    }
});

/**
 * Ajustar el padding superior del body dinámicamente según la altura del encabezado fijo
 */
function adjustBodyPadding() {
    const header = document.querySelector('.main-header');
    if (header) {
        document.body.style.paddingTop = header.offsetHeight + 'px';
    }
}

/**
 * Manejo del scroll para mantener el encabezado siempre visible y fijo
 */
function initNavbarScroll() {
    const header = document.querySelector('.main-header') || navbar;
    if (!header) return;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // El encabezado se queda permanentemente arriba al bajar la página
        if (scrollTop > 20) {
            header.classList.add('scrolled');
            if (navbar) navbar.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
            if (navbar) navbar.classList.remove('scrolled');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

/**
 * Botón scroll to top
 */
function initScrollTopButton() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    
    if (!scrollBtn) return;
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    });
}

/**
 * Scroll suave al hacer clic
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                
                if (targetElement) {
                    smoothScrollTo(targetElement, 800);
                }
            }
        });
    });
}

/**
 * Scroll suave a elemento específico
 */
function smoothScrollTo(element, duration) {
    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 120;
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

/**
 * Función de easing para scroll suave
 */
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

/**
 * Función para scroll al inicio (llamada desde HTML)
 */
function scrollToTop() {
    // Mostrar navbar y top-bar antes de hacer scroll
    if (navbar && topBar && isNavbarHidden) {
        navbar.classList.remove('hidden');
        topBar.classList.remove('hidden');
        isNavbarHidden = false;
    }
    
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * Inicializar modales
 */
function initModals() {
    // Modal del mapa
    const openMapBtn = document.getElementById('openMapModal');
    if (openMapBtn) {
        openMapBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const mapModal = new bootstrap.Modal(document.getElementById('mapModal'));
            mapModal.show();
        });
    }
    
    // Enlaces de información en el footer
    document.querySelectorAll('.info-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
        });
    });
}

/**
 * Abrir modal de información
 */
function openInfoModal(title) {
    // Mostrar navbar y top-bar si están ocultos
    if (navbar && topBar && isNavbarHidden) {
        navbar.classList.remove('hidden');
        topBar.classList.remove('hidden');
        isNavbarHidden = false;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    const modalTitle = document.getElementById('infoModalLabel');
    const modalContentDiv = document.getElementById('modalContent');
    
    modalTitle.textContent = title;
    
    // Usar el contenido definido en el objeto modalContent
    modalContentDiv.innerHTML = modalContent[title] || `
        <div class="text-center py-5">
            <i class="fas fa-info-circle fa-3x text-success mb-3"></i>
            <h5>Información disponible próximamente</h5>
            <p class="text-muted">Estamos trabajando en actualizar esta sección.</p>
        </div>
    `;
    
    modal.show();
}

/**
 * Cargar productos desde la base de datos
 */
function loadProducts() {
    const carouselContainer = document.getElementById('productCarousel');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    
    if (!carouselContainer) {
        console.warn('Contenedor del carrusel no encontrado');
        return;
    }
    
    // Mostrar skeleton loader
    showSkeletonLoader(carouselContainer);
    
    // Hacer fetch a la API para obtener productos
    fetch('/producto/obtener_destacados?limit=8')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log('Productos recibidos:', data);
            
            if (data.success) {
                products = data.productos || [];
                console.log('Número de productos:', products.length);
                
                renderProducts(carouselContainer);
                renderIndicators(indicatorsContainer);
                
                // Mostrar mensaje si no hay productos
                if (products.length === 0) {
                    showNoProducts(carouselContainer);
                } else {
                    // Inicializar el carrusel
                    initProductCarousel();
                    // Inicializar animaciones para los productos cargados
                    setTimeout(() => {
                        initScrollEffects();
                    }, 100);
                }
            } else {
                throw new Error(data.message || 'Error al cargar productos');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showError(carouselContainer, 'Error al cargar productos. Por favor, intente nuevamente.');
        });
}

/**
 * Mostrar skeleton loader
 */
function showSkeletonLoader(container) {
    const skeletonHTML = `
        <div class="skeleton-item">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-line short"></div>
                <div class="skeleton-line medium"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
    `.repeat(4);
    
    container.innerHTML = skeletonHTML;
}

/**
 * Mostrar mensaje cuando no hay productos
 */
function showNoProducts(container) {
    container.innerHTML = `
        <div class="error-container w-100">
            <i class="fas fa-seedling fa-3x text-muted mb-4"></i>
            <h4 class="text-muted mb-3">No hay productos disponibles</h4>
            <p class="text-muted mb-4">Próximamente agregaremos nuevos productos</p>
        </div>
    `;
}

/**
 * Mostrar mensaje de error
 */
function showError(container, message) {
    container.innerHTML = `
        <div class="error-container w-100">
            <i class="fas fa-exclamation-triangle fa-3x text-warning mb-4"></i>
            <h4 class="text-muted mb-3">${message}</h4>
            <p class="text-muted mb-4">Por favor, intenta nuevamente más tarde</p>
            <button class="btn btn-success" onclick="loadProducts()">
                <i class="fas fa-redo me-2"></i>Reintentar
            </button>
        </div>
    `;
}

/**
 * Renderizar productos en el carrusel
 */
function renderProducts(container) {
    container.innerHTML = '';
    
    if (!products || products.length === 0) {
        showNoProducts(container);
        return;
    }
    
    console.log('Renderizando', products.length, 'productos');
    
    products.forEach((producto, index) => {
        const productItem = createProductItem(producto, index);
        container.appendChild(productItem);
    });
}

/**
 * Crear elemento de producto para el carrusel
 */
function createProductItem(producto, index) {
    const productDiv = document.createElement('div');
    productDiv.className = 'product-item animate-on-scroll';
    productDiv.style.transitionDelay = `${index * 100}ms`;
    productDiv.setAttribute('data-product-id', producto.producto_id);
    
    // Asegurar que la descripción no sea nula
    const descripcion = producto.descripcion || 'Producto agrícola de alta calidad';
    
    // Construir la ruta de la imagen
    const imagePath = `/static/images/producto/${producto.foto_producto || 'producto-default.jpg'}`;
    
    productDiv.innerHTML = `
        <div class="product-image">
            <img 
                src="${imagePath}" 
                alt="${producto.nombre}"
                loading="lazy"
                onerror="this.onerror=null; this.src='/static/images/producto/producto-default.jpg'"
            >
        </div>
        <div class="product-content">
            <h4 class="product-title">${producto.nombre}</h4>
            <p class="product-description">${descripcion}</p>
            
            <div class="product-info">
                <div class="info-item">
                    <i class="fas fa-thermometer-half text-primary"></i>
                    <span class="label">Temp</span>
                    <span class="value">${producto.temperatura_optima || 'N/A'}°C</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-tint text-info"></i>
                    <span class="label">Humedad</span>
                    <span class="value">${producto.humedad_optima || 'N/A'}%</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-box text-warning"></i>
                    <span class="label">Stock</span>
                    <span class="value">${producto.cant_productos_act || 0}</span>
                </div>
            </div>
        </div>
    `;
    
    // Agregar evento de clic para mostrar detalles
    productDiv.addEventListener('click', function() {
        showProductDetails(producto.producto_id);
    });
    
    return productDiv;
}

/**
 * Renderizar indicadores del carrusel
 */
function renderIndicators(container) {
    if (!container || products.length === 0) return;
    
    container.innerHTML = '';
    totalSlides = Math.ceil(products.length / productsPerView);
    
    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'carousel-indicator';
        if (i === 0) indicator.classList.add('active');
        
        indicator.addEventListener('click', function() {
            goToSlide(i);
        });
        
        container.appendChild(indicator);
    }
}

/**
 * Inicializar carrusel de productos
 */
function initProductCarousel() {
    const carousel = document.getElementById('productCarousel');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!carousel || products.length === 0) return;
    
    productCarousel = carousel;
    
    // Configurar controles
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            prevSlide();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            nextSlide();
        });
    }
    
    // Configurar responsividad
    updateProductsPerView();
    window.addEventListener('resize', updateProductsPerView);
    
    // Asegurar que el primer slide esté visible
    setTimeout(() => {
        goToSlide(0);
    }, 100);
}

/**
 * Actualizar productos por vista según el ancho de pantalla
 */
function updateProductsPerView() {
    const width = window.innerWidth;
    
    if (width < 576) {
        productsPerView = 1;
    } else if (width < 768) {
        productsPerView = 2;
    } else if (width < 992) {
        productsPerView = 2;
    } else {
        productsPerView = 3;
    }
    
    // Recalcular total de slides
    totalSlides = Math.ceil(products.length / productsPerView);
    
    // Actualizar indicadores
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (indicatorsContainer && products.length > 0) {
        renderIndicators(indicatorsContainer);
        updateActiveIndicator(currentProductIndex); // Mantener la posición actual
    }
}

/**
 * Ir a la siguiente diapositiva
 */
function nextSlide() {
    if (products.length <= productsPerView) return;
    
    const nextIndex = currentProductIndex + 1;
    currentProductIndex = nextIndex >= totalSlides ? totalSlides - 1 : nextIndex;
    goToSlide(currentProductIndex);
}

/**
 * Ir a la diapositiva anterior
 */
function prevSlide() {
    if (products.length <= productsPerView) return;
    
    const prevIndex = currentProductIndex - 1;
    currentProductIndex = prevIndex < 0 ? 0 : prevIndex;
    goToSlide(currentProductIndex);
}

/**
 * Ir a una diapositiva específica
 */
function goToSlide(slideIndex) {
    if (!productCarousel || products.length <= productsPerView) return;
    
    // Asegurar que el índice esté dentro de los límites
    if (slideIndex < 0) slideIndex = 0;
    if (slideIndex >= totalSlides) slideIndex = totalSlides - 1;
    
    // Calcular el ancho de un producto (incluyendo el gap)
    const productItem = productCarousel.querySelector('.product-item');
    if (!productItem) return;
    
    const productWidth = productItem.offsetWidth;
    const gap = 25;
    
    // Calcular la posición de desplazamiento exacta
    const scrollPosition = slideIndex * (productWidth + gap) * productsPerView;
    
    // Aplicar el desplazamiento con animación
    productCarousel.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
    
    // Actualizar indicador activo
    updateActiveIndicator(slideIndex);
    currentProductIndex = slideIndex;
}

/**
 * Actualizar indicador activo
 */
function updateActiveIndicator(activeIndex) {
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach((indicator, index) => {
        if (index === activeIndex) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}

/**
 * Mostrar detalles del producto - MODIFICADO para imagen centrada
 */
function showProductDetails(productId) {
    // Mostrar navbar y top-bar si están ocultos
    if (navbar && topBar && isNavbarHidden) {
        navbar.classList.remove('hidden');
        topBar.classList.remove('hidden');
        isNavbarHidden = false;
    }
    
    fetch(`/producto/obtener_producto_xid/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const producto = data.producto;
                
                Swal.fire({
                    title: `<h4 class="text-success mb-3">${producto.nombre}</h4>`,
                    html: `
                        <div class="text-start">
                            <!-- MODIFICADO: Imagen centrada -->
                            <div class="text-center mb-4" style="display: flex; justify-content: center; align-items: center; min-height: 200px;">
                                <img src="/static/images/producto/${producto.foto_producto || 'producto-default.jpg'}" 
                                     class="img-fluid rounded" 
                                     style="max-height: 200px; max-width: 100%; display: block; margin: 0 auto;"
                                     alt="${producto.nombre}"
                                     onerror="this.onerror=null; this.src='/static/images/producto/producto-default.jpg'">
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong><i class="fas fa-tag me-2"></i>Tipo:</strong> ${producto.tipo || 'N/A'}</p>
                                    <p><strong><i class="fas fa-leaf me-2"></i>Variedad:</strong> ${producto.variedad || 'N/A'}</p>
                                    <p><strong><i class="fas fa-thermometer-half me-2"></i>Temperatura óptima:</strong> ${producto.temperatura_optima || 'N/A'}°C</p>
                                </div>
                                <div class="col-md-6">
                                    <p><strong><i class="fas fa-tint me-2"></i>Humedad óptima:</strong> ${producto.humedad_optima || 'N/A'}%</p>
                                    <p><strong><i class="fas fa-box me-2"></i>Stock disponible:</strong> ${producto.cant_productos_act || 0}</p>
                                    <p><strong><i class="fas fa-info-circle me-2"></i>Estado:</strong> ${producto.estado_producto || 'Disponible'}</p>
                                </div>
                            </div>
                            <div class="mt-3">
                                <strong><i class="fas fa-align-left me-2"></i>Descripción:</strong>
                                <p class="mt-2 p-3 bg-light rounded">${producto.descripcion || 'Sin descripción disponible'}</p>
                            </div>
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Cerrar',
                    confirmButtonColor: '#2e7d32',
                    width: '700px',
                    showCloseButton: true,
                    customClass: {
                        popup: 'rounded-lg',
                        title: 'text-success'
                    }
                });
            } else {
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'No se pudieron cargar los detalles del producto',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error',
                text: 'No se pudo conectar con el servidor',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

/**
 * Efectos de scroll generales
 */
function initScrollEffects() {
    // Si ya existe un observer, desconectarlo primero
    if (scrollObserver) {
        scrollObserver.disconnect();
    }
    
    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observar todos los elementos con animación
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        scrollObserver.observe(el);
    });
}

/**
 * Animaciones del carrusel principal
 */
function initCarouselAnimations() {
    const carousel = document.querySelector('#carouselExample');
    if (carousel) {
        carousel.addEventListener('slide.bs.carousel', function() {
            const captions = this.querySelectorAll('.carousel-caption h1, .carousel-caption p');
            captions.forEach(caption => {
                caption.classList.remove('animate__fadeInDown', 'animate__fadeInUp');
                void caption.offsetWidth; // Trigger reflow
            });
        });
        
        carousel.addEventListener('slid.bs.carousel', function() {
            const activeCaption = this.querySelector('.carousel-item.active .carousel-caption');
            if (activeCaption) {
                const h1 = activeCaption.querySelector('h1');
                const p = activeCaption.querySelector('p');
                
                if (h1) {
                    h1.classList.add('animate__animated', 'animate__fadeInDown', 'animate__delay-1s');
                }
                if (p) {
                    p.classList.add('animate__animated', 'animate__fadeInUp', 'animate__delay-2s');
                }
            }
        });
    }
}

/**
 * Animaciones del footer
 */
function initFooterAnimations() {
    const footerIcons = document.querySelectorAll('.footer-top-box i.fa-leaf');
    footerIcons.forEach(icon => {
        icon.classList.add('float-animation');
    });
}

/**
 * Optimización de eventos scroll/resize
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimizar eventos
window.addEventListener('scroll', debounce(() => {
    // Actualizar efectos de scroll
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('show');
        } else {
            scrollBtn.classList.remove('show');
        }
    }
}, 100));

// Exportar funciones para uso global
window.scrollToTop = scrollToTop;
window.loadProducts = loadProducts;
window.openInfoModal = openInfoModal;

// Manejar carga de imágenes con error
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && e.target.src.includes('/static/images/producto/')) {
        console.log('Error cargando imagen:', e.target.src);
        e.target.src = '/static/images/producto/producto-default.jpg';
        e.target.onerror = null; // Prevenir bucles infinitos
    }
}, true);

// Actualizar productos por vista al cambiar tamaño de ventana
window.addEventListener('resize', debounce(() => {
    updateProductsPerView();
}, 250));

// Inicializar efectos de scroll para elementos existentes
setTimeout(initScrollEffects, 500);

// Agregar evento para detectar cuando se hace scroll manual en el carrusel
const carouselContainer = document.getElementById('productCarousel');
if (carouselContainer) {
    carouselContainer.addEventListener('scroll', debounce(() => {
        // Calcular qué slide está visible
        const scrollLeft = carouselContainer.scrollLeft;
        const productWidth = carouselContainer.querySelector('.product-item')?.offsetWidth || 320;
        const gap = 25;
        const slideWidth = (productWidth + gap) * productsPerView;
        const currentSlide = Math.round(scrollLeft / slideWidth);
        
        if (currentSlide !== currentProductIndex && currentSlide >= 0 && currentSlide < totalSlides) {
            updateActiveIndicator(currentSlide);
            currentProductIndex = currentSlide;
        }
    }, 150));
}

// Asegurar ajuste correcto de padding al terminar de cargar la ventana
window.addEventListener('load', adjustBodyPadding);