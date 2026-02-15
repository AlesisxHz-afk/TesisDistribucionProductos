// Variables globales
let conductoresData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredConductores = [];
let searchTimeout = null;

// Función para cargar los conductores
async function cargarConductores() {
    try {
        const response = await fetch('/main/conductor/obtener_conductores');
        if (!response.ok) {
            throw new Error('Error al cargar los conductores');
        }
        
        const data = await response.json();
        if (data.success) {
            conductoresData = data.conductores || [];
            filtrarConductores();
        } else {
            throw new Error(data.error || 'Error al cargar los conductores');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los conductores');
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(conductores) {
    const tbody = document.getElementById('tabla-conductores-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (conductores.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5; // 5 columnas visibles (Nombre completo, DNI, Dirección, Estado, Acciones)
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-user-slash"></i>
            <h4>No se encontraron conductores</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar conductores por apellido paterno de A a Z (invisible para el usuario)
    const conductoresOrdenados = [...conductores].sort((a, b) => {
        const apellidoA = (a.apellido_paterno || '').toLowerCase();
        const apellidoB = (b.apellido_paterno || '').toLowerCase();
        return apellidoA.localeCompare(apellidoB);
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, conductoresOrdenados.length);
    const paginatedConductores = conductoresOrdenados.slice(startIndex, endIndex);
    
    paginatedConductores.forEach(cond => {
        const tr = document.createElement('tr');
        
        // Celda de nombre completo (única visible de los nombres)
        const tdNombreCompleto = document.createElement('td');
        tdNombreCompleto.className = 'text-left';
        const nombreCompleto = construirNombreCompleto(cond);
        tdNombreCompleto.textContent = nombreCompleto || 'Sin nombre';
        tr.appendChild(tdNombreCompleto);
        
        // Celdas ocultas para mantener la estructura pero no visibles
        // Apellido Paterno (oculto)
        const tdApellidoPaterno = document.createElement('td');
        tdApellidoPaterno.style.display = 'none';
        tdApellidoPaterno.textContent = cond.apellido_paterno || '';
        tr.appendChild(tdApellidoPaterno);
        
        // Apellido Materno (oculto)
        const tdApellidoMaterno = document.createElement('td');
        tdApellidoMaterno.style.display = 'none';
        tdApellidoMaterno.textContent = cond.apellido_materno || '';
        tr.appendChild(tdApellidoMaterno);
        
        // Nombres (oculto)
        const tdNombres = document.createElement('td');
        tdNombres.style.display = 'none';
        tdNombres.textContent = cond.nombre || '';
        tr.appendChild(tdNombres);
        
        // Celda de DNI
        const tdDni = document.createElement('td');
        tdDni.className = 'text-left';
        tdDni.textContent = cond.dni || 'Sin DNI';
        tr.appendChild(tdDni);
        
        // Celda de dirección
        const tdDireccion = document.createElement('td');
        tdDireccion.className = 'text-left';
        tdDireccion.textContent = cond.direccion ? 
            (cond.direccion.length > 30 ? cond.direccion.substring(0, 30) + '...' : cond.direccion) : 
            '-';
        tdDireccion.title = cond.direccion || '';
        tr.appendChild(tdDireccion);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = cond.estado || 'INACTIVO';
        
        switch(cond.estado) {
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
            case 'VACACIONES':
                estadoClass = 'estado-vacaciones';
                estadoIcono = '<i class="fas fa-umbrella-beach"></i>';
                estadoTexto = 'Vacaciones';
                break;
            case 'LICENCIA':
                estadoClass = 'estado-licencia';
                estadoIcono = '<i class="fas fa-file-medical"></i>';
                estadoTexto = 'Licencia';
                break;
            default:
                estadoClass = 'estado-inactivo';
                estadoIcono = '<i class="fas fa-question-circle"></i>';
                estadoTexto = cond.estado || 'Desconocido';
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
        btnEditar.title = 'Editar conductor';
        btnEditar.onclick = () => editarConductor(cond.conductor_id);
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado
        const btnEstado = document.createElement('button');
        if (cond.estado === 'ACTIVO') {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
        } else {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
        }
        btnEstado.onclick = () => cambiarEstadoConductor(cond);
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar conductor';
        btnEliminar.onclick = () => eliminarConductor(cond.conductor_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(conductores.length);
    actualizarControlesPaginacion(conductores.length);
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 conductores';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} conductores`;
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
    renderizarTabla(filteredConductores);
    
    const tabla = document.getElementById('tabla-conductores');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar conductores
function filtrarConductores() {
    const searchInput = document.getElementById('search-conductores');
    if (!searchInput) {
        filteredConductores = conductoresData;
        currentPage = 1;
        renderizarTabla(filteredConductores);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredConductores = conductoresData;
    } else {
        filteredConductores = conductoresData.filter(cond => {
            const nombreCompleto = construirNombreCompleto(cond).toLowerCase();
            const dni = cond.dni ? cond.dni.toLowerCase() : '';
            const direccion = cond.direccion ? cond.direccion.toLowerCase() : '';
            const estado = cond.estado ? cond.estado.toLowerCase() : '';
            
            return nombreCompleto.includes(searchTerm) ||
                   dni.includes(searchTerm) ||
                   direccion.includes(searchTerm) ||
                   estado.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredConductores);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarConductores();
    }, 300);
}

// Función para construir nombre completo
function construirNombreCompleto(conductor) {
    return `${conductor.nombre || ''} ${conductor.apellido_paterno || ''} ${conductor.apellido_materno || ''}`.replace(/\s+/g, ' ').trim();
}

// Función para abrir modal de nuevo conductor
function abrirModalNuevoConductor() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-conductor');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo conductor';
    
    // Limpiar formulario
    document.getElementById('conductor_id').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('apellido_paterno').value = '';
    document.getElementById('apellido_materno').value = '';
    document.getElementById('dni').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('estado').value = 'ACTIVO';
    
    // Valor oculto por defecto
    document.getElementById('fecha_ingreso').value = new Date().toISOString().split('T')[0];
    
    form.classList.remove('was-validated');
    
    $('#modal-conductor').modal('show');
}

// Función para abrir modal de edición
async function editarConductor(id) {
    try {
        const response = await fetch(`/main/conductor/obtener_conductor_xid/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el conductor');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el conductor');
        }
        
        const conductor = data.conductor;
        
        document.getElementById('modal-titulo').textContent = 'Editar conductor';
        document.getElementById('conductor_id').value = conductor.conductor_id;
        document.getElementById('nombre').value = conductor.nombre || '';
        document.getElementById('apellido_paterno').value = conductor.apellido_paterno || '';
        document.getElementById('apellido_materno').value = conductor.apellido_materno || '';
        document.getElementById('dni').value = conductor.dni || '';
        document.getElementById('telefono').value = conductor.telefono || '';
        document.getElementById('direccion').value = conductor.direccion || '';
        document.getElementById('estado').value = conductor.estado || 'ACTIVO';
        
        // Valor oculto
        document.getElementById('fecha_ingreso').value = conductor.fecha_ingreso || new Date().toISOString().split('T')[0];
        
        $('#modal-conductor').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el conductor para editar');
    }
}

// Función para validar datos del formulario
function validarFormulario() {
    const form = document.getElementById('form-conductor');
    if (!form) return false;
    
    // Validar campos obligatorios
    const nombre = document.getElementById('nombre').value.trim();
    const apellidoPaterno = document.getElementById('apellido_paterno').value.trim();
    const apellidoMaterno = document.getElementById('apellido_materno').value.trim();
    const dni = document.getElementById('dni').value.trim();
    const estado = document.getElementById('estado').value;
    
    if (!nombre) {
        mostrarError('Por favor ingrese los nombres del conductor');
        return false;
    }
    
    if (!apellidoPaterno) {
        mostrarError('Por favor ingrese el apellido paterno');
        return false;
    }
    
    if (!apellidoMaterno) {
        mostrarError('Por favor ingrese el apellido materno');
        return false;
    }
    
    if (!dni) {
        mostrarError('Por favor ingrese el DNI');
        return false;
    }
    
    // Validar formato DNI (solo números, 8-15 dígitos)
    const dniRegex = /^[0-9]{8,15}$/;
    if (!dniRegex.test(dni)) {
        mostrarError('El DNI debe contener solo números y tener entre 8 y 15 dígitos');
        return false;
    }
    
    if (!estado) {
        mostrarError('Por favor seleccione el estado del conductor');
        return false;
    }
    
    return true;
}

// Función para guardar conductor
async function guardarConductor() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-conductor');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('conductor_id').value;
    
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido_paterno: document.getElementById('apellido_paterno').value.trim(),
        apellido_materno: document.getElementById('apellido_materno').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        telefono: document.getElementById('telefono').value.trim() || null,
        direccion: document.getElementById('direccion').value.trim() || null,
        fecha_ingreso: document.getElementById('fecha_ingreso').value,
        estado: document.getElementById('estado').value
    };
    
    const url = id ? `/main/conductor/actualizar_conductor/${id}` : '/main/conductor/registrar';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Conductor guardado exitosamente');
            $('#modal-conductor').modal('hide');
            // Recargar la página después de guardar
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error(result.error || 'Error al guardar el conductor');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado del conductor
async function cambiarEstadoConductor(conductor) {
    let nuevoEstado = '';
    let titulo = '';
    let texto = '';
    
    const nombreCompleto = construirNombreCompleto(conductor);
    
    if (conductor.estado === 'ACTIVO') {
        nuevoEstado = 'INACTIVO';
        titulo = 'Dar de baja conductor';
        texto = `¿Está seguro que desea dar de baja al conductor "${nombreCompleto}"?`;
    } else {
        nuevoEstado = 'ACTIVO';
        titulo = 'Activar conductor';
        texto = `¿Está seguro que desea activar al conductor "${nombreCompleto}"?`;
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
                const response = await fetch(`/main/conductor/cambiar_estado/${conductor.conductor_id}`, {
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
                    throw new Error(data.error || 'Error al cambiar el estado del conductor');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del conductor: ' + error.message);
            }
        }
    });
}

// Función para eliminar conductor
async function eliminarConductor(id) {
    const conductor = conductoresData.find(c => c.conductor_id == id);
    if (!conductor) return;
    
    const nombreCompleto = construirNombreCompleto(conductor);
    
    Swal.fire({
        title: 'Eliminar conductor',
        text: `¿Está seguro que desea eliminar permanentemente al conductor "${nombreCompleto}"? Esta acción no se puede deshacer.`,
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
                const response = await fetch(`/main/conductor/eliminar_conductor/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Conductor eliminado exitosamente');
                    // Recargar la página después de eliminar
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error al eliminar el conductor');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo eliminar el conductor: ' + error.message);
            }
        }
    });
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
    cargarConductores();
    
    // Botón nuevo conductor
    const btnNuevoConductor = document.getElementById('btn-nuevo-conductor');
    if (btnNuevoConductor) {
        btnNuevoConductor.addEventListener('click', abrirModalNuevoConductor);
    }
    
    // Botón guardar conductor
    const btnGuardarConductor = document.getElementById('btn-guardar-conductor');
    if (btnGuardarConductor) {
        btnGuardarConductor.addEventListener('click', guardarConductor);
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-conductores');
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
            renderizarTabla(filteredConductores);
        });
    }
    
    // Limpiar modal al cerrar
    $('#modal-conductor').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-conductor');
        if (form) {
            form.classList.remove('was-validated');
        }
    });
    
    // Permitir Enter en formulario
    const formConductor = document.getElementById('form-conductor');
    if (formConductor) {
        formConductor.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarConductor();
            }
        });
    }
});