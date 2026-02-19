// Variables globales
let productosData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredProductos = [];
let searchTimeout = null;
let currentProducto = null;

// Función para cargar todos los productos
async function cargarProductos() {
    try {
        const tbody = document.getElementById('tabla-productos-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 30px; color: #40e0d0;"></i>
                        <p style="color: #a5d8ff; margin-top: 10px;">Cargando productos...</p>
                    </td>
                </tr>
            `;
        }

        // Usamos la ruta existente para obtener productos
        const response = await fetch('/producto/obtener_productos');
        if (!response.ok) {
            throw new Error('Error al cargar los productos');
        }
        
        const data = await response.json();
        if (data.success) {
            productosData = data.productos || [];
            filtrarProductos();
        } else {
            throw new Error(data.error || 'Error al cargar los productos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los productos');
        
        const tbody = document.getElementById('tabla-productos-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center" style="padding: 40px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px; color: #f87171;"></i>
                        <p style="color: #f87171; margin-top: 10px;">Error al cargar los productos</p>
                        <button class="btn btn-primary btn-sm" onclick="cargarProductos()">
                            <i class="fas fa-sync-alt"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(productos) {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-box-open"></i>
            <h4>No se encontraron productos</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar productos por nombre de A a Z
    const productosOrdenados = [...productos].sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, productosOrdenados.length);
    const paginatedProductos = productosOrdenados.slice(startIndex, endIndex);
    
    paginatedProductos.forEach(prod => {
        const tr = document.createElement('tr');
        
        // Celda de Nombre
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        tdNombre.textContent = prod.nombre || 'Sin nombre';
        tr.appendChild(tdNombre);
        
        // Celda de Tipo
        const tdTipo = document.createElement('td');
        tdTipo.className = 'text-left';
        tdTipo.textContent = prod.tipo || 'Sin tipo';
        tr.appendChild(tdTipo);
        
        // Celda de Variedad
        const tdVariedad = document.createElement('td');
        tdVariedad.className = 'text-left';
        tdVariedad.textContent = prod.variedad || 'Sin variedad';
        tr.appendChild(tdVariedad);
        
        // Celda de Cantidad Actual
        const tdCantidad = document.createElement('td');
        tdCantidad.className = 'text-left';
        const cantidadNum = parseFloat(prod.cant_productos_act) || 0;
        tdCantidad.innerHTML = `<strong>${cantidadNum.toFixed(2)} kg</strong>`;
        tr.appendChild(tdCantidad);
        
        // Celda de Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón Sumar (+)
        const btnSumar = document.createElement('button');
        btnSumar.className = 'btn btn-success btn-sm';
        btnSumar.innerHTML = '<i class="fas fa-plus"></i>';
        btnSumar.title = 'Sumar cantidad';
        btnSumar.onclick = () => abrirModalGestion(prod, 'sumar');
        divAcciones.appendChild(btnSumar);
        
        // Botón Restar (-)
        const btnRestar = document.createElement('button');
        btnRestar.className = 'btn btn-warning btn-sm';
        btnRestar.innerHTML = '<i class="fas fa-minus"></i>';
        btnRestar.title = 'Restar cantidad';
        btnRestar.onclick = () => abrirModalGestion(prod, 'restar');
        divAcciones.appendChild(btnRestar);
        
        // Botón Editar (lápiz)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-primary btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        btnEditar.title = 'Editar cantidad (sobrescribir)';
        btnEditar.onclick = () => abrirModalGestion(prod, 'editar');
        divAcciones.appendChild(btnEditar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(productos.length);
    actualizarControlesPaginacion(productos.length);
}

// Función para abrir el modal de gestión
function abrirModalGestion(producto, accion) {
    currentProducto = producto;
    
    // Llenar datos básicos del modal
    document.getElementById('modal-producto-id').value = producto.producto_id;
    document.getElementById('modal-producto-nombre').textContent = producto.nombre;
    document.getElementById('cantidad-actual').value = `${parseFloat(producto.cant_productos_act).toFixed(2)} kg`;
    document.getElementById('modal-accion').value = accion;
    
    // Configurar el modal según la acción
    const labelCantidadNueva = document.getElementById('label-cantidad-nueva');
    const grupoCantidadNueva = document.getElementById('grupo-cantidad-nueva');
    const grupoCantidadOperacion = document.getElementById('grupo-cantidad-operacion');
    const modalTitulo = document.getElementById('modal-titulo');
    
    // Ocultar todos los grupos primero
    grupoCantidadNueva.style.display = 'none';
    grupoCantidadOperacion.style.display = 'none';
    
    // Limpiar inputs
    document.getElementById('cantidad-nueva').value = '';
    document.getElementById('cantidad-operacion').value = '';
    
    if (accion === 'editar') {
        modalTitulo.innerHTML = `Editar Cantidad: <span id="modal-producto-nombre">${producto.nombre}</span>`;
        labelCantidadNueva.textContent = 'Nueva Cantidad (kg)';
        grupoCantidadNueva.style.display = 'block';
    } else if (accion === 'sumar') {
        modalTitulo.innerHTML = `Sumar Cantidad: <span id="modal-producto-nombre">${producto.nombre}</span>`;
        labelCantidadNueva.textContent = 'Cantidad a Añadir (kg)';
        grupoCantidadNueva.style.display = 'block';
    } else if (accion === 'restar') {
        modalTitulo.innerHTML = `Restar Cantidad: <span id="modal-producto-nombre">${producto.nombre}</span>`;
        labelCantidadNueva.textContent = 'Cantidad a Quitar (kg)';
        grupoCantidadNueva.style.display = 'block';
    }
    
    $('#modal-gestion-cantidad').modal('show');
}

// Función para guardar los cambios de cantidad
async function guardarCantidad() {
    const productoId = document.getElementById('modal-producto-id').value;
    const accion = document.getElementById('modal-accion').value;
    const cantidadActual = parseFloat(currentProducto.cant_productos_act) || 0;
    let nuevaCantidadGlobal;
    
    // Obtener el valor del input (usamos cantidad-nueva para todas las operaciones por simplicidad)
    const valorInput = document.getElementById('cantidad-nueva').value;
    
    if (!valorInput || valorInput.trim() === '') {
        mostrarError('Por favor ingrese una cantidad');
        return;
    }
    
    const valorNumerico = parseFloat(valorInput);
    if (isNaN(valorNumerico) || valorNumerico < 0) {
        mostrarError('Por favor ingrese una cantidad válida (debe ser un número positivo)');
        return;
    }
    
    // Calcular la nueva cantidad según la acción
    if (accion === 'sumar') {
        nuevaCantidadGlobal = cantidadActual + valorNumerico;
    } else if (accion === 'restar') {
        if (valorNumerico > cantidadActual) {
            mostrarError(`No se puede restar ${valorNumerico.toFixed(2)} kg porque la cantidad actual es solo ${cantidadActual.toFixed(2)} kg`);
            return;
        }
        nuevaCantidadGlobal = cantidadActual - valorNumerico;
    } else if (accion === 'editar') {
        nuevaCantidadGlobal = valorNumerico;
    } else {
        mostrarError('Acción no válida');
        return;
    }
    
    // Validar que la nueva cantidad no sea negativa
    if (nuevaCantidadGlobal < 0) {
        mostrarError('La cantidad resultante no puede ser negativa');
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Procesando...',
            text: 'Actualizando cantidad del producto',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#152a3a',
            color: '#e0f2fe'
        });
        
        // Usamos la ruta de actualizar producto
        // Primero obtenemos los datos actuales del producto para no perderlos
        const productoActual = currentProducto;
        
        const response = await fetch(`/producto/actualizar_producto/${productoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: productoActual.nombre,
                tipo: productoActual.tipo,
                variedad: productoActual.variedad,
                descripcion: productoActual.descripcion || '',
                temperatura_optima: productoActual.temperatura_optima,
                humedad_optima: productoActual.humedad_optima,
                cant_productos_act: nuevaCantidadGlobal,
                estado_producto: productoActual.estado_producto
            })
        });
        
        const data = await response.json();
        Swal.close();
        
        if (data.success) {
            // Cerrar el modal
            $('#modal-gestion-cantidad').modal('hide');
            
            // Mostrar mensaje de éxito
            await Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Cantidad actualizada exitosamente',
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0',
                timer: 1500,
                showConfirmButton: false
            });
            
            // Recargar la lista de productos
            cargarProductos();
        } else {
            throw new Error(data.error || 'Error al actualizar la cantidad');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Funciones de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 productos';
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} productos`;
}

function actualizarControlesPaginacion(totalItems) {
    totalPages = Math.ceil(totalItems / pageSize);
    
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    
    if (btnFirst) btnFirst.disabled = currentPage === 1 || totalPages === 0;
    if (btnPrev) btnPrev.disabled = currentPage === 1 || totalPages === 0;
    if (btnNext) btnNext.disabled = currentPage === totalPages || totalPages === 0;
    if (btnLast) btnLast.disabled = currentPage === totalPages || totalPages === 0;
    
    const pagesContainer = document.getElementById('pagination-pages');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = '';
    
    if (totalPages <= 1 || totalItems === 0) return;
    
    let startPage, endPage;
    
    if (totalPages <= 5) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 3) {
            startPage = 1;
            endPage = 5;
        } else if (currentPage + 2 >= totalPages) {
            startPage = totalPages - 4;
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `btn-pagination ${i === currentPage ? 'btn-page-active' : 'btn-page'}`;
        pageButton.textContent = i;
        pageButton.onclick = () => cambiarPagina(i);
        pagesContainer.appendChild(pageButton);
    }
    
    if (startPage > 2) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'btn-pagination btn-page';
        firstPageButton.textContent = '1';
        firstPageButton.onclick = () => cambiarPagina(1);
        pagesContainer.insertBefore(firstPageButton, pagesContainer.firstChild);
        
        const ellipsisStart = document.createElement('span');
        ellipsisStart.className = 'pagination-ellipsis';
        ellipsisStart.textContent = '...';
        pagesContainer.insertBefore(ellipsisStart, pagesContainer.firstChild.nextSibling);
    } else if (startPage === 2) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'btn-pagination btn-page';
        firstPageButton.textContent = '1';
        firstPageButton.onclick = () => cambiarPagina(1);
        pagesContainer.insertBefore(firstPageButton, pagesContainer.firstChild);
    }
    
    if (endPage < totalPages - 1) {
        const ellipsisEnd = document.createElement('span');
        ellipsisEnd.className = 'pagination-ellipsis';
        ellipsisEnd.textContent = '...';
        pagesContainer.appendChild(ellipsisEnd);
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'btn-pagination btn-page';
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = () => cambiarPagina(totalPages);
        pagesContainer.appendChild(lastPageButton);
    } else if (endPage === totalPages - 1) {
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'btn-pagination btn-page';
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = () => cambiarPagina(totalPages);
        pagesContainer.appendChild(lastPageButton);
    }
}

function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderizarTabla(filteredProductos);
    
    const tabla = document.getElementById('tabla-productos');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrarProductos() {
    const searchInput = document.getElementById('search-productos');
    if (!searchInput) {
        filteredProductos = productosData;
        currentPage = 1;
        renderizarTabla(filteredProductos);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProductos = productosData;
    } else {
        filteredProductos = productosData.filter(prod => {
            const nombre = prod.nombre ? prod.nombre.toLowerCase() : '';
            const tipo = prod.tipo ? prod.tipo.toLowerCase() : '';
            const variedad = prod.variedad ? prod.variedad.toLowerCase() : '';
            return nombre.includes(searchTerm) || tipo.includes(searchTerm) || variedad.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredProductos);
}

function buscarConDebounce() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => filtrarProductos(), 300);
}

// Funciones auxiliares para mostrar mensajes
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        timer: 1500,
        showConfirmButton: false
    });
}

function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando gestionar_cantidad.js');
    
    // Cargar datos iniciales
    cargarProductos();
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-productos');
    if (searchInput) {
        searchInput.addEventListener('input', buscarConDebounce);
    }
    
    // Controles de paginación
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    
    if (btnFirst) btnFirst.addEventListener('click', () => cambiarPagina(1));
    if (btnPrev) btnPrev.addEventListener('click', () => cambiarPagina(currentPage - 1));
    if (btnNext) btnNext.addEventListener('click', () => cambiarPagina(currentPage + 1));
    if (btnLast) btnLast.addEventListener('click', () => cambiarPagina(totalPages));
    
    // Cambiar tamaño de página
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSize = parseInt(this.value);
            currentPage = 1;
            renderizarTabla(filteredProductos);
        });
    }
    
    // Botón guardar en el modal
    const btnGuardar = document.getElementById('btn-guardar-cantidad');
    if (btnGuardar) {
        btnGuardar.addEventListener('click', guardarCantidad);
    }
    
    // Permitir Enter en el input de cantidad
    const cantidadInput = document.getElementById('cantidad-nueva');
    if (cantidadInput) {
        cantidadInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                guardarCantidad();
            }
        });
    }
    
    // Limpiar el modal al cerrar
    $('#modal-gestion-cantidad').on('hidden.bs.modal', function() {
        document.getElementById('cantidad-nueva').value = '';
        document.getElementById('modal-accion').value = 'editar';
        currentProducto = null;
    });
});

// Exportar funciones para uso en consola si es necesario (opcional)
window.cargarProductos = cargarProductos;
window.guardarCantidad = guardarCantidad;