// reporte06.js - Rendimiento de Almacenes
let datosRendimiento = [];
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('tipo-almacen').addEventListener('change', filtrarRendimiento);
    document.getElementById('ocupacion-min').addEventListener('input', filtrarRendimiento);
    document.getElementById('search-rendimiento').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando rendimiento de almacenes...');
        
        const response = await fetch('/main/reporte/obtener_rendimiento_almacenes');
        const data = await response.json();
        
        if (data.success) {
            datosRendimiento = data.rendimiento || [];
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

function aplicarFiltros() {
    const tipoFiltro = document.getElementById('tipo-almacen').value;
    const ocupacionMin = document.getElementById('ocupacion-min').value;
    
    datosFiltrados = [...datosRendimiento];
    
    if (tipoFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.tipo_almacen === tipoFiltro);
    }
    
    if (ocupacionMin) {
        const min = parseFloat(ocupacionMin);
        if (!isNaN(min)) {
            datosFiltrados = datosFiltrados.filter(d => d.ocupacion >= min);
        }
    }
    
    actualizarTablaRendimiento();
}

function actualizarTablaRendimiento() {
    const tbody = document.getElementById('tabla-rendimiento-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 8);
        document.getElementById('pagination-info').style.display = 'none';
        return;
    }
    
    // Ordenar por ocupación (mayor primero)
    datosFiltrados.sort((a, b) => b.ocupacion - a.ocupacion);
    
    // Tomar solo últimos 20 registros
    const datosMostrar = datosFiltrados.slice(0, 20);
    
    datosMostrar.forEach(alm => {
        const rendimiento = alm.rendimiento || 'BAJO';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${alm.almacen_nombre || 'Sin nombre'}</strong></td>
            <td>${alm.tipo_almacen || '-'}</td>
            <td>${alm.direccion || '-'}</td>
            <td class="text-center">${alm.capacidad_total || 0} kg</td>
            <td class="text-center">${alm.stock_actual || 0} kg</td>
            <td class="text-center">
                <span class="estado-${rendimiento}">
                    ${alm.ocupacion}%
                </span>
            </td>
            <td class="text-center">${alm.total_envios || 0}</td>
            <td class="text-center">
                <span class="estado-${rendimiento}">
                    ${rendimiento}
                </span>
            </td>
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

function filtrarRendimiento() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-rendimiento').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-rendimiento-body tr');
    
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
        <h4>No hay datos de rendimiento</h4>
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
    a.download = `rendimiento_almacenes_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const tipoFiltro = document.getElementById('tipo-almacen').value;
    const ocupacionMin = document.getElementById('ocupacion-min').value;
    
    let filtrosTexto = [];
    if (tipoFiltro) filtrosTexto.push(`Tipo: ${tipoFiltro}`);
    if (ocupacionMin) filtrosTexto.push(`Ocupación mínima: ${ocupacionMin}%`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    const datosExportar = datosFiltrados.slice(0, 50);
    
    let filasHtml = '';
    datosExportar.forEach(alm => {
        filasHtml += `
            <tr>
                <td>${alm.almacen_nombre || 'Sin nombre'}</td>
                <td>${alm.tipo_almacen || '-'}</td>
                <td>${alm.direccion || '-'}</td>
                <td>${alm.capacidad_total || 0} kg</td>
                <td>${alm.stock_actual || 0} kg</td>
                <td>${alm.ocupacion}%</td>
                <td>${alm.total_envios || 0}</td>
                <td>${alm.rendimiento || 'BAJO'}</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Rendimiento de Almacenes - Alaya S.A.C</title>
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
            <h1>Reporte de Rendimiento de Almacenes</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
                <p><strong>Total registros encontrados:</strong> ${datosFiltrados.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Almacén</th>
                        <th>Tipo</th>
                        <th>Dirección</th>
                        <th>Capacidad Total (kg)</th>
                        <th>Stock Actual (kg)</th>
                        <th>% Ocupación</th>
                        <th>Total Envíos</th>
                        <th>Rendimiento</th>
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