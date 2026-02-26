// Variables globales
let map;
let markers = [];
let infoWindow;
let almacenesData = [];
let enviosData = [];
let clasificacionActual = {};
let periodoSeleccionado = '';
let periodoYaAsignado = false;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    cargarPeriodos();
    configurarEventos();
    window.initMapCallback = initMap;
});

// Inicializar mapa de Google Maps
function initMap() {
    const peruCenter = { lat: -9.19, lng: -75.0152 };
    map = new google.maps.Map(document.getElementById('mapa-almacenes'), {
        center: peruCenter,
        zoom: 6,
        styles: [
            { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#e0f2fe' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1e3a5a' }] },
            { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#152a3a' }] },
            { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#2c5282' }] }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });
    infoWindow = new google.maps.InfoWindow();
    cargarAlmacenes();
}

// Configurar event listeners
function configurarEventos() {
    document.getElementById('btn-clasificar').addEventListener('click', clasificarEnvio);
    document.getElementById('btn-guardar-asignacion').addEventListener('click', guardarAsignacion);
    document.getElementById('mes-periodo').addEventListener('change', function(e) {
        periodoSeleccionado = e.target.value;
        // Actualizar estado del botón guardar y banner al cambiar periodo
        const option = e.target.options[e.target.selectedIndex];
        const yaAsignado = option ? option.dataset.asignado === 'true' : false;
        actualizarEstadoBotones(yaAsignado);
        // Limpiar clasificación pendiente al cambiar periodo
        clasificacionActual = {};
        enviosData = [];
    });
}

// Actualizar estado visual de botones y banner según si el periodo está asignado
function actualizarEstadoBotones(yaAsignado) {
    periodoYaAsignado = yaAsignado;
    const btnGuardar = document.getElementById('btn-guardar-asignacion');
    const bannerContainer = document.getElementById('banner-asignado-container');

    if (yaAsignado) {
        btnGuardar.disabled = true;
        btnGuardar.title = 'Este periodo ya tiene distribución guardada';
        if (bannerContainer) {
            bannerContainer.innerHTML = `
                <div class="banner-asignado">
                    <i class="fas fa-check-circle"></i>
                    <span>Este periodo ya tiene distribución asignada. Puedes visualizarla haciendo clic en "Clasificar".</span>
                </div>
            `;
        }
    } else {
        btnGuardar.disabled = false;
        btnGuardar.title = '';
        if (bannerContainer) {
            bannerContainer.innerHTML = '';
        }
    }
}

// Cargar periodos desde la base de datos
async function cargarPeriodos() {
    try {
        const response = await fetch('/main/almacen/obtener_periodos_futuros');
        if (!response.ok) throw new Error('Error al cargar periodos');

        const data = await response.json();
        if (data.success) {
            const selectPeriodo = document.getElementById('mes-periodo');
            selectPeriodo.innerHTML = '<option value="">Seleccione un periodo</option>';

            data.periodos.forEach(periodo => {
                const option = document.createElement('option');
                option.value = `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}`;
                const suffixAsignado = periodo.ya_asignado ? ' ✓' : ` (${periodo.envios_asignados}/${periodo.total_envios})`;
                option.textContent = periodo.nombre + suffixAsignado;
                option.dataset.asignado = periodo.ya_asignado ? 'true' : 'false';
                selectPeriodo.appendChild(option);
            });
        } else {
            mostrarError('No se pudieron cargar los periodos: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar periodos');
    }
}

// Cargar almacenes con su stock y capacidad
async function cargarAlmacenes() {
    try {
        const response = await fetch('/main/almacen/obtener_almacenes_con_stock');
        if (!response.ok) throw new Error('Error al cargar almacenes');

        const data = await response.json();
        if (data.success) {
            almacenesData = data.almacenes || [];
            renderizarListaAlmacenes(almacenesData);
            actualizarMapa(almacenesData);
        } else {
            mostrarError('Error al cargar almacenes: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar almacenes');
    }
}

// Función principal de clasificación / visualización
async function clasificarEnvio() {
    if (!periodoSeleccionado) {
        mostrarAdvertencia('Por favor, selecciona un periodo (Mes-Año)');
        return;
    }

    Swal.fire({
        title: periodoYaAsignado ? 'Cargando distribución...' : 'Clasificando envíos...',
        text: periodoYaAsignado ? 'Obteniendo la distribución guardada' : 'El modelo PKT está procesando los datos',
        allowOutsideClick: false,
        background: '#152a3a',
        color: '#e0f2fe',
        didOpen: () => Swal.showLoading()
    });

    try {
        const response = await fetch('/main/almacen/clasificar_envios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ periodo: periodoSeleccionado })
        });

        const data = await response.json();

        if (data.success) {
            const yaAsignado = data.ya_asignado === true;

            if (yaAsignado) {
                // Distribución ya guardada: mostrar en modo lectura
                clasificacionActual = {};
                enviosData = [];

                // almacenes_agrupados contiene la distribución por almacén
                const almacenesAgrupados = data.almacenes || [];
                almacenesData = data.almacenes_stock || almacenesData;

                renderizarListaAlmacenesPorDistribucion(almacenesAgrupados, true);
                actualizarMapa(almacenesData, [], almacenesAgrupados);
                actualizarEstadoBotones(true);

                Swal.fire({
                    icon: 'info',
                    title: 'Distribución existente',
                    text: `Este periodo ya tiene ${data.total_envios} envío(s) asignados. Mostrando la distribución guardada.`,
                    timer: 2500,
                    showConfirmButton: false,
                    background: '#152a3a',
                    color: '#e0f2fe'
                });
            } else {
                // Nueva clasificación
                clasificacionActual = data.clasificacion;
                enviosData = data.envios;
                const almacenesAgrupados = data.almacenes_agrupados || [];
                almacenesData = data.almacenes_actualizados || almacenesData;

                renderizarListaAlmacenesPorDistribucion(almacenesAgrupados, false);
                actualizarMapa(almacenesData, data.envios, almacenesAgrupados);
                actualizarEstadoBotones(false);

                Swal.fire({
                    icon: 'success',
                    title: 'Clasificación completada',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false,
                    background: '#152a3a',
                    color: '#e0f2fe'
                });
            }
        } else {
            throw new Error(data.error || 'Error en la clasificación');
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo completar la clasificación',
            background: '#152a3a',
            color: '#e0f2fe',
            confirmButtonColor: '#40e0d0'
        });
    }
}

// Guardar la asignación
async function guardarAsignacion() {
    if (periodoYaAsignado) {
        mostrarAdvertencia('Este periodo ya tiene distribución guardada. No es necesario guardar nuevamente.');
        return;
    }

    if (Object.keys(clasificacionActual).length === 0) {
        mostrarAdvertencia('No hay una clasificación reciente para guardar. Haz clic en "Clasificar" primero.');
        return;
    }

    const result = await Swal.fire({
        title: '¿Guardar asignación?',
        text: `Se actualizarán los almacenes para ${enviosData.length} envío(s). Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#40e0d0',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    });

    if (result.isConfirmed) {
        Swal.fire({
            title: 'Guardando...',
            allowOutsideClick: false,
            background: '#152a3a',
            color: '#e0f2fe',
            didOpen: () => Swal.showLoading()
        });

        try {
            const response = await fetch('/main/almacen/guardar_asignacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clasificacion: clasificacionActual })
            });

            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: data.message,
                    timer: 1800,
                    showConfirmButton: false,
                    background: '#152a3a',
                    color: '#e0f2fe'
                });
                // Marcar como asignado y limpiar
                clasificacionActual = {};
                actualizarEstadoBotones(true);
                // Recargar periodos para reflejar el nuevo estado
                cargarPeriodos();
            } else {
                throw new Error(data.error || 'Error al guardar');
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message,
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0'
            });
        }
    }
}

// Renderizar lista de almacenes agrupados por distribución PKT
function renderizarListaAlmacenesPorDistribucion(almacenesAgrupados, yaAsignado) {
    const listaContainer = document.getElementById('almacenes-lista');
    if (!listaContainer) return;

    if (!almacenesAgrupados || almacenesAgrupados.length === 0) {
        listaContainer.innerHTML = '<p class="no-results">No hay distribución que mostrar.</p>';
        return;
    }

    // Ordenar por nombre
    almacenesAgrupados.sort((a, b) => (a.almacen_nombre || '').localeCompare(b.almacen_nombre || ''));

    let html = '';
    almacenesAgrupados.forEach(alm => {
        const capacidad = parseFloat(alm.capacidad) || 0;
        const ocupado = parseFloat(alm.total_ocupado) || 0;
        const porcentaje = capacidad > 0 ? Math.min((ocupado / capacidad) * 100, 100) : 0;
        const cantEnvios = alm.envios ? alm.envios.length : 0;
        const totalDemanda = parseFloat(alm.total_demanda) || 0;

        let barraColor = '#40e0d0';
        if (porcentaje > 90) barraColor = '#f87171';
        else if (porcentaje > 70) barraColor = '#ffd54f';

        html += `
            <div class="almacen-item" data-almacen-id="${alm.almacen_id}">
                <h5>
                    <span style="flex: 1;">${alm.almacen_nombre}</span>
                    <span class="tipo-badge">${alm.tipo_almacen || ''}</span>
                    ${cantEnvios > 0 ? `<span class="almacen-envios-count"><i class="fas fa-truck"></i> ${cantEnvios}</span>` : ''}
                </h5>
                <div class="barra-progreso-container">
                    <div class="barra-progreso-uso" style="width: ${porcentaje.toFixed(1)}%; background: ${barraColor};"></div>
                </div>
                <div class="almacen-detalles">
                    <div><i class="fas fa-warehouse"></i> Cap: ${capacidad.toFixed(2)} kg</div>
                    <div><i class="fas fa-truck-loading"></i> Demanda: ${totalDemanda.toFixed(2)} kg</div>
                </div>
                <button class="btn-ver-detalles" onclick="verDetallesDistribucion(${alm.almacen_id}, '${(alm.almacen_nombre || '').replace(/'/g, "\\'")}', ${JSON.stringify(alm.envios || []).replace(/"/g, '&quot;')})">
                    <i class="fas fa-eye"></i> Ver envíos asignados
                </button>
            </div>
        `;
    });

    listaContainer.innerHTML = html;
}

// Renderizar lista simple de almacenes (sin distribución activa)
function renderizarListaAlmacenes(almacenes) {
    const listaContainer = document.getElementById('almacenes-lista');
    if (!listaContainer) return;

    if (!almacenes || almacenes.length === 0) {
        listaContainer.innerHTML = '<p class="no-results">No hay almacenes disponibles.</p>';
        return;
    }

    almacenes.sort((a, b) => a.nombre.localeCompare(b.nombre));

    let html = '';
    almacenes.forEach(alm => {
        const capacidad = parseFloat(alm.capacidad) || 0;
        const ocupado = parseFloat(alm.total_ocupado) || 0;
        const porcentaje = capacidad > 0 ? (ocupado / capacidad) * 100 : 0;

        let barraColor = '#40e0d0';
        if (porcentaje > 90) barraColor = '#f87171';
        else if (porcentaje > 70) barraColor = '#ffd54f';

        html += `
            <div class="almacen-item" data-almacen-id="${alm.almacen_id}">
                <h5>
                    <span style="flex: 1;">${alm.nombre}</span>
                    <span class="tipo-badge">${alm.tipo_almacen}</span>
                </h5>
                <div class="barra-progreso-container">
                    <div class="barra-progreso-uso" style="width: ${porcentaje.toFixed(1)}%; background: ${barraColor};"></div>
                </div>
                <div class="almacen-detalles">
                    <div><i class="fas fa-warehouse"></i> Cap: ${capacidad.toFixed(2)} kg</div>
                    <div><i class="fas fa-boxes"></i> Stock: ${ocupado.toFixed(2)} kg</div>
                </div>
                <button class="btn-ver-detalles" onclick="verDetallesAlmacen(${alm.almacen_id})">
                    <i class="fas fa-eye"></i> Ver asignaciones
                </button>
            </div>
        `;
    });

    listaContainer.innerHTML = html;
}

// Actualizar marcadores en el mapa
function actualizarMapa(almacenes, enviosClasificados, almacenesAgrupados) {
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (!almacenes || almacenes.length === 0 || !map) return;

    // Contar envíos por almacén
    const enviosPorAlmacen = {};
    if (almacenesAgrupados && almacenesAgrupados.length > 0) {
        almacenesAgrupados.forEach(alm => {
            enviosPorAlmacen[alm.almacen_id] = (alm.envios || []).length;
        });
    } else if (enviosClasificados && enviosClasificados.length > 0) {
        enviosClasificados.forEach(envio => {
            const aId = envio.almacen_id_sugerido;
            if (aId) enviosPorAlmacen[aId] = (enviosPorAlmacen[aId] || 0) + 1;
        });
    }

    const bounds = new google.maps.LatLngBounds();

    almacenes.forEach(alm => {
        const lat = parseFloat(alm.latitud);
        const lng = parseFloat(alm.longitud);
        if (!alm.latitud || !alm.longitud || isNaN(lat) || isNaN(lng)) return;

        const position = { lat, lng };
        bounds.extend(position);

        const capacidad = parseFloat(alm.capacidad) || 0;
        const ocupado = parseFloat(alm.total_ocupado) || 0;
        const porcentaje = capacidad > 0 ? (ocupado / capacidad) * 100 : 0;
        const enviosAsignados = enviosPorAlmacen[alm.almacen_id] || 0;

        let markerColor = '#40e0d0';
        if (porcentaje > 90) markerColor = '#f87171';
        else if (porcentaje > 70) markerColor = '#ffd54f';

        const svgColor = markerColor.replace('#', '%23');
        const marker = new google.maps.Marker({
            position,
            map,
            icon: {
                url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='18' r='15' fill='${svgColor}' stroke='white' stroke-width='3'/%3E%3C/svg%3E`,
                scaledSize: new google.maps.Size(36, 36),
                anchor: new google.maps.Point(18, 18)
            },
            title: alm.nombre || alm.almacen_nombre
        });

        const nombre = alm.nombre || alm.almacen_nombre || 'Almacén';
        const tipo = alm.tipo_almacen || '';

        const infoContent = `
            <div style="background:#1e3a5a;color:#e0f2fe;padding:15px;border-radius:10px;border-left:4px solid #40e0d0;min-width:200px;">
                <h4 style="margin:0 0 10px;color:#40e0d0;font-size:16px;">${nombre}</h4>
                <p style="margin:5px 0;font-size:13px;">Tipo: ${tipo}</p>
                <p style="margin:5px 0;font-size:13px;">Capacidad: ${capacidad.toFixed(2)} kg</p>
                <p style="margin:5px 0;font-size:13px;">Ocupado: ${ocupado.toFixed(2)} kg (${porcentaje.toFixed(1)}%)</p>
                ${enviosAsignados > 0 ? `<p style="margin:5px 0;font-size:13px;color:#40e0d0;">Envíos asignados: ${enviosAsignados}</p>` : ''}
            </div>
        `;

        marker.addListener('click', () => {
            infoWindow.setContent(infoContent);
            infoWindow.open(map, marker);
        });

        markers.push(marker);
    });

    if (markers.length > 0) {
        map.fitBounds(bounds);
        if (markers.length === 1) map.setZoom(12);
    }
}

// Ver detalles de un almacén con sus envíos asignados (desde datos ya cargados)
function verDetallesDistribucion(almacenId, almacenNombre, enviosJson) {
    let envios = [];
    try {
        if (typeof enviosJson === 'string') {
            envios = JSON.parse(enviosJson.replace(/&quot;/g, '"'));
        } else if (Array.isArray(enviosJson)) {
            envios = enviosJson;
        }
    } catch(e) {
        console.error('Error parseando envíos:', e);
    }

    // Buscar info del almacén
    const almacenInfo = almacenesData.find(a => a.almacen_id === almacenId);
    const capacidadTotal = almacenInfo ? parseFloat(almacenInfo.capacidad) : 0;
    const espacioOcupado = almacenInfo ? parseFloat(almacenInfo.total_ocupado) : 0;
    const espacioDisponible = capacidadTotal - espacioOcupado;

    document.getElementById('detalle-almacen-titulo').textContent = `Envíos asignados — ${almacenNombre}`;

    let html = construirResumenAlmacen(capacidadTotal, espacioOcupado, espacioDisponible);
    html += construirTablaEnvios(envios);

    document.getElementById('detalle-almacen-body').innerHTML = html;
    $('#modal-detalle-almacen').modal('show');
}

// Ver detalles de almacén consultando la API (modo normal)
async function verDetallesAlmacen(almacenId) {
    document.getElementById('detalle-almacen-titulo').textContent = 'Cargando...';
    document.getElementById('detalle-almacen-body').innerHTML = `
        <div style="text-align:center;padding:50px;">
            <i class="fas fa-spinner fa-spin" style="font-size:48px;color:#40e0d0;"></i>
            <p style="margin-top:20px;color:#e0f2fe;">Cargando datos...</p>
        </div>
    `;
    $('#modal-detalle-almacen').modal('show');

    try {
        let url = `/main/almacen/obtener_asignaciones_almacen/${almacenId}`;
        if (periodoSeleccionado) {
            const [anio, mes] = periodoSeleccionado.split('-');
            url += `?anio=${anio}&mes=${mes}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al cargar datos');

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Error desconocido');

        const almacenInfo = almacenesData.find(a => a.almacen_id === almacenId);
        const nombreAlmacen = almacenInfo ? almacenInfo.nombre : `Almacén ${almacenId}`;
        const capacidadTotal = almacenInfo ? parseFloat(almacenInfo.capacidad) : 0;
        const espacioOcupado = almacenInfo ? parseFloat(almacenInfo.total_ocupado) : 0;

        document.getElementById('detalle-almacen-titulo').textContent = `Envíos asignados — ${nombreAlmacen}`;

        let html = construirResumenAlmacen(capacidadTotal, espacioOcupado, capacidadTotal - espacioOcupado);
        html += construirTablaEnvios(data.asignaciones || []);

        document.getElementById('detalle-almacen-body').innerHTML = html;

    } catch (error) {
        document.getElementById('detalle-almacen-body').innerHTML = `
            <div style="text-align:center;padding:50px;color:#f87171;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;margin-bottom:15px;"></i>
                <h4>Error de conexión</h4>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Construir HTML del resumen de capacidad del almacén
function construirResumenAlmacen(capacidadTotal, espacioOcupado, espacioDisponible) {
    return `
        <div class="modal-resumen-almacen">
            <div class="modal-resumen-item">
                <div class="modal-resumen-label">Capacidad Total</div>
                <div class="modal-resumen-valor cap">${capacidadTotal.toFixed(2)} kg</div>
            </div>
            <div class="modal-resumen-item">
                <div class="modal-resumen-label">Espacio Ocupado</div>
                <div class="modal-resumen-valor ocu">${espacioOcupado.toFixed(2)} kg</div>
            </div>
            <div class="modal-resumen-item">
                <div class="modal-resumen-label">Espacio Disponible</div>
                <div class="modal-resumen-valor dis">${Math.max(0, espacioDisponible).toFixed(2)} kg</div>
            </div>
        </div>
    `;
}

// Construir HTML de la tabla de envíos
function construirTablaEnvios(envios) {
    if (!envios || envios.length === 0) {
        return `
            <div style="text-align:center;padding:40px;background:rgba(30,58,90,0.3);border-radius:8px;border:1px dashed rgba(64,224,208,0.3);">
                <i class="fas fa-box-open" style="font-size:48px;color:#a5d8ff;margin-bottom:15px;opacity:0.5;"></i>
                <h5 style="color:#e0f2fe;margin-bottom:10px;">No hay envíos asignados</h5>
                <p style="color:#a5d8ff;font-size:14px;">Este almacén no tiene envíos asignados para el periodo seleccionado.</p>
            </div>
        `;
    }

    let totalDemanda = 0;
    let rowsHtml = '';

    envios.forEach(envio => {
        const demanda = parseFloat(envio.demanda) || 0;
        totalDemanda += demanda;

        const nombreProd = envio.producto_nombre || 'Sin nombre';
        const fotoProd = envio.foto_producto;
        const fechaEnvio = envio.fecha_envio || (envio.dia && envio.mes && envio.anio ? `${envio.anio}-${String(envio.mes).padStart(2,'0')}-${String(envio.dia).padStart(2,'0')}` : 'Sin fecha');
        const estado = envio.estado_envio || 'PENDIENTE';

        let estadoClass = 'estado-pendiente';
        if (estado === 'ENVIADO' || estado === 'COMPLETADO') estadoClass = 'estado-completado';
        else if (estado === 'CANCELADO' || estado === 'RECHAZADO') estadoClass = 'estado-cancelado';
        else if (estado === 'ASIGNADO' || estado === 'EN_PROCESO') estadoClass = 'estado-asignado';

        const fotoHtml = fotoProd
            ? `<img src="/static/images/producto/${fotoProd}" alt="${nombreProd}" class="foto-thumbnail-detalle" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
               <div class="no-foto-detalle" style="display:none;"><i class="fas fa-image"></i></div>`
            : `<div class="no-foto-detalle"><i class="fas fa-image"></i></div>`;

        rowsHtml += `
            <tr>
                <td style="text-align:center;width:60px;">${fotoHtml}</td>
                <td>
                    <div style="font-weight:600;color:#e0f2fe;">${nombreProd}</div>
                </td>
                <td style="font-weight:bold;color:#40e0d0;font-size:15px;">${demanda.toFixed(2)} kg</td>
                <td style="color:#a5d8ff;">${fechaEnvio}</td>
                <td><span class="estado-badge ${estadoClass}">${estado}</span></td>
            </tr>
        `;
    });

    return `
        <div>
            <h4 style="color:#40e0d0;border-bottom:2px solid rgba(64,224,208,0.3);padding-bottom:8px;margin-bottom:15px;display:flex;align-items:center;gap:10px;">
                <i class="fas fa-truck"></i>
                Envíos asignados
                <span style="font-size:13px;background:#1e3a5a;padding:3px 10px;border-radius:15px;color:#a5d8ff;">${envios.length} envío(s)</span>
            </h4>
            <table class="tabla-detalle">
                <thead>
                    <tr>
                        <th style="text-align:center;">Foto</th>
                        <th>Producto</th>
                        <th>Demanda</th>
                        <th>Fecha Envío</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <div class="modal-total-bar">
                <span><i class="fas fa-truck"></i> Total envíos: <strong style="color:white;">${envios.length}</strong></span>
                <span>Demanda total: <strong>${totalDemanda.toFixed(2)} kg</strong></span>
            </div>
        </div>
    `;
}

// Funciones auxiliares de mensajes
function mostrarError(mensaje) {
    Swal.fire({
        icon: 'error', title: 'Error', text: mensaje,
        background: '#152a3a', color: '#e0f2fe', confirmButtonColor: '#40e0d0'
    });
}

function mostrarAdvertencia(mensaje) {
    Swal.fire({
        icon: 'warning', title: 'Atención', text: mensaje,
        background: '#152a3a', color: '#e0f2fe', confirmButtonColor: '#40e0d0'
    });
}
