// Variables globales
let datosRendimiento = [];
let datosFiltrados = [];
let graficoRendimiento = null;

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
    document.getElementById('fecha-inicio').addEventListener('change', filtrarRendimiento);
    document.getElementById('fecha-fin').addEventListener('change', filtrarRendimiento);
    document.getElementById('tipo-vehiculo').addEventListener('change', filtrarRendimiento);
    document.getElementById('search-vehiculos').addEventListener('input', filtrarTabla);
}

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando datos de rendimiento...');
        
        const response = await fetch('/main/reporte/obtener_rendimiento_vehiculos');
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

function calcularEficiencia(envios, demanda, gasto) {
    // Si no hay envíos o datos, retornar 0
    if (!envios || envios === 0) return 0;
    if (!demanda || demanda === 0) return 0;
    
    // Calcular eficiencia basada en kg por envío
    // Un valor normal podría ser 100-500 kg por envío
    const kgPorEnvio = demanda / envios;
    
    // Escalar a un porcentaje (asumiendo que 500 kg por envío es 100% eficiente)
    const eficienciaBase = (kgPorEnvio / 500) * 100;
    
    // Ajustar por gasto (menor gasto = mayor eficiencia)
    if (gasto && gasto > 0) {
        const gastoPorEnvio = gasto / envios;
        // Si el gasto es alto, reducir eficiencia
        const factorGasto = Math.max(0.5, Math.min(1.5, 100 / gastoPorEnvio));
        return Math.min(100, Math.round(eficienciaBase * factorGasto));
    }
    
    return Math.min(100, Math.round(eficienciaBase));
}

function getNivelRendimiento(eficiencia) {
    if (eficiencia >= 70) return 'ALTO';
    if (eficiencia >= 40) return 'MEDIO';
    return 'BAJO';
}

function aplicarFiltros() {
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const tipoVehiculo = document.getElementById('tipo-vehiculo').value;
    
    datosFiltrados = [...datosRendimiento];
    
    if (fechaInicio || fechaFin) {
        datosFiltrados = datosFiltrados.map(vehiculo => {
            // Filtrar envíos por fecha
            if (vehiculo.envios && vehiculo.envios.length > 0) {
                let enviosFiltrados = vehiculo.envios;
                
                if (fechaInicio) {
                    enviosFiltrados = enviosFiltrados.filter(e => e.fecha_envio >= fechaInicio);
                }
                if (fechaFin) {
                    enviosFiltrados = enviosFiltrados.filter(e => e.fecha_envio <= fechaFin);
                }
                
                // Recalcular métricas con envíos filtrados
                const totalEnvios = enviosFiltrados.length;
                const totalDemanda = enviosFiltrados.reduce((sum, e) => sum + (e.demanda || 0), 0);
                const totalGasto = enviosFiltrados.reduce((sum, e) => sum + (e.gasto || 0), 0);
                
                return {
                    ...vehiculo,
                    envios: enviosFiltrados,
                    total_envios: totalEnvios,
                    total_demanda: totalDemanda,
                    total_gasto: totalGasto,
                    eficiencia: calcularEficiencia(totalEnvios, totalDemanda, totalGasto)
                };
            }
            return {
                ...vehiculo,
                total_envios: 0,
                total_demanda: 0,
                total_gasto: 0,
                eficiencia: 0
            };
        });
    } else {
        // Si no hay filtros de fecha, recalcular eficiencia para todos
        datosFiltrados = datosFiltrados.map(vehiculo => {
            return {
                ...vehiculo,
                eficiencia: calcularEficiencia(
                    vehiculo.total_envios || 0, 
                    vehiculo.total_demanda || 0, 
                    vehiculo.total_gasto || 0
                )
            };
        });
    }
    
    if (tipoVehiculo) {
        datosFiltrados = datosFiltrados.filter(v => v.tipo_vehiculo === tipoVehiculo);
    }
    
    actualizarTablaRendimiento();
    actualizarGrafico();
}

function actualizarTablaRendimiento() {
    const tbody = document.getElementById('tabla-rendimiento-body');
    tbody.innerHTML = '';
    
    if (datosFiltrados.length === 0) {
        mostrarNoResultados(tbody, 7);
        return;
    }
    
    // Ordenar por total de envíos (mayor a menor)
    datosFiltrados.sort((a, b) => (b.total_envios || 0) - (a.total_envios || 0));
    
    datosFiltrados.forEach(vehiculo => {
        const eficiencia = vehiculo.eficiencia || 0;
        const nivelRendimiento = getNivelRendimiento(eficiencia);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong>${vehiculo.placa || '-'}</strong>
                <br>
                <small style="color: #a5d8ff;">${vehiculo.modelo || ''} - ${vehiculo.marca || ''}</small>
            </td>
            <td>${vehiculo.conductor_nombre || 'No asignado'}</td>
            <td class="text-center">${vehiculo.total_envios || 0}</td>
            <td class="text-center">${(vehiculo.total_demanda || 0).toLocaleString()}</td>
            <td class="text-center">S/ ${(vehiculo.total_gasto || 0).toLocaleString()}</td>
            <td class="text-center">
                <span class="rendimiento-${nivelRendimiento}">
                    <i class="fas fa-${nivelRendimiento === 'ALTO' ? 'arrow-up' : nivelRendimiento === 'MEDIO' ? 'minus' : 'arrow-down'}"></i>
                    ${eficiencia}%
                </span>
            </td>
            <td style="min-width: 120px;">
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${eficiencia}%"></div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarGrafico() {
    const ctx = document.getElementById('grafico-rendimiento').getContext('2d');
    
    // Top 10 vehículos por envíos
    const topVehiculos = [...datosFiltrados]
        .filter(v => v.total_envios > 0)
        .sort((a, b) => (b.total_envios || 0) - (a.total_envios || 0))
        .slice(0, 10);
    
    if (topVehiculos.length === 0) {
        return;
    }
    
    const labels = topVehiculos.map(v => v.placa);
    const enviosData = topVehiculos.map(v => v.total_envios || 0);
    const demandaData = topVehiculos.map(v => Math.round((v.total_demanda || 0) / 100)); // Escalar para visualización
    
    if (graficoRendimiento) {
        graficoRendimiento.destroy();
    }
    
    graficoRendimiento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Envíos',
                    data: enviosData,
                    backgroundColor: 'rgba(64, 224, 208, 0.7)',
                    borderColor: '#40e0d0',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Demanda (x100 kg)',
                    data: demandaData,
                    backgroundColor: 'rgba(70, 130, 180, 0.7)',
                    borderColor: '#4682b4',
                    borderWidth: 1,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#e0f2fe'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(64, 224, 208, 0.1)'
                    },
                    ticks: {
                        color: '#a5d8ff'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#e0f2fe'
                    }
                }
            }
        }
    });
}

function filtrarRendimiento() {
    aplicarFiltros();
}

function filtrarTabla() {
    const termino = document.getElementById('search-vehiculos').value.toLowerCase();
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
        <i class="fas fa-chart-line"></i>
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
    a.download = `rendimiento_vehiculos_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const fechaInicio = document.getElementById('fecha-inicio').value;
    const fechaFin = document.getElementById('fecha-fin').value;
    const tipoVehiculo = document.getElementById('tipo-vehiculo').value;
    
    let filtrosTexto = [];
    if (fechaInicio) filtrosTexto.push(`Desde: ${fechaInicio}`);
    if (fechaFin) filtrosTexto.push(`Hasta: ${fechaFin}`);
    if (tipoVehiculo) filtrosTexto.push(`Tipo: ${tipoVehiculo}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    let filasHtml = '';
    datosFiltrados.slice(0, 100).forEach(vehiculo => {
        const eficiencia = vehiculo.eficiencia || 0;
        filasHtml += `
            <tr>
                <td>${vehiculo.placa || '-'} (${vehiculo.modelo || ''})</td>
                <td>${vehiculo.conductor_nombre || 'No asignado'}</td>
                <td>${vehiculo.total_envios || 0}</td>
                <td>${(vehiculo.total_demanda || 0).toLocaleString()} kg</td>
                <td>S/ ${(vehiculo.total_gasto || 0).toLocaleString()}</td>
                <td>${eficiencia}%</td>
            </tr>
        `;
    });
    
    return `
        <html>
        <head>
            <title>Rendimiento de Vehículos - Alaya S.A.C</title>
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
            <h1>Reporte de Rendimiento de Vehículos</h1>
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
                        <th>Envíos</th>
                        <th>Demanda</th>
                        <th>Gasto</th>
                        <th>Eficiencia</th>
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