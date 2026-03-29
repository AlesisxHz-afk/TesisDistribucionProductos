// Variables globales
let rolesData = [];
let accionActual = '';
let rolIdActual = '';
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredRoles = [];

// Función para cargar los roles
async function cargarRoles() {
    try {
        const response = await fetch('/main/tipo_usuario/obtener_roles');
        if (!response.ok) {
            throw new Error('Error al cargar los roles');
        }
        
        const data = await response.json();
        if (data.success) {
            rolesData = data.roles;
            filtrarRoles();
        } else {
            throw new Error(data.error || 'Error al cargar los roles');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los roles');
    }
}

// Función para renderizar la tabla con paginación
function renderizarTabla(roles) {
    const tbody = document.getElementById('tabla-roles-body');
    tbody.innerHTML = '';
    
    if (roles.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 4;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-search"></i>
            <h4>No se encontraron roles</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, roles.length);
    const paginatedRoles = roles.slice(startIndex, endIndex);
    
    paginatedRoles.forEach(rol => {
        const tr = document.createElement('tr');
        
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        tdNombre.textContent = rol.tipo_usuario;
        tr.appendChild(tdNombre);
        
        const tdDescripcion = document.createElement('td');
        tdDescripcion.className = 'text-left';
        tdDescripcion.textContent = rol.descripcion || '-';
        tr.appendChild(tdDescripcion);
        
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        estadoBadge.className = rol.estado_rol ? 'estado-activo' : 'estado-inactivo';
        estadoBadge.innerHTML = rol.estado_rol ? 
            '<i class="fas fa-check-circle"></i> Activo' : 
            '<i class="fas fa-ban"></i> Inactivo';
        tdEstado.appendChild(estadoBadge);
        tr.appendChild(tdEstado);
        
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        btnEditar.title = 'Editar rol';
        btnEditar.onclick = () => editarRol(rol.tipo_usuario_id);
        divAcciones.appendChild(btnEditar);
        
        const btnEstado = document.createElement('button');
        if (rol.estado_rol) {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
        } else {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
        }
        btnEstado.onclick = () => cambiarEstadoRol(rol);
        divAcciones.appendChild(btnEstado);
        
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar Rol';
        btnEliminar.onclick = () => eliminarRol(rol.tipo_usuario_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(roles.length);
    actualizarControlesPaginacion(roles.length);
}

function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 roles';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} roles`;
    }
}

function actualizarControlesPaginacion(totalItems) {
    totalPages = Math.ceil(totalItems / pageSize);
    
    document.getElementById('btn-first').disabled = currentPage === 1;
    document.getElementById('btn-prev').disabled = currentPage === 1;
    document.getElementById('btn-next').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('btn-last').disabled = currentPage === totalPages || totalPages === 0;
    
    const pagesContainer = document.getElementById('pagination-pages');
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

function cambiarPagina(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderizarTabla(filteredRoles);
    
    const tabla = document.getElementById('tabla-roles');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function filtrarRoles() {
    const searchTerm = document.getElementById('search-roles').value.toLowerCase();
    filteredRoles = rolesData.filter(rol => {
        return rol.tipo_usuario.toLowerCase().includes(searchTerm) ||
               (rol.descripcion && rol.descripcion.toLowerCase().includes(searchTerm));
    });
    
    currentPage = 1;
    renderizarTabla(filteredRoles);
}

function abrirModalNuevoRol() {
    document.getElementById('modal-titulo').textContent = 'Nuevo Rol';
    document.getElementById('tipo_usuario_id').value = '';
    document.getElementById('nombre_rol').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('estado_rol').value = 'true';
    document.getElementById('estado-group').style.display = 'none';
    
    const form = document.getElementById('form-rol');
    form.classList.remove('was-validated');
    
    $('#modal-rol').modal('show');
}

// Función de edición MODIFICADA - Estado oculto
async function editarRol(id) {
    try {
        const response = await fetch(`/main/tipo_usuario/obtener_rol/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el rol');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el rol');
        }
        
        const rol = data.rol;
        
        document.getElementById('modal-titulo').textContent = 'Editar rol';
        document.getElementById('tipo_usuario_id').value = rol.tipo_usuario_id;
        document.getElementById('nombre_rol').value = rol.tipo_usuario;
        document.getElementById('descripcion').value = rol.descripcion || '';
        // ELIMINADO: document.getElementById('estado_rol').value = rol.estado_rol ? 'true' : 'false';
        // MANTENER OCULTO EL CAMPO DE ESTADO
        document.getElementById('estado-group').style.display = 'none';
        
        $('#modal-rol').modal('show');
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el rol para editar');
    }
}

async function guardarRol() {
    const form = document.getElementById('form-rol');
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    const id = document.getElementById('tipo_usuario_id').value;
    const datos = {
        tipo_usuario: document.getElementById('nombre_rol').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        estado_rol: document.getElementById('estado_rol').value === 'true'
    };
    
    const url = id ? `/main/tipo_usuario/actualizar_rol/${id}` : '/main/tipo_usuario/agregar_rol';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje);
            $('#modal-rol').modal('hide');
            cargarRoles();
        } else {
            throw new Error(result.error || 'Error al guardar el rol');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

async function cambiarEstadoRol(rol) {
    Swal.fire({
        title: rol.estado_rol ? 'Dar de baja rol' : 'Activar rol',
        text: rol.estado_rol ? 
            `¿Está seguro que desea dar de baja el rol "${rol.tipo_usuario}"?` :
            `¿Está seguro que desea activar el rol "${rol.tipo_usuario}"?`,
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
                const response = await fetch(`/main/tipo_usuario/cambiar_estado/${rol.tipo_usuario_id}`, {
                    method: 'PUT'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje);
                    cargarRoles();
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado del rol');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del rol: ' + error.message);
            }
        }
    });
}

async function eliminarRol(id) {
    const rol = rolesData.find(r => r.tipo_usuario_id == id);
    
    Swal.fire({
        title: 'Eliminar rol',
        text: `¿Está seguro que desea eliminar permanentemente el rol "${rol.tipo_usuario}"? Esta acción no se puede deshacer.`,
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
                const response = await fetch(`/main/tipo_usuario/eliminar_rol/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje);
                    cargarRoles();
                } else {
                    throw new Error(data.error || 'Error al eliminar el rol');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo eliminar el rol: ' + error.message);
            }
        }
    });
}

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

function mostrarAdvertencia(titulo, mensaje) {
    Swal.fire({
        icon: 'warning',
        title: titulo,
        text: mensaje,
        background: '#152a3a',
        color: '#e0f2fe',
        confirmButtonColor: '#40e0d0'
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarRoles();
    
    document.getElementById('btn-nuevo-rol').addEventListener('click', abrirModalNuevoRol);
    document.getElementById('btn-guardar-rol').addEventListener('click', guardarRol);
    
    const searchInput = document.getElementById('search-roles');
    if (searchInput) {
        searchInput.addEventListener('input', filtrarRoles);
    }
    
    document.getElementById('btn-first').addEventListener('click', () => cambiarPagina(1));
    document.getElementById('btn-prev').addEventListener('click', () => cambiarPagina(currentPage - 1));
    document.getElementById('btn-next').addEventListener('click', () => cambiarPagina(currentPage + 1));
    document.getElementById('btn-last').addEventListener('click', () => cambiarPagina(totalPages));
    
    document.getElementById('page-size').addEventListener('change', function() {
        pageSize = parseInt(this.value);
        currentPage = 1;
        renderizarTabla(filteredRoles);
    });
    
    $('#modal-rol').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-rol');
        form.classList.remove('was-validated');
    });
    
    document.getElementById('form-rol').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            guardarRol();
        }
    });
});