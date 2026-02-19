// reporte05.js - Movimiento de Productos
let datosMovimiento = [];
let datosFiltrados = [];
let fechaInicio = null;
let fechaFin = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('estado-envio').addEventListener('change', filtrarMovimiento);
    document.getElementById('search-movimiento').addEventListener('input', filtrarTabla);
    
    // Configurar flatpickr después de que el DOM esté listo
    setTimeout(() => {
        configurarDatePicker();
    }, 100);
}

function configurarDatePicker() {
    const fechaInput = document.getElementById('fecha-movimiento');
    if (fechaInput) {
        flatpickr(fechaInput, {
            mode: "range",
            dateFormat: "Y-m-d",
            locale: "es",
            maxDate: "today",
            onClose: function(selectedDates, dateStr, instance) {
                if (dateStr) {
                    const fechas = dateStr.split(" to ");
                    if (fechas.length === 2) {
                        fechaInicio = fechas[0];
                        fechaFin = fechas[1];
                    } else {
                        fechaInicio = fechas[0];
                        fechaFin = fechas[0];
                    }
                    filtrarMovimiento();
                } else {
                    fechaInicio = null;
                    fechaFin = null;
                    filtrarMovimiento();
                }
            }
        });
    }
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando movimientos de productos...');
        
        const response = await fetch('/main/reporte/obtener_movimiento_productos');
        const data = await response.json();
        
        if (data.success) {
            datosMovimiento = data.movimientos || [];
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

function parseFecha(fechaStr) {
    if (!fechaStr) return null;
    try {
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month-1, day);
    } catch (e) {
        return null;
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '';
    return fecha.toISOString().split('T')[0];
}

function aplicarFiltros() {
    const estadoFiltro = document.getElementById('estado-envio').value;
    
    datosFiltrados = [...datosMovimiento];
    
    // Filtrar por estado
    if (estadoFiltro) {
        datosFiltrados = datosFiltrados.filter(d => d.estado_envio === estadoFiltro);
    }
    
    // Filtrar por rango de fechas
    if (fechaInicio && fechaFin) {
        const fechaInicioObj = parseFecha(fechaInicio);
        const fechaFinObj = parseFecha(fechaFin);
        
        if (fechaInicioObj && fechaFinObj) {
            // Ajustar fecha fin para incluir todo el día
            fechaFinObj.setHours(23, 59, 59);
            
            datosFiltrados = datosFiltrados.filter(d => {
                if (!d.fecha_envio) return false;
                const fechaItem = parseFecha(d.fecha_envio);
                if (!fechaItem) return false;
                
                return fechaItem >= fechaInicioObj && fechaItem <= fechaFinObj;
            });
        }
    }
    
    actualizarTablaMovimiento();
}

function actualizarTablaMovimiento() {
    const tbody = document.getElementById('tabla-movimiento-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 8);
        document.getElementById('pagination-info').style.display = 'none';
        return;
    }
    
    // Ordenar por fecha (más reciente primero)
    datosFiltrados.sort((a, b) => {
        if (!a.fecha_envio) return 1;
        if (!b.fecha_envio) return -1;
        return b.fecha_envio.localeCompare(a.fecha_envio);
    });
    
    // Tomar solo últimos 20 registros
    const datosMostrar = datosFiltrados.slice(0, 20);
    
    datosMostrar.forEach(mov => {
        const tr = document.createElement('tr');
        
        // Determinar icono según estado
        let icono = 'clock';
        let estadoClass = 'estado-PENDIENTE';
        
        if (mov.estado_envio === 'ENTREGADO') {
            icono = 'check-circle';
            estadoClass = 'estado-ENTREGADO';
        } else if (mov.estado_envio === 'EN TRANSITO' || mov.estado_envio === 'EN_RUTA') {
            icono = 'truck';
            estadoClass = 'estado-EN_RUTA';
        } else if (mov.estado_envio === 'CANCELADO') {
            icono = 'ban';
            estadoClass = 'estado-CANCELADO';
        }
        
        // Formatear estado para mostrar
        let estadoMostrar = mov.estado_envio || 'PENDIENTE';
        if (estadoMostrar === 'EN_RUTA') {
            estadoMostrar = 'EN RUTA';
        }
        
        tr.innerHTML = `
            <td><strong>${mov.nro_envio || '-'}</strong></td>
            <td>${mov.producto_nombre || 'Sin producto'}</td>
            <td>${mov.almacen_nombre || '-'}</td>
            <td>${mov.fecha_envio || '-'}</td>
            <td>${mov.hora_envio || '-'}</td>
            <td>${mov.hora_llegada || '-'}</td>
            <td>
                <span class="${estadoClass}">
                    <i class="fas fa-${icono}"></i>
                    ${estadoMostrar}
                </span>
            </td>
            <td class="text-center">${mov.demanda ? mov.demanda.toFixed(2) : '0'} kg</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mostrar información de paginación
    const paginationInfo = document.getElementById('pagination-info');
    const totalRegistros = document.getElementById('total-registros');
    
    if (datosFiltrados.length > 20) {
        if (paginationInfo) paginationInfo.style.display = 'block';
        if (totalRegistros) totalRegistros.textContent = datosFiltrados.length;
    } else {
        if (paginationInfo) paginationInfo.style.display = 'none';
    }
}

function filtrarMovimiento() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-movimiento').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-movimiento-body tr');
    
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
        <h4>No hay movimientos registrados</h4>
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
    a.download = `movimiento_productos_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString('es-PE');
    const estadoFiltro = document.getElementById('estado-envio').value;
    const fechaRango = document.getElementById('fecha-movimiento').value;
    
    let filtrosTexto = [];
    if (estadoFiltro) {
        let estadoMostrar = estadoFiltro;
        if (estadoMostrar === 'EN_RUTA') estadoMostrar = 'EN RUTA';
        filtrosTexto.push(`Estado: ${estadoMostrar}`);
    }
    if (fechaRango) filtrosTexto.push(`Fecha: ${fechaRango}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    const datosExportar = datosFiltrados.slice(0, 50);
    
    let filasHtml = '';
    datosExportar.forEach(mov => {
        let estadoMostrar = mov.estado_envio || 'PENDIENTE';
        if (estadoMostrar === 'EN_RUTA') estadoMostrar = 'EN RUTA';
        
        filasHtml += `
            <tr>
                <td>${mov.nro_envio || '-'}</td>
                <td>${mov.producto_nombre || 'Sin producto'}</td>
                <td>${mov.almacen_nombre || '-'}</td>
                <td>${mov.fecha_envio || '-'}</td>
                <td>${mov.hora_envio || '-'}</td>
                <td>${mov.hora_llegada || '-'}</td>
                <td>${estadoMostrar}</td>
                <td>${mov.demanda ? mov.demanda.toFixed(2) : '0'} kg</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Movimiento de Productos - Alaya S.A.C</title>
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
            <h1>Reporte de Movimiento de Productos</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
                <p><strong>Total registros encontrados:</strong> ${datosFiltrados.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>N° Envío</th>
                        <th>Producto</th>
                        <th>Almacén</th>
                        <th>Fecha Envío</th>
                        <th>Hora Salida</th>
                        <th>Hora Llegada</th>
                        <th>Estado</th>
                        <th>Demanda (kg)</th>
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