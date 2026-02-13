// Funcionalidad para la galería de productos

document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const productosGrid = document.getElementById('productosGrid');
    const searchInput = document.getElementById('searchInput');
    const filtersContainer = document.getElementById('filtersContainer');
    const productCount = document.getElementById('productCount');
    const noProductsMessage = document.getElementById('noProductsMessage');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // Variables globales
    let allProducts = [];
    let filteredProducts = [];
    let currentFilter = 'todos';
    let currentSearch = '';
    let availableTypes = new Set();
    
    // Inicializar
    init();
    
    // Función de inicialización
    function init() {
        loadProducts();
        setupEventListeners();
    }
    
    // Cargar productos desde la API
    function loadProducts() {
        // Mostrar spinner de carga
        productosGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-success" role="status">
                    <span class="visually-hidden">Cargando productos...</span>
                </div>
                <p class="mt-3">Cargando productos...</p>
            </div>
        `;
        
        // Hacer petición a la API
        fetch('/producto/obtener_productos')
            .then(response => response.json())
            .then(data => {
                if (data.success && data.productos) {
                    allProducts = data.productos;
                    filteredProducts = [...allProducts];
                    
                    // Extraer tipos únicos de productos
                    extractUniqueTypes();
                    
                    // Generar filtros dinámicamente
                    generateDynamicFilters();
                    
                    updateProductDisplay();
                    updateProductCount();
                } else {
                    showError('No se pudieron cargar los productos');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Error al cargar los productos');
            });
    }
    
    // Extraer tipos únicos de productos
    function extractUniqueTypes() {
        availableTypes.clear();
        availableTypes.add('todos'); // Siempre incluir "todos"
        
        allProducts.forEach(product => {
            if (product.tipo && product.tipo.trim() !== '') {
                // Normalizar el tipo (minúsculas, sin espacios extra)
                const normalizedType = product.tipo.toLowerCase().trim();
                availableTypes.add(normalizedType);
            }
        });
    }
    
    // Generar filtros dinámicamente
    function generateDynamicFilters() {
        if (!filtersContainer) return;
        
        // Mantener el botón "Todos"
        const allButton = filtersContainer.querySelector('[data-filter="todos"]');
        filtersContainer.innerHTML = '';
        filtersContainer.appendChild(allButton);
        
        // Crear botones para cada tipo único
        const typesArray = Array.from(availableTypes)
            .filter(type => type !== 'todos')
            .sort();
        
        typesArray.forEach(type => {
            // Capitalizar primera letra para mostrar
            const displayName = type.charAt(0).toUpperCase() + type.slice(1);
            
            const button = document.createElement('button');
            button.className = 'btn btn-outline-success filter-btn';
            button.setAttribute('data-filter', type);
            button.textContent = displayName;
            
            button.addEventListener('click', function() {
                // Remover clase active de todos los botones
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Agregar clase active al botón clickeado
                this.classList.add('active');
                // Actualizar filtro
                currentFilter = this.getAttribute('data-filter');
                applyFilters();
            });
            
            filtersContainer.appendChild(button);
        });
        
        // Si solo hay "todos" como filtro, mostrar mensaje
        if (typesArray.length === 0) {
            const infoSpan = document.createElement('span');
            infoSpan.className = 'text-muted ms-3';
            infoSpan.textContent = 'No hay tipos de productos definidos';
            filtersContainer.appendChild(infoSpan);
        }
    }
    
    // Configurar event listeners
    function setupEventListeners() {
        // Event listener para búsqueda
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                currentSearch = this.value.toLowerCase();
                applyFilters();
            });
        }
        
        // Event listener para resetear filtros
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', function() {
                resetFilters();
            });
        }
        
        // Event listener para el botón "todos" (ya existente en el HTML)
        const todosButton = document.querySelector('[data-filter="todos"]');
        if (todosButton) {
            todosButton.addEventListener('click', function() {
                // Remover clase active de todos los botones
                document.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Agregar clase active al botón "todos"
                this.classList.add('active');
                // Actualizar filtro
                currentFilter = 'todos';
                applyFilters();
            });
        }
    }
    
    // Aplicar filtros
    function applyFilters() {
        filteredProducts = allProducts.filter(product => {
            // Filtrar por categoría
            let matchesFilter = true;
            if (currentFilter !== 'todos') {
                const tipo = product.tipo ? product.tipo.toLowerCase().trim() : '';
                matchesFilter = tipo === currentFilter;
            }
            
            // Filtrar por búsqueda
            let matchesSearch = true;
            if (currentSearch.trim() !== '') {
                const nombre = product.nombre ? product.nombre.toLowerCase() : '';
                const variedad = product.variedad ? product.variedad.toLowerCase() : '';
                const descripcion = product.descripcion ? product.descripcion.toLowerCase() : '';
                const tipo = product.tipo ? product.tipo.toLowerCase() : '';
                
                matchesSearch = nombre.includes(currentSearch) || 
                               variedad.includes(currentSearch) || 
                               descripcion.includes(currentSearch) ||
                               tipo.includes(currentSearch);
            }
            
            return matchesFilter && matchesSearch;
        });
        
        updateProductDisplay();
        updateProductCount();
    }
    
    // Resetear filtros
    function resetFilters() {
        // Resetear búsqueda
        if (searchInput) {
            searchInput.value = '';
            currentSearch = '';
        }
        
        // Resetear filtros de botones
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.getAttribute('data-filter') === 'todos') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        currentFilter = 'todos';
        filteredProducts = [...allProducts];
        updateProductDisplay();
        updateProductCount();
    }
    
    // Actualizar display de productos
    function updateProductDisplay() {
        if (filteredProducts.length === 0) {
            // Mostrar mensaje de no productos
            productosGrid.innerHTML = '';
            noProductsMessage.classList.remove('d-none');
            return;
        }
        
        // Ocultar mensaje de no productos
        noProductsMessage.classList.add('d-none');
        
        // Generar HTML para los productos
        let productsHTML = '';
        
        filteredProducts.forEach(product => {
            // Obtener imagen del producto
            const imageUrl = product.foto_producto ? 
                `/static/images/producto/${product.foto_producto}` : 
                '/static/images/producto/producto-default.jpg';
            
            // Formatear descripción
            const description = product.descripcion || 'Sin descripción disponible';
            const shortDescription = description.length > 100 ? 
                description.substring(0, 100) + '...' : description;
            
            // Determinar clase de estado
            const estadoClass = product.estado_producto === 'ACTIVO' ? 'estado-activo' : 'estado-inactivo';
            const estadoText = product.estado_producto === 'ACTIVO' ? 'Disponible' : 'No Disponible';
            
            // Formatear temperatura y humedad
            const temperatura = product.temperatura_optima ? 
                `${product.temperatura_optima}°C` : 'No especificado';
            
            const humedad = product.humedad_optima ? 
                `${product.humedad_optima}%` : 'No especificado';
            
            // Obtener tipo para el badge (usar tipo o variedad si tipo está vacío)
            const badgeType = product.tipo || product.variedad || 'Producto';
            
            productsHTML += `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <div class="producto-card">
                        <div class="producto-img-container">
                            <img src="${imageUrl}" 
                                 alt="${product.nombre}" 
                                 class="producto-img"
                                 onerror="this.src='/static/images/producto/producto-default.jpg'">
                            <span class="producto-badge">${badgeType}</span>
                        </div>
                        <div class="producto-content">
                            <h3 class="producto-title">${product.nombre}</h3>
                            <p class="producto-description">${shortDescription}</p>
                            
                            <div class="producto-info">
                                <span class="producto-tipo">${product.variedad || 'Sin variedad'}</span>
                                <span class="producto-cantidad">${product.cant_productos_act || 0} unidades</span>
                            </div>
                            
                            <div class="mb-3">
                                <span class="producto-estado ${estadoClass}">${estadoText}</span>
                            </div>
                            
                            <button class="producto-btn" onclick="showProductDetails(${product.producto_id})">
                                <i class="fas fa-eye me-2"></i>Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        productosGrid.innerHTML = productsHTML;
    }
    
    // Actualizar contador de productos
    function updateProductCount() {
        if (productCount) {
            productCount.textContent = filteredProducts.length;
        }
    }
    
    // Mostrar error
    function showError(message) {
        productosGrid.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-4"></i>
                <h4 class="text-danger mb-3">Error</h4>
                <p class="text-muted">${message}</p>
                <button class="btn btn-success" onclick="location.reload()">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>
        `;
    }
});

// Función global para mostrar detalles del producto
function showProductDetails(productId) {
    // Mostrar spinner en el modal
    document.getElementById('modalProductImage').src = '';
    document.getElementById('modalProductName').textContent = 'Cargando...';
    document.getElementById('modalProductDescription').textContent = '';
    document.getElementById('modalProductTemp').textContent = '';
    document.getElementById('modalProductHumidity').textContent = '';
    document.getElementById('modalProductQuantity').textContent = '';
    document.getElementById('modalProductStatus').textContent = '';
    document.getElementById('modalProductType').textContent = '';
    document.getElementById('modalProductVariety').textContent = '';
    
    // Obtener detalles del producto
    fetch(`/producto/obtener_producto_xid/${productId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.producto) {
                const product = data.producto;
                
                // Obtener imagen
                const imageUrl = product.foto_producto ? 
                    `/static/images/producto/${product.foto_producto}` : 
                    '/static/images/producto/producto-default.jpg';
                
                // Actualizar modal
                document.getElementById('modalProductImage').src = imageUrl;
                document.getElementById('modalProductImage').onerror = function() {
                    this.src = '/static/images/producto/producto-default.jpg';
                };
                
                document.getElementById('modalProductName').textContent = product.nombre;
                document.getElementById('modalProductDescription').textContent = product.descripcion || 'Sin descripción disponible';
                document.getElementById('modalProductTemp').textContent = product.temperatura_optima ? 
                    `${product.temperatura_optima}°C` : 'No especificado';
                document.getElementById('modalProductHumidity').textContent = product.humedad_optima ? 
                    `${product.humedad_optima}%` : 'No especificado';
                document.getElementById('modalProductQuantity').textContent = product.cant_productos_act || 0;
                document.getElementById('modalProductStatus').textContent = product.estado_producto === 'ACTIVO' ? 'Disponible' : 'No Disponible';
                document.getElementById('modalProductType').textContent = product.tipo || 'Producto';
                document.getElementById('modalProductVariety').textContent = product.variedad || 'Sin variedad';
                
                // Mostrar modal
                const modal = new bootstrap.Modal(document.getElementById('productoModal'));
                modal.show();
                
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'No se pudo cargar la información del producto'
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar la información del producto'
            });
        });
}

// Manejar error en carga de imágenes
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && (e.target.classList.contains('producto-img') || e.target.id === 'modalProductImage')) {
        e.target.src = '/static/images/producto/producto-default.jpg';
    }
}, true);