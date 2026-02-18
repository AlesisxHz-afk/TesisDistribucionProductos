// Variables globales
let conductoresData = [];
let conductorSeleccionado = null;
let horariosData = [];

// Mapeo de días
const diasMap = {
    'lunes': 'LUNES',
    'martes': 'MARTES',
    'miercoles': 'MIÉRCOLES',
    'jueves': 'JUEVES',
    'viernes': 'VIERNES',
    'sabado': 'SÁBADO'
};

const diasArray = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Función para cargar conductores
async function cargarConductores() {
    try {
        const response = await fetch('/main/conductor/obtener_conductores');
        if (!response.ok) {
            throw new Error('Error al cargar los conductores');
        }
        
        const data = await response.json();
        if (data.success) {
            conductoresData = data.conductores || [];
        } else {
            throw new Error(data.error || 'Error al cargar los conductores');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los conductores');
    }
}

// Función para buscar conductor
function buscarConductor() {
    const tipoBusqueda = document.getElementById('tipo-busqueda').value;
    const termino = document.getElementById('search-conductor').value.trim();
    
    if (!termino) {
        mostrarError('Por favor ingrese un término de búsqueda');
        return;
    }
    
    let resultados = [];
    
    if (tipoBusqueda === 'dni') {
        resultados = conductoresData.filter(c => 
            c.dni && c.dni.toLowerCase().includes(termino.toLowerCase())
        );
    } else {
        resultados = conductoresData.filter(c => {
            const nombreCompleto = `${c.nombre || ''} ${c.apellido_paterno || ''} ${c.apellido_materno || ''}`.toLowerCase();
            return nombreCompleto.includes(termino.toLowerCase());
        });
    }
    
    if (resultados.length === 0) {
        mostrarError('No se encontraron conductores con los criterios de búsqueda');
        document.getElementById('resultados-busqueda').style.display = 'none';
        return;
    }
    
    if (resultados.length === 1) {
        // Si solo hay un resultado, seleccionarlo automáticamente
        seleccionarConductor(resultados[0]);
        document.getElementById('resultados-busqueda').style.display = 'none';
    } else {
        // Mostrar múltiples resultados
        mostrarResultadosBusqueda(resultados);
    }
}

// Función para mostrar resultados de búsqueda
function mostrarResultadosBusqueda(resultados) {
    const tbody = document.getElementById('tabla-resultados-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    resultados.forEach(cond => {
        const tr = document.createElement('tr');
        
        // Nombre completo
        const tdNombre = document.createElement('td');
        tdNombre.textContent = `${cond.nombre || ''} ${cond.apellido_paterno || ''} ${cond.apellido_materno || ''}`.trim() || 'Sin nombre';
        tr.appendChild(tdNombre);
        
        // DNI
        const tdDni = document.createElement('td');
        tdDni.textContent = cond.dni || '-';
        tr.appendChild(tdDni);
        
        // Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const btnSeleccionar = document.createElement('button');
        btnSeleccionar.className = 'btn btn-primary btn-sm';
        btnSeleccionar.innerHTML = '<i class="fas fa-check"></i> Seleccionar';
        btnSeleccionar.onclick = () => seleccionarConductor(cond);
        
        tdAcciones.appendChild(btnSeleccionar);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    document.getElementById('resultados-busqueda').style.display = 'block';
}

// Función para seleccionar un conductor
async function seleccionarConductor(conductor) {
    conductorSeleccionado = conductor;
    
    // Mostrar solo el nombre completo
    document.getElementById('conductor-nombre').textContent = 
        `${conductor.nombre || ''} ${conductor.apellido_paterno || ''} ${conductor.apellido_materno || ''}`.trim() || 'Sin nombre';
    
    document.getElementById('conductor-header').style.display = 'flex';
    
    // Cargar horarios del conductor
    await cargarHorariosConductor(conductor.conductor_id);
}

// Función para cargar horarios del conductor
async function cargarHorariosConductor(conductorId) {
    try {
        const response = await fetch(`/main/conductor/disponibilidad/obtener_por_conductor/${conductorId}`);
        if (!response.ok) {
            throw new Error('Error al cargar los horarios');
        }
        
        const data = await response.json();
        if (data.success) {
            horariosData = data.horarios || [];
            renderizarTablaHorarios();
            document.getElementById('horario-container').style.display = 'block';
        } else {
            horariosData = [];
            renderizarTablaHorarios();
        }
    } catch (error) {
        console.error('Error:', error);
        horariosData = [];
        renderizarTablaHorarios();
        mostrarError('No se pudieron cargar los horarios');
    }
}

// Función para renderizar la tabla de horarios
function renderizarTablaHorarios() {
    const tbody = document.getElementById('tabla-horarios-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Generar filas de 7:00 a 20:00 (13 filas de 7-8, 8-9, ..., 19-20)
    for (let hora = 7; hora < 20; hora++) {
        const horaInicio = hora.toString().padStart(2, '0') + ':00';
        const horaFin = (hora + 1).toString().padStart(2, '0') + ':00';
        const rangoHorario = `${horaInicio} - ${horaFin}`;
        
        const tr = document.createElement('tr');
        
        // Primera columna: rango horario
        const tdHora = document.createElement('td');
        tdHora.textContent = rangoHorario;
        tr.appendChild(tdHora);
        
        // Columnas para cada día
        for (const dia of diasArray) {
            const td = document.createElement('td');
            
            // Verificar si hay disponibilidad para esta hora y día
            const disponible = horariosData.some(h => 
                h.dia === dia && 
                horaEstaEnRango(hora, h.hora_inicio, h.hora_fin)
            );
            
            td.className = disponible ? 'celda-disponible' : 'celda-no-disponible';
            td.textContent = disponible ? '✓' : '✗';
            td.setAttribute('data-dia', dia);
            td.setAttribute('data-hora', hora);
            
            tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
    }
}

// Función auxiliar para verificar si una hora está en un rango
function horaEstaEnRango(hora, horaInicio, horaFin) {
    const horaNum = hora;
    const inicioNum = parseInt(horaInicio.split(':')[0]);
    const finNum = parseInt(horaFin.split(':')[0]);
    
    // Si el rango cruza varias horas, verificar si la hora está dentro
    if (finNum > inicioNum) {
        return horaNum >= inicioNum && horaNum < finNum;
    } else {
        // Rango que cruza la medianoche (no debería pasar en este caso)
        return false;
    }
}

// Función para abrir modal de edición
function abrirModalEditar() {
    if (!conductorSeleccionado) {
        mostrarError('Por favor seleccione un conductor primero');
        return;
    }
    
    document.getElementById('modal-conductor-nombre').textContent = 
        `${conductorSeleccionado.nombre} ${conductorSeleccionado.apellido_paterno}`;
    document.getElementById('modal-conductor_id').value = conductorSeleccionado.conductor_id;
    
    renderizarTablaEditor();
    $('#modal-editar-horarios').modal('show');
}

// Función para renderizar la tabla editor
function renderizarTablaEditor() {
    const tbody = document.getElementById('tabla-editor-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Generar filas de 7:00 a 20:00
    for (let hora = 7; hora < 20; hora++) {
        const horaInicio = hora.toString().padStart(2, '0') + ':00';
        const horaFin = (hora + 1).toString().padStart(2, '0') + ':00';
        const rangoHorario = `${horaInicio} - ${horaFin}`;
        
        const tr = document.createElement('tr');
        
        // Primera columna: rango horario
        const tdHora = document.createElement('td');
        tdHora.textContent = rangoHorario;
        tr.appendChild(tdHora);
        
        // Columnas para cada día con checkboxes
        for (const dia of diasArray) {
            const td = document.createElement('td');
            
            // Verificar si hay disponibilidad para esta hora y día
            const disponible = horariosData.some(h => 
                h.dia === dia && 
                horaEstaEnRango(hora, h.hora_inicio, h.hora_fin)
            );
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'horario-checkbox';
            checkbox.setAttribute('data-dia', dia);
            checkbox.setAttribute('data-hora', hora);
            checkbox.checked = disponible;
            
            td.appendChild(checkbox);
            tr.appendChild(td);
        }
        
        tbody.appendChild(tr);
    }
}

// Función para guardar horarios editados
async function guardarHorarios() {
    const conductorId = document.getElementById('modal-conductor_id').value;
    
    // Recopilar todos los checkboxes seleccionados
    const checkboxes = document.querySelectorAll('#tabla-editor-body input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        mostrarError('Debe seleccionar al menos un horario');
        return;
    }
    
    // Agrupar por día y hora
    const horariosPorDia = {};
    
    checkboxes.forEach(cb => {
        const dia = cb.getAttribute('data-dia');
        const hora = parseInt(cb.getAttribute('data-hora'));
        
        if (!horariosPorDia[dia]) {
            horariosPorDia[dia] = [];
        }
        
        horariosPorDia[dia].push(hora);
    });
    
    // Convertir a formato de horarios (agrupar horas consecutivas)
    const horariosAGuardar = [];
    
    for (const [dia, horas] of Object.entries(horariosPorDia)) {
        // Ordenar horas
        horas.sort((a, b) => a - b);
        
        // Agrupar horas consecutivas
        let inicio = horas[0];
        let fin = horas[0] + 1;
        
        for (let i = 1; i < horas.length; i++) {
            if (horas[i] === fin) {
                // Hora consecutiva, extender el fin
                fin = horas[i] + 1;
            } else {
                // No consecutiva, guardar el bloque anterior y empezar nuevo
                horariosAGuardar.push({
                    conductor_id: parseInt(conductorId),
                    dia: dia,
                    hora_inicio: inicio.toString().padStart(2, '0') + ':00',
                    hora_fin: fin.toString().padStart(2, '0') + ':00'
                });
                
                inicio = horas[i];
                fin = horas[i] + 1;
            }
        }
        
        // Guardar el último bloque
        horariosAGuardar.push({
            conductor_id: parseInt(conductorId),
            dia: dia,
            hora_inicio: inicio.toString().padStart(2, '0') + ':00',
            hora_fin: fin.toString().padStart(2, '0') + ':00'
        });
    }
    
    try {
        const response = await fetch('/main/conductor/disponibilidad/guardar_todos_horarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conductor_id: parseInt(conductorId),
                horarios: horariosAGuardar
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Horarios guardados exitosamente');
            $('#modal-editar-horarios').modal('hide');
            await cargarHorariosConductor(conductorId);
        } else {
            throw new Error(result.error || 'Error al guardar los horarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para procesar archivo Excel
async function procesarExcel() {
    const fileInput = document.getElementById('archivo_excel');
    const file = fileInput.files[0];
    
    if (!file) {
        mostrarError('Por favor seleccione un archivo Excel');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            let resultados = [];
            let errores = [];
            
            // Procesar cada hoja (cada hoja es un DNI)
            for (const sheetName of workbook.SheetNames) {
                const dni = sheetName.trim();
                
                // Buscar conductor por DNI
                const conductor = conductoresData.find(c => c.dni === dni);
                
                if (!conductor) {
                    errores.push(`Hoja "${sheetName}": No se encontró conductor con DNI ${dni}`);
                    continue;
                }
                
                const worksheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // Buscar encabezados
                const headers = rows[0] || [];
                const diaIndex = headers.findIndex(h => 
                    h && h.toString().toUpperCase().trim() === 'DIA'
                );
                const horaInicioIndex = headers.findIndex(h => 
                    h && h.toString().toUpperCase().replace(' ', '_').trim() === 'HORA_INICIO'
                );
                const horaFinIndex = headers.findIndex(h => 
                    h && h.toString().toUpperCase().replace(' ', '_').trim() === 'HORA_FIN'
                );
                
                if (diaIndex === -1 || horaInicioIndex === -1 || horaFinIndex === -1) {
                    errores.push(`Hoja "${sheetName}": Faltan columnas requeridas (DIA, HORA_INICIO, HORA_FIN)`);
                    continue;
                }
                
                // Procesar filas de datos
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (!row || row.length === 0) continue;
                    
                    const dia = row[diaIndex] ? row[diaIndex].toString().toLowerCase().trim() : '';
                    const horaInicio = row[horaInicioIndex] ? formatearHoraExcel(row[horaInicioIndex]) : '';
                    const horaFin = row[horaFinIndex] ? formatearHoraExcel(row[horaFinIndex]) : '';
                    
                    // Validar día
                    if (!diasArray.includes(dia)) {
                        errores.push(`Hoja "${sheetName}", fila ${i+1}: Día inválido "${dia}"`);
                        continue;
                    }
                    
                    // Validar horas
                    if (!horaInicio || !horaFin) {
                        errores.push(`Hoja "${sheetName}", fila ${i+1}: Horas inválidas`);
                        continue;
                    }
                    
                    resultados.push({
                        conductor_id: conductor.conductor_id,
                        dni: dni,
                        dia: dia,
                        hora_inicio: horaInicio,
                        hora_fin: horaFin
                    });
                }
            }
            
            if (resultados.length === 0) {
                mostrarError('No se encontraron datos válidos en el archivo');
                return;
            }
            
            // Mostrar resumen y preguntar si desea procesar
            let mensaje = `Se encontraron ${resultados.length} registros válidos`;
            if (errores.length > 0) {
                mensaje += ` y ${errores.length} errores.`;
            } else {
                mensaje += '.';
            }
            
            Swal.fire({
                title: 'Procesar Excel',
                text: mensaje + ' ¿Desea continuar?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, procesar',
                cancelButtonText: 'Cancelar',
                background: '#152a3a',
                color: '#e0f2fe'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    await enviarHorariosExcel(resultados);
                }
            });
            
            if (errores.length > 0) {
                mostrarAdvertencia(`Se encontraron ${errores.length} errores. Revise la consola para más detalles.`);
            }
            
        } catch (error) {
            console.error('Error al procesar Excel:', error);
            mostrarError('Error al procesar el archivo Excel');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Función para formatear hora desde Excel
function formatearHoraExcel(valor) {
    if (!valor) return '';
    
    // Si es número (formato Excel)
    if (typeof valor === 'number') {
        const totalSegundos = Math.round(valor * 24 * 3600);
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
    }
    
    // Si es string
    let horaStr = valor.toString().trim();
    
    // Intentar parsear formato HH:MM
    const match = horaStr.match(/(\d{1,2}):(\d{2})/);
    if (match) {
        const horas = parseInt(match[1]);
        const minutos = parseInt(match[2]);
        if (horas >= 0 && horas <= 23 && minutos >= 0 && minutos <= 59) {
            return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
        }
    }
    
    return horaStr;
}

// Función para enviar horarios del Excel
async function enviarHorariosExcel(horarios) {
    try {
        const response = await fetch('/main/conductor/disponibilidad/procesar_excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ horarios: horarios })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Horarios procesados exitosamente');
            $('#modal-excel').modal('hide');
            
            // Si hay un conductor seleccionado, recargar sus horarios
            if (conductorSeleccionado) {
                await cargarHorariosConductor(conductorSeleccionado.conductor_id);
            }
        } else {
            throw new Error(result.error || 'Error al procesar los horarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Funciones auxiliares para mostrar mensajes
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

function mostrarAdvertencia(mensaje) {
    Swal.fire({
        icon: 'warning',
        title: 'Advertencia',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarConductores();
    
    // Botón buscar conductor
    const btnBuscar = document.getElementById('btn-buscar-conductor');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarConductor);
    }
    
    // Buscar al presionar Enter
    const searchInput = document.getElementById('search-conductor');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarConductor();
            }
        });
    }
    
    // Botón subir Excel
    const btnSubirExcel = document.getElementById('btn-subir-excel');
    if (btnSubirExcel) {
        btnSubirExcel.addEventListener('click', function() {
            $('#modal-excel').modal('show');
        });
    }
    
    // Botón procesar Excel
    const btnProcesarExcel = document.getElementById('btn-procesar-excel');
    if (btnProcesarExcel) {
        btnProcesarExcel.addEventListener('click', procesarExcel);
    }
    
    // Botón editar todo
    const btnEditarTodo = document.getElementById('btn-editar-todo');
    if (btnEditarTodo) {
        btnEditarTodo.addEventListener('click', abrirModalEditar);
    }
    
    // Botón guardar horarios
    const btnGuardarHorarios = document.getElementById('btn-guardar-horarios');
    if (btnGuardarHorarios) {
        btnGuardarHorarios.addEventListener('click', guardarHorarios);
    }
    
    // Limpiar modales al cerrar
    $('#modal-excel').on('hidden.bs.modal', function() {
        document.getElementById('archivo_excel').value = '';
    });
});