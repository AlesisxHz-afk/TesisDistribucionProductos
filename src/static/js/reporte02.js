// Variables globales
let datosProductos = [];
let datosEnvios = [];
let tipoChartInstance = null;

document.addEventListener('DOMContentLoaded', function() {
    cargarTiposProducto();
    cargarAniosAnalisis();
    cargarDatosIniciales();
    configurarEventListeners();
});

function configurarEventListeners() {
    document.getElementById('btn-actualizar').addEventListener('click', actualizarReporte);
    document.getElementById('btn-exportar').addEventListener('click', exportarReporte);
    document.getElementById('tipo-producto').addEventListener('change', filtrarDatos);
    document.getElementById('anio-analisis').addEventListener('change', filtrarDatos);
    document.getElementById('search-productos').addEventListener('input', filtrarTabla);
}

async function cargarTiposProducto() {
    try {
        const response = await fetch('/main/reporte/obtener_tipos_producto');
        const data = await response.json();
        
        if (data.success) {
            const tipoSelect = document.getElementById('tipo-producto');
            data.tipos.forEach(tipo => {
                const option = document.createElement('option');
                option.value = tipo;
                option.textContent = tipo;
                tipoSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error cargando tipos:', error);
    }
}

async function cargarAniosAnalisis() {
    try {
        const response = await fetch('/main/reporte/obtener_anios_distribucion');
        const data = await response.json();
        
        if (data.success) {
            const anioSelect = document.getElementById('anio-analisis');
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

async function cargarDatosIniciales() {
    try {
        mostrarCargando('Cargando datos de productos...');
        
        // Cargar productos
        const productosResponse = await fetch('/main/reporte/obtener_productos');
        const productosData = await productosResponse.json();
        
        // Cargar envíos
        const enviosResponse = await fetch('/main/reporte/obtener_movimiento_productos');
        const enviosData = await enviosResponse.json();
        
        if (productosData.success) {
            datosProductos = productosData.productos || [];
        }
        
        if (enviosData.success) {
            datosEnvios = enviosData.movimientos || [];
        }
        
        procesarDatos();
        Swal.close();
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar datos');
        Swal.close();
    }
}

function procesarDatos() {
    // Crear mapa de productos con estadísticas
    const productosMap = {};
    
    datosProductos.forEach(prod => {
        productosMap[prod.producto_id] = {
            producto_id: prod.producto_id,
            nombre: prod.nombre,
            tipo: prod.tipo,
            variedad: prod.variedad || '-',
            stock_actual: parseFloat(prod.cant_productos_act) || 0,
            temperatura_optima: prod.temperatura_optima,
            humedad_optima: prod.humedad_optima,
            total_envios: 0,
            demanda_total: 0
        };
    });
    
    // Procesar envíos
    datosEnvios.forEach(envio => {
        if (envio.producto_id && productosMap[envio.producto_id]) {
            productosMap[envio.producto_id].total_envios += 1;
            productosMap[envio.producto_id].demanda_total += parseFloat(envio.demanda) || 0;
        }
    });
    
    datosProductos = Object.values(productosMap);
    actualizarGraficoTipo();
    aplicarFiltros();
}

function actualizarGraficoTipo() {
    const ctx = document.getElementById('tipoChart').getContext('2d');
    
    if (tipoChartInstance) {
        tipoChartInstance.destroy();
    }
    
    // Agrupar por tipo
    const tiposMap = {};
    datosProductos.forEach(prod => {
        if (!tiposMap[prod.tipo]) {
            tiposMap[prod.tipo] = 0;
        }
        tiposMap[prod.tipo] += prod.total_envios;
    });
    
    const tipos = Object.keys(tiposMap);
    const cantidades = Object.values(tiposMap);
    
    // Si no hay datos, mostrar mensaje
    if (tipos.length === 0) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#a5d8ff';
        ctx.textAlign = 'center';
        ctx.fillText('No hay datos disponibles', 150, 150);
        return;
    }
    
    tipoChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: tipos,
            datasets: [{
                data: cantidades,
                backgroundColor: [
                    'rgba(64, 224, 208, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(199, 199, 199, 0.7)'
                ],
                borderColor: [
                    '#40e0d0',
                    '#36a2eb',
                    '#ffce56',
                    '#4bc0c0',
                    '#9966ff',
                    '#ff6384',
                    '#ff9f40',
                    '#c7c7c7'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0f2fe',
                        font: {
                            size: 11
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} envíos (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function filtrarDatos() {
    aplicarFiltros();
}

function aplicarFiltros() {
    const tipoFiltro = document.getElementById('tipo-producto').value;
    const anioFiltro = document.getElementById('anio-analisis').value;
    
    let datosFiltrados = [...datosProductos];
    
    if (tipoFiltro) {
        datosFiltrados = datosFiltrados.filter(p => p.tipo === tipoFiltro);
    }
    
    // Si hay filtro de año, filtrar envíos y recalcular
    if (anioFiltro) {
        // Filtrar envíos por año
        const enviosFiltrados = datosEnvios.filter(envio => {
            if (envio.fecha_envio) {
                const añoEnvio = envio.fecha_envio.split('-')[0];
                return añoEnvio === anioFiltro;
            }
            return false;
        });
        
        // Recalcular estadísticas para cada producto
        const productosMap = {};
        datosProductos.forEach(prod => {
            productosMap[prod.producto_id] = {
                ...prod,
                total_envios: 0,
                demanda_total: 0
            };
        });
        
        enviosFiltrados.forEach(envio => {
            if (envio.producto_id && productosMap[envio.producto_id]) {
                productosMap[envio.producto_id].total_envios += 1;
                productosMap[envio.producto_id].demanda_total += parseFloat(envio.demanda) || 0;
            }
        });
        
        datosFiltrados = Object.values(productosMap);
        
        // Aplicar filtro de tipo si existe
        if (tipoFiltro) {
            datosFiltrados = datosFiltrados.filter(p => p.tipo === tipoFiltro);
        }
    }
    
    actualizarTablaProductos(datosFiltrados);
}

function actualizarTablaProductos(datos) {
    const tbody = document.getElementById('tabla-productos-body');
    tbody.innerHTML = '';
    
    if (datos.length === 0) {
        mostrarNoResultados(tbody, 9);
        document.getElementById('pagination-info').style.display = 'none';
        return;
    }
    
    // Ordenar por nombre
    datos.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    // Tomar solo primeros 50 registros
    const datosMostrar = datos.slice(0, 50);
    
    datosMostrar.forEach(prod => {
        const promedioEnvio = prod.total_envios > 0 ? (prod.demanda_total / prod.total_envios).toFixed(2) : '0.00';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${prod.nombre || 'Sin nombre'}</strong></td>
            <td>${prod.tipo || '-'}</td>
            <td>${prod.variedad || '-'}</td>
            <td class="text-center">${prod.stock_actual.toFixed(2)} kg</td>
            <td class="text-center">${prod.total_envios}</td>
            <td class="text-center">${prod.demanda_total.toFixed(2)} kg</td>
            <td class="text-center">${promedioEnvio} kg</td>
            <td class="text-center">${prod.temperatura_optima ? prod.temperatura_optima + ' °C' : '-'}</td>
            <td class="text-center">${prod.humedad_optima ? prod.humedad_optima + ' %' : '-'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Mostrar información de paginación
    if (datos.length > 50) {
        document.getElementById('pagination-info').style.display = 'block';
        document.getElementById('total-registros').textContent = datos.length;
    } else {
        document.getElementById('pagination-info').style.display = 'none';
    }
}

function filtrarTabla() {
    const termino = document.getElementById('search-productos').value.toLowerCase();
    const filas = document.querySelectorAll('#tabla-productos-body tr');
    
    filas.forEach(fila => {
        // Evitar ocultar la fila de "no resultados"
        if (fila.querySelector('.no-results')) {
            return;
        }
        const texto = fila.textContent.toLowerCase();
        fila.style.display = texto.includes(termino) ? '' : 'none';
    });
}

function actualizarReporte() {
    cargarDatosIniciales();
}

function mostrarNoResultados(tbody, colSpan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.className = 'no-results';
    td.innerHTML = `
        <i class="fas fa-box-open"></i>
        <h4>No hay productos disponibles</h4>
        <p>No se encontraron productos para los filtros seleccionados</p>
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
    a.download = `analisis_productos_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    mostrarExito('Reporte exportado');
}

function generarHTMLExportacion() {
    const fechaGeneracion = new Date().toLocaleDateString();
    const tipoFiltro = document.getElementById('tipo-producto').value;
    const anioFiltro = document.getElementById('anio-analisis').value;
    
    let filtrosTexto = [];
    if (tipoFiltro) filtrosTexto.push(`Tipo: ${tipoFiltro}`);
    if (anioFiltro) filtrosTexto.push(`Año: ${anioFiltro}`);
    const filtrosStr = filtrosTexto.length > 0 ? filtrosTexto.join(' - ') : 'Sin filtros';
    
    const filas = document.querySelectorAll('#tabla-productos-body tr');
    let filasHtml = '';
    
    filas.forEach(fila => {
        // Excluir la fila de "no resultados"
        if (!fila.querySelector('.no-results') && fila.style.display !== 'none') {
            filasHtml += fila.outerHTML;
        }
    });
    
    return `
        <html>
        <head>
            <title>Análisis de Productos - Alaya S.A.C</title>
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
                .text-center { text-align: center; }
            </style>
        </head>
        <body>
            <h1>Análisis de Productos y Distribución</h1>
            <div class="info">
                <p><strong>Generado el:</strong> ${fechaGeneracion}</p>
                <p><strong>Filtros aplicados:</strong> ${filtrosStr}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Variedad</th>
                        <th>Stock Actual</th>
                        <th>Total Envíos</th>
                        <th>Demanda Total</th>
                        <th>Promedio por Envío</th>
                        <th>Temp. Óptima</th>
                        <th>Humedad Óptima</th>
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
}