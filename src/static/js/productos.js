// Variables globales
let productosData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredProductos = [];
let searchTimeout = null;

// Función para cargar los productos
async function cargarProductos() {
    try {
        const response = await fetch('/main/producto/obtener_productos');
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
    }
}

// Función para mostrar foto ampliada
function mostrarFotoAmpliada(fotoSrc, nombreProducto) {
    Swal.fire({
        title: nombreProducto,
        imageUrl: fotoSrc,
        imageWidth: 400,
        imageHeight: 400,
        imageAlt: nombreProducto,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        showConfirmButton: true,
        confirmButtonText: 'Cerrar'
    });
}

// Función para renderizar la tabla con paginación
function renderizarTabla(productos) {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (productos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
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
        
        // Celda de nombre
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        tdNombre.textContent = prod.nombre || 'Sin nombre';
        tr.appendChild(tdNombre);
        
        // Celda de tipo
        const tdTipo = document.createElement('td');
        tdTipo.className = 'text-left';
        tdTipo.textContent = prod.tipo || 'Sin tipo';
        tr.appendChild(tdTipo);
        
        // Celda de variedad
        const tdVariedad = document.createElement('td');
        tdVariedad.className = 'text-left';
        tdVariedad.textContent = prod.variedad || 'Sin variedad';
        tr.appendChild(tdVariedad);
        
        // Celda de foto
        const tdFoto = document.createElement('td');
        tdFoto.className = 'text-center';
        
        const fotoDiv = document.createElement('div');
        fotoDiv.className = 'foto-container';
        
        if (prod.foto_producto) {
            const fotoPath = `/static/images/producto/${prod.foto_producto}`;
            const img = document.createElement('img');
            img.src = fotoPath;
            img.alt = prod.nombre;
            img.className = 'foto-thumbnail';
            img.onclick = () => mostrarFotoAmpliada(fotoPath, prod.nombre);
            img.onerror = function() {
                this.onerror = null;
                this.style.display = 'none';
                const noFoto = document.createElement('div');
                noFoto.className = 'no-foto';
                noFoto.innerHTML = '<i class="fas fa-image"></i>';
                fotoDiv.appendChild(noFoto);
            };
            fotoDiv.appendChild(img);
        } else {
            const noFoto = document.createElement('div');
            noFoto.className = 'no-foto';
            noFoto.innerHTML = '<i class="fas fa-image"></i>';
            fotoDiv.appendChild(noFoto);
        }
        
        tdFoto.appendChild(fotoDiv);
        tr.appendChild(tdFoto);
        
        // Celda de descripción
        const tdDescripcion = document.createElement('td');
        tdDescripcion.className = 'text-left';
        tdDescripcion.textContent = prod.descripcion ? 
            (prod.descripcion.length > 50 ? prod.descripcion.substring(0, 50) + '...' : prod.descripcion) : 
            'Sin descripción';
        tdDescripcion.title = prod.descripcion || '';
        tr.appendChild(tdDescripcion);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = prod.estado_producto || 'ACTIVO';
        
        switch(prod.estado_producto) {
            case 'ACTIVO':
                estadoClass = 'estado-activo';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                estadoTexto = 'Activo';
                break;
            case 'INACTIVO':
                estadoClass = 'estado-inactivo';
                estadoIcono = '<i class="fas fa-ban"></i>';
                estadoTexto = 'Inactivo';
                break;
            case 'SIN_STOCK':
                estadoClass = 'estado-sinstock';
                estadoIcono = '<i class="fas fa-box"></i>';
                estadoTexto = 'Sin stock';
                break;
            default:
                estadoClass = 'estado-activo';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                estadoTexto = 'Activo';
        }
        
        estadoBadge.className = estadoClass;
        estadoBadge.innerHTML = `${estadoIcono} ${estadoTexto}`;
        tdEstado.appendChild(estadoBadge);
        tr.appendChild(tdEstado);
        
        // Celda de acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        btnEditar.title = 'Editar producto';
        btnEditar.onclick = () => editarProducto(prod.producto_id);
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado
        const btnEstado = document.createElement('button');
        if (prod.estado_producto === 'ACTIVO') {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
        } else {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
        }
        btnEstado.onclick = () => cambiarEstadoProducto(prod);
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar producto';
        btnEliminar.onclick = () => eliminarProducto(prod.producto_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(productos.length);
    actualizarControlesPaginacion(productos.length);
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 productos';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} productos`;
    }
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion(totalItems) {
    totalPages = Math.ceil(totalItems / pageSize);
    
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    
    if (btnFirst) btnFirst.disabled = currentPage === 1;
    if (btnPrev) btnPrev.disabled = currentPage === 1;
    if (btnNext) btnNext.disabled = currentPage === totalPages || totalPages === 0;
    if (btnLast) btnLast.disabled = currentPage === totalPages || totalPages === 0;
    
    const pagesContainer = document.getElementById('pagination-pages');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
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
    
    if (startPage > 1) {
        const ellipsisStart = document.createElement('span');
        ellipsisStart.className = 'pagination-ellipsis';
        ellipsisStart.textContent = '...';
        pagesContainer.insertBefore(ellipsisStart, pagesContainer.firstChild);
        
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'btn-pagination btn-page';
        firstPageButton.textContent = '1';
        firstPageButton.onclick = () => cambiarPagina(1);
        pagesContainer.insertBefore(firstPageButton, ellipsisStart);
    }
    
    if (endPage < totalPages) {
        const ellipsisEnd = document.createElement('span');
        ellipsisEnd.className = 'pagination-ellipsis';
        ellipsisEnd.textContent = '...';
        pagesContainer.appendChild(ellipsisEnd);
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'btn-pagination btn-page';
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = () => cambiarPagina(totalPages);
        pagesContainer.appendChild(lastPageButton);
    }
}

// Función para cambiar de página
function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarTabla(filteredProductos);
    
    const tabla = document.getElementById('tabla-productos');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar productos
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
            const descripcion = prod.descripcion ? prod.descripcion.toLowerCase() : '';
            const estado = prod.estado_producto ? prod.estado_producto.toLowerCase().replace('_', ' ') : '';
            
            return nombre.includes(searchTerm) ||
                   tipo.includes(searchTerm) ||
                   variedad.includes(searchTerm) ||
                   descripcion.includes(searchTerm) ||
                   estado.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredProductos);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarProductos();
    }, 300);
}

// Función para abrir modal de nuevo producto
function abrirModalNuevoProducto() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-producto');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo producto';
    
    // Limpiar formulario
    document.getElementById('producto_id').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('tipo').value = '';
    document.getElementById('variedad').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('temperatura_optima').value = '';
    document.getElementById('humedad_optima').value = '';
    document.getElementById('cant_productos_act').value = '';
    document.getElementById('foto_producto').value = '';
    
    // Ocultar vista previa
    const previewSection = document.getElementById('preview-section');
    if (previewSection) {
        previewSection.style.display = 'none';
    }
    
    form.classList.remove('was-validated');
    
    $('#modal-producto').modal('show');
}

// Función para abrir modal de edición
async function editarProducto(id) {
    try {
        const response = await fetch(`/main/producto/obtener_producto_xid/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el producto');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el producto');
        }
        
        const producto = data.producto;
        
        document.getElementById('modal-titulo').textContent = 'Editar producto';
        document.getElementById('producto_id').value = producto.producto_id;
        document.getElementById('nombre').value = producto.nombre || '';
        document.getElementById('tipo').value = producto.tipo || '';
        document.getElementById('variedad').value = producto.variedad || '';
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('temperatura_optima').value = producto.temperatura_optima || '';
        document.getElementById('humedad_optima').value = producto.humedad_optima || '';
        document.getElementById('cant_productos_act').value = producto.cant_productos_act || '';
        document.getElementById('foto_producto').value = '';
        
        // Ocultar vista previa
        const previewSection = document.getElementById('preview-section');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
        
        $('#modal-producto').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el producto para editar');
    }
}

// Función para validar datos del formulario
function validarFormulario() {
    const form = document.getElementById('form-producto');
    if (!form) return false;
    
    // Validar campos obligatorios
    const nombre = document.getElementById('nombre').value.trim();
    const tipo = document.getElementById('tipo').value;
    const variedad = document.getElementById('variedad').value.trim();
    const temperatura = document.getElementById('temperatura_optima').value;
    const humedad = document.getElementById('humedad_optima').value;
    const cantidad = document.getElementById('cant_productos_act').value;
    
    if (!nombre) {
        mostrarError('Por favor ingrese el nombre del producto');
        return false;
    }
    
    if (!tipo) {
        mostrarError('Por favor seleccione el tipo de producto');
        return false;
    }
    
    if (!variedad) {
        mostrarError('Por favor ingrese la variedad del producto');
        return false;
    }
    
    if (!temperatura || isNaN(temperatura) || parseFloat(temperatura) < 0 || parseFloat(temperatura) > 100) {
        mostrarError('Por favor ingrese una temperatura óptima válida (0-100)');
        return false;
    }
    
    if (!humedad || isNaN(humedad) || parseFloat(humedad) < 0 || parseFloat(humedad) > 100) {
        mostrarError('Por favor ingrese una humedad óptima válida (0-100)');
        return false;
    }
    
    if (!cantidad || isNaN(cantidad) || parseFloat(cantidad) < 0) {
        mostrarError('Por favor ingrese una cantidad válida (mayor o igual a 0)');
        return false;
    }
    
    return true;
}

// Función para guardar producto
async function guardarProducto() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-producto');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('producto_id').value;
    const fotoInput = document.getElementById('foto_producto');
    let foto = null;
    
    // Verificar si se seleccionó una foto
    if (fotoInput && fotoInput.files.length > 0) {
        foto = fotoInput.files[0];
        
        // Validar formato JPG
        if (foto.type !== 'image/jpeg' && !foto.name.toLowerCase().endsWith('.jpg')) {
            mostrarError('Solo se permiten archivos en formato JPG');
            return;
        }
        
        // Validar tamaño máximo (5MB)
        if (foto.size > 5 * 1024 * 1024) {
            mostrarError('La imagen no debe superar los 5MB');
            return;
        }
    }
    
    // Datos del producto (sin incluir el estado)
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        tipo: document.getElementById('tipo').value,
        variedad: document.getElementById('variedad').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim() || '',
        temperatura_optima: parseFloat(document.getElementById('temperatura_optima').value),
        humedad_optima: parseFloat(document.getElementById('humedad_optima').value),
        cant_productos_act: parseFloat(document.getElementById('cant_productos_act').value)
        // NOTA: No se incluye estado, el backend lo establecerá como ACTIVO por defecto
    };
    
    const url = id ? `/main/producto/actualizar_producto/${id}` : '/main/producto/registrar';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const formData = new FormData();
        for (const key in datos) {
            if (datos[key] !== null && datos[key] !== undefined) {
                formData.append(key, datos[key]);
            }
        }
        
        if (foto) {
            formData.append('foto', foto);
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Producto guardado exitosamente');
            $('#modal-producto').modal('hide');
            // Recargar la página después de guardar
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error(result.error || 'Error al guardar el producto');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado del producto
async function cambiarEstadoProducto(producto) {
    let nuevoEstado = '';
    let titulo = '';
    let texto = '';
    
    if (producto.estado_producto === 'ACTIVO') {
        nuevoEstado = 'INACTIVO';
        titulo = 'Dar de baja producto';
        texto = `¿Está seguro que desea dar de baja el producto "${producto.nombre}"?`;
    } else {
        nuevoEstado = 'ACTIVO';
        titulo = 'Activar producto';
        texto = `¿Está seguro que desea activar el producto "${producto.nombre}"?`;
    }
    
    Swal.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/producto/cambiar_estado/${producto.producto_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                    // Recargar la página después de cambiar estado
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado del producto');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del producto: ' + error.message);
            }
        }
    });
}

// Función para eliminar producto
async function eliminarProducto(id) {
    const producto = productosData.find(p => p.producto_id == id);
    if (!producto) return;
    
    Swal.fire({
        title: 'Eliminar producto',
        text: `¿Está seguro que desea eliminar permanentemente el producto "${producto.nombre}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/producto/eliminar_producto/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Producto eliminado exitosamente');
                    // Recargar la página después de eliminar
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    // Mostrar el mensaje de error que viene del backend
                    const errorMessage = data.error || 'No se pudo eliminar el producto';
                    
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede eliminar',
                        text: errorMessage,
                        background: '#152a3a',
                        color: '#e0f2fe',
                        confirmButtonColor: '#40e0d0'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('Ocurrió un error al intentar eliminar el producto');
            }
        }
    });
}

// Función para vista previa de imagen
function mostrarVistaPrevia(event) {
    const file = event.target.files[0];
    if (!file) {
        document.getElementById('preview-section').style.display = 'none';
        return;
    }
    
    // Validar formato JPG
    if (file.type !== 'image/jpeg' && !file.name.toLowerCase().endsWith('.jpg')) {
        mostrarError('Solo se permiten archivos en formato JPG');
        event.target.value = '';
        document.getElementById('preview-section').style.display = 'none';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('image-preview');
        preview.src = e.target.result;
        document.getElementById('preview-section').style.display = 'block';
    };
    reader.readAsDataURL(file);
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
    // Cargar datos iniciales
    cargarProductos();
    
    // Botón nuevo producto
    const btnNuevoProducto = document.getElementById('btn-nuevo-producto');
    if (btnNuevoProducto) {
        btnNuevoProducto.addEventListener('click', abrirModalNuevoProducto);
    }
    
    // Botón guardar producto
    const btnGuardarProducto = document.getElementById('btn-guardar-producto');
    if (btnGuardarProducto) {
        btnGuardarProducto.addEventListener('click', guardarProducto);
    }
    
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
    
    // Vista previa de imagen
    const fotoInput = document.getElementById('foto_producto');
    if (fotoInput) {
        fotoInput.addEventListener('change', mostrarVistaPrevia);
    }
    
    // Limpiar modal al cerrar
    $('#modal-producto').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-producto');
        if (form) {
            form.classList.remove('was-validated');
        }
        
        const previewSection = document.getElementById('preview-section');
        if (previewSection) {
            previewSection.style.display = 'none';
        }
    });
    
    // Permitir Enter en formulario
    const formProducto = document.getElementById('form-producto');
    if (formProducto) {
        formProducto.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarProducto();
            }
        });
    }
});