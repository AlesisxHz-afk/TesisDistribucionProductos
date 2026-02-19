// Variables globales
let datosProductos = [];
let datosEnvios = [];
let tendenciaChartInstance = null;

const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
    cargarAniosTendencia();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('producto-select').addEventListener('change', cargarTendenciaProducto);
    document.getElementById('anio-tendencia').addEventListener('change', cargarTendenciaProducto);
}

async function cargarProductos() {
    try {
        const response = await fetch('/main/reporte/obtener_productos');
        const data = await response.json();
        
        if (data.success) {
            datosProductos = data.productos || [];
            const productoSelect = document.getElementById('producto-select');
            
            datosProductos.forEach(prod => {
                const option = document.createElement('option');
                option.value = prod.producto_id;
                option.textContent = prod.nombre;
                productoSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

async function cargarAniosTendencia() {
    try {
        const response = await fetch('/main/reporte/obtener_anios_distribucion');
        const data = await response.json();
        
        if (data.success) {
            const anioSelect = document.getElementById('anio-tendencia');
            data.anios.forEach(anio => {
                const option = document.createElement('option');
                option.value = anio;
                option.textContent = anio;
                anioSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando años:', error);
    }
}

async function cargarEnvios() {
    try {
        const response = await fetch('/main/reporte/obtener_movimiento_productos');
        const data = await response.json();
        
        if (data.success) {
            datosEnvios = data.movimientos || [];
        }
    } catch (error) {
        console.error('Error cargando envíos:', error);
    }
}

async function cargarTendenciaProducto() {
    const productoId = document.getElementById('producto-select').value;
    const anio = document.getElementById('anio-tendencia').value;
    
    if (!productoId) {
        document.getElementById('info-producto-card').style.display = 'none';
        return;
    }
    
    mostrarCargando('Cargando tendencia...');
    
    // Cargar envíos si no están cargados
    if (datosEnvios.length === 0) {
        await cargarEnvios();
    }
    
    // Mostrar información del producto
    const producto = datosProductos.find(p => p.producto_id == productoId);
    if (producto) {
        document.getElementById('info-nombre').textContent = producto.nombre;
        document.getElementById('info-tipo').textContent = producto.tipo;
        document.getElementById('info-stock').textContent = parseFloat(producto.cant_productos_act).toFixed(2) + ' kg';
        document.getElementById('info-temp').textContent = producto.temperatura_optima ? producto.temperatura_optima + ' °C' : '-';
        document.getElementById('info-humedad').textContent = producto.humedad_optima ? producto.humedad_optima + ' %' : '-';
        document.getElementById('info-producto-card').style.display = 'block';
    }
    
    // Filtrar envíos del producto
    const enviosProducto = datosEnvios.filter(e => e.producto_id == productoId);
    
    // Crear array para los 12 meses
    const demandaMensual = new Array(12).fill(0);
    const enviosMensual = new Array(12).fill(0);
    
    // Procesar envíos
    enviosProducto.forEach(envio => {
        if (envio.fecha_envio) {
            const [year, month] = envio.fecha_envio.split('-');
            const mesIndex = parseInt(month) - 1;
            
            // Filtrar por año si se seleccionó uno
            if (!anio || year === anio) {
                if (mesIndex >= 0 && mesIndex < 12) {
                    demandaMensual[mesIndex] += parseFloat(envio.demanda) || 0;
                    enviosMensual[mesIndex] += 1;
                }
            }
        }
    });
    
    actualizarGraficoTendencia(demandaMensual, enviosMensual, producto.nombre, anio);
    
    Swal.close();
}

function actualizarGraficoTendencia(demandaMensual, enviosMensual, nombreProducto, año) {
    const ctx = document.getElementById('tendenciaChart').getContext('2d');
    
    if (tendenciaChartInstance) {
        tendenciaChartInstance.destroy();
    }
    
    const titulo = año ? `${nombreProducto} - ${año}` : nombreProducto;
    
    tendenciaChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: NOMBRES_MESES,
            datasets: [
                {
                    label: 'Demanda (kg)',
                    data: demandaMensual,
                    borderColor: '#40e0d0',
                    backgroundColor: 'rgba(64, 224, 208, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#40e0d0',
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    yAxisID: 'y'
                },
                {
                    label: 'Cantidad de Envíos',
                    data: enviosMensual,
                    borderColor: '#fbbf24',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: '#fbbf24',
                    pointBorderColor: '#fff',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: titulo,
                    color: '#40e0d0',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                legend: {
                    labels: {
                        color: '#e0f2fe'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (context.dataset.label.includes('Demanda')) {
                                    label += context.parsed.y.toFixed(2) + ' kg';
                                } else {
                                    label += context.parsed.y + ' envíos';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Demanda (kg)',
                        color: '#40e0d0'
                    },
                    grid: {
                        color: 'rgba(64, 224, 208, 0.1)'
                    },
                    ticks: {
                        color: '#a5d8ff',
                        callback: function(value) {
                            return value + ' kg';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cantidad de Envíos',
                        color: '#fbbf24'
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(251, 191, 36, 0.1)'
                    },
                    ticks: {
                        color: '#fbbf24',
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(64, 224, 208, 0.1)'
                    },
                    ticks: {
                        color: '#a5d8ff',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            }
        }
    });
}

function actualizarReporte() {
    if (document.getElementById('producto-select').value) {
        cargarTendenciaProducto();
    }
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
    if (!tendenciaChartInstance) {
        mostrarError('No hay datos para exportar');
        return;
    }
    
    const productoId = document.getElementById('producto-select').value;
    const producto = datosProductos.find(p => p.producto_id == productoId);
    const anio = document.getElementById('anio-tendencia').value;
    const fechaGeneracion = new Date().toLocaleDateString();
    
    // Obtener datos del gráfico
    const labels = tendenciaChartInstance.data.labels;
    const demandaData = tendenciaChartInstance.data.datasets[0].data;
    const enviosData = tendenciaChartInstance.data.datasets[1].data;
    
    // Generar filas de la tabla
    let filasHtml = '';
    for (let i = 0; i < labels.length; i++) {
        if (demandaData[i] > 0 || enviosData[i] > 0) {
            filasHtml += `
                <tr>
                    <td>${labels[i]}</td>
                    <td class="text-center">${demandaData[i].toFixed(2)} kg</td>
                    <td class="text-center">${enviosData[i]}</td>
                </tr>
            `;
        }
    }
    
    const contenido = `
        <html>
        <head>
            <title>Tendencias de Productos - Alaya S.A.C</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                h1 { color: #1e3a5a; border-bottom: 2px solid #40e0d0; padding-bottom: 10px; }
                .info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info p { margin: 5px 0; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th { background-color: #1e3a5a; color: white; padding: 10px; text-align: left; }
                td { border: 1px solid #ddd; padding: 8px; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <h1>Tendencias y Comportamiento de Productos</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Producto:</strong> ${producto ? producto.nombre : 'No seleccionado'}</p>
                <p><strong>Tipo:</strong> ${producto ? producto.tipo : '-'}</p>
                <p><strong>Año:</strong> ${anio || 'Todos los años'}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Demanda Total</th>
                        <th>Cantidad de Envíos</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHtml}
                </tbody>
            </table>
            
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                * Reporte generado automáticamente por el sistema Alaya S.A.C
            </p>
        </body>
        </html>
    `;
    
    const blob = new Blob([contenido], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tendencia_${producto ? producto.nombre : 'producto'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}