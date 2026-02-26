// Variables globales
let prediccionesData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredPredicciones = [];
let searchTimeout = null;
let currentAnio = null;
let currentMes = null;

// Función para cargar años disponibles (3 años: actual, siguiente, subsiguiente)
function cargarAniosDisponibles() {
    const anioSelect = document.getElementById('anio');
    const mesSelect = document.getElementById('mes');
    
    if (!anioSelect || !mesSelect) return;
    
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth() + 1;
    const anioActual = fechaActual.getFullYear();
    
    console.log(`Fecha actual: ${anioActual}-${mesActual}`);
    
    // Limpiar selects
    anioSelect.innerHTML = '<option value="">Seleccione año</option>';
    mesSelect.innerHTML = '<option value="">Seleccione mes</option>';
    
    // Generar 3 años: actual, actual+1, actual+2
    const años = [anioActual, anioActual + 1, anioActual + 2];
    
    // Agregar años al select
    años.forEach(año => {
        const option = document.createElement('option');
        option.value = año;
        option.textContent = año;
        anioSelect.appendChild(option);
    });
    
    // Evento para actualizar meses cuando cambia el año
    anioSelect.addEventListener('change', function() {
        actualizarMesesDisponibles(mesActual, anioActual);
    });
    
    // Establecer valor por defecto: año actual
    anioSelect.value = anioActual;
    
    // Actualizar meses para el año actual
    actualizarMesesDisponibles(mesActual, anioActual);
}

// Función para actualizar meses disponibles según el año seleccionado
function actualizarMesesDisponibles(mesActual, anioActual) {
    const anioSelect = document.getElementById('anio');
    const mesSelect = document.getElementById('mes');
    
    if (!anioSelect || !mesSelect) return;
    
    const anioSeleccionado = parseInt(anioSelect.value);
    if (!anioSeleccionado) return;
    
    // Limpiar meses
    mesSelect.innerHTML = '<option value="">Seleccione mes</option>';
    
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    // Determinar qué meses mostrar según el año
    if (anioSeleccionado === anioActual) {
        // Año actual: mostrar desde el mes siguiente hasta diciembre
        for (let i = mesActual + 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = meses[i-1];
            mesSelect.appendChild(option);
        }
        console.log(`Año actual ${anioActual}: mostrando meses ${mesActual+1} a 12`);
    } 
    else if (anioSeleccionado === anioActual + 1) {
        // Año siguiente: mostrar TODOS los meses (enero a diciembre)
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = meses[i-1];
            mesSelect.appendChild(option);
        }
        console.log(`Año siguiente ${anioActual+1}: mostrando todos los meses (1-12)`);
    }
    else if (anioSeleccionado === anioActual + 2) {
        // Año subsiguiente: mostrar TODOS los meses (enero a diciembre)
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = meses[i-1];
            mesSelect.appendChild(option);
        }
        console.log(`Año subsiguiente ${anioActual+2}: mostrando todos los meses (1-12)`);
    }
}

// Función para predecir stock
async function predecirStock() {
    const anio = document.getElementById('anio').value;
    const mes = document.getElementById('mes').value;
    
    if (!anio || !mes) {
        mostrarError('Por favor seleccione año y mes');
        return;
    }
    
    Swal.fire({
        title: 'Generando predicciones...',
        html: 'Procesando datos con el modelo de stock óptimo',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        background: '#152a3a',
        color: '#e0f2fe'
    });
    
    try {
        const response = await fetch(`/main/producto/predecir_stock_api?anio=${anio}&mes=${mes}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error ${response.status}`);
        }
        
        const data = await response.json();
        Swal.close();
        
        if (data.success) {
            currentAnio = anio;
            currentMes = mes;
            prediccionesData = data.predicciones || [];
            filteredPredicciones = [...prediccionesData];
            currentPage = 1;
            
            renderizarTabla(filteredPredicciones);
            
            // Mostrar contenedores
            document.getElementById('tabla-container').style.display = 'block';
            document.getElementById('pagination-container').style.display = 'flex';
            
            // Mostrar y habilitar botón guardar
            const btnGuardar = document.getElementById('btn-guardar-predicciones');
            btnGuardar.style.display = 'inline-flex';
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';
            
            mostrarExito(`Se generaron ${prediccionesData.length} predicciones`);
        } else {
            throw new Error(data.error || 'Error al generar predicciones');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para guardar predicciones
async function guardarPredicciones() {
    if (!prediccionesData || prediccionesData.length === 0) {
        mostrarError('No hay predicciones para guardar');
        return;
    }
    
    const totalEnvios = prediccionesData.reduce((sum, p) => sum + (p.total_envios || 1), 0);
    
    const confirmacion = await Swal.fire({
        title: '¿Guardar predicciones?',
        html: `
            <p>Se guardarán:</p>
            <ul style="text-align: left; color: #e0f2fe;">
                <li><strong>${prediccionesData.length}</strong> productos</li>
                <li><strong>${totalEnvios}</strong> envíos totales</li>
                <li>Período: ${currentMes}/${currentAnio}</li>
            </ul>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    });
    
    if (!confirmacion.isConfirmed) return;
    
    Swal.fire({
        title: 'Guardando predicciones...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        },
        background: '#152a3a',
        color: '#e0f2fe'
    });
    
    try {
        // Asegurar que los datos numéricos sean números
        const datosAEnviar = {
            anio: parseInt(currentAnio),
            mes: parseInt(currentMes),
            predicciones: prediccionesData.map(p => ({
                producto_id: parseInt(p.producto_id),
                nombre_producto: p.nombre_producto,
                tipo_producto: p.tipo_producto,
                variedad_producto: p.variedad_producto,
                demanda_predicha: parseFloat(p.demanda_predicha),
                total_envios: parseInt(p.total_envios || 1)
            }))
        };
        
        console.log('Enviando datos:', datosAEnviar);
        
        const response = await fetch('/main/producto/guardar_predicciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosAEnviar)
        });
        
        const data = await response.json();
        Swal.close();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Guardado exitoso!',
                html: `
                    <p>${data.mensaje}</p>
                    <p style="color: #40e0d0;">
                        <i class="fas fa-check-circle"></i> 
                        Productos: ${data.guardados} | 
                        Envíos: ${data.total_envios || totalEnvios}
                    </p>
                `,
                background: '#152a3a',
                color: '#e0f2fe',
                confirmButtonColor: '#40e0d0'
            });
            
            const btnGuardar = document.getElementById('btn-guardar-predicciones');
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="fas fa-check"></i> Guardado';
        } else {
            throw new Error(data.error || 'Error al guardar predicciones');
        }
    } catch (error) {
        Swal.close();
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para ver detalle de envíos - VERSIÓN CORREGIDA CON MÍNIMO 100 kg
function verDetalle(productoId, productoNombre, productoTipo, productoVariedad) {
    try {
        const prediccion = prediccionesData.find(p => p.producto_id == productoId);
        
        if (!prediccion) {
            mostrarError('No se encontró la predicción');
            return;
        }
        
        const totalEnvios = prediccion.total_envios || 1;
        const demandaTotal = prediccion.demanda_predicha || 0;
        
        console.log(`Producto: ${productoNombre}, Demanda total: ${demandaTotal}, Envíos: ${totalEnvios}`);
        
        // Verificar si la demanda total es suficiente para el mínimo por envío
        const minimoPorEnvio = 100;
        const demandaMinimaNecesaria = totalEnvios * minimoPorEnvio;
        
        let cantidades = [];
        
        if (demandaTotal < demandaMinimaNecesaria) {
            // No alcanza para el mínimo, ajustar número de envíos
            const enviosPosibles = Math.floor(demandaTotal / minimoPorEnvio);
            
            if (enviosPosibles === 0) {
                // Si ni siquiera para 1 envío, crear un solo envío con toda la demanda
                cantidades = [demandaTotal];
                console.log(`Demanda insuficiente (${demandaTotal}), creando 1 envío`);
            } else {
                // Crear envíos con el mínimo y distribuir el resto
                console.log(`Ajustando de ${totalEnvios} a ${enviosPosibles} envíos por mínimo de ${minimoPorEnvio} kg`);
                
                // Crear array con el mínimo para cada envío
                cantidades = Array(enviosPosibles).fill(minimoPorEnvio);
                
                // Distribuir el resto
                const resto = demandaTotal - (enviosPosibles * minimoPorEnvio);
                if (resto > 0) {
                    // Distribuir el resto aleatoriamente entre los envíos
                    for (let i = 0; i < resto; i++) {
                        const indice = Math.floor(Math.random() * enviosPosibles);
                        cantidades[indice] += 1;
                    }
                }
            }
        } else {
            // Hay suficiente demanda, distribuir respetando el mínimo
            console.log(`Demanda suficiente (${demandaTotal}), creando ${totalEnvios} envíos con mínimo ${minimoPorEnvio} kg`);
            
            // Asignar el mínimo a cada envío
            cantidades = Array(totalEnvios).fill(minimoPorEnvio);
            
            // Calcular cuánto sobra para distribuir
            const sobra = demandaTotal - (totalEnvios * minimoPorEnvio);
            
            if (sobra > 0) {
                // Distribuir la sobra de forma aleatoria
                for (let i = 0; i < sobra; i++) {
                    const indice = Math.floor(Math.random() * totalEnvios);
                    cantidades[indice] += 1;
                }
            }
        }
        
        // Redondear todas las cantidades a 2 decimales
        cantidades = cantidades.map(c => Math.round(c * 100) / 100);
        
        // Verificar que la suma sea correcta y ajustar si es necesario
        const sumaActual = cantidades.reduce((a, b) => a + b, 0);
        if (Math.abs(sumaActual - demandaTotal) > 0.1) {
            const diferencia = demandaTotal - sumaActual;
            cantidades[cantidades.length - 1] += diferencia;
            cantidades[cantidades.length - 1] = Math.round(cantidades[cantidades.length - 1] * 100) / 100;
        }
        
        // Generar días únicos para los envíos
        const diasDisponibles = [];
        for (let i = 1; i <= 28; i++) {
            diasDisponibles.push(i);
        }
        
        // Mezclar días
        for (let i = diasDisponibles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [diasDisponibles[i], diasDisponibles[j]] = [diasDisponibles[j], diasDisponibles[i]];
        }
        
        // Tomar los primeros N días
        const diasSeleccionados = diasDisponibles.slice(0, cantidades.length).sort((a, b) => a - b);
        
        // Crear array de envíos
        const envios = [];
        for (let i = 0; i < cantidades.length; i++) {
            envios.push({
                dia: diasSeleccionados[i],
                fecha: `${currentAnio}-${String(currentMes).padStart(2, '0')}-${String(diasSeleccionados[i]).padStart(2, '0')}`,
                cantidad: cantidades[i]
            });
        }
        
        // Ordenar por día
        envios.sort((a, b) => a.dia - b.dia);
        
        // Llenar modal
        document.getElementById('detalle-producto-nombre').textContent = productoNombre;
        document.getElementById('detalle-producto-tipo').textContent = productoTipo || 'N/A';
        document.getElementById('detalle-producto-variedad').textContent = productoVariedad || 'N/A';
        
        const tbody = document.getElementById('detalle-envios-body');
        tbody.innerHTML = '';
        
        let total = 0;
        envios.forEach(envio => {
            const tr = document.createElement('tr');
            
            const tdFecha = document.createElement('td');
            tdFecha.textContent = envio.fecha;
            tr.appendChild(tdFecha);
            
            const tdCantidad = document.createElement('td');
            tdCantidad.className = 'text-right';
            tdCantidad.textContent = envio.cantidad.toFixed(2);
            tr.appendChild(tdCantidad);
            
            tbody.appendChild(tr);
            total += envio.cantidad;
        });
        
        document.getElementById('detalle-total').textContent = total.toFixed(2);
        
        // Agregar información adicional
        const infoDiv = document.createElement('div');
        infoDiv.className = 'alert alert-info mt-3';
        infoDiv.style.marginTop = '15px';
        infoDiv.style.padding = '10px';
        infoDiv.style.backgroundColor = 'rgba(32, 107, 196, 0.2)';
        infoDiv.style.border = '1px solid rgba(64, 224, 208, 0.3)';
        infoDiv.style.borderRadius = '8px';
        infoDiv.style.color = '#a5d8ff';
        
        const min = Math.min(...envios.map(e => e.cantidad)).toFixed(2);
        const max = Math.max(...envios.map(e => e.cantidad)).toFixed(2);
        const promedio = (total / envios.length).toFixed(2);
        
        infoDiv.innerHTML = `
            <i class="fas fa-chart-bar" style="color: #40e0d0; margin-right: 8px;"></i>
            <strong>Resumen:</strong> 
            Total: ${total.toFixed(2)} kg | 
            Envíos: ${envios.length} | 
            Mín: ${min} kg | 
            Máx: ${max} kg | 
            Prom: ${promedio} kg
            ${envios.length < prediccion.total_envios ? `<br><small class="text-warning">⚠️ Se redujo de ${prediccion.total_envios} a ${envios.length} envíos por mínimo de 100 kg</small>` : ''}
        `;
        
        // Eliminar info anterior si existe
        const infoAnterior = document.querySelector('.modal-body .alert-info');
        if (infoAnterior) infoAnterior.remove();
        
        document.querySelector('.modal-body').appendChild(infoDiv);
        
        // Mostrar modal
        $('#modal-detalle').modal('show');
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al generar detalle');
    }
}

// Función para renderizar tabla
function renderizarTabla(predicciones) {
    const tbody = document.getElementById('tabla-predicciones-body');
    tbody.innerHTML = '';
    
    if (predicciones.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-chart-line"></i>
            <h4>No se encontraron predicciones</h4>
            <p>Intente con otros filtros de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, predicciones.length);
    const paginatedPredicciones = predicciones.slice(startIndex, endIndex);
    
    paginatedPredicciones.forEach(pred => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td class="text-left">${pred.producto_id}</td>
            <td class="text-left">${pred.nombre_producto}</td>
            <td class="text-left">${pred.tipo_producto || 'N/A'}</td>
            <td class="text-left">${pred.variedad_producto || 'N/A'}</td>
            <td class="text-center">${pred.total_envios || 0}</td>
            <td class="text-center"><strong>${(pred.demanda_predicha || 0).toFixed(2)}</strong></td>
            <td class="text-center">
                <div class="acciones-cell">
                    <button class="btn btn-info btn-sm" onclick="verDetalle(${pred.producto_id}, '${pred.nombre_producto}', '${pred.tipo_producto || 'N/A'}', '${pred.variedad_producto || 'N/A'}')">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(predicciones.length);
    actualizarControlesPaginacion(predicciones.length);
}

// Función para filtrar predicciones
function filtrarPredicciones() {
    const searchTerm = document.getElementById('search-productos').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredPredicciones = prediccionesData;
    } else {
        filteredPredicciones = prediccionesData.filter(pred => 
            pred.nombre_producto?.toLowerCase().includes(searchTerm) ||
            pred.tipo_producto?.toLowerCase().includes(searchTerm) ||
            pred.variedad_producto?.toLowerCase().includes(searchTerm) ||
            pred.producto_id?.toString().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    renderizarTabla(filteredPredicciones);
}

// Funciones de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    infoElement.textContent = totalItems === 0 
        ? 'Mostrando 0 de 0 predicciones'
        : `Mostrando ${startIndex}-${endIndex} de ${totalItems} predicciones`;
}

function actualizarControlesPaginacion(totalItems) {
    totalPages = Math.ceil(totalItems / pageSize);
    
    document.getElementById('btn-first').disabled = currentPage === 1 || totalPages === 0;
    document.getElementById('btn-prev').disabled = currentPage === 1 || totalPages === 0;
    document.getElementById('btn-next').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('btn-last').disabled = currentPage === totalPages || totalPages === 0;
    
    const pagesContainer = document.getElementById('pagination-pages');
    pagesContainer.innerHTML = '';
    
    if (totalPages <= 1 || totalPages === 0) return;
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) endPage = Math.min(5, totalPages);
    if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
    
    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = `btn-pagination ${i === currentPage ? 'btn-page-active' : 'btn-page'}`;
        btn.textContent = i;
        btn.onclick = () => cambiarPagina(i);
        pagesContainer.appendChild(btn);
    }
}

function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderizarTabla(filteredPredicciones);
}

// Funciones auxiliares
function buscarConDebounce() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filtrarPredicciones, 300);
}

function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0',
        timer: 1500,
        showConfirmButton: false
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

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarAniosDisponibles();
    
    document.getElementById('btn-predecir').addEventListener('click', predecirStock);
    document.getElementById('btn-guardar-predicciones').addEventListener('click', guardarPredicciones);
    document.getElementById('search-productos').addEventListener('input', buscarConDebounce);
    
    document.getElementById('btn-first').addEventListener('click', () => cambiarPagina(1));
    document.getElementById('btn-prev').addEventListener('click', () => cambiarPagina(currentPage - 1));
    document.getElementById('btn-next').addEventListener('click', () => cambiarPagina(currentPage + 1));
    document.getElementById('btn-last').addEventListener('click', () => cambiarPagina(totalPages));
    
    document.getElementById('page-size').addEventListener('change', function() {
        pageSize = parseInt(this.value);
        currentPage = 1;
        if (filteredPredicciones.length > 0) renderizarTabla(filteredPredicciones);
    });
    
    // Enter en selects
    document.getElementById('anio').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') predecirStock();
    });
    
    document.getElementById('mes').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') predecirStock();
    });
});