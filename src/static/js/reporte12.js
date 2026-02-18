// Variables globales
let datosDisponibilidad = [];
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('dia-semana').addEventListener('change', filtrarDisponibilidad);
    document.getElementById('estado-conductor').addEventListener('change', filtrarDisponibilidad);
    document.getElementById('search-disponibilidad').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando datos de disponibilidad...');
        
        const response = await fetch('/main/reporte/obtener_disponibilidad_completa');
        const data = await response.json();
        
        if (data.success) {
            datosDisponibilidad = data.disponibilidad || [];
            normalizarDias();
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

function normalizarDias() {
    // Normalizar los nombres de días (primera letra mayúscula)
    datosDisponibilidad = datosDisponibilidad.map(item => {
        if (item.dia) {
            // Convertir a minúsculas y luego capitalizar primera letra
            const diaLower = item.dia.toLowerCase();
            item.dia = diaLower.charAt(0).toUpperCase() + diaLower.slice(1);
        }
        return item;
    });
}

function actualizarReporte() {
    aplicarFiltros();
}

function convertirHora(horaStr) {
    if (!horaStr) return 0;
    const [horas, minutos] = horaStr.split(':').map(Number);
    return horas + minutos / 60;
}

function aplicarFiltros() {
    // Aplicar filtros
    const diaFiltro = document.getElementById('dia-semana').value;
    const estadoFiltro = document.getElementById('estado-conductor').value;
    
    datosFiltrados = [...datosDisponibilidad];
    
    if (diaFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.dia === diaFiltro);
    }
    
    if (estadoFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.conductor_estado === estadoFiltro);
    }
    
    actualizarTablaDisponibilidad();
}

function actualizarTablaDisponibilidad() {
    const tbody = document.getElementById('tabla-disponibilidad-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 7);
        document.getElementById('pagination-info').style.display = 'none';
        return;
    }
    
    // Ordenar por conductor y día
    const ordenDias = {'Lunes':1, 'Martes':2, 'Miercoles':3, 'Jueves':4, 'Viernes':5, 'Sabado':6};
    datosFiltrados.sort((a, b) => {
        if (a.conductor_nombre !== b.conductor_nombre) {
            return a.conductor_nombre.localeCompare(b.conductor_nombre);
        }
        return (ordenDias[a.dia] || 7) - (ordenDias[b.dia] || 7);
    });
    
    // Tomar solo últimos 20 registros (los más recientes por orden alfabético)
    const datosMostrar = datosFiltrados.slice(0, 20);
    
    datosMostrar.forEach(disp => {
        const inicio = convertirHora(disp.hora_inicio);
        const fin = convertirHora(disp.hora_fin);
        const horas = (fin - inicio).toFixed(1);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${disp.conductor_nombre || 'Sin nombre'}</strong>
            </td>
            <td>${disp.conductor_dni || '-'}</td>
            <td>
                <span class="estado-${disp.conductor_estado || 'INACTIVO'}">
                    <i class="fas fa-${disp.conductor_estado === 'ACTIVO' ? 'check-circle' : 'ban'}"></i>
                    ${disp.conductor_estado || 'INACTIVO'}
                </span>
            </td>
            <td>${disp.dia || '-'}</td>
            <td>${disp.hora_inicio || '-'}</td>
            <td>${disp.hora_fin || '-'}</td>
            <td class="text-center">${horas} h</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mostrar información de paginación
    if (datosFiltrados.length > 20) {
        document.getElementById('pagination-info').style.display = 'block';
        document.getElementById('total-registros').textContent = datosFiltrados.length;
    } else {
        document.getElementById('pagination-info').style.display = 'none';
    }
}

function filtrarDisponibilidad() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-disponibilidad').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-disponibilidad-body tr');
    
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
        <i class="fas fa-box-open"></i>
        <h4>No hay disponibilidad registrada</h4>
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
    a.download = `reporte_disponibilidad_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const diaFiltro = document.getElementById('dia-semana').value;
    const estadoFiltro = document.getElementById('estado-conductor').value;
    
    let filtrosTexto = [];
    if (diaFiltro) filtrosTexto.push(`Día: ${diaFiltro}`);
    if (estadoFiltro) filtrosTexto.push(`Estado: ${estadoFiltro}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    // Para exportación, tomar solo primeros 50 registros
    const datosExportar = datosFiltrados.slice(0, 50);
    
    let filasHtml = '';
    datosExportar.forEach(disp => {
        const inicio = convertirHora(disp.hora_inicio);
        const fin = convertirHora(disp.hora_fin);
        const horas = (fin - inicio).toFixed(1);
        
        filasHtml += `
            <tr>
                <td>${disp.conductor_nombre || 'Sin nombre'}</td>
                <td>${disp.conductor_dni || '-'}</td>
                <td>${disp.conductor_estado || 'INACTIVO'}</td>
                <td>${disp.dia || '-'}</td>
                <td>${disp.hora_inicio || '-'}</td>
                <td>${disp.hora_fin || '-'}</td>
                <td>${horas} h</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Reporte de Disponibilidad - Alaya S.A.C</title>
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
            <h1>Reporte de Disponibilidad de Conductores</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
                <p><strong>Total registros encontrados:</strong> ${datosFiltrados.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Conductor</th>
                        <th>DNI</th>
                        <th>Estado</th>
                        <th>Día</th>
                        <th>Hora Inicio</th>
                        <th>Hora Fin</th>
                        <th>Horas</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHtml}
                </tbody>
            </table>
            
            ${datosFiltrados.length > 50 ? '<p class="nota">* Mostrando primeros 50 registros de un total de ' + datosFiltrados.length + '</p>' : ''}
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                * Reporte generado automáticamente por el sistema Alaya S.A.C
            </p>
        </body>
        </html>
    `;
}