// Variables globales
let asignacionesData = [];
let conductoresList = [];
let vehiculosList = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredAsignaciones = [];
let searchTimeout = null;

// Función para obtener la fecha actual en formato YYYY-MM-DD
function getFechaActual() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Función para cargar las asignaciones
async function cargarAsignaciones() {
    try {
        const response = await fetch('/main/vehiculo_conductor/obtener_asignaciones');
        if (!response.ok) {
            throw new Error('Error al cargar las asignaciones');
        }
        
        const data = await response.json();
        if (data.success) {
            asignacionesData = data.asignaciones || [];
            filtrarAsignaciones();
        } else {
            throw new Error(data.error || 'Error al cargar las asignaciones');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar las asignaciones');
    }
}

// Función para cargar conductores (para el select)
async function cargarConductores() {
    try {
        const response = await fetch('/main/vehiculo_conductor/obtener_conductores');
        if (!response.ok) {
            throw new Error('Error al cargar los conductores');
        }
        
        const data = await response.json();
        if (data.success) {
            conductoresList = data.conductores || [];
            llenarSelectConductores();
        } else {
            console.warn('No se pudieron cargar los conductores:', data.error);
        }
    } catch (error) {
        console.error('Error cargando conductores:', error);
    }
}

// Función para llenar el select de conductores
function llenarSelectConductores() {
    const select = document.getElementById('conductor_id');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccione un conductor</option>';
    
    conductoresList.forEach(cond => {
        const option = document.createElement('option');
        option.value = cond.conductor_id;
        option.textContent = `${cond.nombre} ${cond.apellido_paterno} ${cond.apellido_materno} - DNI: ${cond.dni}`;
        select.appendChild(option);
    });
    
    // Restaurar el valor seleccionado si existe
    if (currentValue) {
        select.value = currentValue;
    }
}

// Función para cargar vehículos (para el select)
async function cargarVehiculos() {
    try {
        const response = await fetch('/main/vehiculo_conductor/obtener_vehiculos');
        if (!response.ok) {
            throw new Error('Error al cargar los vehículos');
        }
        
        const data = await response.json();
        if (data.success) {
            vehiculosList = data.vehiculos || [];
            llenarSelectVehiculos();
        } else {
            console.warn('No se pudieron cargar los vehículos:', data.error);
        }
    } catch (error) {
        console.error('Error cargando vehículos:', error);
    }
}

// Función para llenar el select de vehículos
function llenarSelectVehiculos() {
    const select = document.getElementById('vehiculo_id');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Seleccione un vehículo</option>';
    
    vehiculosList.forEach(veh => {
        const option = document.createElement('option');
        option.value = veh.vehiculo_id;
        option.textContent = `${veh.marca} ${veh.modelo} - Placa: ${veh.placa}`;
        select.appendChild(option);
    });
    
    // Restaurar el valor seleccionado si existe
    if (currentValue) {
        select.value = currentValue;
    }
}

// Función para mostrar información adicional al seleccionar
function setupSelectListeners() {
    const conductorSelect = document.getElementById('conductor_id');
    const vehiculoSelect = document.getElementById('vehiculo_id');
    const infoDiv = document.getElementById('info-adicional');
    const conductorInfo = document.getElementById('conductor-info');
    const vehiculoInfo = document.getElementById('vehiculo-info');

    if (conductorSelect) {
        conductorSelect.addEventListener('change', () => {
            const id = conductorSelect.value;
            if (id && infoDiv) {
                const conductor = conductoresList.find(c => c.conductor_id == id);
                if (conductor) {
                    conductorInfo.innerHTML = `<strong>Conductor:</strong> ${conductor.nombre} ${conductor.apellido_paterno} ${conductor.apellido_materno} (DNI: ${conductor.dni})<br>`;
                    if (vehiculoSelect && vehiculoSelect.value) {
                        infoDiv.style.display = 'block';
                    }
                }
            } else if (infoDiv) {
                infoDiv.style.display = 'none';
            }
        });
    }

    if (vehiculoSelect) {
        vehiculoSelect.addEventListener('change', () => {
            const id = vehiculoSelect.value;
            if (id && infoDiv) {
                const vehiculo = vehiculosList.find(v => v.vehiculo_id == id);
                if (vehiculo) {
                    vehiculoInfo.innerHTML = `<strong>Vehículo:</strong> ${vehiculo.marca} ${vehiculo.modelo} (Placa: ${vehiculo.placa}) - Capacidad: ${vehiculo.cantidad_carga} kg`;
                    if (conductorSelect && conductorSelect.value) {
                        infoDiv.style.display = 'block';
                    }
                }
            } else if (infoDiv) {
                infoDiv.style.display = 'none';
            }
        });
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(asignaciones) {
    const tbody = document.getElementById('tabla-asignaciones-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (asignaciones.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 6; // Cambiado a 6 porque ocultamos 2 columnas (ID y Fecha)
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-truck"></i>
            <h4>No se encontraron asignaciones</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar asignaciones por ID descendente (más recientes primero)
    const asignacionesOrdenadas = [...asignaciones].sort((a, b) => b.vehiculo_conductor_id - a.vehiculo_conductor_id);
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, asignacionesOrdenadas.length);
    const paginatedAsignaciones = asignacionesOrdenadas.slice(startIndex, endIndex);
    
    paginatedAsignaciones.forEach(asig => {
        const tr = document.createElement('tr');
        
        // Celda de ID (oculta)
        const tdId = document.createElement('td');
        tdId.style.display = 'none';
        tdId.textContent = asig.vehiculo_conductor_id;
        tr.appendChild(tdId);
        
        // Celda de Conductor
        const tdConductor = document.createElement('td');
        tdConductor.className = 'text-left';
        tdConductor.textContent = asig.nombre_conductor || 'N/A';
        tr.appendChild(tdConductor);
        
        // Celda de DNI Conductor
        const tdDni = document.createElement('td');
        tdDni.className = 'text-left';
        tdDni.textContent = asig.dni_conductor || 'N/A';
        tr.appendChild(tdDni);
        
        // Celda de Vehículo (Placa)
        const tdVehiculo = document.createElement('td');
        tdVehiculo.className = 'text-left';
        tdVehiculo.textContent = asig.placa_vehiculo || 'N/A';
        tr.appendChild(tdVehiculo);
        
        // Celda de Marca / Modelo
        const tdMarcaModelo = document.createElement('td');
        tdMarcaModelo.className = 'text-left';
        tdMarcaModelo.textContent = asig.marca_vehiculo && asig.modelo_vehiculo ? `${asig.marca_vehiculo} ${asig.modelo_vehiculo}` : 'N/A';
        tr.appendChild(tdMarcaModelo);
        
        // Celda de Fecha Asignación (oculta)
        const tdFecha = document.createElement('td');
        tdFecha.style.display = 'none';
        if (asig.fecha_asignacion) {
            const fecha = new Date(asig.fecha_asignacion + 'T00:00:00');
            tdFecha.textContent = fecha.toLocaleDateString('es-PE');
        } else {
            tdFecha.textContent = 'N/A';
        }
        tr.appendChild(tdFecha);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = asig.estado || 'INACTIVO';
        
        switch(asig.estado) {
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
            case 'EN_USO':
                estadoClass = 'estado-engargado';
                estadoIcono = '<i class="fas fa-truck"></i>';
                estadoTexto = 'En uso';
                break;
            default:
                estadoClass = 'estado-inactivo';
                estadoIcono = '<i class="fas fa-question-circle"></i>';
                estadoTexto = asig.estado || 'Desconocido';
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
        
        // Botón editar - Deshabilitado si estado es EN_USO
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        if (asig.estado === 'EN_USO') {
            btnEditar.classList.add('btn-secondary');
            btnEditar.classList.remove('btn-warning');
            btnEditar.title = 'No se puede editar (En uso)';
            btnEditar.disabled = true;
        } else {
            btnEditar.title = 'Editar asignación';
            btnEditar.onclick = () => editarAsignacion(asig.vehiculo_conductor_id);
        }
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado (solo si no está EN_USO)
        const btnEstado = document.createElement('button');
        if (asig.estado === 'ACTIVO') {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
            btnEstado.onclick = () => cambiarEstadoAsignacion(asig);
        } else if (asig.estado === 'INACTIVO') {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
            btnEstado.onclick = () => cambiarEstadoAsignacion(asig);
        } else if (asig.estado === 'EN_USO') {
            btnEstado.className = 'btn btn-secondary btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'No se puede cambiar (En uso)';
            btnEstado.disabled = true;
        }
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar asignación';
        if (asig.estado === 'EN_USO') {
            btnEliminar.classList.add('btn-secondary');
            btnEliminar.classList.remove('btn-danger');
            btnEliminar.title = 'No se puede eliminar (En uso)';
            btnEliminar.disabled = true;
        } else {
            btnEliminar.onclick = () => eliminarAsignacion(asig.vehiculo_conductor_id);
        }
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(asignaciones.length);
    actualizarControlesPaginacion(asignaciones.length);
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 asignaciones';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} asignaciones`;
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
    renderizarTabla(filteredAsignaciones);
    
    const tabla = document.getElementById('tabla-asignaciones');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar asignaciones
function filtrarAsignaciones() {
    const searchInput = document.getElementById('search-asignaciones');
    if (!searchInput) {
        filteredAsignaciones = asignacionesData;
        currentPage = 1;
        renderizarTabla(filteredAsignaciones);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredAsignaciones = asignacionesData;
    } else {
        filteredAsignaciones = asignacionesData.filter(asig => {
            const nombreConductor = asig.nombre_conductor ? asig.nombre_conductor.toLowerCase() : '';
            const dniConductor = asig.dni_conductor ? asig.dni_conductor.toLowerCase() : '';
            const placaVehiculo = asig.placa_vehiculo ? asig.placa_vehiculo.toLowerCase() : '';
            const marcaModelo = `${asig.marca_vehiculo || ''} ${asig.modelo_vehiculo || ''}`.toLowerCase();
            const estado = asig.estado ? asig.estado.toLowerCase().replace('_', ' ') : '';
            
            return nombreConductor.includes(searchTerm) ||
                   dniConductor.includes(searchTerm) ||
                   placaVehiculo.includes(searchTerm) ||
                   marcaModelo.includes(searchTerm) ||
                   estado.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredAsignaciones);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarAsignaciones();
    }, 300);
}

// Función para abrir modal de nueva asignación
function abrirModalNuevaAsignacion() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-asignacion');
    const infoDiv = document.getElementById('info-adicional');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nueva asignación';
    
    // Limpiar formulario
    document.getElementById('vehiculo_conductor_id').value = '';
    document.getElementById('conductor_id').value = '';
    document.getElementById('vehiculo_id').value = '';
    
    // Establecer valores por defecto en campos ocultos
    document.getElementById('fecha_asignacion').value = getFechaActual();
    document.getElementById('estado_asignacion').value = 'ACTIVO';
    
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
    
    form.classList.remove('was-validated');
    
    $('#modal-asignacion').modal('show');
}

// Función para abrir modal de edición
async function editarAsignacion(id) {
    try {
        const response = await fetch(`/main/vehiculo_conductor/obtener_asignacion_xid/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener la asignación');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener la asignación');
        }
        
        const asignacion = data.asignacion;
        
        // Verificar si la asignación está EN_USO
        if (asignacion.estado === 'EN_USO') {
            mostrarError('No se puede editar una asignación que está "En uso".');
            return;
        }
        
        document.getElementById('modal-titulo').textContent = 'Editar asignación';
        document.getElementById('vehiculo_conductor_id').value = asignacion.vehiculo_conductor_id;
        
        // Asegurar que los selects tengan los valores cargados antes de asignar
        if (conductoresList.length === 0) {
            await cargarConductores();
        }
        if (vehiculosList.length === 0) {
            await cargarVehiculos();
        }
        
        // Asignar valores a los selects
        const conductorSelect = document.getElementById('conductor_id');
        const vehiculoSelect = document.getElementById('vehiculo_id');
        
        conductorSelect.value = asignacion.conductor_id;
        vehiculoSelect.value = asignacion.vehiculo_id;
        
        // En edición, la fecha y estado se mantienen como estaban
        document.getElementById('fecha_asignacion').value = asignacion.fecha_asignacion;
        document.getElementById('estado_asignacion').value = asignacion.estado;
        
        // Mostrar info adicional si ambos están seleccionados
        const infoDiv = document.getElementById('info-adicional');
        const conductorInfo = document.getElementById('conductor-info');
        const vehiculoInfo = document.getElementById('vehiculo-info');
        
        if (infoDiv && conductorInfo && vehiculoInfo) {
            const conductor = conductoresList.find(c => c.conductor_id == asignacion.conductor_id);
            const vehiculo = vehiculosList.find(v => v.vehiculo_id == asignacion.vehiculo_id);
            
            if (conductor && vehiculo) {
                conductorInfo.innerHTML = `<strong>Conductor:</strong> ${conductor.nombre} ${conductor.apellido_paterno} ${conductor.apellido_materno} (DNI: ${conductor.dni})<br>`;
                vehiculoInfo.innerHTML = `<strong>Vehículo:</strong> ${vehiculo.marca} ${vehiculo.modelo} (Placa: ${vehiculo.placa}) - Capacidad: ${vehiculo.cantidad_carga} kg`;
                infoDiv.style.display = 'block';
            }
        }
        
        $('#modal-asignacion').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar la asignación para editar');
    }
}

// Función para validar datos del formulario
function validarFormulario() {
    const conductorId = document.getElementById('conductor_id').value;
    const vehiculoId = document.getElementById('vehiculo_id').value;
    
    if (!conductorId) {
        mostrarError('Por favor seleccione un conductor');
        return false;
    }
    
    if (!vehiculoId) {
        mostrarError('Por favor seleccione un vehículo');
        return false;
    }
    
    return true;
}

// Función para guardar asignación
async function guardarAsignacion() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-asignacion');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('vehiculo_conductor_id').value;
    const estadoActual = document.getElementById('estado_asignacion').value;
    
    // Validar si está EN_USO (no debería poder editarse, pero validamos por si acaso)
    if (id && estadoActual === 'EN_USO') {
        mostrarError('No se puede editar una asignación que está "En uso".');
        $('#modal-asignacion').modal('hide');
        return;
    }
    
    const datos = {
        conductor_id: parseInt(document.getElementById('conductor_id').value),
        vehiculo_id: parseInt(document.getElementById('vehiculo_id').value),
        fecha_asignacion: document.getElementById('fecha_asignacion').value,
        estado: document.getElementById('estado_asignacion').value
    };
    
    const url = id ? `/main/vehiculo_conductor/actualizar_asignacion/${id}` : '/main/vehiculo_conductor/registrar';
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
            mostrarExito(result.mensaje || 'Asignación guardada exitosamente');
            $('#modal-asignacion').modal('hide');
            // Recargar datos
            setTimeout(() => {
                cargarAsignaciones();
            }, 1000);
        } else {
            throw new Error(result.error || 'Error al guardar la asignación');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado de la asignación
async function cambiarEstadoAsignacion(asignacion) {
    // Validación de seguridad: no permitir cambio si está EN_USO
    if (asignacion.estado === 'EN_USO') {
        mostrarError('No se puede cambiar el estado de una asignación que está "En uso".');
        return;
    }
    
    let nuevoEstado = '';
    let titulo = '';
    let texto = '';
    
    if (asignacion.estado === 'ACTIVO') {
        nuevoEstado = 'INACTIVO';
        titulo = 'Dar de baja asignación';
        texto = `¿Está seguro que desea dar de baja la asignación del conductor "${asignacion.nombre_conductor}" con el vehículo "${asignacion.placa_vehiculo}"?`;
    } else if (asignacion.estado === 'INACTIVO') {
        nuevoEstado = 'ACTIVO';
        titulo = 'Activar asignación';
        texto = `¿Está seguro que desea activar la asignación del conductor "${asignacion.nombre_conductor}" con el vehículo "${asignacion.placa_vehiculo}"?`;
    } else {
        return;
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
                const response = await fetch(`/main/vehiculo_conductor/cambiar_estado/${asignacion.vehiculo_conductor_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                    cargarAsignaciones(); // Recargar datos
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado de la asignación');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado de la asignación: ' + error.message);
            }
        }
    });
}

// Función para eliminar asignación
async function eliminarAsignacion(id) {
    const asignacion = asignacionesData.find(a => a.vehiculo_conductor_id == id);
    if (!asignacion) return;
    
    // Validación: no permitir eliminar si está EN_USO
    if (asignacion.estado === 'EN_USO') {
        mostrarError('No se puede eliminar una asignación que está "En uso". Debe cambiarla a "Inactivo" primero.');
        return;
    }
    
    Swal.fire({
        title: 'Eliminar asignación',
        text: `¿Está seguro que desea eliminar permanentemente la asignación del conductor "${asignacion.nombre_conductor}"? Esta acción no se puede deshacer.`,
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
                const response = await fetch(`/main/vehiculo_conductor/eliminar_asignacion/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Asignación eliminada exitosamente');
                    cargarAsignaciones(); // Recargar datos
                } else {
                    throw new Error(data.error || 'Error al eliminar la asignación');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo eliminar la asignación: ' + error.message);
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
    cargarAsignaciones();
    cargarConductores();
    cargarVehiculos();
    
    // Setup listeners para selects
    setupSelectListeners();
    
    // Botón nueva asignación
    const btnNuevaAsignacion = document.getElementById('btn-nueva-asignacion');
    if (btnNuevaAsignacion) {
        btnNuevaAsignacion.addEventListener('click', abrirModalNuevaAsignacion);
    }
    
    // Botón guardar asignación
    const btnGuardarAsignacion = document.getElementById('btn-guardar-asignacion');
    if (btnGuardarAsignacion) {
        btnGuardarAsignacion.addEventListener('click', guardarAsignacion);
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-asignaciones');
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
            renderizarTabla(filteredAsignaciones);
        });
    }
    
    // Limpiar modal al cerrar
    $('#modal-asignacion').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-asignacion');
        if (form) {
            form.classList.remove('was-validated');
        }
        
        const infoDiv = document.getElementById('info-adicional');
        if (infoDiv) {
            infoDiv.style.display = 'none';
        }
        
        // Limpiar valores de los selects
        const conductorSelect = document.getElementById('conductor_id');
        const vehiculoSelect = document.getElementById('vehiculo_id');
        if (conductorSelect) conductorSelect.value = '';
        if (vehiculoSelect) vehiculoSelect.value = '';
    });
    
    // Permitir Enter en formulario
    const formAsignacion = document.getElementById('form-asignacion');
    if (formAsignacion) {
        formAsignacion.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarAsignacion();
            }
        });
    }
});