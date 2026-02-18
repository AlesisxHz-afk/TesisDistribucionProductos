// Variables globales
let enviosData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredEnvios = [];
let searchTimeout = null;

// Variables para datos de selects
let almacenes = [];
let productos = [];
let vehiculosConductores = [];

// Variables para seguimiento en tiempo real
let intervaloUbicacion = null;
let envioEnSeguimiento = null;

// ==================== FUNCIONES PRINCIPALES ====================

// Función para cargar los envíos (solo posteriores a fecha actual)
async function cargarEnvios() {
    try {
        const response = await fetch('/main/distribucion_almacen_producto/obtener_envios');
        if (!response.ok) {
            throw new Error('Error al cargar los envíos');
        }
        
        const data = await response.json();
        if (data.success) {
            enviosData = data.envios || [];
            filtrarEnvios();
            
            // Verificar si hay envíos en ruta para reanudar seguimiento
            verificarSeguimientoActivo();
        } else {
            throw new Error(data.error || 'Error al cargar los envíos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los envíos');
    }
}

// Función para cargar datos para selects (almacenes, productos, vehículos)
async function cargarDatosSelects() {
    try {
        // Cargar almacenes activos
        const responseAlmacenes = await fetch('/main/almacen/obtener_almacenes_activos');
        if (responseAlmacenes.ok) {
            const data = await responseAlmacenes.json();
            almacenes = data.almacenes || [];
        } else {
            console.warn('No se pudieron cargar los almacenes');
        }
        
        // Cargar productos activos con stock
        const responseProductos = await fetch('/main/producto/obtener_productos_activos_con_stock');
        if (responseProductos.ok) {
            const data = await responseProductos.json();
            productos = data.productos || [];
        } else {
            console.warn('No se pudieron cargar los productos');
        }
        
        // Cargar vehículos-conductores activos
        const responseVehiculos = await fetch('/main/vehiculo_conductor/obtener_activos');
        if (responseVehiculos.ok) {
            const data = await responseVehiculos.json();
            vehiculosConductores = data.vehiculos_conductores || [];
        } else {
            console.warn('No se pudieron cargar los vehículos-conductores');
        }
    } catch (error) {
        console.error('Error cargando datos para selects:', error);
    }
}

// ==================== FUNCIONES DE RENDERIZADO ====================

// Función para renderizar la tabla
function renderizarTabla(envios) {
    const tbody = document.getElementById('tabla-envios-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (envios.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-truck"></i>
            <h4>No se encontraron envíos</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar envíos por fecha (más recientes primero)
    const enviosOrdenados = [...envios].sort((a, b) => {
        const fechaA = a.fecha_envio ? new Date(a.fecha_envio) : new Date(0);
        const fechaB = b.fecha_envio ? new Date(b.fecha_envio) : new Date(0);
        return fechaB - fechaA;
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, enviosOrdenados.length);
    const paginatedEnvios = enviosOrdenados.slice(startIndex, endIndex);
    
    paginatedEnvios.forEach(envio => {
        const tr = document.createElement('tr');
        
        // N° Envío
        const tdNroEnvio = document.createElement('td');
        tdNroEnvio.className = 'text-left';
        tdNroEnvio.innerHTML = `<strong>${envio.nro_envio || 'N/A'}</strong>`;
        tr.appendChild(tdNroEnvio);
        
        // Almacén
        const tdAlmacen = document.createElement('td');
        tdAlmacen.className = 'text-left';
        tdAlmacen.textContent = envio.almacen_nombre || 'N/A';
        tr.appendChild(tdAlmacen);
        
        // Producto
        const tdProducto = document.createElement('td');
        tdProducto.className = 'text-left';
        tdProducto.textContent = envio.producto_nombre || 'N/A';
        tr.appendChild(tdProducto);
        
        // Vehículo / Conductor
        const tdVehiculo = document.createElement('td');
        tdVehiculo.className = 'text-left';
        const vehiculoTexto = envio.vehiculo_placa ? 
            `${envio.vehiculo_placa} - ${envio.conductor_nombre || ''}` : 
            'N/A';
        tdVehiculo.textContent = vehiculoTexto;
        tr.appendChild(tdVehiculo);
        
        // Demanda
        const tdDemanda = document.createElement('td');
        tdDemanda.className = 'text-left';
        tdDemanda.textContent = envio.demanda ? 
            parseFloat(envio.demanda).toFixed(2) + ' kg' : 
            '0.00 kg';
        tr.appendChild(tdDemanda);
        
        // Estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = envio.estado_envio || 'PENDIENTE';
        
        switch(envio.estado_envio) {
            case 'PENDIENTE':
                estadoClass = 'estado-pendiente';
                estadoIcono = '<i class="fas fa-clock"></i>';
                break;
            case 'EN_RUTA':
                estadoClass = 'estado-enruta';
                estadoIcono = '<i class="fas fa-truck"></i>';
                break;
            case 'ENTREGADO':
                estadoClass = 'estado-entregado';
                estadoIcono = '<i class="fas fa-check-circle"></i>';
                break;
            case 'CANCELADO':
                estadoClass = 'estado-cancelado';
                estadoIcono = '<i class="fas fa-times-circle"></i>';
                break;
            default:
                estadoClass = 'estado-pendiente';
                estadoIcono = '<i class="fas fa-clock"></i>';
        }
        
        estadoBadge.className = estadoClass;
        estadoBadge.innerHTML = `${estadoIcono} ${estadoTexto}`;
        tdEstado.appendChild(estadoBadge);
        tr.appendChild(tdEstado);
        
        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón ver detalle (siempre visible)
        const btnDetalle = document.createElement('button');
        btnDetalle.className = 'btn btn-info btn-sm';
        btnDetalle.innerHTML = '<i class="fas fa-eye"></i>';
        btnDetalle.title = 'Ver detalle';
        btnDetalle.onclick = () => verDetalleEnvio(envio.asignacion_id);
        divAcciones.appendChild(btnDetalle);
        
        // Botón editar (solo si está PENDIENTE)
        if (envio.estado_envio === 'PENDIENTE') {
            const btnEditar = document.createElement('button');
            btnEditar.className = 'btn btn-warning btn-sm';
            btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
            btnEditar.title = 'Editar envío';
            btnEditar.onclick = () => editarEnvio(envio.asignacion_id);
            divAcciones.appendChild(btnEditar);
        }
        
        // Botón iniciar (solo si es PENDIENTE)
        if (envio.estado_envio === 'PENDIENTE') {
            const btnIniciar = document.createElement('button');
            btnIniciar.className = 'btn btn-success btn-sm';
            btnIniciar.innerHTML = '<i class="fas fa-play"></i>';
            btnIniciar.title = 'Iniciar envío';
            btnIniciar.onclick = () => iniciarEnvio(envio);
            divAcciones.appendChild(btnIniciar);
        }
        
        // Botón completar (solo si es EN_RUTA)
        if (envio.estado_envio === 'EN_RUTA') {
            const btnCompletar = document.createElement('button');
            btnCompletar.className = 'btn btn-primary btn-sm';
            btnCompletar.innerHTML = '<i class="fas fa-check-circle"></i>';
            btnCompletar.title = 'Completar envío';
            btnCompletar.onclick = () => completarEnvio(envio);
            divAcciones.appendChild(btnCompletar);
        }
        
        // Botón ver ubicación (solo si está EN_RUTA)
        if (envio.estado_envio === 'EN_RUTA') {
            const btnUbicacion = document.createElement('button');
            btnUbicacion.className = 'btn btn-info btn-sm';
            btnUbicacion.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
            btnUbicacion.title = 'Ver ubicación actual';
            btnUbicacion.onclick = () => verUbicacionConductor(envio);
            divAcciones.appendChild(btnUbicacion);
        }
        
        // Botón cancelar (solo si es PENDIENTE)
        if (envio.estado_envio === 'PENDIENTE') {
            const btnCancelar = document.createElement('button');
            btnCancelar.className = 'btn btn-danger btn-sm';
            btnCancelar.innerHTML = '<i class="fas fa-ban"></i>';
            btnCancelar.title = 'Cancelar envío';
            btnCancelar.onclick = () => cancelarEnvio(envio);
            divAcciones.appendChild(btnCancelar);
        }
        
        // Botón PDF (siempre visible)
        const btnPdf = document.createElement('button');
        btnPdf.className = 'btn btn-success btn-sm';
        btnPdf.innerHTML = '<i class="fas fa-file-pdf"></i>';
        btnPdf.title = 'Descargar PDF';
        btnPdf.onclick = () => generarPDF(envio.asignacion_id);
        divAcciones.appendChild(btnPdf);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(envios.length);
    actualizarControlesPaginacion(envios.length);
}

// ==================== FUNCIONES DE PAGINACIÓN ====================

function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 envíos';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} envíos`;
    }
}

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

function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarTabla(filteredEnvios);
    
    const tabla = document.getElementById('tabla-envios');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==================== FUNCIONES DE BÚSQUEDA ====================

function filtrarEnvios() {
    const searchInput = document.getElementById('search-envios');
    if (!searchInput) {
        filteredEnvios = enviosData;
        currentPage = 1;
        renderizarTabla(filteredEnvios);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredEnvios = enviosData;
    } else {
        filteredEnvios = enviosData.filter(envio => {
            const nroEnvio = envio.nro_envio ? envio.nro_envio.toLowerCase() : '';
            const almacen = envio.almacen_nombre ? envio.almacen_nombre.toLowerCase() : '';
            const producto = envio.producto_nombre ? envio.producto_nombre.toLowerCase() : '';
            const vehiculo = envio.vehiculo_placa ? envio.vehiculo_placa.toLowerCase() : '';
            const conductor = envio.conductor_nombre ? envio.conductor_nombre.toLowerCase() : '';
            const estado = envio.estado_envio ? envio.estado_envio.toLowerCase() : '';
            
            return nroEnvio.includes(searchTerm) ||
                   almacen.includes(searchTerm) ||
                   producto.includes(searchTerm) ||
                   vehiculo.includes(searchTerm) ||
                   conductor.includes(searchTerm) ||
                   estado.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredEnvios);
}

function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarEnvios();
    }, 300);
}

// ==================== FUNCIONES DEL MODAL ====================

function llenarSelects() {
    // Llenar select de almacenes
    const selectAlmacen = document.getElementById('almacen_id');
    if (selectAlmacen) {
        selectAlmacen.innerHTML = '<option value="">Seleccione almacén</option>';
        almacenes.forEach(alm => {
            const option = document.createElement('option');
            option.value = alm.almacen_id;
            option.textContent = `${alm.nombre} (Cap: ${parseFloat(alm.capacidad).toFixed(2)} kg)`;
            option.dataset.capacidad = alm.capacidad;
            selectAlmacen.appendChild(option);
        });
    }
    
    // Llenar select de productos
    const selectProducto = document.getElementById('producto_id');
    if (selectProducto) {
        selectProducto.innerHTML = '<option value="">Seleccione producto</option>';
        productos.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.producto_id;
            option.textContent = `${prod.nombre} (Stock: ${parseFloat(prod.cant_productos_act).toFixed(2)} kg)`;
            option.dataset.stock = prod.cant_productos_act;
            selectProducto.appendChild(option);
        });
    }
    
    // Llenar select de vehículos-conductores
    const selectVehiculo = document.getElementById('vehiculo_conductor_id');
    if (selectVehiculo) {
        selectVehiculo.innerHTML = '<option value="">Seleccione vehículo y conductor</option>';
        vehiculosConductores.forEach(vc => {
            const option = document.createElement('option');
            option.value = vc.vehiculo_conductor_id;
            option.textContent = `${vc.placa} - ${vc.conductor_nombre} (Cap: ${vc.cantidad_carga} kg)`;
            option.dataset.capacidad = vc.cantidad_carga;
            option.dataset.conductorId = vc.conductor_id;
            selectVehiculo.appendChild(option);
        });
    }
}

function abrirModalNuevoEnvio() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-envio');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo envío';
    
    // Generar número de envío
    const nroEnvio = generarNroEnvio();
    
    // Limpiar formulario
    document.getElementById('asignacion_id').value = '';
    document.getElementById('nro_envio').value = nroEnvio;
    document.getElementById('fecha_envio').value = '';
    document.getElementById('hora_envio').value = '';
    document.getElementById('almacen_id').value = '';
    document.getElementById('producto_id').value = '';
    document.getElementById('vehiculo_conductor_id').value = '';
    document.getElementById('demanda').value = '';
    document.getElementById('dia').value = '';
    document.getElementById('mes').value = '';
    document.getElementById('anio').value = '';
    document.getElementById('original_producto_id').value = '';
    document.getElementById('original_almacen_id').value = '';
    document.getElementById('original_demanda').value = '';
    
    // Ocultar info de validación
    document.getElementById('validacion-info').style.display = 'none';
    
    form.classList.remove('was-validated');
    
    // Llenar selects
    llenarSelects();
    
    $('#modal-envio').modal('show');
}

async function editarEnvio(id) {
    try {
        const response = await fetch(`/main/distribucion_almacen_producto/obtener_envio/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el envío');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el envío');
        }
        
        const envio = data.envio;
        
        // Cargar datos para selects
        await cargarDatosSelects();
        llenarSelects();
        
        document.getElementById('modal-titulo').textContent = 'Editar envío';
        document.getElementById('asignacion_id').value = envio.asignacion_id;
        document.getElementById('nro_envio').value = envio.nro_envio;
        document.getElementById('fecha_envio').value = envio.fecha_envio;
        document.getElementById('hora_envio').value = envio.hora_envio;
        document.getElementById('almacen_id').value = envio.almacen_id;
        document.getElementById('producto_id').value = envio.producto_id;
        document.getElementById('vehiculo_conductor_id').value = envio.vehiculo_conductor_id;
        document.getElementById('demanda').value = envio.demanda;
        
        // Extraer día, mes, año de la fecha
        if (envio.fecha_envio) {
            const fecha = new Date(envio.fecha_envio);
            document.getElementById('dia').value = fecha.getDate();
            document.getElementById('mes').value = fecha.getMonth() + 1;
            document.getElementById('anio').value = fecha.getFullYear();
        }
        
        // Guardar valores originales
        document.getElementById('original_producto_id').value = envio.producto_id;
        document.getElementById('original_almacen_id').value = envio.almacen_id;
        document.getElementById('original_demanda').value = envio.demanda;
        
        document.getElementById('validacion-info').style.display = 'none';
        
        $('#modal-envio').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el envío para editar');
    }
}

function generarNroEnvio() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ENV-${año}${mes}${dia}-${random}`;
}

// ==================== FUNCIONES DE VALIDACIÓN Y GUARDADO ====================

async function validarFormulario() {
    const form = document.getElementById('form-envio');
    if (!form) return false;
    
    // Validar campos obligatorios
    const fechaEnvio = document.getElementById('fecha_envio').value;
    const horaEnvio = document.getElementById('hora_envio').value;
    const almacenId = document.getElementById('almacen_id').value;
    const productoId = document.getElementById('producto_id').value;
    const vehiculoConductorId = document.getElementById('vehiculo_conductor_id').value;
    const demanda = parseFloat(document.getElementById('demanda').value);
    
    if (!fechaEnvio) {
        mostrarError('Por favor seleccione la fecha de envío');
        return false;
    }
    
    if (!horaEnvio) {
        mostrarError('Por favor seleccione la hora de envío');
        return false;
    }
    
    if (!almacenId) {
        mostrarError('Por favor seleccione el almacén');
        return false;
    }
    
    if (!productoId) {
        mostrarError('Por favor seleccione el producto');
        return false;
    }
    
    if (!vehiculoConductorId) {
        mostrarError('Por favor seleccione el vehículo y conductor');
        return false;
    }
    
    if (!demanda || isNaN(demanda) || demanda <= 0) {
        mostrarError('Por favor ingrese una demanda válida (mayor a 0)');
        return false;
    }
    
    // Validar con el servidor
    const validacion = await validarEnvioServidor();
    return validacion;
}

async function validarEnvioServidor() {
    const id = document.getElementById('asignacion_id').value;
    const data = {
        asignacion_id: id || null,
        fecha_envio: document.getElementById('fecha_envio').value,
        hora_envio: document.getElementById('hora_envio').value,
        almacen_id: parseInt(document.getElementById('almacen_id').value),
        producto_id: parseInt(document.getElementById('producto_id').value),
        vehiculo_conductor_id: parseInt(document.getElementById('vehiculo_conductor_id').value),
        demanda: parseFloat(document.getElementById('demanda').value),
        original_producto_id: document.getElementById('original_producto_id').value ? 
            parseInt(document.getElementById('original_producto_id').value) : null,
        original_almacen_id: document.getElementById('original_almacen_id').value ?
            parseInt(document.getElementById('original_almacen_id').value) : null,
        original_demanda: document.getElementById('original_demanda').value ?
            parseFloat(document.getElementById('original_demanda').value) : null
    };
    
    try {
        const response = await fetch('/main/distribucion_almacen_producto/validar_envio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        const validacionInfo = document.getElementById('validacion-info');
        const validacionMensaje = document.getElementById('validacion-mensaje');
        
        if (result.success) {
            validacionInfo.style.display = 'none';
            return true;
        } else {
            validacionInfo.style.display = 'block';
            validacionMensaje.textContent = result.error || 'Error de validación';
            return false;
        }
    } catch (error) {
        console.error('Error validando:', error);
        return false;
    }
}

async function guardarEnvio() {
    if (!await validarFormulario()) {
        const form = document.getElementById('form-envio');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('asignacion_id').value;
    
    // Extraer día, mes, año de la fecha
    const fechaEnvio = document.getElementById('fecha_envio').value;
    const fecha = new Date(fechaEnvio);
    
    const datos = {
        almacen_id: parseInt(document.getElementById('almacen_id').value),
        producto_id: parseInt(document.getElementById('producto_id').value),
        vehiculo_conductor_id: parseInt(document.getElementById('vehiculo_conductor_id').value),
        fecha_envio: fechaEnvio,
        hora_envio: document.getElementById('hora_envio').value,
        dia: fecha.getDate(),
        mes: fecha.getMonth() + 1,
        anio: fecha.getFullYear(),
        demanda: parseFloat(document.getElementById('demanda').value),
        estado_envio: 'PENDIENTE',
        nro_envio: document.getElementById('nro_envio').value
    };
    
    // Agregar valores originales si es edición
    if (id) {
        datos.original_producto_id = parseInt(document.getElementById('original_producto_id').value);
        datos.original_almacen_id = parseInt(document.getElementById('original_almacen_id').value);
        datos.original_demanda = parseFloat(document.getElementById('original_demanda').value);
    }
    
    const url = id ? 
        `/main/distribucion_almacen_producto/actualizar_envio/${id}` : 
        '/main/distribucion_almacen_producto/registrar_envio';
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
            mostrarExito(result.mensaje || 'Envío guardado exitosamente');
            $('#modal-envio').modal('hide');
            setTimeout(() => {
                cargarEnvios(); // Recargar datos sin recargar página
            }, 1000);
        } else {
            throw new Error(result.error || 'Error al guardar el envío');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// ==================== FUNCIONES DE SEGUIMIENTO EN TIEMPO REAL ====================

// Función para iniciar envío
async function iniciarEnvio(envio) {
    if (envio.estado_envio !== 'PENDIENTE') {
        mostrarError('Solo se pueden iniciar envíos pendientes');
        return;
    }
    
    Swal.fire({
        title: 'Iniciar envío',
        text: `¿Está seguro que desea iniciar el envío "${envio.nro_envio}"? Se comenzará a registrar la ubicación en tiempo real.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#40e0d0',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, iniciar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Verificar soporte de geolocalización
                if (!navigator.geolocation) {
                    throw new Error('Tu navegador no soporta geolocalización');
                }
                
                // Mostrar indicador de carga
                Swal.fire({
                    title: 'Iniciando envío...',
                    text: 'Obteniendo ubicación actual',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    background: '#152a3a',
                    color: '#e0f2fe'
                });
                
                // Obtener ubicación actual
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // Primero obtener el conductor_id
                            const conductorResponse = await fetch(`/main/vehiculo_conductor/obtener_conductor_por_asignacion/${envio.vehiculo_conductor_id}`);
                            if (!conductorResponse.ok) {
                                throw new Error('Error al obtener datos del conductor');
                            }
                            
                            const conductorData = await conductorResponse.json();
                            if (!conductorData.success) {
                                throw new Error(conductorData.error || 'Error al obtener conductor');
                            }
                            
                            // Actualizar estado del envío a EN_RUTA
                            const response = await fetch(`/main/distribucion_almacen_producto/cambiar_estado/${envio.asignacion_id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ estado: 'EN_RUTA' })
                            });
                            
                            const data = await response.json();
                            
                            if (response.ok && data.success) {
                                // Guardar primera ubicación (actualiza el registro existente)
                                await actualizarUbicacionConductor(conductorData.conductor_id, position.coords);
                                
                                // Iniciar seguimiento cada 10 segundos
                                iniciarSeguimiento(envio, conductorData.conductor_id);
                                
                                Swal.close();
                                
                                mostrarExito('Envío iniciado exitosamente. El seguimiento comenzará cada 10 segundos.');
                                
                                // Actualizar la tabla sin recargar la página
                                setTimeout(() => {
                                    cargarEnvios();
                                }, 2000);
                            } else {
                                throw new Error(data.error || 'Error al iniciar el envío');
                            }
                        } catch (error) {
                            Swal.close();
                            console.error('Error:', error);
                            mostrarError(error.message);
                        }
                    },
                    (error) => {
                        Swal.close();
                        let mensaje = 'Error al obtener ubicación: ';
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                mensaje += 'Permiso denegado';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                mensaje += 'Ubicación no disponible';
                                break;
                            case error.TIMEOUT:
                                mensaje += 'Tiempo de espera agotado';
                                break;
                            default:
                                mensaje += error.message;
                        }
                        mostrarError(mensaje);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } catch (error) {
                Swal.close();
                console.error('Error:', error);
                mostrarError(error.message);
            }
        }
    });
}

// Función para actualizar ubicación del conductor
async function actualizarUbicacionConductor(conductorId, coords) {
    try {
        const ubicacionResponse = await fetch('/main/conductor/actualizar_ubicacion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conductor_id: conductorId,
                latitud: coords.latitude,
                longitud: coords.longitude
            })
        });
        
        const ubicacionData = await ubicacionResponse.json();
        
        if (!ubicacionData.success) {
            console.warn('Error actualizando ubicación:', ubicacionData.error);
        } else {
            console.log('📍 Ubicación actualizada para conductor:', conductorId, coords);
            actualizarTiempoActualizacion();
        }
        
        return ubicacionData;
        
    } catch (error) {
        console.error('Error actualizando ubicación:', error);
        return { success: false, error: error.message };
    }
}

// Función para iniciar seguimiento periódico
function iniciarSeguimiento(envio, conductorId) {
    // Detener seguimiento anterior si existe
    detenerSeguimiento();
    
    envioEnSeguimiento = { envio, conductorId };
    
    console.log('🚚 INICIANDO SEGUIMIENTO para conductor:', conductorId);
    console.log('📦 Envío:', envio.nro_envio);
    
    // Mostrar notificación de inicio de seguimiento
    mostrarIndicadorSeguimiento(envio);
    
    // Actualizar inmediatamente
    navigator.geolocation.getCurrentPosition(
        (position) => {
            actualizarUbicacionConductor(conductorId, position.coords);
        },
        (error) => console.warn('Error obteniendo ubicación:', error),
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
    
    // Configurar intervalo cada 10 segundos
    intervaloUbicacion = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                actualizarUbicacionConductor(conductorId, position.coords);
            },
            (error) => console.warn('Error en actualización periódica:', error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, 10000); // 10 segundos
    
    // Guardar referencia del intervalo en window
    window.intervaloUbicacion = intervaloUbicacion;
}

// Función para mostrar indicador de seguimiento
function mostrarIndicadorSeguimiento(envio) {
    // Quitar indicador anterior si existe
    const indicadorAnterior = document.getElementById('seguimiento-activo');
    if (indicadorAnterior) {
        indicadorAnterior.remove();
    }
    
    const seguimientoDiv = document.createElement('div');
    seguimientoDiv.id = 'seguimiento-activo';
    seguimientoDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(90deg, #1e3a5a 0%, #2c5282 100%);
        color: #40e0d0;
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 4px solid #40e0d0;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    seguimientoDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-satellite-dish" style="color: #40e0d0; font-size: 20px; animation: pulse 2s infinite;"></i>
            <div>
                <strong style="color: white;">Seguimiento activo</strong><br>
                <span style="color: #a5d8ff;">Envío: ${envio.nro_envio}</span><br>
                <span style="color: #a5d8ff; font-size: 12px;" id="ultima-actualizacion">Actualizando cada 10 segundos...</span>
            </div>
        </div>
    `;
    document.body.appendChild(seguimientoDiv);
}

// Función para actualizar el tiempo de última actualización
function actualizarTiempoActualizacion() {
    const elemento = document.getElementById('ultima-actualizacion');
    if (elemento) {
        const ahora = new Date();
        const tiempo = ahora.toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        elemento.innerHTML = `Última actualización: ${tiempo}`;
    }
}

// Función para verificar seguimiento activo al cargar la página
function verificarSeguimientoActivo() {
    const envioEnRuta = enviosData.find(e => e.estado_envio === 'EN_RUTA');
    
    if (envioEnRuta && envioEnRuta.vehiculo_conductor_id) {
        console.log('🔍 Se encontró un envío en ruta, verificando seguimiento...');
        
        fetch(`/main/vehiculo_conductor/obtener_conductor_por_asignacion/${envioEnRuta.vehiculo_conductor_id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Reanudar seguimiento
                    iniciarSeguimiento(envioEnRuta, data.conductor_id);
                }
            })
            .catch(err => console.warn('Error al reanudar seguimiento:', err));
    }
}

// Función para detener seguimiento
function detenerSeguimiento() {
    if (window.intervaloUbicacion) {
        clearInterval(window.intervaloUbicacion);
        window.intervaloUbicacion = null;
        envioEnSeguimiento = null;
        
        // Quitar indicador visual
        const indicador = document.getElementById('seguimiento-activo');
        if (indicador) {
            indicador.remove();
        }
        
        console.log('🛑 Seguimiento detenido');
    }
}

// ==================== FUNCIONES DE ACCIONES SOBRE ENVÍOS ====================

async function cancelarEnvio(envio) {
    if (envio.estado_envio !== 'PENDIENTE') {
        mostrarError('Solo se pueden cancelar envíos pendientes');
        return;
    }
    
    Swal.fire({
        title: 'Cancelar envío',
        text: `¿Está seguro que desea cancelar el envío "${envio.nro_envio}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'No, mantener',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/distribucion_almacen_producto/cancelar_envio/${envio.asignacion_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: 'CANCELADO' })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito('Envío cancelado exitosamente');
                    setTimeout(() => {
                        cargarEnvios();
                    }, 1000);
                } else {
                    throw new Error(data.error || 'Error al cancelar el envío');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cancelar el envío: ' + error.message);
            }
        }
    });
}

async function completarEnvio(envio) {
    if (envio.estado_envio !== 'EN_RUTA') {
        mostrarError('Solo se pueden completar envíos que están en ruta');
        return;
    }
    
    Swal.fire({
        title: 'Completar envío',
        text: `¿Está seguro que desea marcar como entregado el envío "${envio.nro_envio}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, completar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // Mostrar carga
                Swal.fire({
                    title: 'Completando envío...',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    background: '#152a3a',
                    color: '#e0f2fe'
                });
                
                // DETENER SEGUIMIENTO PRIMERO
                detenerSeguimiento();
                
                // Actualizar última ubicación antes de completar
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            const conductorResponse = await fetch(`/main/vehiculo_conductor/obtener_conductor_por_asignacion/${envio.vehiculo_conductor_id}`);
                            if (conductorResponse.ok) {
                                const conductorData = await conductorResponse.json();
                                if (conductorData.success) {
                                    await actualizarUbicacionConductor(conductorData.conductor_id, position.coords);
                                }
                            }
                            
                            await finalizarCompletarEnvio(envio);
                        },
                        async () => {
                            // Si hay error de geolocalización, igual completar el envío
                            await finalizarCompletarEnvio(envio);
                        }
                    );
                } else {
                    await finalizarCompletarEnvio(envio);
                }
            } catch (error) {
                Swal.close();
                console.error('Error:', error);
                mostrarError(error.message);
            }
        }
    });
}

async function finalizarCompletarEnvio(envio) {
    try {
        const response = await fetch(`/main/distribucion_almacen_producto/cambiar_estado/${envio.asignacion_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: 'ENTREGADO' })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            Swal.close();
            mostrarExito('Envío completado exitosamente');
            
            // Actualizar tabla sin recargar
            setTimeout(() => {
                cargarEnvios();
            }, 2000);
        } else {
            throw new Error(data.error || 'Error al completar el envío');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para ver ubicación del conductor
async function verUbicacionConductor(envio) {
    try {
        // Primero obtener el conductor_id
        const conductorResponse = await fetch(`/main/vehiculo_conductor/obtener_conductor_por_asignacion/${envio.vehiculo_conductor_id}`);
        if (!conductorResponse.ok) {
            throw new Error('Error al obtener datos del conductor');
        }
        
        const conductorData = await conductorResponse.json();
        if (!conductorData.success) {
            throw new Error(conductorData.error || 'Error al obtener conductor');
        }
        
        const response = await fetch(`/main/conductor/obtener_ultima_ubicacion/${conductorData.conductor_id}`);
        if (!response.ok) {
            throw new Error('Error al obtener ubicación');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'No se pudo obtener la ubicación');
        }
        
        const ubicacion = data.ubicacion;
        
        // Mostrar ubicación en Google Maps
        const url = `https://www.google.com/maps?q=${ubicacion.latitud},${ubicacion.longitud}`;
        window.open(url, '_blank');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo obtener la ubicación del conductor');
    }
}

// ==================== FUNCIONES DE DETALLE Y PDF ====================

async function verDetalleEnvio(id) {
    try {
        const response = await fetch(`/main/distribucion_almacen_producto/obtener_envio_detalle/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el detalle');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el detalle');
        }
        
        const envio = data.envio;
        
        // Renderizar detalle
        const detalleContent = document.getElementById('detalle-envio-content');
        detalleContent.innerHTML = `
            <div class="detalle-header">
                <div class="detalle-titulo">${envio.nro_envio}</div>
                <div class="detalle-estado ${getEstadoClass(envio.estado_envio)}">
                    ${getEstadoIcon(envio.estado_envio)} ${envio.estado_envio}
                </div>
            </div>
            
            <div class="detalle-grid">
                <div class="detalle-item">
                    <span class="detalle-label">Fecha de envío</span>
                    <span class="detalle-valor">${formatFecha(envio.fecha_envio)}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Hora de envío</span>
                    <span class="detalle-valor">${envio.hora_envio}</span>
                </div>
                <div class="detalle-item">
                    <span class="detalle-label">Demanda</span>
                    <span class="detalle-valor-grande">${parseFloat(envio.demanda).toFixed(2)} kg</span>
                </div>
            </div>
            
            <div class="detalle-seccion">
                <div class="detalle-seccion-titulo">Almacén de destino</div>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">Nombre</span>
                        <span class="detalle-valor">${envio.almacen_nombre}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Tipo</span>
                        <span class="detalle-valor">${envio.almacen_tipo}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Dirección</span>
                        <span class="detalle-valor">${envio.almacen_direccion || 'N/A'}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Capacidad máxima</span>
                        <span class="detalle-valor">${parseFloat(envio.almacen_capacidad).toFixed(2)} kg</span>
                    </div>
                </div>
            </div>
            
            <div class="detalle-seccion">
                <div class="detalle-seccion-titulo">Producto</div>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">Nombre</span>
                        <span class="detalle-valor">${envio.producto_nombre}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Tipo</span>
                        <span class="detalle-valor">${envio.producto_tipo}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Variedad</span>
                        <span class="detalle-valor">${envio.producto_variedad}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Stock actual</span>
                        <span class="detalle-valor">${parseFloat(envio.producto_stock).toFixed(2)} kg</span>
                    </div>
                </div>
            </div>
            
            <div class="detalle-seccion">
                <div class="detalle-seccion-titulo">Vehículo y Conductor</div>
                <div class="detalle-grid">
                    <div class="detalle-item">
                        <span class="detalle-label">Vehículo</span>
                        <span class="detalle-valor">${envio.vehiculo_placa} - ${envio.vehiculo_marca} ${envio.vehiculo_modelo}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Capacidad vehículo</span>
                        <span class="detalle-valor">${envio.vehiculo_capacidad} kg</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">Conductor</span>
                        <span class="detalle-valor">${envio.conductor_nombre}</span>
                    </div>
                    <div class="detalle-item">
                        <span class="detalle-label">DNI conductor</span>
                        <span class="detalle-valor">${envio.conductor_dni}</span>
                    </div>
                </div>
            </div>
        `;
        
        $('#modal-detalle-envio').modal('show');
        
        // Configurar botón de PDF
        document.getElementById('btn-descargar-pdf').onclick = () => generarPDF(id);
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el detalle del envío');
    }
}

function getEstadoClass(estado) {
    switch(estado) {
        case 'PENDIENTE': return 'estado-pendiente';
        case 'EN_RUTA': return 'estado-enruta';
        case 'ENTREGADO': return 'estado-entregado';
        case 'CANCELADO': return 'estado-cancelado';
        default: return 'estado-pendiente';
    }
}

function getEstadoIcon(estado) {
    switch(estado) {
        case 'PENDIENTE': return '<i class="fas fa-clock"></i>';
        case 'EN_RUTA': return '<i class="fas fa-truck"></i>';
        case 'ENTREGADO': return '<i class="fas fa-check-circle"></i>';
        case 'CANCELADO': return '<i class="fas fa-times-circle"></i>';
        default: return '<i class="fas fa-clock"></i>';
    }
}

function formatFecha(fecha) {
    if (!fecha) return 'N/A';
    try {
        const f = new Date(fecha);
        return f.toLocaleDateString('es-PE');
    } catch (e) {
        return fecha;
    }
}

// ==================== FUNCIÓN DE PDF MEJORADA ====================

async function generarPDF(id) {
    try {
        const response = await fetch(`/main/distribucion_almacen_producto/obtener_envio_detalle/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener datos para PDF');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener datos');
        }
        
        const envio = data.envio;
        
        if (!envio) {
            throw new Error('No se encontraron datos del envío');
        }
        
        // Crear PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Paleta de colores profesional
        const colorPrimario = [30, 58, 90];      // Azul oscuro
        const colorSecundario = [64, 224, 208];   // Turquesa
        const colorGris = [108, 117, 125];        // Gris
        const colorGrisClaro = [248, 249, 250];   // Gris muy claro
        const colorExito = [40, 167, 69];         // Verde
        const colorAdvertencia = [255, 193, 7];   // Amarillo
        const colorPeligro = [220, 53, 69];       // Rojo
        
        // ==================== ENCABEZADO ====================
        doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('COMPROBANTE DE ENVÍO', 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');
        doc.text(envio.nro_envio || 'N/A', 105, 28, { align: 'center' });
        
        doc.setFontSize(9);
        doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-PE', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`, 105, 35, { align: 'center' });
        
        // ==================== BADGE DE ESTADO ====================
        let estadoColor, estadoTexto;
        switch(envio.estado_envio) {
            case 'ENTREGADO':
                estadoColor = colorExito;
                estadoTexto = 'ENTREGADO';
                break;
            case 'EN_RUTA':
                estadoColor = [13, 110, 253];
                estadoTexto = 'EN RUTA';
                break;
            case 'CANCELADO':
                estadoColor = colorPeligro;
                estadoTexto = 'CANCELADO';
                break;
            default:
                estadoColor = colorAdvertencia;
                estadoTexto = 'PENDIENTE';
        }
        
        doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
        doc.roundedRect(150, 50, 45, 10, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(estadoTexto, 172.5, 56.5, { align: 'center' });
        
        // ==================== SECCIÓN: RESUMEN DEL ENVÍO ====================
        let yPos = 68;
        
        doc.setFillColor(colorGrisClaro[0], colorGrisClaro[1], colorGrisClaro[2]);
        doc.roundedRect(15, yPos, 180, 28, 3, 3, 'F');
        
        doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(15, yPos, 180, 28, 3, 3, 'S');
        
        yPos += 8;
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        doc.text('FECHA', 25, yPos);
        doc.text('HORA', 85, yPos);
        doc.text('DEMANDA', 145, yPos);
        
        yPos += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        
        doc.text(envio.fecha_envio ? formatFecha(envio.fecha_envio) : 'N/A', 25, yPos);
        doc.text(envio.hora_envio || 'N/A', 85, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(envio.demanda ? `${parseFloat(envio.demanda).toFixed(2)} kg` : '0.00 kg', 145, yPos);
        
        // ==================== SECCIÓN: ALMACÉN ====================
        yPos += 15;
        
        doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.rect(15, yPos, 180, 8, 'F');
        
        doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.rect(17, yPos + 2, 4, 4, 'F');
        
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('ALMACEN DE DESTINO', 24, yPos + 5.5);
        
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        
        const almacenData = [
            { label: 'Nombre:', value: envio.almacen_nombre || 'N/A' },
            { label: 'Tipo:', value: envio.almacen_tipo || 'N/A' },
            { label: 'Dirección:', value: envio.almacen_direccion || 'N/A' },
            { label: 'Capacidad:', value: envio.almacen_capacidad ? `${parseFloat(envio.almacen_capacidad).toFixed(2)} kg` : 'N/A' }
        ];
        
        almacenData.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
            doc.text(item.label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(item.value, 65, yPos);
            yPos += 6;
        });
        
        // ==================== SECCIÓN: PRODUCTO ====================
        yPos += 5;
        
        doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.rect(15, yPos, 180, 8, 'F');
        
        doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.circle(19, yPos + 4, 2, 'F');
        
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUCTO', 24, yPos + 5.5);
        
        yPos += 12;
        
        const productoData = [
            { label: 'Nombre:', value: envio.producto_nombre || 'N/A' },
            { label: 'Tipo:', value: envio.producto_tipo || 'N/A' },
            { label: 'Variedad:', value: envio.producto_variedad || 'N/A' },
            { label: 'Stock actual:', value: envio.producto_stock ? `${parseFloat(envio.producto_stock).toFixed(2)} kg` : 'N/A' }
        ];
        
        doc.setFontSize(10);
        productoData.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
            doc.text(item.label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(item.value, 65, yPos);
            yPos += 6;
        });
        
        // ==================== SECCIÓN: VEHÍCULO Y CONDUCTOR ====================
        yPos += 5;
        
        doc.setFillColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.rect(15, yPos, 180, 8, 'F');
        
        doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.triangle(17, yPos + 6, 19, yPos + 2, 21, yPos + 6, 'F');
        
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('VEHICULO Y CONDUCTOR', 24, yPos + 5.5);
        
        yPos += 12;
        
        const vehiculoData = [
            { label: 'Vehículo:', value: envio.vehiculo_placa ? `${envio.vehiculo_placa} - ${envio.vehiculo_marca || ''} ${envio.vehiculo_modelo || ''}`.trim() : 'N/A' },
            { label: 'Capacidad:', value: envio.vehiculo_capacidad ? `${envio.vehiculo_capacidad} kg` : 'N/A' },
            { label: 'Conductor:', value: envio.conductor_nombre || 'N/A' },
            { label: 'DNI:', value: envio.conductor_dni || 'N/A' }
        ];
        
        doc.setFontSize(10);
        vehiculoData.forEach(item => {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
            doc.text(item.label, 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            doc.text(item.value, 65, yPos);
            yPos += 6;
        });
        
        // ==================== PIE DE PÁGINA ====================
        doc.setDrawColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
        doc.setLineWidth(0.5);
        doc.line(15, 270, 195, 270);
        
        doc.setFontSize(8);
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
        doc.setFont('helvetica', 'italic');
        doc.text('Este documento es un comprobante de envío generado automáticamente.', 105, 277, { align: 'center' });
        doc.text('Para consultas, comuníquese con el departamento de logística.', 105, 282, { align: 'center' });
        
        doc.setFont('helvetica', 'normal');
        doc.text('Página 1 de 1', 105, 287, { align: 'center' });
        
        doc.save(`Envio_${envio.nro_envio || 'sin_numero'}.pdf`);
        mostrarExito('PDF generado exitosamente');
        
    } catch (error) {
        console.error('Error generando PDF:', error);
        mostrarError('No se pudo generar el PDF: ' + error.message);
    }
}

// ==================== FUNCIONES DE UTILIDAD ====================

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

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarEnvios();
    cargarDatosSelects();
    
    // Botón nuevo envío
    const btnNuevoEnvio = document.getElementById('btn-nuevo-envio');
    if (btnNuevoEnvio) {
        btnNuevoEnvio.addEventListener('click', abrirModalNuevoEnvio);
    }
    
    // Botón guardar envío
    const btnGuardarEnvio = document.getElementById('btn-guardar-envio');
    if (btnGuardarEnvio) {
        btnGuardarEnvio.addEventListener('click', guardarEnvio);
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-envios');
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
            renderizarTabla(filteredEnvios);
        });
    }
    
    // Actualizar día, mes, año al cambiar fecha
    const fechaInput = document.getElementById('fecha_envio');
    if (fechaInput) {
        fechaInput.addEventListener('change', function() {
            if (this.value) {
                const fecha = new Date(this.value);
                document.getElementById('dia').value = fecha.getDate();
                document.getElementById('mes').value = fecha.getMonth() + 1;
                document.getElementById('anio').value = fecha.getFullYear();
            }
        });
    }
    
    // Validar al cambiar campos importantes
    ['almacen_id', 'producto_id', 'vehiculo_conductor_id', 'demanda', 'fecha_envio', 'hora_envio'].forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.addEventListener('change', () => {
                if (document.getElementById('asignacion_id').value) {
                    validarFormulario();
                }
            });
        }
    });
    
    // Limpiar modal al cerrar
    $('#modal-envio').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-envio');
        if (form) {
            form.classList.remove('was-validated');
        }
    });
    
    // Detener seguimiento al cerrar la página
    window.addEventListener('beforeunload', function() {
        detenerSeguimiento();
    });
});