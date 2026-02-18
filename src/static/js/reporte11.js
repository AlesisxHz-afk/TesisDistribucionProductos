// Variables globales
let datosConductores = [];
let datosEnvios = [];
let conductorSeleccionado = null;
let fechaInicio = null;
let fechaFin = null;
let vistaActual = 'cards';

document.addEventListener('DOMContentLoaded', function() {
    inicializarDatepickers();
    cargarConductores();
    configurarEventListeners();
});

function inicializarDatepickers() {
    flatpickr("#fecha-inicio", {
        dateFormat: "Y-m-d",
        maxDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            fechaInicio = dateStr;
        }
    });
    
    flatpickr("#fecha-fin", {
        dateFormat: "Y-m-d",
        maxDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            fechaFin = dateStr;
        }
    });
}

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', function() {
        if (conductorSeleccionado) {
            cargarDatosConductor();
        } else {
            mostrarError('Seleccione un conductor');
        }
    });
    
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    
    document.getElementById('select-conductor').addEventListener('change', function(e) {
        const conductorId = e.target.value;
        if (conductorId) {
            conductorSeleccionado = datosConductores.find(c => c.conductor_id == conductorId);
            cargarDatosConductor();
        } else {
            ocultarSecciones();
        }
    });
}

function cambiarVista(vista) {
    vistaActual = vista;
    
    // Actualizar botones
    document.querySelectorAll('.btn-view').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-view-${vista}`).classList.add('active');
    
    // Ocultar todas las vistas
    document.querySelectorAll('.cards-view, .timeline-view, .summary-view').forEach(v => v.style.display = 'none');
    
    // Mostrar vista seleccionada
    document.getElementById(`view-${vista}`).style.display = 'block';
    
    // Actualizar contenido según vista
    if (vista === 'cards') {
        actualizarVistaCards();
    } else if (vista === 'timeline') {
        actualizarVistaTimeline();
    } else if (vista === 'summary') {
        actualizarVistaSummary();
    }
}

async function cargarConductores() {
    try {
        mostrarCargando('Cargando conductores...');
        
        const response = await fetch('/main/reporte/obtener_conductores');
        const data = await response.json();
        
        if (data.success) {
            datosConductores = data.conductores || [];
            llenarSelectConductores();
        } else {
            throw new Error(data.message || 'Error al cargar conductores');
        }
        
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar conductores: ' + error.message);
        Swal.close();
    }
}

function llenarSelectConductores() {
    const select = document.getElementById('select-conductor');
    select.innerHTML = '<option value="">Seleccionar conductor...</option>';
    
    datosConductores.sort((a, b) => {
        const nombreA = `${a.nombre} ${a.apellido_paterno}`;
        const nombreB = `${b.nombre} ${b.apellido_paterno}`;
        return nombreA.localeCompare(nombreB);
    });
    
    datosConductores.forEach(conductor => {
        const option = document.createElement('option');
        option.value = conductor.conductor_id;
        option.textContent = `${conductor.nombre} ${conductor.apellido_paterno} ${conductor.apellido_materno} - ${conductor.dni || 'Sin DNI'}`;
        select.appendChild(option);
    });
}

async function cargarDatosConductor() {
    if (!conductorSeleccionado) return;
    
    try {
        mostrarCargando('Cargando datos del conductor...');
        
        let url = `/main/reporte/obtener_envios_conductor/${conductorSeleccionado.conductor_id}`;
        const params = new URLSearchParams();
        
        if (fechaInicio) {
            params.append('fecha_inicio', fechaInicio);
        }
        if (fechaFin) {
            params.append('fecha_fin', fechaFin);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            datosEnvios = data.envios || [];
            mostrarSecciones();
            actualizarReporteConductor();
        } else {
            throw new Error(data.message || 'Error al cargar datos');
        }
        
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos del conductor: ' + error.message);
        Swal.close();
    }
}

function mostrarSecciones() {
    document.getElementById('info-conductor-card').style.display = 'block';
    document.getElementById('view-selector').style.display = 'flex';
    cambiarVista('cards'); // Vista por defecto
}

function ocultarSecciones() {
    document.getElementById('info-conductor-card').style.display = 'none';
    document.getElementById('view-selector').style.display = 'none';
    document.querySelectorAll('.cards-view, .timeline-view, .summary-view').forEach(v => v.style.display = 'none');
}

function actualizarReporteConductor() {
    actualizarInfoConductor();
    
    if (vistaActual === 'cards') {
        actualizarVistaCards();
    } else if (vistaActual === 'timeline') {
        actualizarVistaTimeline();
    } else if (vistaActual === 'summary') {
        actualizarVistaSummary();
    }
}

function actualizarInfoConductor() {
    const infoDiv = document.getElementById('conductor-info');
    const c = conductorSeleccionado;
    
    const totalEnvios = datosEnvios.length;
    const entregados = datosEnvios.filter(e => e.estado_envio === 'ENTREGADO').length;
    const totalDemanda = datosEnvios.reduce((sum, e) => sum + (parseFloat(e.demanda) || 0), 0);
    const tasaExito = totalEnvios > 0 ? ((entregados / totalEnvios) * 100).toFixed(1) : 0;
    
    infoDiv.innerHTML = `
        <div class="info-item">
            <span class="info-label">Nombre completo:</span>
            <span class="info-value">${c.nombre} ${c.apellido_paterno} ${c.apellido_materno}</span>
        </div>
        <div class="info-item">
            <span class="info-label">DNI:</span>
            <span class="info-value">${c.dni || '-'}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Total Envíos:</span>
            <span class="info-value">${totalEnvios}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Entregados:</span>
            <span class="info-value">${entregados}</span>
        </div>
        <div class="info-item">
            <span class="info-label">Demanda Total:</span>
            <span class="info-value">${totalDemanda.toFixed(2)} kg</span>
        </div>
    `;
}

function actualizarVistaCards() {
    const container = document.getElementById('cards-envios');
    container.innerHTML = '';
    
    if (datosEnvios.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-box-open"></i>
                <h4>No hay envíos en este período</h4>
                <p>Seleccione otro conductor o rango de fechas</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más reciente primero) y tomar solo últimos 12 para cards
    const enviosMostrar = [...datosEnvios].sort((a, b) => 
        new Date(b.fecha_envio) - new Date(a.fecha_envio)
    ).slice(0, 12);
    
    enviosMostrar.forEach(envio => {
        const demanda = parseFloat(envio.demanda || 0);
        const fecha = new Date(envio.fecha_envio).toLocaleDateString('es-PE');
        const estadoClass = envio.estado_envio === 'ENTREGADO' ? 'card-estado-entregado' : 
                           (envio.estado_envio === 'PENDIENTE' ? 'card-estado-pendiente' : 'card-estado-cancelado');
        
        const card = document.createElement('div');
        card.className = 'envio-card';
        card.onclick = () => verDetalleEnvio(envio);
        
        card.innerHTML = `
            <div class="card-header-mini ${estadoClass}">
                <span class="card-numero">#${envio.nro_envio || 'N/A'}</span>
                <span class="card-fecha">${fecha}</span>
            </div>
            <div class="card-body-mini">
                <div class="card-producto">
                    <i class="fas fa-box"></i>
                    <span>${envio.producto_desc || 'Sin producto'}</span>
                </div>
                <div class="card-almacen">
                    <i class="fas fa-warehouse"></i>
                    <span>${envio.almacen_nombre || 'Sin almacén'}</span>
                </div>
                <div class="card-demanda">
                    <i class="fas fa-weight-hanging"></i>
                    <span>${demanda.toFixed(2)} kg</span>
                </div>
                <div class="card-estado">
                    <span class="${estadoClass}">${envio.estado_envio || 'PENDIENTE'}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    document.getElementById('cards-mostrados').textContent = enviosMostrar.length;
    document.getElementById('cards-total').textContent = datosEnvios.length;
    document.getElementById('pagination-info-cards').style.display = 'block';
}

function actualizarVistaTimeline() {
    const container = document.getElementById('timeline-envios');
    container.innerHTML = '';
    
    if (datosEnvios.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-box-open"></i>
                <h4>No hay envíos en este período</h4>
                <p>Seleccione otro conductor o rango de fechas</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por fecha (más reciente primero) y tomar solo últimos 10 para timeline
    const enviosMostrar = [...datosEnvios].sort((a, b) => 
        new Date(b.fecha_envio) - new Date(a.fecha_envio)
    ).slice(0, 10);
    
    enviosMostrar.forEach((envio, index) => {
        const demanda = parseFloat(envio.demanda || 0);
        const fecha = new Date(envio.fecha_envio).toLocaleDateString('es-PE');
        const estadoClass = envio.estado_envio === 'ENTREGADO' ? 'timeline-completado' : 
                           (envio.estado_envio === 'PENDIENTE' ? 'timeline-pendiente' : 'timeline-cancelado');
        
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.onclick = () => verDetalleEnvio(envio);
        
        item.innerHTML = `
            <div class="timeline-marker ${estadoClass}"></div>
            <div class="timeline-content">
                <div class="timeline-header">
                    <span class="timeline-numero">#${envio.nro_envio || 'N/A'}</span>
                    <span class="timeline-fecha">${fecha}</span>
                </div>
                <div class="timeline-body">
                    <span><i class="fas fa-box"></i> ${envio.producto_desc || 'Sin producto'}</span>
                    <span><i class="fas fa-warehouse"></i> ${envio.almacen_nombre || 'Sin almacén'}</span>
                    <span><i class="fas fa-weight-hanging"></i> ${demanda.toFixed(2)} kg</span>
                    <span class="timeline-estado ${estadoClass}">${envio.estado_envio || 'PENDIENTE'}</span>
                </div>
            </div>
        `;
        container.appendChild(item);
    });
    
    document.getElementById('timeline-mostrados').textContent = enviosMostrar.length;
    document.getElementById('timeline-total').textContent = datosEnvios.length;
    document.getElementById('pagination-info-timeline').style.display = 'block';
}

function actualizarVistaSummary() {
    const container = document.getElementById('summary-envios');
    
    if (datosEnvios.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-box-open"></i>
                <h4>No hay envíos en este período</h4>
                <p>Seleccione otro conductor o rango de fechas</p>
            </div>
        `;
        return;
    }
    
    // Calcular estadísticas
    const totalEnvios = datosEnvios.length;
    const entregados = datosEnvios.filter(e => e.estado_envio === 'ENTREGADO').length;
    const pendientes = datosEnvios.filter(e => e.estado_envio === 'PENDIENTE').length;
    const cancelados = datosEnvios.filter(e => e.estado_envio === 'CANCELADO').length;
    
    const totalDemanda = datosEnvios.reduce((sum, e) => sum + (parseFloat(e.demanda) || 0), 0);
    const promedioDemanda = totalEnvios > 0 ? (totalDemanda / totalEnvios).toFixed(2) : 0;
    
    // Agrupar por producto
    const productos = {};
    datosEnvios.forEach(envio => {
        const prod = envio.producto_desc || 'Sin producto';
        if (!productos[prod]) {
            productos[prod] = {
                nombre: prod,
                cantidad: 0,
                demanda: 0
            };
        }
        productos[prod].cantidad++;
        productos[prod].demanda += parseFloat(envio.demanda || 0);
    });
    
    const productosArray = Object.values(productos).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    
    // Agrupar por almacén
    const almacenes = {};
    datosEnvios.forEach(envio => {
        const alm = envio.almacen_nombre || 'Sin almacén';
        if (!almacenes[alm]) {
            almacenes[alm] = {
                nombre: alm,
                cantidad: 0,
                demanda: 0
            };
        }
        almacenes[alm].cantidad++;
        almacenes[alm].demanda += parseFloat(envio.demanda || 0);
    });
    
    const almacenesArray = Object.values(almacenes).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);
    
    // Generar HTML
    let productosHtml = '';
    productosArray.forEach(p => {
        productosHtml += `
            <div class="summary-item">
                <span class="summary-label">${p.nombre}</span>
                <span class="summary-value">${p.cantidad} envíos (${p.demanda.toFixed(2)} kg)</span>
            </div>
        `;
    });
    
    let almacenesHtml = '';
    almacenesArray.forEach(a => {
        almacenesHtml += `
            <div class="summary-item">
                <span class="summary-label">${a.nombre}</span>
                <span class="summary-value">${a.cantidad} envíos (${a.demanda.toFixed(2)} kg)</span>
            </div>
        `;
    });
    
    container.innerHTML = `
        <div class="summary-grid">
            <div class="summary-card">
                <h4><i class="fas fa-chart-pie"></i> Resumen General</h4>
                <div class="summary-stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Envíos:</span>
                        <span class="stat-value">${totalEnvios}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Entregados:</span>
                        <span class="stat-value success">${entregados}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Pendientes:</span>
                        <span class="stat-value warning">${pendientes}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Cancelados:</span>
                        <span class="stat-value danger">${cancelados}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Demanda Total:</span>
                        <span class="stat-value">${totalDemanda.toFixed(2)} kg</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Promedio x Envío:</span>
                        <span class="stat-value">${promedioDemanda} kg</span>
                    </div>
                </div>
            </div>
            
            <div class="summary-card">
                <h4><i class="fas fa-box"></i> Top 5 Productos</h4>
                <div class="summary-list">
                    ${productosHtml || '<p>No hay datos de productos</p>'}
                </div>
            </div>
            
            <div class="summary-card">
                <h4><i class="fas fa-warehouse"></i> Top 5 Almacenes</h4>
                <div class="summary-list">
                    ${almacenesHtml || '<p>No hay datos de almacenes</p>'}
                </div>
            </div>
        </div>
    `;
}

function verDetalleEnvio(envio) {
    const modalContent = document.getElementById('detalle-envio-content');
    
    modalContent.innerHTML = `
        <div class="detalle-envio">
            <div class="resumen-grid">
                <div class="resumen-item">
                    <span class="resumen-label">N° Envío:</span>
                    <span class="resumen-value">${envio.nro_envio || '-'}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Fecha:</span>
                    <span class="resumen-value">${envio.fecha_envio || '-'}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Hora salida:</span>
                    <span class="resumen-value">${envio.hora_envio || '-'}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Hora llegada:</span>
                    <span class="resumen-value">${envio.hora_llegada || '-'}</span>
                </div>
            </div>
            
            <div class="resumen-grid">
                <div class="resumen-item">
                    <span class="resumen-label">Producto:</span>
                    <span class="resumen-value">${envio.producto_desc || '-'}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Almacén:</span>
                    <span class="resumen-value">${envio.almacen_nombre || '-'}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Dirección:</span>
                    <span class="resumen-value">${envio.almacen_direccion || '-'}</span>
                </div>
            </div>
            
            <div class="resumen-grid">
                <div class="resumen-item">
                    <span class="resumen-label">Demanda:</span>
                    <span class="resumen-value">${(parseFloat(envio.demanda) || 0).toFixed(2)} kg</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Estado:</span>
                    <span class="${envio.estado_envio === 'ENTREGADO' ? 'estado-ENTREGADO' : (envio.estado_envio === 'PENDIENTE' ? 'estado-PENDIENTE' : 'estado-CANCELADO')}">
                        ${envio.estado_envio || 'PENDIENTE'}
                    </span>
                </div>
            </div>
        </div>
    `;
    
    $('#modal-detalle-envio').modal('show');
}

function mostrarCargando(mensaje = 'Cargando...') {
    Swal.fire({
        title: 'Cargando',
        text: mensaje,
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
        background: '#152a3a',
        color: '#e0f2fe'
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

function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        timer: 1500,
        showConfirmButton: false
    });
}

function exportarReporte() {
    if (!conductorSeleccionado) {
        mostrarError('Seleccione un conductor');
        return;
    }
    
    const contenido = generarHTMLExportacion();
    const blob = new Blob([contenido], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productividad_${conductorSeleccionado.dni}_${fechaInicio || 'inicio'}_a_${fechaFin || 'fin'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const c = conductorSeleccionado;
    const fechaGeneracion = new Date().toLocaleDateString();
    
    const totalEnvios = datosEnvios.length;
    const entregados = datosEnvios.filter(e => e.estado_envio === 'ENTREGADO').length;
    const pendientes = datosEnvios.filter(e => e.estado_envio === 'PENDIENTE').length;
    const cancelados = datosEnvios.filter(e => e.estado_envio === 'CANCELADO').length;
    const totalDemanda = datosEnvios.reduce((sum, e) => sum + (parseFloat(e.demanda) || 0), 0);
    const tasaExito = totalEnvios > 0 ? ((entregados / totalEnvios) * 100).toFixed(1) : 0;
    
    // Solo exportar últimos 30 envíos
    const enviosExportar = [...datosEnvios].sort((a, b) => 
        new Date(b.fecha_envio) - new Date(a.fecha_envio)
    ).slice(0, 30);
    
    let enviosHtml = '';
    enviosExportar.forEach(envio => {
        enviosHtml += `
            <tr>
                <td>${envio.nro_envio || '-'}</td>
                <td>${envio.fecha_envio || '-'}</td>
                <td>${envio.producto_desc || '-'}</td>
                <td>${envio.almacen_nombre || '-'}</td>
                <td>${(parseFloat(envio.demanda) || 0).toFixed(2)} kg</td>
                <td>${envio.estado_envio || 'PENDIENTE'}</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Productividad - ${c.nombre} ${c.apellido_paterno}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #1e3a5a; border-bottom: 2px solid #40e0d0; padding-bottom: 10px; }
                .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
                .info-item { padding: 8px; }
                .info-label { font-weight: bold; color: #666; }
                .info-value { color: #333; }
                .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
                .stat-card { background: #f9f9f9; padding: 15px; border-radius: 5px; text-align: center; }
                .stat-card h3 { margin: 0 0 10px 0; color: #1e3a5a; }
                .stat-number { font-size: 24px; font-weight: bold; color: #40e0d0; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th { background-color: #1e3a5a; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #ddd; padding: 8px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .success { color: #28a745; font-weight: bold; }
                .warning { color: #ffc107; font-weight: bold; }
                .danger { color: #dc3545; font-weight: bold; }
                .nota { margin-top: 10px; font-size: 12px; color: #999; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Reporte de Productividad por Conductor</h1>
            <div class="info">
                <h3>${c.nombre} ${c.apellido_paterno} ${c.apellido_materno}</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">DNI:</span>
                        <span class="info-value">${c.dni || '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Período:</span>
                        <span class="info-value">${fechaInicio || 'Inicio'} al ${fechaFin || 'Fin'}</span>
                    </div>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Envíos</h3>
                    <div class="stat-number">${totalEnvios}</div>
                </div>
                <div class="stat-card">
                    <h3>Entregados</h3>
                    <div class="stat-number success">${entregados}</div>
                </div>
                <div class="stat-card">
                    <h3>Demanda Total</h3>
                    <div class="stat-number">${totalDemanda.toFixed(2)} kg</div>
                </div>
                <div class="stat-card">
                    <h3>Pendientes</h3>
                    <div class="stat-number warning">${pendientes}</div>
                </div>
                <div class="stat-card">
                    <h3>Cancelados</h3>
                    <div class="stat-number danger">${cancelados}</div>
                </div>
                <div class="stat-card">
                    <h3>Rendimiento</h3>
                    <div class="stat-number">${tasaExito}%</div>
                </div>
            </div>
            
            <h4>Historial de Envíos (últimos 30)</h4>
            <table>
                <thead>
                    <tr>
                        <th>N° Envío</th>
                        <th>Fecha</th>
                        <th>Producto</th>
                        <th>Almacén</th>
                        <th>Demanda (kg)</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${enviosHtml}
                </tbody>
            </table>
            ${totalEnvios > 30 ? '<p class="nota">* Mostrando últimos 30 envíos de un total de ' + totalEnvios + '</p>' : ''}
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                * Reporte generado el ${fechaGeneracion} - Sistema Alaya S.A.C
            </p>
        </body>
        </html>
    `;
}