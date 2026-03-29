// Variables globales
let almacenesData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredAlmacenes = [];
let searchTimeout = null;
// Variable para almacenar datos del almacén seleccionado en el modal
let currentAlmacen = null;

// Función para cargar los almacenes y su ocupación
async function cargarAlmacenes() {
    try {
        // Mostrar indicador de carga
        const tbody = document.getElementById('tabla-almacenes-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 30px; color: #40e0d0;"></i>
                        <p style="color: #a5d8ff; margin-top: 10px;">Cargando almacenes...</p>
                    </td>
                </tr>
            `;
        }
        
        const response = await fetch('/main/almacen/obtener_almacenes_con_stock');
        if (!response.ok) {
            throw new Error('Error al cargar los almacenes');
        }
        
        const data = await response.json();
        if (data.success) {
            almacenesData = data.almacenes || [];
            filtrarAlmacenes();
        } else {
            throw new Error(data.error || 'Error al cargar los almacenes');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los almacenes');
        
        const tbody = document.getElementById('tabla-almacenes-body');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center" style="padding: 40px;">
                        <i class="fas fa-exclamation-circle" style="font-size: 30px; color: #f87171;"></i>
                        <p style="color: #f87171; margin-top: 10px;">Error al cargar los almacenes</p>
                        <button class="btn btn-primary btn-sm" onclick="cargarAlmacenes()">
                            <i class="fas fa-sync-alt"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(almacenes) {
    const tbody = document.getElementById('tabla-almacenes-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (almacenes.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-warehouse"></i>
            <h4>No se encontraron almacenes</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar almacenes por nombre de A a Z
    const almacenesOrdenados = [...almacenes].sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, almacenesOrdenados.length);
    const paginatedAlmacenes = almacenesOrdenados.slice(startIndex, endIndex);
    
    paginatedAlmacenes.forEach(alm => {
        const tr = document.createElement('tr');
        
        // Celda de Nombre del Almacén
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        tdNombre.textContent = alm.nombre || 'Sin nombre';
        tr.appendChild(tdNombre);
        
        // Celda de Capacidad Máxima
        const tdCapacidad = document.createElement('td');
        tdCapacidad.className = 'text-left';
        const capacidadNum = parseFloat(alm.capacidad) || 0;
        tdCapacidad.textContent = `${capacidadNum.toFixed(2)} kg`;
        tr.appendChild(tdCapacidad);
        
        // Celda de Cantidad Total de Productos
        const tdCantidadTotal = document.createElement('td');
        tdCantidadTotal.className = 'text-left';
        const ocupadoNum = parseFloat(alm.total_ocupado) || 0;
        tdCantidadTotal.textContent = `${ocupadoNum.toFixed(2)} kg`;
        
        // Agregar indicador de porcentaje de ocupación
        const porcentaje = capacidadNum > 0 ? (ocupadoNum / capacidadNum * 100).toFixed(1) : 0;
        let colorClase = 'text-success';
        if (porcentaje > 80) colorClase = 'text-warning';
        if (porcentaje >= 95) colorClase = 'text-danger';
        
        tdCantidadTotal.innerHTML = `${ocupadoNum.toFixed(2)} kg <small class="${colorClase}">(${porcentaje}%)</small>`;
        tr.appendChild(tdCantidadTotal);
        
        // Celda de Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón Gestionar (+)
        const btnGestionar = document.createElement('button');
        btnGestionar.className = 'btn btn-success btn-sm';
        btnGestionar.innerHTML = '<i class="fas fa-plus"></i>';
        btnGestionar.title = 'Agregar o quitar productos';
        btnGestionar.onclick = () => abrirModalGestion(alm.almacen_id);
        divAcciones.appendChild(btnGestionar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(almacenes.length);
    actualizarControlesPaginacion(almacenes.length);
}

// Función para abrir el modal de gestión de productos
async function abrirModalGestion(almacenId) {
    try {
        // Mostrar indicador de carga en el modal
        Swal.fire({
            title: 'Cargando...',
            text: 'Obteniendo información del almacén',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#152a3a',
            color: '#e0f2fe'
        });
        
        const response = await fetch(`/main/almacen/obtener_almacen_con_detalle/${almacenId}`);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles del almacén');
        }
        const data = await response.json();
        
        // Cerrar el loading
        Swal.close();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar los detalles');
        }
        
        currentAlmacen = data.almacen;
        
        // Llenar información del almacén en el modal
        document.getElementById('modal-almacen-id').value = currentAlmacen.almacen_id;
        document.getElementById('modal-almacen-nombre').textContent = currentAlmacen.nombre;
        
        const capacidad = parseFloat(currentAlmacen.capacidad) || 0;
        const ocupado = parseFloat(currentAlmacen.total_ocupado) || 0;
        const disponible = capacidad - ocupado;
        
        document.getElementById('modal-capacidad-max').textContent = capacidad.toFixed(2);
        document.getElementById('modal-espacio-ocupado').textContent = ocupado.toFixed(2);
        document.getElementById('modal-espacio-disponible').textContent = disponible.toFixed(2);
        
        // Cambiar color según disponibilidad
        const espacioDisponibleElement = document.getElementById('modal-espacio-disponible');
        if (disponible <= 0) {
            espacioDisponibleElement.className = 'text-danger';
        } else if (disponible < capacidad * 0.1) {
            espacioDisponibleElement.className = 'text-warning';
        } else {
            espacioDisponibleElement.className = '';
        }
        
        // Renderizar tabla de productos en el almacén
        renderizarProductosEnAlmacen(currentAlmacen.productos || []);
        
        // Cargar productos disponibles en el select
        await cargarProductosDisponibles(almacenId);
        
        $('#modal-gestion-producto').modal('show');
        
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError('No se pudo cargar la información del almacén: ' + error.message);
    }
}

// Función para renderizar la tabla de productos dentro de un almacén
function renderizarProductosEnAlmacen(productos) {
    const tbody = document.getElementById('tabla-productos-almacen-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 3;
        td.className = 'text-center';
        td.style.padding = '30px';
        td.style.color = '#a5d8ff';
        td.innerHTML = '<i class="fas fa-box-open fa-2x mb-2"></i><br>No hay productos en este almacén.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    
    productos.forEach(item => {
        const tr = document.createElement('tr');
        
        // Producto
        const tdProducto = document.createElement('td');
        tdProducto.textContent = item.producto_nombre || 'Producto sin nombre';
        tr.appendChild(tdProducto);
        
        // Cantidad Actual
        const tdCantidad = document.createElement('td');
        const cantidad = parseFloat(item.cant_productos_act) || 0;
        tdCantidad.textContent = `${cantidad.toFixed(2)} kg`;
        tr.appendChild(tdCantidad);
        
        // Acciones (solo botón de quitar)
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const btnQuitar = document.createElement('button');
        btnQuitar.className = 'btn btn-warning btn-sm';
        btnQuitar.innerHTML = '<i class="fas fa-minus"></i>';
        btnQuitar.title = 'Quitar cantidad';
        btnQuitar.onclick = () => quitarProductoAlmacen(
            item.almacen_capacidad_id, 
            item.producto_id, 
            item.cant_productos_act
        );
        
        tdAcciones.appendChild(btnQuitar);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
}

// Función para cargar productos disponibles en el select del modal
async function cargarProductosDisponibles(almacenId) {
    try {
        const response = await fetch(`/main/almacen/obtener_productos_para_agregar/${almacenId}`);
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        
        const select = document.getElementById('select-producto');
        select.innerHTML = '<option value="">Seleccione un producto</option>';
        
        if (data.success && data.productos && data.productos.length > 0) {
            data.productos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.producto_id;
                const stock = parseFloat(prod.cant_productos_act) || 0;
                option.textContent = `${prod.nombre} (Stock: ${stock.toFixed(2)} kg)`;
                option.dataset.stock = stock;
                select.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No hay productos con stock disponible';
            option.disabled = true;
            select.appendChild(option);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los productos disponibles');
    }
}

// Función para agregar producto al almacén (MODIFICADA - recarga la página)
async function agregarProductoAlmacen() {
    const almacenId = document.getElementById('modal-almacen-id').value;
    const productoId = document.getElementById('select-producto').value;
    const cantidadInput = document.getElementById('cantidad-agregar').value;
    const selectOption = document.getElementById('select-producto').selectedOptions[0];
    
    // Validaciones
    if (!productoId) {
        mostrarError('Por favor seleccione un producto');
        return;
    }
    
    if (!cantidadInput || cantidadInput.trim() === '') {
        mostrarError('Por favor ingrese una cantidad');
        return;
    }
    
    const cantidad = parseFloat(cantidadInput);
    if (isNaN(cantidad) || cantidad <= 0) {
        mostrarError('Por favor ingrese una cantidad válida mayor a 0');
        return;
    }
    
    // Validar stock disponible
    const stockDisponible = selectOption ? parseFloat(selectOption.dataset.stock) : 0;
    if (cantidad > stockDisponible) {
        mostrarError(`La cantidad ingresada (${cantidad.toFixed(2)} kg) supera el stock disponible (${stockDisponible.toFixed(2)} kg)`);
        return;
    }
    
    // Validar espacio en almacén
    const espacioDisponible = parseFloat(document.getElementById('modal-espacio-disponible').textContent);
    if (cantidad > espacioDisponible) {
        mostrarError(`No hay suficiente espacio en el almacén. Espacio disponible: ${espacioDisponible.toFixed(2)} kg`);
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Procesando...',
            text: 'Agregando producto al almacén',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#152a3a',
            color: '#e0f2fe'
        });
        
        const response = await fetch('/main/almacen/agregar_producto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                almacen_id: parseInt(almacenId),
                producto_id: parseInt(productoId),
                cantidad: cantidad
            })
        });
        
        const data = await response.json();
        Swal.close();
        
        if (data.success) {
            // Cerrar el modal
            $('#modal-gestion-producto').modal('hide');
            
            // Mostrar mensaje de éxito y recargar la página
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Producto agregado exitosamente. La página se recargará.',
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload(); // Recargar la página
            });
        } else {
            throw new Error(data.error || 'Error al agregar el producto');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para quitar producto del almacén (MODIFICADA - recarga la página)
async function quitarProductoAlmacen(almacenCapacidadId, productoId, cantidadActual) {
    const almacenId = document.getElementById('modal-almacen-id').value;
    const cantidadActualNum = parseFloat(cantidadActual) || 0;
    
    // Usar prompt nativo del navegador
    const cantidadInput = window.prompt(
        `Cantidad actual: ${cantidadActualNum.toFixed(2)} kg\n\nIngrese la cantidad a quitar (kg):`,
        ''
    );
    
    // Si el usuario cancela
    if (cantidadInput === null) {
        return;
    }
    
    // Validar
    if (!cantidadInput.trim()) {
        mostrarError('Debe ingresar una cantidad');
        return;
    }
    
    const valorLimpio = cantidadInput.replace(',', '.');
    const cantidadQuitar = parseFloat(valorLimpio);
    
    if (isNaN(cantidadQuitar) || cantidadQuitar <= 0) {
        mostrarError('Debe ingresar una cantidad válida mayor a 0');
        return;
    }
    
    if (cantidadQuitar > cantidadActualNum) {
        mostrarError(`No puede quitar más de ${cantidadActualNum.toFixed(2)} kg`);
        return;
    }
    
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Procesando...',
            text: 'Quitando producto del almacén',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
            background: '#152a3a',
            color: '#e0f2fe'
        });
        
        const response = await fetch('/main/almacen/quitar_producto', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                almacen_capacidad_id: almacenCapacidadId,
                almacen_id: parseInt(almacenId),
                producto_id: parseInt(productoId),
                cantidad: cantidadQuitar
            })
        });
        
        const data = await response.json();
        Swal.close();
        
        if (data.success) {
            // Cerrar el modal
            $('#modal-gestion-producto').modal('hide');
            
            // Mostrar mensaje de éxito y recargar la página
            Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Cantidad quitada exitosamente. La página se recargará.',
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                location.reload(); // Recargar la página
            });
        } else {
            throw new Error(data.error || 'Error al quitar el producto');
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
        infoElement.textContent = 'Mostrando 0 de 0 almacenes';
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} almacenes`;
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
    renderizarTabla(filteredAlmacenes);
    
    const tabla = document.getElementById('tabla-almacenes');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrarAlmacenes() {
    const searchInput = document.getElementById('search-almacenes');
    if (!searchInput) {
        filteredAlmacenes = almacenesData;
        currentPage = 1;
        renderizarTabla(filteredAlmacenes);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredAlmacenes = almacenesData;
    } else {
        filteredAlmacenes = almacenesData.filter(alm => {
            const nombre = alm.nombre ? alm.nombre.toLowerCase() : '';
            const tipo = alm.tipo_almacen ? alm.tipo_almacen.toLowerCase() : '';
            return nombre.includes(searchTerm) || tipo.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredAlmacenes);
}

function buscarConDebounce() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => filtrarAlmacenes(), 300);
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
    console.log('DOM cargado, inicializando cantidad_almacenes.js');
    
    // Cargar datos iniciales
    cargarAlmacenes();
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-almacenes');
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
            renderizarTabla(filteredAlmacenes);
        });
    }
    
    // Botón agregar producto en el modal
    const btnAgregarProducto = document.getElementById('btn-agregar-producto');
    if (btnAgregarProducto) {
        btnAgregarProducto.addEventListener('click', agregarProductoAlmacen);
    }
    
    // Mostrar stock disponible al seleccionar un producto
    const selectProducto = document.getElementById('select-producto');
    if (selectProducto) {
        selectProducto.addEventListener('change', function() {
            const selectedOption = this.selectedOptions[0];
            const stockInfo = document.getElementById('stock-disponible-info');
            if (selectedOption && selectedOption.dataset.stock) {
                const stock = parseFloat(selectedOption.dataset.stock).toFixed(2);
                stockInfo.textContent = `Stock global: ${stock} kg`;
            } else {
                stockInfo.textContent = 'Stock global: 0 kg';
            }
        });
    }
    
    // Permitir Enter en el input de cantidad
    const cantidadInput = document.getElementById('cantidad-agregar');
    if (cantidadInput) {
        cantidadInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                agregarProductoAlmacen();
            }
        });
    }
    
    // Limpiar el modal al cerrar
    $('#modal-gestion-producto').on('hidden.bs.modal', function() {
        document.getElementById('select-producto').value = '';
        document.getElementById('cantidad-agregar').value = '';
        document.getElementById('stock-disponible-info').textContent = 'Stock global: 0 kg';
        currentAlmacen = null;
    });
});

// Exportar funciones para uso en consola si es necesario (opcional)
window.cargarAlmacenes = cargarAlmacenes;
window.quitarProductoAlmacen = quitarProductoAlmacen;
window.agregarProductoAlmacen = agregarProductoAlmacen;