// Variables globales
let datosAsignaciones = [];
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    flatpickr(".datepicker", {
        dateFormat: "Y-m-d",
        allowInput: true
    });
    
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('estado-asignacion').addEventListener('change', filtrarAsignaciones);
    document.getElementById('fecha-inicio').addEventListener('change', filtrarAsignaciones);
    document.getElementById('fecha-fin').addEventListener('change', filtrarAsignaciones);
    document.getElementById('search-asignaciones').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando asignaciones...');
        
        const response = await fetch('/main/reporte/obtener_asignaciones_completo');
        const data = await response.json();
        
        if (data.success) {
            datosAsignaciones = data.asignaciones || [];
            actualizarReporte();
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

function actualizarReporte() {
    aplicarFiltros();
}

function calcularDiasActivo(fechaAsignacion, estado) {
    if (!fechaAsignacion) return 0;
    
    const fechaInicio = new Date(fechaAsignacion);
    const fechaActual = new Date();
    const diffTime = Math.abs(fechaActual - fechaInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return estado === 'ACTIVO' ? diffDays : 0;
}

function aplicarFiltros() {
    const estadoFiltro = document.getElementById('estado-asignacion').value;
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    
    datosFiltrados = [...datosAsignaciones];
    
    if (estadoFiltro) {
        datosFiltrados = datosFiltrados.filter(a => a.estado === estadoFiltro);
    }
    
    if (fechaInicio) {
        datosFiltrados = datosFiltrados.filter(a => a.fecha_asignacion >= fechaInicio);
    }
    
    if (fechaFin) {
        datosFiltrados = datosFiltrados.filter(a => a.fecha_asignacion <= fechaFin);
    }
    
    actualizarTablaAsignaciones();
}

function actualizarTablaAsignaciones() {
    const tbody = document.getElementById('tabla-asignaciones-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 6);
        return;
    }
    
    // Ordenar por fecha (más recientes primero)
    datosFiltrados.sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion));
    
    // Mostrar solo últimos 50 registros
    const datosMostrar = datosFiltrados.slice(0, 50);
    
    datosMostrar.forEach(asignacion => {
        const diasActivo = calcularDiasActivo(asignacion.fecha_asignacion, asignacion.estado);
        const totalEnvios = asignacion.total_envios || 0;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${asignacion.vehiculo_placa || '-'}</strong>
                <br>
                <small style="color: #a5d8ff;">${asignacion.vehiculo_modelo || ''}</small>
            </td>
            <td>
                <strong>${asignacion.conductor_nombre || 'Sin asignar'}</strong>
                <br>
                <small style="color: #a5d8ff;">${asignacion.conductor_dni || ''}</small>
            </td>
            <td>${asignacion.fecha_asignacion || '-'}</td>
            <td>
                <span class="estado-${asignacion.estado || 'INACTIVO'}">
                    <i class="fas fa-${asignacion.estado === 'ACTIVO' ? 'check-circle' : 'ban'}"></i>
                    ${asignacion.estado || 'INACTIVO'}
                </span>
            </td>
            <td class="text-center">${diasActivo} días</td>
            <td class="text-center">
                <span class="badge-envios">${totalEnvios}</span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarAsignaciones() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-asignaciones').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-asignaciones-body tr');
    
    filas.forEach(fila => {
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(termino) ? '' : 'none';
    });
}

function mostrarNoResultados(tbody, colSpan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.className = 'no-results';
    td.innerHTML = `
        <i class="fas fa-link"></i>
        <h4>No hay asignaciones registradas</h4>
        <p>No se encontraron asignaciones para los filtros seleccionados</p>
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
    a.download = `asignaciones_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const estadoFiltro = document.getElementById('estado-asignacion').value;
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    
    let filtrosTexto = [];
    if (estadoFiltro) filtrosTexto.push(`Estado: ${estadoFiltro}`);
    if (fechaInicio) filtrosTexto.push(`Desde: ${fechaInicio}`);
    if (fechaFin) filtrosTexto.push(`Hasta: ${fechaFin}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    let filasHtml = '';
    datosFiltrados.slice(0, 100).forEach(asignacion => {
        const diasActivo = calcularDiasActivo(asignacion.fecha_asignacion, asignacion.estado);
        filasHtml += `
            <tr>
                <td>${asignacion.vehiculo_placa || '-'} (${asignacion.vehiculo_modelo || ''})</td>
                <td>${asignacion.conductor_nombre || 'Sin asignar'}</td>
                <td>${asignacion.fecha_asignacion || '-'}</td>
                <td>${asignacion.estado || 'INACTIVO'}</td>
                <td>${diasActivo} días</td>
                <td>${asignacion.total_envios || 0}</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Reporte de Asignaciones - Alaya S.A.C</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #1e3a5a; border-bottom: 2px solid #40e0d0; padding-bottom: 10px; }
                .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info p { margin: 5px 0; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th { background-color: #1e3a5a; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #ddd; padding: 8px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .nota { margin-top: 10px; font-size: 12px; color: #999; font-style: italic; }
            </style>
        </head>
        <body>
            <h1>Reporte de Asignaciones Vehículo-Conductor</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
                <p><strong>Total registros:</strong> ${datosFiltrados.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Vehículo</th>
                        <th>Conductor</th>
                        <th>Fecha Asignación</th>
                        <th>Estado</th>
                        <th>Días Activo</th>
                        <th>Total Envíos</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHtml}
                </tbody>
            </table>
            
            ${datosFiltrados.length > 100 ? '<p class="nota">* Mostrando primeros 100 registros de un total de ' + datosFiltrados.length + '</p>' : ''}
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                * Reporte generado automáticamente por el sistema Alaya S.A.C
            </p>
        </body>
        </html>
    `;
}