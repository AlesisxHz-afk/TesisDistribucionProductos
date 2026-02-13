// Variables globales
let usuariosData = [];
let tiposUsuarioData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredUsuarios = [];
let conductorSeleccionado = null;
let esTipoConductor = false;
let searchTimeout = null;

// Función para cargar los tipos de usuario
async function cargarTiposUsuario() {
    try {
        const response = await fetch('/main/tipo_usuario/obtener_roles');
        if (!response.ok) {
            throw new Error('Error al cargar los tipos de usuario');
        }
        
        const data = await response.json();
        if (data.success) {
            tiposUsuarioData = data.roles;
            actualizarSelectTipos();
        } else {
            throw new Error(data.error || 'Error al cargar los tipos de usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los tipos de usuario');
    }
}

// Función para verificar si un tipo de usuario es CONDUCTOR
function esTipoUsuarioConductor(tipoUsuario) {
    return tipoUsuario && tipoUsuario.toLowerCase().includes('conductor');
}

// Función para actualizar el select de tipos de usuario
function actualizarSelectTipos() {
    const select = document.getElementById('tipo_usuario_id');
    if (!select) return;
    
    const currentValue = select.value;
    
    // Mantener solo la primera opción (placeholder)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Agregar solo tipos de usuario activos
    tiposUsuarioData
        .filter(tipo => tipo.estado_rol)
        .forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo.tipo_usuario_id;
            option.textContent = tipo.tipo_usuario;
            select.appendChild(option);
        });
    
    if (currentValue) {
        select.value = currentValue;
    }
}

// Función para cargar los usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch('/main/usuario/obtener_usuarios');
        if (!response.ok) {
            throw new Error('Error al cargar los usuarios');
        }
        
        const data = await response.json();
        if (data.success) {
            usuariosData = data.usuarios || [];
            filtrarUsuarios();
        } else {
            throw new Error(data.error || 'Error al cargar los usuarios');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los usuarios');
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(usuarios) {
    const tbody = document.getElementById('tabla-usuarios-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (usuarios.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 5;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-search"></i>
            <h4>No se encontraron usuarios</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar usuarios por apellido paterno de A a Z
    const usuariosOrdenados = [...usuarios].sort((a, b) => {
        // Obtener apellido paterno de cada usuario (en minúsculas para comparación case-insensitive)
        const apellidoA = (a.ape_paterno || '').toLowerCase();
        const apellidoB = (b.ape_paterno || '').toLowerCase();
        
        // Si ambos tienen apellido paterno, compararlos
        if (apellidoA && apellidoB) {
            return apellidoA.localeCompare(apellidoB);
        }
        
        // Si alguno no tiene apellido paterno, manejarlo
        if (!apellidoA && !apellidoB) return 0;
        if (!apellidoA) return 1; // Los sin apellido van al final
        if (!apellidoB) return -1; // Los con apellido van primero
        
        return 0;
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, usuariosOrdenados.length);
    const paginatedUsuarios = usuariosOrdenados.slice(startIndex, endIndex);
    
    paginatedUsuarios.forEach(user => {
        const tr = document.createElement('tr');
        
        // Celda de usuario
        const tdUsuario = document.createElement('td');
        tdUsuario.className = 'text-left';
        tdUsuario.textContent = user.usuario || 'Sin usuario';
        tr.appendChild(tdUsuario);
        
        // Celda de nombre completo - FORMATO: Apellidos, Nombres
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        
        // Construir el nombre completo en formato: "Apellido Paterno Apellido Materno, Nombres"
        const apellidoPaterno = user.ape_paterno || '';
        const apellidoMaterno = user.ape_materno || '';
        const nombres = user.nombres || '';
        
        let nombreCompleto = '';
        if (apellidoPaterno || apellidoMaterno) {
            // Si tiene al menos un apellido, mostrar primero los apellidos
            nombreCompleto = `${apellidoPaterno} ${apellidoMaterno}`.trim();
            if (nombres) {
                nombreCompleto += `, ${nombres}`;
            }
        } else if (nombres) {
            // Si no tiene apellidos pero tiene nombres
            nombreCompleto = nombres;
        } else {
            nombreCompleto = 'Sin nombre';
        }
        
        tdNombre.textContent = nombreCompleto;
        tr.appendChild(tdNombre);
        
        // Celda de tipo de usuario
        const tdTipo = document.createElement('td');
        tdTipo.className = 'text-left';
        tdTipo.textContent = user.tipo_usuario || 'Sin tipo';
        tr.appendChild(tdTipo);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        estadoBadge.className = user.estado_usuario ? 'estado-activo' : 'estado-inactivo';
        estadoBadge.innerHTML = user.estado_usuario ? 
            '<i class="fas fa-check-circle"></i> Activo' : 
            '<i class="fas fa-ban"></i> Inactivo';
        tdEstado.appendChild(estadoBadge);
        tr.appendChild(tdEstado);
        
        // Celda de acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        btnEditar.title = 'Editar usuario';
        btnEditar.onclick = () => editarUsuario(user.usuario_id);
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado
        const btnEstado = document.createElement('button');
        if (user.estado_usuario) {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
        } else {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
        }
        btnEstado.onclick = () => cambiarEstadoUsuario(user);
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar usuario';
        btnEliminar.onclick = () => eliminarUsuario(user.usuario_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(usuarios.length);
    actualizarControlesPaginacion(usuarios.length);
}

// Función para actualizar la información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 usuarios';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} usuarios`;
    }
}

// Función para actualizar los controles de paginación
function actualizarControlesPaginacion(totalItems) {
    totalPages = Math.ceil(totalItems / pageSize);
    
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    
    if (btnFirst) btnFirst.disabled = currentPage === 1;
    if (btnPrev) btnPrev.disabled = currentPage === 1;
    if (btnNext) btnNext.disabled = currentPage === totalPages || totalPages === 0;
    if (btnLast) btnLast.disabled = currentPage === totalPages || totalPages === 0;
    
    const pagesContainer = document.getElementById('pagination-pages');
    if (!pagesContainer) return;
    
    pagesContainer.innerHTML = '';
    
    if (totalPages <= 1) return;
    
    let startPage, endPage;
    
    if (totalPages <= 5) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= 3) {
            startPage = 1;
            endPage = 5;
        } else if (currentPage + 2 >= totalPages) {
            startPage = totalPages - 4;
            endPage = totalPages;
        } else {
            startPage = currentPage - 2;
            endPage = currentPage + 2;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `btn-pagination ${i === currentPage ? 'btn-page-active' : 'btn-page'}`;
        pageButton.textContent = i;
        pageButton.onclick = () => cambiarPagina(i);
        pagesContainer.appendChild(pageButton);
    }
    
    if (startPage > 1) {
        const ellipsisStart = document.createElement('span');
        ellipsisStart.className = 'pagination-ellipsis';
        ellipsisStart.textContent = '...';
        pagesContainer.insertBefore(ellipsisStart, pagesContainer.firstChild);
        
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'btn-pagination btn-page';
        firstPageButton.textContent = '1';
        firstPageButton.onclick = () => cambiarPagina(1);
        pagesContainer.insertBefore(firstPageButton, ellipsisStart);
    }
    
    if (endPage < totalPages) {
        const ellipsisEnd = document.createElement('span');
        ellipsisEnd.className = 'pagination-ellipsis';
        ellipsisEnd.textContent = '...';
        pagesContainer.appendChild(ellipsisEnd);
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'btn-pagination btn-page';
        lastPageButton.textContent = totalPages;
        lastPageButton.onclick = () => cambiarPagina(totalPages);
        pagesContainer.appendChild(lastPageButton);
    }
}

// Función para cambiar de página
function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarTabla(filteredUsuarios);
    
    const tabla = document.getElementById('tabla-usuarios');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar usuarios
function filtrarUsuarios() {
    const searchInput = document.getElementById('search-usuarios');
    if (!searchInput) {
        filteredUsuarios = usuariosData;
        currentPage = 1;
        renderizarTabla(filteredUsuarios);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredUsuarios = usuariosData;
    } else {
        filteredUsuarios = usuariosData.filter(user => {
            const usuario = user.usuario ? user.usuario.toLowerCase() : '';
            const nombres = user.nombres ? user.nombres.toLowerCase() : '';
            const apePaterno = user.ape_paterno ? user.ape_paterno.toLowerCase() : '';
            const apeMaterno = user.ape_materno ? user.ape_materno.toLowerCase() : '';
            const tipoUsuario = user.tipo_usuario ? user.tipo_usuario.toLowerCase() : '';
            const nombreCompleto = `${apePaterno} ${apeMaterno} ${nombres}`.toLowerCase();
            
            return usuario.includes(searchTerm) ||
                   nombres.includes(searchTerm) ||
                   apePaterno.includes(searchTerm) ||
                   apeMaterno.includes(searchTerm) ||
                   tipoUsuario.includes(searchTerm) ||
                   nombreCompleto.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredUsuarios);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarUsuarios();
    }, 300); // 300ms de delay
}

// Función para verificar DNI de conductor
async function verificarConductor(dni) {
    try {
        const response = await fetch(`/main/usuario/verificar_conductor/${dni}`);
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error verificando conductor:', error);
        return null;
    }
}

// Función para mostrar información del conductor
function mostrarInfoConductor(conductorData) {
    const conductorInfo = document.getElementById('conductor-info');
    const conductorNombre = document.getElementById('conductor-nombre');
    const conductorEstado = document.getElementById('conductor-estado');
    const conductorAsignado = document.getElementById('conductor-asignado');
    
    if (!conductorInfo || !conductorNombre || !conductorEstado || !conductorAsignado) return;
    
    if (conductorData && conductorData.existe) {
        conductorInfo.style.display = 'block';
        conductorSeleccionado = conductorData.conductor;
        
        if (conductorData.conductor) {
            const nombre = conductorData.conductor.nombre || '';
            const paterno = conductorData.conductor.apellido_paterno || conductorData.conductor.paterno || '';
            const materno = conductorData.conductor.apellido_materno || conductorData.conductor.materno || '';
            
            conductorNombre.textContent = `${nombre} ${paterno} ${materno}`.trim();
            conductorEstado.textContent = conductorData.conductor.estado || 'Sin estado';
            conductorAsignado.textContent = conductorData.tiene_usuario ? 'Ya tiene usuario asignado' : 'Disponible para asignar';
            
            // Limpiar clases anteriores
            conductorEstado.className = '';
            if (conductorData.conductor.estado !== 'ACTIVO') {
                conductorEstado.className = 'text-danger';
            } else {
                conductorEstado.className = conductorData.tiene_usuario ? 'text-warning' : 'text-success';
            }
        }
    } else {
        conductorInfo.style.display = 'none';
        conductorSeleccionado = null;
        conductorNombre.textContent = '-';
        conductorEstado.textContent = '-';
        conductorAsignado.textContent = '-';
    }
}

// Función para mostrar/ocultar sección de conductor según tipo de usuario
function mostrarSeccionConductor() {
    const tipoSelect = document.getElementById('tipo_usuario_id');
    const conductorSection = document.getElementById('conductor-section');
    const conductorInfo = document.getElementById('conductor-info');
    const dniInput = document.getElementById('dni');
    
    if (!tipoSelect || !conductorSection) return;
    
    if (!tipoSelect.value) {
        conductorSection.style.display = 'none';
        if (conductorInfo) conductorInfo.style.display = 'none';
        esTipoConductor = false;
        return;
    }
    
    // Buscar el tipo de usuario seleccionado
    const tipoSeleccionado = tiposUsuarioData.find(t => t.tipo_usuario_id == tipoSelect.value);
    
    if (tipoSeleccionado && esTipoUsuarioConductor(tipoSeleccionado.tipo_usuario)) {
        conductorSection.style.display = 'block';
        esTipoConductor = true;
        
        // Si ya hay un DNI ingresado, verificar conductor
        if (dniInput && dniInput.value) {
            verificarConductor(dniInput.value).then(data => {
                mostrarInfoConductor(data);
            });
        }
    } else {
        conductorSection.style.display = 'none';
        if (conductorInfo) conductorInfo.style.display = 'none';
        conductorSeleccionado = null;
        esTipoConductor = false;
    }
}

// Función para abrir modal de nuevo usuario
function abrirModalNuevoUsuario() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-usuario');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo usuario';
    document.getElementById('usuario_id').value = '';
    document.getElementById('nombre_usuario').value = '';
    document.getElementById('password').value = '';
    document.getElementById('nombres').value = '';
    document.getElementById('ape_paterno').value = '';
    document.getElementById('ape_materno').value = '';
    document.getElementById('tipo_usuario_id').value = '';
    document.getElementById('estado_usuario').value = 'true';
    document.getElementById('dni').value = '';
    
    document.getElementById('conductor-section').style.display = 'none';
    document.getElementById('conductor-info').style.display = 'none';
    
    const passwordInput = document.getElementById('password');
    const passwordRequired = document.getElementById('password-required');
    
    if (passwordInput) {
        passwordInput.required = true;
        passwordInput.value = ''; // Asegurarse de que esté vacío
    }
    
    if (passwordRequired) {
        passwordRequired.style.display = 'inline';
    }
    
    conductorSeleccionado = null;
    esTipoConductor = false;
    
    form.classList.remove('was-validated');
    
    $('#modal-usuario').modal('show');
}

// Función para abrir modal de edición
async function editarUsuario(id) {
    try {
        const response = await fetch(`/main/usuario/obtener_usuario/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el usuario');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el usuario');
        }
        
        const usuario = data.usuario;
        
        document.getElementById('modal-titulo').textContent = 'Editar usuario';
        document.getElementById('usuario_id').value = usuario.usuario_id;
        document.getElementById('nombre_usuario').value = usuario.usuario || '';
        document.getElementById('password').value = '';
        document.getElementById('nombres').value = usuario.nombres || '';
        document.getElementById('ape_paterno').value = usuario.ape_paterno || '';
        document.getElementById('ape_materno').value = usuario.ape_materno || '';
        document.getElementById('tipo_usuario_id').value = usuario.tipo_usuario_id || '';
        document.getElementById('estado_usuario').value = usuario.estado_usuario ? 'true' : 'false';
        
        const passwordInput = document.getElementById('password');
        const passwordRequired = document.getElementById('password-required');
        
        if (passwordInput) {
            passwordInput.required = false;
            passwordInput.value = ''; // Limpiar contraseña en edición
        }
        
        if (passwordRequired) {
            passwordRequired.style.display = 'none';
        }
        
        // Verificar si es conductor
        const esConductorResponse = await fetch(`/main/usuario/es_conductor/${usuario.usuario_id}`);
        if (esConductorResponse.ok) {
            const conductorData = await esConductorResponse.json();
            
            if (conductorData.es_conductor && conductorData.dni) {
                document.getElementById('dni').value = conductorData.dni || '';
            } else {
                document.getElementById('dni').value = '';
            }
        } else {
            document.getElementById('dni').value = '';
        }
        
        // Mostrar/ocultar sección de conductor según tipo de usuario
        mostrarSeccionConductor();
        
        $('#modal-usuario').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el usuario para editar');
    }
}

// Función para validar datos del formulario
function validarFormulario() {
    const form = document.getElementById('form-usuario');
    if (!form) return false;
    
    // Validar campos básicos
    const nombreUsuario = document.getElementById('nombre_usuario').value.trim();
    const nombres = document.getElementById('nombres').value.trim();
    const apePaterno = document.getElementById('ape_paterno').value.trim();
    const apeMaterno = document.getElementById('ape_materno').value.trim();
    const tipoUsuarioId = document.getElementById('tipo_usuario_id').value;
    
    if (!nombreUsuario) {
        mostrarError('Por favor ingrese el nombre de usuario');
        return false;
    }
    
    if (!nombres) {
        mostrarError('Por favor ingrese los nombres');
        return false;
    }
    
    if (!apePaterno) {
        mostrarError('Por favor ingrese el apellido paterno');
        return false;
    }
    
    if (!apeMaterno) {
        mostrarError('Por favor ingrese el apellido materno');
        return false;
    }
    
    if (!tipoUsuarioId) {
        mostrarError('Por favor seleccione un tipo de usuario');
        return false;
    }
    
    // Validar contraseña para nuevo usuario
    const usuarioId = document.getElementById('usuario_id').value;
    const password = document.getElementById('password').value.trim();
    if (!usuarioId && !password) {
        mostrarError('Por favor ingrese una contraseña para el nuevo usuario');
        return false;
    }
    
    return true;
}

// Función para guardar usuario
async function guardarUsuario() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-usuario');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('usuario_id').value;
    const tipoUsuarioId = document.getElementById('tipo_usuario_id').value;
    
    // Obtener el nombre del tipo de usuario para verificar si es conductor
    const tipoSeleccionado = tiposUsuarioData.find(t => t.tipo_usuario_id == tipoUsuarioId);
    const esConductor = tipoSeleccionado && esTipoUsuarioConductor(tipoSeleccionado.tipo_usuario);
    
    let dni = null;
    
    // Validar DNI si es conductor
    if (esConductor) {
        dni = document.getElementById('dni').value.trim();
        if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
            mostrarError('El DNI debe tener exactamente 8 dígitos numéricos');
            return;
        }
        
        // Verificar conductor
        const conductorData = await verificarConductor(dni);
        if (!conductorData || !conductorData.existe) {
            mostrarError('El conductor con este DNI no existe en la base de datos');
            return;
        }
        
        if (!conductorData.puede_registrarse) {
            mostrarError(conductorData.mensaje || 'El conductor no está disponible para asignar');
            return;
        }
        
        // Si es nuevo usuario o se está cambiando a conductor
        if (!id && conductorData.tiene_usuario) {
            mostrarError('El conductor ya tiene un usuario asignado');
            return;
        }
        
        // Si es edición y se está cambiando de conductor
        if (id && conductorData.tiene_usuario && conductorData.conductor.usuario_id != id) {
            mostrarError('El conductor ya tiene un usuario asignado a otra cuenta');
            return;
        }
    }
    
    const datos = {
        username: document.getElementById('nombre_usuario').value.trim(),
        password: document.getElementById('password').value.trim(),
        nombres: document.getElementById('nombres').value.trim(),
        paterno: document.getElementById('ape_paterno').value.trim(),
        materno: document.getElementById('ape_materno').value.trim(),
        tipo_usuario_id: parseInt(tipoUsuarioId),
        estado_usuario: document.getElementById('estado_usuario').value === 'true',
        dni: dni
    };
    
    // Si es edición y no se cambió la contraseña, no enviar password
    if (id && !datos.password) {
        delete datos.password;
    }
    
    const url = id ? `/main/usuario/actualizar_usuario/${id}` : '/main/usuario/registrar';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const formData = new FormData();
        for (const key in datos) {
            if (datos[key] !== null && datos[key] !== undefined) {
                formData.append(key, datos[key]);
            }
        }
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Usuario guardado exitosamente');
            $('#modal-usuario').modal('hide');
            cargarUsuarios();
        } else {
            throw new Error(result.error || 'Error al guardar el usuario');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado (dar de baja/activar)
async function cambiarEstadoUsuario(user) {
    const accion = user.estado_usuario ? 'dar de baja' : 'activar';
    const titulo = user.estado_usuario ? 'Dar de baja usuario' : 'Activar usuario';
    const texto = user.estado_usuario ? 
        `¿Está seguro que desea dar de baja al usuario "${user.usuario}"?` :
        `¿Está seguro que desea activar al usuario "${user.usuario}"?`;
    
    Swal.fire({
        title: titulo,
        text: texto,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/usuario/cambiar_estado/${user.usuario_id}`, {
                    method: 'PUT'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                    cargarUsuarios();
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado del usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del usuario: ' + error.message);
            }
        }
    });
}

// Función para eliminar usuario
async function eliminarUsuario(id) {
    const user = usuariosData.find(u => u.usuario_id == id);
    if (!user) return;
    
    Swal.fire({
        title: 'Eliminar usuario',
        text: `¿Está seguro que desea eliminar permanentemente al usuario "${user.usuario}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#152a3a',
        color: '#e0f2fe'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/main/usuario/eliminar_usuario/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Usuario eliminado exitosamente');
                    cargarUsuarios();
                } else {
                    throw new Error(data.error || 'Error al eliminar el usuario');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo eliminar el usuario: ' + error.message);
            }
        }
    });
}

// Funciones auxiliares para mostrar mensajes
function mostrarExito(mensaje) {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0'
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
    // Cargar datos iniciales
    cargarTiposUsuario();
    cargarUsuarios();
    
    // Botón nuevo usuario
    const btnNuevoUsuario = document.getElementById('btn-nuevo-usuario');
    if (btnNuevoUsuario) {
        btnNuevoUsuario.addEventListener('click', abrirModalNuevoUsuario);
    }
    
    // Botón guardar usuario
    const btnGuardarUsuario = document.getElementById('btn-guardar-usuario');
    if (btnGuardarUsuario) {
        btnGuardarUsuario.addEventListener('click', guardarUsuario);
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-usuarios');
    if (searchInput) {
        searchInput.addEventListener('input', buscarConDebounce);
    }
    
    // Controles de paginación
    const btnFirst = document.getElementById('btn-first');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnLast = document.getElementById('btn-last');
    
    if (btnFirst) btnFirst.addEventListener('click', () => cambiarPagina(1));
    if (btnPrev) btnPrev.addEventListener('click', () => cambiarPagina(currentPage - 1));
    if (btnNext) btnNext.addEventListener('click', () => cambiarPagina(currentPage + 1));
    if (btnLast) btnLast.addEventListener('click', () => cambiarPagina(totalPages));
    
    // Cambiar tamaño de página
    const pageSizeSelect = document.getElementById('page-size');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSize = parseInt(this.value);
            currentPage = 1;
            renderizarTabla(filteredUsuarios);
        });
    }
    
    // Mostrar/ocultar sección de conductor según tipo de usuario
    const tipoUsuarioSelect = document.getElementById('tipo_usuario_id');
    if (tipoUsuarioSelect) {
        tipoUsuarioSelect.addEventListener('change', function() {
            mostrarSeccionConductor();
        });
    }
    
    // Verificar DNI en tiempo real
    const dniInput = document.getElementById('dni');
    if (dniInput) {
        dniInput.addEventListener('input', async function() {
            const dni = this.value;
            if (dni.length === 8 && /^\d+$/.test(dni)) {
                const conductorData = await verificarConductor(dni);
                mostrarInfoConductor(conductorData);
            } else {
                mostrarInfoConductor(null);
            }
        });
    }
    
    // Limpiar modal al cerrar
    $('#modal-usuario').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-usuario');
        if (form) {
            form.classList.remove('was-validated');
        }
        
        const conductorSection = document.getElementById('conductor-section');
        const conductorInfo = document.getElementById('conductor-info');
        
        if (conductorSection) conductorSection.style.display = 'none';
        if (conductorInfo) conductorInfo.style.display = 'none';
        
        conductorSeleccionado = null;
        esTipoConductor = false;
    });
    
    // Permitir Enter en formulario
    const formUsuario = document.getElementById('form-usuario');
    if (formUsuario) {
        formUsuario.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarUsuario();
            }
        });
    }
});