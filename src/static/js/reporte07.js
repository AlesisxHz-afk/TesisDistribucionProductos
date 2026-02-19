// Variables globales
let datosVehiculos = [];
let datosFiltrados = [];

document.addEventListener('DOMContentLoaded', function() {
    cargarDatosIniciales();
    configurarEventListeners();
    cargarAniosFabricacion();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('tipo-vehiculo').addEventListener('change', filtrarVehiculos);
    document.getElementById('estado-vehiculo').addEventListener('change', filtrarVehiculos);
    document.getElementById('anio-fabricacion').addEventListener('change', filtrarVehiculos);
    document.getElementById('search-vehiculos').addEventListener('input', filtrarTabla);
}

function cargarAniosFabricacion() {
    const selectAnio = document.getElementById('anio-fabricacion');
    const anioActual = new Date().getFullYear();
    
    for (let anio = anioActual; anio >= anioActual - 20; anio--) {
        const option = document.createElement('option');
        option.value = anio;
        option.textContent = anio;
        selectAnio.appendChild(option);
    }
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando inventario de vehículos...');
        
        const response = await fetch('/main/reporte/obtener_vehiculos');
        const data = await response.json();
        
        if (data.success) {
            datosVehiculos = data.vehiculos || [];
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
    const tipoFiltro = document.getElementById('tipo-vehiculo').value;
    const estadoFiltro = document.getElementById('estado-vehiculo').value;
    const anioFiltro = document.getElementById('anio-fabricacion').value;
    
    datosFiltrados = [...datosVehiculos];
    
    if (tipoFiltro) {
        datosFiltrados = datosFiltrados.filter(v => v.tipo_vehiculo === tipoFiltro);
    }
    
    if (estadoFiltro) {
        datosFiltrados = datosFiltrados.filter(v => v.estado === estadoFiltro);
    }
    
    if (anioFiltro) {
        datosFiltrados = datosFiltrados.filter(v => v.anio_fabricacion == anioFiltro);
    }
    
    actualizarTablaVehiculos();
}

function actualizarTablaVehiculos() {
    const tbody = document.getElementById('tabla-vehiculos-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 7);
        return;
    }
    
    datosFiltrados.forEach(vehiculo => {
        const tr = document.createElement('tr');
        const conductorAsignado = vehiculo.conductor_asignado || 'No asignado';
        const conductorClass = vehiculo.conductor_asignado ? 'conductor-asignado' : '';
        
        tr.innerHTML = `
            <td><strong>${vehiculo.placa || '-'}</strong></td>
            <td>${vehiculo.marca || '-'} ${vehiculo.modelo || '-'}</td>
            <td>${vehiculo.tipo_vehiculo || '-'}</td>
            <td>${vehiculo.anio_fabricacion || '-'}</td>
            <td class="text-center">${(vehiculo.cantidad_carga || 0).toLocaleString()} kg</td>
            <td>
                <span class="estado-${vehiculo.estado || 'INACTIVO'}">
                    <i class="fas fa-${vehiculo.estado === 'ACTIVO' ? 'check-circle' : vehiculo.estado === 'MANTENIMIENTO' ? 'tools' : 'ban'}"></i>
                    ${vehiculo.estado || 'INACTIVO'}
                </span>
            </td>
            <td>
                <span class="${conductorClass}">
                    <i class="fas fa-user"></i>
                    ${conductorAsignado}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarVehiculos() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-vehiculos').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-vehiculos-body tr');
    
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
        <i class="fas fa-truck"></i>
        <h4>No hay vehículos registrados</h4>
        <p>No se encontraron vehículos para los filtros seleccionados</p>
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
    a.download = `inventario_vehiculos_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const tipoFiltro = document.getElementById('tipo-vehiculo').value;
    const estadoFiltro = document.getElementById('estado-vehiculo').value;
    const anioFiltro = document.getElementById('anio-fabricacion').value;
    
    let filtrosTexto = [];
    if (tipoFiltro) filtrosTexto.push(`Tipo: ${tipoFiltro}`);
    if (estadoFiltro) filtrosTexto.push(`Estado: ${estadoFiltro}`);
    if (anioFiltro) filtrosTexto.push(`Año: ${anioFiltro}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    let filasHtml = '';
    datosFiltrados.slice(0, 100).forEach(vehiculo => {
        filasHtml += `
            <tr>
                <td>${vehiculo.placa || '-'}</td>
                <td>${vehiculo.marca || '-'} ${vehiculo.modelo || '-'}</td>
                <td>${vehiculo.tipo_vehiculo || '-'}</td>
                <td>${vehiculo.anio_fabricacion || '-'}</td>
                <td>${(vehiculo.cantidad_carga || 0).toLocaleString()} kg</td>
                <td>${vehiculo.estado || 'INACTIVO'}</td>
                <td>${vehiculo.conductor_asignado || 'No asignado'}</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Inventario de Vehículos - Alaya S.A.C</title>
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
            <h1>Inventario de Vehículos</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
                <p><strong>Total registros:</strong> ${datosFiltrados.length}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Placa</th>
                        <th>Marca / Modelo</th>
                        <th>Tipo</th>
                        <th>Año</th>
                        <th>Capacidad</th>
                        <th>Estado</th>
                        <th>Conductor</th>
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