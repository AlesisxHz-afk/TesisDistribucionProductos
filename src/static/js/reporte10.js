// Variables globales
let datosConductores = [];
let fechaInicio = null;
let fechaFin = null;

document.addEventListener('DOMContentLoaded', function() {
    inicializarDatepickers();
    cargarDatosIniciales();
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
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('search-conductores').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    await actualizarReporte();
}

async function actualizarReporte() {
    try {
        mostrarCargando('Cargando datos de rendimiento...');
        
        let url = '/main/reporte/obtener_rendimiento_conductores';
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
            datosConductores = data.conductores || [];
            actualizarTablaRendimiento();
        } else {
            throw new Error(data.message || 'Error al cargar datos');
        }
        
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos: ' + error.message);
        Swal.close();
    }
}

function actualizarTablaRendimiento() {
    const tbody = document.getElementById('tabla-rendimiento-body');
    tbody.innerHTML = '';
    
    if (datosConductores.length === 0) {
        mostrarNoResultados(tbody, 6);
        return;
    }
    
    // Ordenar por total de envíos (mayor a menor)
    const conductoresOrdenados = [...datosConductores].sort((a, b) => b.total_envios - a.total_envios);
    
    conductoresOrdenados.forEach((cond, index) => {
        const tr = document.createElement('tr');
        
        const tasaExito = cond.tasa_exito || 0;
        const badgeClass = tasaExito >= 90 ? 'badge-alta' : (tasaExito >= 70 ? 'badge-media' : 'badge-baja');
        
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <strong>${cond.conductor_nombre || 'Sin nombre'}</strong>
            </td>
            <td class="text-center">${cond.total_envios}</td>
            <td class="text-center">${cond.completados || 0}</td>
            <td class="text-center">
                <span class="badge-eficiencia ${badgeClass}">
                    ${tasaExito}%
                </span>
            </td>
            <td class="text-center">
                <button class="btn-action" onclick="verDetalleConductor(${cond.conductor_id})" title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function verDetalleConductor(conductorId) {
    try {
        mostrarCargando('Cargando detalles del conductor...');
        
        let url = `/main/reporte/obtener_envios_conductor/${conductorId}`;
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
            mostrarModalDetalle(data);
        } else {
            throw new Error(data.message || 'Error al cargar detalles');
        }
        
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar detalles: ' + error.message);
        Swal.close();
    }
}

function mostrarModalDetalle(data) {
    const conductor = datosConductores.find(c => c.conductor_id === data.envios[0]?.conductor_id) || {};
    const resumen = data.resumen || {};
    const envios = data.envios || [];
    
    let enviosHtml = '';
    envios.slice(0, 10).forEach(envio => {
        enviosHtml += `
            <tr>
                <td>${envio.nro_envio || '-'}</td>
                <td>${envio.fecha_envio || '-'}</td>
                <td>${envio.producto_desc || '-'}</td>
                <td>${envio.almacen_nombre || '-'}</td>
                <td>
                    <span class="estado-${envio.estado_envio === 'ENTREGADO' ? 'COMPLETADO' : 'PENDIENTE'}">
                        ${envio.estado_envio || 'PENDIENTE'}
                    </span>
                </td>
                <td class="text-right">${envio.demanda.toFixed(2)}</td>
            </tr>
        `;
    });
    
    const modalContent = document.getElementById('detalle-conductor-content');
    modalContent.innerHTML = `
        <div class="detalle-conductor">
            <h4>${conductor.conductor_nombre || 'Conductor'}</h4>
            
            <div class="resumen-grid">
                <div class="resumen-item">
                    <span class="resumen-label">Total Envíos:</span>
                    <span class="resumen-value">${resumen.total_envios || 0}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Entregados:</span>
                    <span class="resumen-value">${resumen.completados || 0}</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Demanda Total:</span>
                    <span class="resumen-value">${(resumen.total_demanda || 0).toFixed(2)} kg</span>
                </div>
                <div class="resumen-item">
                    <span class="resumen-label">Tiempo Promedio:</span>
                    <span class="resumen-value">${(resumen.tiempo_promedio || 0).toFixed(1)} min</span>
                </div>
            </div>
            
            <h5>Últimos envíos</h5>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>N° Envío</th>
                            <th>Fecha</th>
                            <th>Producto</th>
                            <th>Almacén</th>
                            <th>Estado</th>
                            <th>Demanda (kg)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${enviosHtml || '<tr><td colspan="6" class="text-center">No hay envíos registrados</td></tr>'}
                    </tbody>
                </table>
            </div>
            ${envios.length > 10 ? '<p class="text-muted">Mostrando últimos 10 envíos</p>' : ''}
        </div>
    `;
    
    $('#modal-detalle').modal('show');
}

function filtrarTabla() {
    const termino = document.getElementById('search-conductores').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-rendimiento-body tr');
    
    filas.forEach(fila => {
        const nombreConductor = fila.querySelector('td:nth-child(2)')?.textContent.toLowerCase() || '';
        fila.style.display = nombreConductor.includes(termino) ? '' : 'none';
    });
}

function mostrarNoResultados(tbody, colSpan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.className = 'no-results';
    td.innerHTML = `
        <i class="fas fa-box-open"></i>
        <h4>No hay datos disponibles</h4>
        <p>No se encontraron registros para los filtros seleccionados</p>
    `;
    tr.appendChild(td);
    tbody.appendChild(tr);
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
    const contenido = generarHTMLExportacion();
    const blob = new Blob([contenido], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_rendimiento.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    
    let tablaHtml = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Conductor</th>
                    <th>Total Envíos</th>
                    <th>Entregados</th>
                    <th>Rendimiento</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    datosConductores.slice(0, 50).forEach((cond, index) => {
        tablaHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${cond.conductor_nombre || 'Sin nombre'}</td>
                <td>${cond.total_envios}</td>
                <td>${cond.completados || 0}</td>
                <td>${(cond.tasa_exito || 0)}%</td>
            </tr>
        `;
    });
    
    tablaHtml += '</tbody></table>';
    
    return `
        <html>
        <head>
            <title>Reporte de Rendimiento - Alaya S.A.C</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #1e3a5a; border-bottom: 2px solid #40e0d0; padding-bottom: 10px; }
                .fecha { color: #666; margin-bottom: 20px; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th { background-color: #1e3a5a; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #ddd; padding: 8px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        </head>
        <body>
            <h1>Reporte de Rendimiento de Conductores</h1>
            <div class="fecha">
                <p>Generado el: ${fechaGeneracion}</p>
                ${fechaInicio ? `<p>Período: ${fechaInicio} - ${fechaFin || 'Actual'}</p>` : ''}
            </div>
            ${tablaHtml}
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                * Reporte generado automáticamente por el sistema Alaya S.A.C
            </p>
        </body>
        </html>
    `;
}