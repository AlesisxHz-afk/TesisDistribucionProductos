// Función para entrenar modelo
function entrenarModelo(tipo) {
    const btnId = tipo === 'stock_optimo' ? 'btnStockOptimo' : 
                 tipo === 'clasificacion_almacenes' ? 'btnClasificacionAlmacenes' : 
                 'btnPlanificacionRutas';
    const btn = document.getElementById(btnId);
    const loading = document.getElementById('loading');
    const url = tipo === 'stock_optimo' ? '/main/configuracion/entrenar_stock_optimo' : 
                tipo === 'clasificacion_almacenes' ? '/main/configuracion/entrenar_clasificacion_almacenes' : 
                '/main/configuracion/entrenar_planificacion_rutas';
    
    const tipoTexto = tipo === 'stock_optimo' ? 'Stock Óptimo' : 
                     tipo === 'clasificacion_almacenes' ? 'Clasificación' : 
                     'Planificación Rutas';
    
    const descripcion = tipo === 'stock_optimo' ? 
        'Predice demanda para los próximos 36 meses (1200 envíos/año).' : 
        tipo === 'clasificacion_almacenes' ?
        'Predice el almacén óptimo para cada producto.' :
        'Analiza eficiencia de rutas con condiciones climáticas.';
    
    btn.disabled = true;
    loading.classList.add('active');
    
    Swal.fire({
        title: `Entrenar Modelo: ${tipoTexto}`,
        html: `
            <div style="text-align: left; color: #a5d8ff;">
                <p>${descripcion}</p>
                <p><strong>¿Continuar?</strong></p>
                <div style="margin-top: 10px; padding: 10px; background: rgba(30, 58, 90, 0.5); border-radius: 6px;">
                    <p style="margin: 0; font-size: 13px;">
                        <i class="fas fa-info-circle"></i> Se generará un archivo Excel con resultados.
                    </p>
                </div>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Entrenar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        cancelButtonColor: '#1e3a5a',
        width: 500
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Procesando...',
                html: `
                    <div style="text-align: center; color: #a5d8ff;">
                        <div class="spinner" style="margin: 20px auto;"></div>
                        <p>Entrenando modelo...</p>
                    </div>
                `,
                background: '#152a3a',
                color: '#e0f2fe',
                showConfirmButton: false,
                allowOutsideClick: false
            });
            
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(data => {
                loading.classList.remove('active');
                btn.disabled = false;
                
                Swal.close();
                
                if (data.error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        html: `
                            <div style="text-align: left; color: #a5d8ff;">
                                <p style="color: #ff6b6b;">${data.error}</p>
                            </div>
                        `,
                        background: '#152a3a',
                        color: '#e0f2fe',
                        confirmButtonColor: '#40e0d0',
                        width: 500
                    });
                } else {
                    mostrarResultados(data, tipo);
                }
            })
            .catch(error => {
                loading.classList.remove('active');
                btn.disabled = false;
                Swal.close();
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    html: `
                        <div style="text-align: left; color: #a5d8ff;">
                            <p>Error al entrenar el modelo</p>
                        </div>
                    `,
                    background: '#152a3a',
                    color: '#e0f2fe',
                    confirmButtonColor: '#40e0d0',
                    width: 500
                });
            });
        } else {
            loading.classList.remove('active');
            btn.disabled = false;
        }
    });
}

// Función para mostrar resultados (SOLO 5 MÉTRICAS POR MODELO)
function mostrarResultados(data, tipo) {
    const resultadosContainer = document.getElementById('resultadosContainer');
    const resultTitle = document.getElementById('resultTitle');
    const metricsContainer = document.getElementById('metricsContainer');
    const modelInfo = document.getElementById('modelInfo');
    
    resultadosContainer.style.display = 'block';
    
    const tipoTexto = tipo === 'stock_optimo' ? 'Stock Óptimo' : 
                     tipo === 'clasificacion_almacenes' ? 'Clasificación Almacenes' : 
                     'Planificación Rutas';
    
    resultTitle.textContent = `Resultados: ${tipoTexto}`;
    
    // SOLO 5 MÉTRICAS POR MODELO
    if (tipo === 'stock_optimo') {
        metricsContainer.innerHTML = `
            <div class="metric-item">
                <div class="metric-label">R² Score</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['r2_score'] ? data.metricas['r2_score'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">MAE</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['mae'] ? data.metricas['mae'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">RMSE</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['rmse'] ? data.metricas['rmse'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">MAPE</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['mape'] ? data.metricas['mape'] + '%' : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Productos</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['productos_analizados'] ? data.metricas['productos_analizados'] : 'N/A'}
                </div>
            </div>
        `;
        
    } else if (tipo === 'clasificacion_almacenes') {
        metricsContainer.innerHTML = `
            <div class="metric-item">
                <div class="metric-label">Accuracy</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['accuracy'] ? (data.metricas['accuracy'] * 100).toFixed(1) + '%' : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Precisión</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['precision'] ? (data.metricas['precision'] * 100).toFixed(1) + '%' : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Recall</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['recall'] ? (data.metricas['recall'] * 100).toFixed(1) + '%' : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">F1-Score</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['f1_score'] ? (data.metricas['f1_score'] * 100).toFixed(1) + '%' : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Almacenes</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['almacenes_unicos'] ? data.metricas['almacenes_unicos'] : 'N/A'}
                </div>
            </div>
        `;
        
    } else {
        // RUTAS: SOLO 5 métricas (sin eficiencia)
        metricsContainer.innerHTML = `
            <div class="metric-item">
                <div class="metric-label">Score Temperatura</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['score_temperatura'] ? data.metricas['score_temperatura'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Score Humedad</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['score_humedad'] ? data.metricas['score_humedad'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Rutas</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['rutas_analizadas'] ? data.metricas['rutas_analizadas'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Bajo Riesgo</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['rutas_bajo_riesgo'] ? data.metricas['rutas_bajo_riesgo'] : 'N/A'}
                </div>
            </div>
            <div class="metric-item">
                <div class="metric-label">Alto Riesgo</div>
                <div class="metric-value">
                    ${data.metricas && data.metricas['rutas_alto_riesgo'] ? data.metricas['rutas_alto_riesgo'] : 'N/A'}
                </div>
            </div>
        `;
    }
    
    // Información del modelo
    let excelLink = '';
    if (data.ruta_excel) {
        excelLink = `
            <p>
                <strong><i class="fas fa-file-excel"></i> Reporte:</strong>
                <a href="/main/configuracion/descargar_excel/${tipo}" target="_blank" 
                   style="color: #40e0d0; text-decoration: none; margin-left: 10px;">
                    <i class="fas fa-download"></i> Descargar Excel
                </a>
            </p>
        `;
    }
    
    modelInfo.innerHTML = `
        <p>
            <strong><i class="fas fa-check-circle"></i> Estado:</strong>
            <span style="color: #4ade80;">Completado</span>
        </p>
        <p>
            <strong><i class="fas fa-database"></i> Datos:</strong>
            ${data.datos_entrenamiento || 0} registros
        </p>
        ${excelLink}
        <div style="margin-top: 15px; padding: 10px; background: rgba(30, 58, 90, 0.5); border-radius: 6px; border-left: 3px solid #40e0d0;">
            <p style="margin: 0; font-size: 12px; color: #a5d8ff;">
                ${tipo === 'stock_optimo' ? 'Predicciones de demanda para 36 meses (1200 envíos/año)' : 
                  tipo === 'clasificacion_almacenes' ? 'Predicción de almacén_id basado en características del producto' : 
                  'Análisis de eficiencia de rutas con condiciones climáticas (Temperatura y Humedad)'}
            </p>
        </div>
    `;
    
    // Mostrar alerta de éxito
    Swal.fire({
        icon: 'success',
        title: '¡Completado!',
        html: `
            <div style="text-align: left; color: #a5d8ff;">
                <p style="color: #40e0d0;">${data.message}</p>
                <div style="margin-top: 15px; padding: 10px; background: rgba(30, 58, 90, 0.5); border-radius: 6px;">
                    <p style="margin: 0; font-size: 13px;">
                        <i class="fas fa-info-circle"></i> Resultados disponibles en la sección inferior.
                    </p>
                </div>
            </div>
        `,
        confirmButtonText: 'Ver Resultados',
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        showCancelButton: true,
        cancelButtonText: 'Cerrar',
        cancelButtonColor: '#1e3a5a',
        width: 500
    }).then((result) => {
        if (result.isConfirmed) {
            resultadosContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Función para listar archivos Excel
function listarArchivosExcel() {
    fetch('/main/configuracion/listar_archivos_excel')
        .then(response => response.json())
        .then(data => {
            if (data.archivos && data.archivos.length > 0) {
                mostrarModalArchivosExcel(data.archivos);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No hay archivos',
                    text: 'No se han generado archivos Excel.',
                    background: '#152a3a',
                    color: '#e0f2fe',
                    confirmButtonColor: '#40e0d0'
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron listar archivos.',
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0'
            });
        });
}

// Mostrar modal con archivos
function mostrarModalArchivosExcel(archivos) {
    const archivosHTML = archivos.map(archivo => `
        <div style="padding: 10px; margin-bottom: 8px; background: rgba(30, 58, 90, 0.5); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="margin: 0 0 5px 0; color: #40e0d0;">
                        <i class="fas fa-file-excel"></i> ${archivo.nombre}
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #a5d8ff;">
                        <i class="fas fa-calendar"></i> ${archivo.fecha_modificacion}
                    </p>
                </div>
                <a href="/main/configuracion/descargar_excel?ruta=${encodeURIComponent(archivo.ruta)}" 
                   style="padding: 6px 12px; background: #40e0d0; color: white; text-decoration: none; border-radius: 4px;">
                    <i class="fas fa-download"></i>
                </a>
            </div>
        </div>
    `).join('');
    
    Swal.fire({
        title: 'Archivos Excel',
        html: `
            <div style="text-align: left; color: #a5d8ff;">
                <p style="margin-bottom: 15px;">Archivos disponibles:</p>
                <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                    ${archivosHTML}
                </div>
            </div>
        `,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        confirmButtonText: 'Cerrar',
        width: 600
    });
}

// Función para actualizar la vista de métricas
function actualizarVistaMetricas() {
    fetch('/main/configuracion/obtener_metricas')
        .then(response => response.json())
        .then(data => {
            if (data.models && data.models.length > 0) {
                const alerta = document.querySelector('.alert-warning');
                if (alerta) {
                    const infoHTML = data.models.map(model => `
                        <div style="margin-bottom: 10px; padding: 10px; background: rgba(30, 58, 90, 0.3); border-radius: 6px;">
                            <p style="margin: 0 0 5px 0; color: #40e0d0; font-weight: 600;">
                                <i class="fas fa-robot"></i> ${model.tipo}
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #a5d8ff;">
                                📅 ${model.fecha_entrenamiento ? new Date(model.fecha_entrenamiento).toLocaleDateString() : 'No disponible'}
                            </p>
                        </div>
                    `).join('');
                    
                    alerta.innerHTML = `
                        <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <i class="fas fa-info-circle" style="color: #40e0d0; font-size: 20px; margin-top: 2px;"></i>
                            <div>
                                <p style="margin: 0 0 10px 0; font-weight: 600; color: #40e0d0;">
                                    Modelos Disponibles
                                </p>
                                <div style="margin-bottom: 10px;">
                                    ${infoHTML}
                                </div>
                                <p style="margin: 0; font-size: 12px; color: #a5d8ff;">
                                    <i class="fas fa-lightbulb"></i> Entrene un nuevo modelo para actualizar los resultados.
                                </p>
                            </div>
                        </div>
                    `;
                }
            }
        })
        .catch(error => console.error('Error al obtener métricas:', error));
}

// Asignar eventos
document.addEventListener('DOMContentLoaded', function() {
    // Botones de entrenamiento
    document.getElementById('btnStockOptimo').addEventListener('click', function(e) {
        e.stopPropagation();
        entrenarModelo('stock_optimo');
    });
    
    document.getElementById('btnClasificacionAlmacenes').addEventListener('click', function(e) {
        e.stopPropagation();
        entrenarModelo('clasificacion_almacenes');
    });
    
    document.getElementById('btnPlanificacionRutas').addEventListener('click', function(e) {
        e.stopPropagation();
        entrenarModelo('planificacion_rutas');
    });
    
    // Botón flotante
    const floatingButton = document.createElement('button');
    floatingButton.id = 'floatingExcelBtn';
    floatingButton.innerHTML = '<i class="fas fa-file-excel"></i> Reportes';
    floatingButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(90deg, #217346 0%, #2ecc71 100%);
        color: white;
        border: none;
        border-radius: 25px;
        padding: 12px 20px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    `;
    
    floatingButton.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    };
    
    floatingButton.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    };
    
    floatingButton.onclick = listarArchivosExcel;
    document.body.appendChild(floatingButton);
    
    // Estilos para SweetAlert
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            border: 4px solid rgba(64, 224, 208, 0.1);
            border-top: 4px solid #40e0d0;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .swal2-popup {
            background: #152a3a;
            border: 1px solid rgba(64, 224, 208, 0.3);
            border-radius: 12px;
        }
        
        .swal2-title {
            color: #40e0d0;
            font-weight: 700;
        }
        
        .swal2-html-container {
            color: #a5d8ff;
        }
        
        .swal2-confirm {
            background: linear-gradient(90deg, #40e0d0 0%, #4682b4 100%);
            border: none;
            border-radius: 8px;
            font-weight: 600;
        }
        
        .swal2-cancel {
            background: rgba(30, 58, 90, 0.8);
            border: 1px solid rgba(64, 224, 208, 0.3);
            border-radius: 8px;
            color: #a5d8ff;
        }
    `;
    document.head.appendChild(style);
    
    // Cargar métricas al iniciar
    setTimeout(() => {
        actualizarVistaMetricas();
    }, 1000);
});