// Variables globales
let vehiculosData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredVehiculos = [];
let searchTimeout = null;

// Función para cargar los vehículos
async function cargarVehiculos() {
    try {
        const response = await fetch('/main/vehiculo/obtener_vehiculos');
        if (!response.ok) {
            throw new Error('Error al cargar los vehículos');
        }
        
        const data = await response.json();
        if (data.success) {
            vehiculosData = data.vehiculos || [];
            filtrarVehiculos();
        } else {
            throw new Error(data.error || 'Error al cargar los vehículos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los vehículos');
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(vehiculos) {
    const tbody = document.getElementById('tabla-vehiculos-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (vehiculos.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 8;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-truck"></i>
            <h4>No se encontraron vehículos</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar vehículos por placa
    const vehiculosOrdenados = [...vehiculos].sort((a, b) => {
        const placaA = (a.placa || '').toLowerCase();
        const placaB = (b.placa || '').toLowerCase();
        return placaA.localeCompare(placaB);
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, vehiculosOrdenados.length);
    const paginatedVehiculos = vehiculosOrdenados.slice(startIndex, endIndex);
    
    paginatedVehiculos.forEach(veh => {
        const tr = document.createElement('tr');
        
        // Celda de placa
        const tdPlaca = document.createElement('td');
        tdPlaca.className = 'text-left';
        tdPlaca.innerHTML = `<strong>${veh.placa || 'Sin placa'}</strong>`;
        tr.appendChild(tdPlaca);
        
        // Celda de modelo
        const tdModelo = document.createElement('td');
        tdModelo.className = 'text-left';
        tdModelo.textContent = veh.modelo || 'Sin modelo';
        tr.appendChild(tdModelo);
        
        // Celda de marca
        const tdMarca = document.createElement('td');
        tdMarca.className = 'text-left';
        tdMarca.textContent = veh.marca || 'Sin marca';
        tr.appendChild(tdMarca);
        
        // Celda de tipo
        const tdTipo = document.createElement('td');
        tdTipo.className = 'text-left';
        tdTipo.textContent = veh.tipo_vehiculo || 'Sin tipo';
        tr.appendChild(tdTipo);
        
        // Celda de capacidad de carga
        const tdCarga = document.createElement('td');
        tdCarga.className = 'text-left';
        tdCarga.textContent = veh.cantidad_carga ? `${parseFloat(veh.cantidad_carga).toLocaleString()} kg` : '0 kg';
        tr.appendChild(tdCarga);
        
        // Celda de año
        const tdAnio = document.createElement('td');
        tdAnio.className = 'text-left';
        tdAnio.textContent = veh.anio_fabricacion || 'Sin año';
        tr.appendChild(tdAnio);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = veh.estado || 'INACTIVO';
        
        switch(veh.estado) {
            case 'ACTIVO':
                estadoClass = 'estado-activo';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                estadoTexto = 'Activo';
                break;
            case 'EN_USO':
                estadoClass = 'estado-enuso';
                estadoIcono = '<i class="fas fa-truck"></i>';
                estadoTexto = 'En uso';
                break;
            case 'INACTIVO':
                estadoClass = 'estado-inactivo';
                estadoIcono = '<i class="fas fa-ban"></i>';
                estadoTexto = 'Inactivo';
                break;
            default:
                estadoClass = 'estado-inactivo';
                estadoIcono = '<i class="fas fa-question-circle"></i>';
                estadoTexto = veh.estado || 'Desconocido';
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
        btnEditar.title = 'Editar vehículo';
        btnEditar.onclick = () => editarVehiculo(veh.vehiculo_id);
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado
        const btnEstado = document.createElement('button');
        if (veh.estado === 'ACTIVO') {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Cambiar a Inactivo';
        } else if (veh.estado === 'EN_USO') {
            btnEstado.className = 'btn btn-warning btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-truck"></i>';
            btnEstado.title = 'Vehículo en uso - Cambiar estado';
        } else { // INACTIVO
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Cambiar a Activo';
        }
        btnEstado.onclick = () => cambiarEstadoVehiculo(veh);
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar vehículo';
        btnEliminar.onclick = () => eliminarVehiculo(veh.vehiculo_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(vehiculos.length);
    actualizarControlesPaginacion(vehiculos.length);
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 vehículos';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} vehículos`;
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
    renderizarTabla(filteredVehiculos);
    
    const tabla = document.getElementById('tabla-vehiculos');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar vehículos
function filtrarVehiculos() {
    const searchInput = document.getElementById('search-vehiculos');
    if (!searchInput) {
        filteredVehiculos = vehiculosData;
        currentPage = 1;
        renderizarTabla(filteredVehiculos);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredVehiculos = vehiculosData;
    } else {
        filteredVehiculos = vehiculosData.filter(veh => {
            const placa = veh.placa ? veh.placa.toLowerCase() : '';
            const modelo = veh.modelo ? veh.modelo.toLowerCase() : '';
            const marca = veh.marca ? veh.marca.toLowerCase() : '';
            const tipo = veh.tipo_vehiculo ? veh.tipo_vehiculo.toLowerCase() : '';
            const estado = veh.estado ? veh.estado.toLowerCase().replace('_', ' ') : '';
            const anio = veh.anio_fabricacion ? veh.anio_fabricacion.toString() : '';
            
            return placa.includes(searchTerm) ||
                   modelo.includes(searchTerm) ||
                   marca.includes(searchTerm) ||
                   tipo.includes(searchTerm) ||
                   estado.includes(searchTerm) ||
                   anio.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredVehiculos);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarVehiculos();
    }, 300);
}

// Función para abrir modal de nuevo vehículo
function abrirModalNuevoVehiculo() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-vehiculo');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo vehículo';
    
    // Limpiar formulario
    document.getElementById('vehiculo_id').value = '';
    document.getElementById('placa').value = '';
    document.getElementById('marca').value = '';
    document.getElementById('modelo').value = '';
    document.getElementById('tipo_vehiculo').value = '';
    document.getElementById('anio_fabricacion').value = '';
    document.getElementById('cantidad_carga').value = '';
    document.getElementById('estado').value = 'ACTIVO';
    
    form.classList.remove('was-validated');
    
    $('#modal-vehiculo').modal('show');
}

// Función para abrir modal de edición
async function editarVehiculo(id) {
    try {
        const response = await fetch(`/main/vehiculo/obtener_vehiculo_xid/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el vehículo');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el vehículo');
        }
        
        const vehiculo = data.vehiculo;
        
        document.getElementById('modal-titulo').textContent = 'Editar vehículo';
        document.getElementById('vehiculo_id').value = vehiculo.vehiculo_id;
        document.getElementById('placa').value = vehiculo.placa || '';
        document.getElementById('marca').value = vehiculo.marca || '';
        document.getElementById('modelo').value = vehiculo.modelo || '';
        document.getElementById('tipo_vehiculo').value = vehiculo.tipo_vehiculo || '';
        document.getElementById('anio_fabricacion').value = vehiculo.anio_fabricacion || '';
        document.getElementById('cantidad_carga').value = vehiculo.cantidad_carga || '';
        document.getElementById('estado').value = vehiculo.estado || 'ACTIVO';
        
        $('#modal-vehiculo').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el vehículo para editar');
    }
}

// Función para validar datos del formulario
function validarFormulario() {
    const form = document.getElementById('form-vehiculo');
    if (!form) return false;
    
    // Validar campos obligatorios
    const placa = document.getElementById('placa').value.trim();
    const marca = document.getElementById('marca').value.trim();
    const modelo = document.getElementById('modelo').value.trim();
    const tipo = document.getElementById('tipo_vehiculo').value;
    const anio = document.getElementById('anio_fabricacion').value;
    const carga = document.getElementById('cantidad_carga').value;
    const estado = document.getElementById('estado').value;
    
    if (!placa) {
        mostrarError('Por favor ingrese la placa del vehículo');
        return false;
    }
    
    // Validar formato de placa (simple)
    const placaRegex = /^[A-Z0-9-]{3,15}$/i;
    if (!placaRegex.test(placa)) {
        mostrarError('La placa debe tener entre 3 y 15 caracteres alfanuméricos y guiones');
        return false;
    }
    
    if (!marca) {
        mostrarError('Por favor ingrese la marca del vehículo');
        return false;
    }
    
    if (!modelo) {
        mostrarError('Por favor ingrese el modelo del vehículo');
        return false;
    }
    
    if (!tipo) {
        mostrarError('Por favor seleccione el tipo de vehículo');
        return false;
    }
    
    if (!anio || isNaN(anio) || anio < 1900 || anio > 2025) {
        mostrarError('Por favor ingrese un año de fabricación válido (1900-2025)');
        return false;
    }
    
    if (!carga || isNaN(carga) || parseFloat(carga) <= 0) {
        mostrarError('Por favor ingrese una capacidad de carga válida (mayor a 0)');
        return false;
    }
    
    if (!estado) {
        mostrarError('Por favor seleccione el estado del vehículo');
        return false;
    }
    
    return true;
}

// Función para guardar vehículo
async function guardarVehiculo() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-vehiculo');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('vehiculo_id').value;
    
    const datos = {
        placa: document.getElementById('placa').value.trim().toUpperCase(),
        marca: document.getElementById('marca').value.trim(),
        modelo: document.getElementById('modelo').value.trim(),
        tipo_vehiculo: document.getElementById('tipo_vehiculo').value,
        anio_fabricacion: parseInt(document.getElementById('anio_fabricacion').value),
        cantidad_carga: parseFloat(document.getElementById('cantidad_carga').value),
        estado: document.getElementById('estado').value
    };
    
    const url = id ? `/main/vehiculo/actualizar_vehiculo/${id}` : '/main/vehiculo/registrar';
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
            mostrarExito(result.mensaje || 'Vehículo guardado exitosamente');
            $('#modal-vehiculo').modal('hide');
            // Recargar los datos después de guardar
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            throw new Error(result.error || 'Error al guardar el vehículo');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado del vehículo (CORREGIDA)
async function cambiarEstadoVehiculo(vehiculo) {
    // Ciclo de estados: ACTIVO -> INACTIVO -> ACTIVO
    // EN_USO se asigna manualmente (no en el ciclo automático)
    let nuevoEstado = '';
    let titulo = '';
    let texto = '';
    
    if (vehiculo.estado === 'ACTIVO') {
        nuevoEstado = 'INACTIVO';
        titulo = 'Desactivar vehículo';
        texto = `¿Está seguro que desea cambiar el estado del vehículo con placa "${vehiculo.placa}" de ACTIVO a INACTIVO?`;
    } else if (vehiculo.estado === 'INACTIVO') {
        nuevoEstado = 'ACTIVO';
        titulo = 'Activar vehículo';
        texto = `¿Está seguro que desea cambiar el estado del vehículo con placa "${vehiculo.placa}" de INACTIVO a ACTIVO?`;
    } else { // EN_USO
        // Si está EN_USO, preguntar qué hacer
        Swal.fire({
            title: 'Vehículo en uso',
            text: `El vehículo con placa "${vehiculo.placa}" está actualmente EN_USO. ¿Desea marcarlo como inactivo?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, marcar inactivo',
            cancelButtonText: 'Cancelar',
            background: '#152a3a',
            color: '#e0f2fe'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`/main/vehiculo/cambiar_estado/${vehiculo.vehiculo_id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ estado: 'INACTIVO' })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
                    } else {
                        throw new Error(data.error || 'Error al cambiar el estado del vehículo');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarError('No se pudo cambiar el estado del vehículo: ' + error.message);
                }
            }
        });
        return;
    }
    
    Swal.fire({
        title: titulo,
        text: texto,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/vehiculo/cambiar_estado/${vehiculo.vehiculo_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado del vehículo');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del vehículo: ' + error.message);
            }
        }
    });
}

// Función para eliminar vehículo
async function eliminarVehiculo(id) {
    const vehiculo = vehiculosData.find(v => v.vehiculo_id == id);
    if (!vehiculo) return;
    
    Swal.fire({
        title: 'Eliminar vehículo',
        text: `¿Está seguro que desea eliminar permanentemente el vehículo con placa "${vehiculo.placa}"? Esta acción no se puede deshacer.`,
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
                const response = await fetch(`/main/vehiculo/eliminar_vehiculo/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Vehículo eliminado exitosamente');
                    // Recargar los datos después de eliminar
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error al eliminar el vehículo');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo eliminar el vehículo: ' + error.message);
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
    cargarVehiculos();
    
    // Botón nuevo vehículo
    const btnNuevoVehiculo = document.getElementById('btn-nuevo-vehiculo');
    if (btnNuevoVehiculo) {
        btnNuevoVehiculo.addEventListener('click', abrirModalNuevoVehiculo);
    }
    
    // Botón guardar vehículo
    const btnGuardarVehiculo = document.getElementById('btn-guardar-vehiculo');
    if (btnGuardarVehiculo) {
        btnGuardarVehiculo.addEventListener('click', guardarVehiculo);
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-vehiculos');
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
            renderizarTabla(filteredVehiculos);
        });
    }
    
    // Limpiar modal al cerrar
    $('#modal-vehiculo').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-vehiculo');
        if (form) {
            form.classList.remove('was-validated');
        }
    });
    
    // Permitir Enter en formulario
    const formVehiculo = document.getElementById('form-vehiculo');
    if (formVehiculo) {
        formVehiculo.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarVehiculo();
            }
        });
    }
});