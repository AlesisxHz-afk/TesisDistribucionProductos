// Variables globales
let datosPredicciones = [];
let datosHistoricos = [];
let chartInstance = null;
let añosExcel = [];
let añosBD = [];

const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

document.addEventListener('DOMContentLoaded', function() {
    cargarAñosDisponibles();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('anio-predicho').addEventListener('change', aplicarComparativa);
    document.getElementById('anio-historico').addEventListener('change', aplicarComparativa);
}

async function cargarAñosDisponibles() {
    try {
        mostrarCargando('Cargando años disponibles...');
        
        // Cargar años de la BD
        const responseBD = await fetch('/main/reporte/obtener_anios_distribucion');
        const dataBD = await responseBD.json();
        
        // Cargar predicciones del Excel
        const responseExcel = await fetch('/main/reporte/obtener_predicciones_excel');
        const dataExcel = await responseExcel.json();
        
        const anioPredichoSelect = document.getElementById('anio-predicho');
        const anioHistoricoSelect = document.getElementById('anio-historico');
        
        // Limpiar selects
        anioPredichoSelect.innerHTML = '<option value="">Seleccionar año predicho</option>';
        anioHistoricoSelect.innerHTML = '<option value="">Seleccionar año histórico</option>';
        
        // Procesar años del Excel (para año predicho)
        if (dataExcel.success) {
            datosPredicciones = dataExcel.predicciones || [];
            
            // Extraer años únicos del Excel
            const añosSet = new Set();
            datosPredicciones.forEach(p => {
                if (p.fecha) {
                    const año = p.fecha.split('-')[0];
                    añosSet.add(año);
                }
            });
            
            añosExcel = Array.from(añosSet).sort();
            
            // Llenar select de año predicho SOLO con años del Excel
            añosExcel.forEach(año => {
                const option = document.createElement('option');
                option.value = año;
                option.textContent = año;
                anioPredichoSelect.appendChild(option);
            });
        }
        
        // Procesar años de la BD (para año histórico)
        if (dataBD.success) {
            añosBD = dataBD.anios || [];
            
            // Llenar select de año histórico SOLO con años de la BD
            añosBD.forEach(año => {
                const option = document.createElement('option');
                option.value = año;
                option.textContent = año;
                anioHistoricoSelect.appendChild(option);
            });
        }
        
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        Swal.close();
    }
}

async function cargarDatosHistoricos() {
    try {
        const response = await fetch('/main/reporte/obtener_demanda_mensual_historica');
        const data = await response.json();
        
        if (data.success) {
            datosHistoricos = data.demanda_mensual || [];
        } else {
            console.error('Error en respuesta:', data.message);
            mostrarError('Error al cargar datos históricos: ' + data.message);
        }
    } catch (error) {
        console.error('Error cargando datos históricos:', error);
        mostrarError('Error de conexión al cargar datos históricos');
    }
}

function obtenerDemandaMensualPredicha(año) {
    if (!año) return new Array(12).fill(0);
    
    const demandaPorMes = new Array(12).fill(0);
    
    datosPredicciones.forEach(p => {
        if (p.fecha) {
            const [añoPred, mesPred] = p.fecha.split('-');
            if (añoPred === año.toString()) {
                const mesIndex = parseInt(mesPred) - 1;
                if (mesIndex >= 0 && mesIndex < 12) {
                    demandaPorMes[mesIndex] += p.demanda_predicha || 0;
                }
            }
        }
    });
    
    return demandaPorMes;
}

function obtenerDemandaMensualHistorica(año) {
    if (!año) return new Array(12).fill(0);
    
    const demandaPorMes = new Array(12).fill(0);
    
    datosHistoricos.forEach(d => {
        if (d.anio === parseInt(año)) {
            const mesIndex = d.mes - 1;
            if (mesIndex >= 0 && mesIndex < 12) {
                demandaPorMes[mesIndex] = d.demanda_total || 0;
            }
        }
    });
    
    return demandaPorMes;
}

async function aplicarComparativa() {
    const añoPredicho = document.getElementById('anio-predicho').value;
    const añoHistorico = document.getElementById('anio-historico').value;
    
    if (!añoPredicho || !añoHistorico) {
        mostrarError('Debe seleccionar ambos años para la comparativa');
        return;
    }
    
    mostrarCargando('Procesando comparativa...');
    
    // Cargar datos históricos si no están cargados
    if (datosHistoricos.length === 0) {
        await cargarDatosHistoricos();
    }
    
    // Obtener datos mensuales
    const demandaPredicha = obtenerDemandaMensualPredicha(añoPredicho);
    const demandaHistorica = obtenerDemandaMensualHistorica(añoHistorico);
    
    actualizarGrafico(demandaPredicha, demandaHistorica, añoPredicho, añoHistorico);
    
    Swal.close();
}

function actualizarGrafico(demandaPredicha, demandaHistorica, añoPredicho, añoHistorico) {
    const ctx = document.getElementById('comparativaChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: NOMBRES_MESES,
            datasets: [
                {
                    label: `Demanda Predicha ${añoPredicho} (Excel)`,
                    data: demandaPredicha,
                    backgroundColor: 'rgba(64, 224, 208, 0.7)',
                    borderColor: '#40e0d0',
                    borderWidth: 1
                },
                {
                    label: `Demanda Histórica ${añoHistorico} (BD)`,
                    data: demandaHistorica,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: '#36a2eb',
                    borderWidth: 1
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2) + ' kg';
                            }
                            return label;
                        }
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
                        color: '#a5d8ff',
                        callback: function(value) {
                            return value + ' kg';
                        }
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
    aplicarComparativa();
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
    // Obtener datos del gráfico actual
    if (!chartInstance) {
        mostrarError('No hay datos para exportar');
        return;
    }
    
    const añoPredicho = document.getElementById('anio-predicho').value;
    const añoHistorico = document.getElementById('anio-historico').value;
    const fechaGeneracion = new Date().toLocaleDateString();
    
    // Obtener datos del gráfico
    const labels = chartInstance.data.labels;
    const datasetPredicho = chartInstance.data.datasets[0].data;
    const datasetHistorico = chartInstance.data.datasets[1].data;
    
    // Generar filas de la tabla
    let filasHtml = '';
    for (let i = 0; i < labels.length; i++) {
        filasHtml += `
            <tr>
                <td>${labels[i]}</td>
                <td class="text-center">${datasetPredicho[i].toFixed(2)} kg</td>
                <td class="text-center">${datasetHistorico[i].toFixed(2)} kg</td>
            </tr>
        `;
    }
    
    const contenido = `
        <html>
        <head>
            <title>Comparativa de Demanda - Alaya S.A.C</title>
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
            <h1>Comparativa: Demanda Predicha vs Histórica</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Año Predicho (Excel):</strong> ${añoPredicho || 'No seleccionado'}</p>
                <p><strong>Año Histórico (BD):</strong> ${añoHistorico || 'No seleccionado'}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Demanda Predicha (${añoPredicho})</th>
                        <th>Demanda Histórica (${añoHistorico})</th>
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
    a.download = `comparativa_demanda_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}