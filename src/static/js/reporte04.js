// reporte04.js - Inventario de Almacenes
let datosInventario = [];
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('tipo-almacen').addEventListener('change', filtrarInventario);
    document.getElementById('estado-almacen').addEventListener('change', filtrarInventario);
    document.getElementById('search-inventario').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando inventario de almacenes...');
        
        const response = await fetch('/main/reporte/obtener_inventario_almacenes');
        const data = await response.json();
        
        if (data.success) {
            datosInventario = data.inventario || [];
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
    const estadoFiltro = document.getElementById('estado-almacen').value;
    
    datosFiltrados = [...datosInventario];
    
    if (tipoFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.tipo_almacen === tipoFiltro);
    }
    
    if (estadoFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.estado === estadoFiltro);
    }
    
    actualizarTablaInventario();
}

function actualizarTablaInventario() {
    const tbody = document.getElementById('tabla-inventario-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 8);
        document.getElementById('pagination-info').style.display = 'none';
        return;
    }
    
    // Ordenar por almacén y producto
    datosFiltrados.sort((a, b) => {
        if (a.almacen_nombre !== b.almacen_nombre) {
            return a.almacen_nombre.localeCompare(b.almacen_nombre);
        }
        return (a.producto_nombre || '').localeCompare(b.producto_nombre || '');
    });
    
    // Tomar solo últimos 20 registros
    const datosMostrar = datosFiltrados.slice(0, 20);
    
    datosMostrar.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.almacen_nombre || 'Sin nombre'}</strong></td>
            <td>${item.tipo_almacen || '-'}</td>
            <td>${item.direccion || '-'}</td>
            <td>${item.producto_nombre || 'Sin producto'}</td>
            <td>${item.producto_tipo || '-'}</td>
            <td class="text-center">${item.stock_actual || 0} kg</td>
            <td class="text-center">${item.capacidad_total || 0} kg</td>
            <td class="text-center">
                <span class="${item.ocupacion > 90 ? 'estado-ALTO' : (item.ocupacion > 50 ? 'estado-MEDIO' : 'estado-BAJO')}">
                    ${item.ocupacion}%
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

function filtrarInventario() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-inventario').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-inventario-body tr');
    
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
        <h4>No hay inventario registrado</h4>
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
    a.download = `inventario_almacenes_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const tipoFiltro = document.getElementById('tipo-almacen').value;
    const estadoFiltro = document.getElementById('estado-almacen').value;
    
    let filtrosTexto = [];
    if (tipoFiltro) filtrosTexto.push(`Tipo: ${tipoFiltro}`);
    if (estadoFiltro) filtrosTexto.push(`Estado: ${estadoFiltro}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    const datosExportar = datosFiltrados.slice(0, 50);
    
    let filasHtml = '';
    datosExportar.forEach(item => {
        filasHtml += `
            <tr>
                <td>${item.almacen_nombre || 'Sin nombre'}</td>
                <td>${item.tipo_almacen || '-'}</td>
                <td>${item.direccion || '-'}</td>
                <td>${item.producto_nombre || 'Sin producto'}</td>
                <td>${item.producto_tipo || '-'}</td>
                <td>${item.stock_actual || 0} kg</td>
                <td>${item.capacidad_total || 0} kg</td>
                <td>${item.ocupacion}%</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Inventario de Almacenes - Alaya S.A.C</title>
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
            <h1>Reporte de Inventario de Almacenes</h1>
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
                        <th>Producto</th>
                        <th>Tipo Producto</th>
                        <th>Stock Actual (kg)</th>
                        <th>Capacidad (kg)</th>
                        <th>% Ocupación</th>
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