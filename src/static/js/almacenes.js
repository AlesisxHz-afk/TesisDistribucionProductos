// Variables globales
let almacenesData = [];
let currentPage = 1;
let pageSize = 5;
let totalPages = 0;
let filteredAlmacenes = [];
let searchTimeout = null;
let map = null;
let markers = [];
let infoWindow = null;
let previewMap = null;
let previewMarker = null;
let mapInitialized = false;
let currentInfoWindow = null;

// Función para cargar los almacenes
async function cargarAlmacenes() {
    try {
        const response = await fetch('/main/almacen/obtener_almacenes');
        if (!response.ok) {
            throw new Error('Error al cargar los almacenes');
        }
        
        const data = await response.json();
        if (data.success) {
            almacenesData = data.almacenes || [];
            filtrarAlmacenes();
            
            // Si la vista de mapa está activa, actualizar marcadores
            if (document.getElementById('vista-mapa').classList.contains('active') && map) {
                actualizarMarcadoresMapa();
            }
        } else {
            throw new Error(data.error || 'Error al cargar los almacenes');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudieron cargar los almacenes');
    }
}

// Función para renderizar la tabla
function renderizarTabla(almacenes) {
    const tbody = document.getElementById('tabla-almacenes-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (almacenes.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.className = 'no-results';
        td.innerHTML = `
            <i class="fas fa-warehouse"></i>
            <h4>No se encontraron almacenes</h4>
            <p>Intenta con otros términos de búsqueda</p>
        `;
        tr.appendChild(td);
        tbody.appendChild(tr);
        
        actualizarInfoPaginacion(0);
        actualizarControlesPaginacion(0);
        return;
    }
    
    // Ordenar almacenes por nombre
    const almacenesOrdenados = [...almacenes].sort((a, b) => {
        const nombreA = (a.nombre || '').toLowerCase();
        const nombreB = (b.nombre || '').toLowerCase();
        return nombreA.localeCompare(nombreB);
    });
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, almacenesOrdenados.length);
    const paginatedAlmacenes = almacenesOrdenados.slice(startIndex, endIndex);
    
    paginatedAlmacenes.forEach(almacen => {
        const tr = document.createElement('tr');
        
        // Celda de nombre
        const tdNombre = document.createElement('td');
        tdNombre.className = 'text-left';
        tdNombre.textContent = almacen.nombre || 'Sin nombre';
        tr.appendChild(tdNombre);
        
        // Celda de tipo de almacén
        const tdTipo = document.createElement('td');
        tdTipo.className = 'text-left';
        tdTipo.textContent = almacen.tipo_almacen || 'Sin tipo';
        tr.appendChild(tdTipo);
        
        // Celda de dirección
        const tdDireccion = document.createElement('td');
        tdDireccion.className = 'text-left';
        tdDireccion.textContent = almacen.direccion || 'Sin dirección';
        tr.appendChild(tdDireccion);
        
        // Celda de capacidad
        const tdCapacidad = document.createElement('td');
        tdCapacidad.className = 'text-left';
        const capacidad = almacen.capacidad ? parseFloat(almacen.capacidad).toLocaleString('es-PE') : '0';
        tdCapacidad.innerHTML = `${capacidad} m³`;
        tr.appendChild(tdCapacidad);
        
        // Celda de estado
        const tdEstado = document.createElement('td');
        tdEstado.className = 'text-center';
        const estadoBadge = document.createElement('span');
        
        let estadoClass = '';
        let estadoIcono = '';
        let estadoTexto = almacen.estado || 'INACTIVO';
        
        if (almacen.estado === 'ACTIVO') {
            estadoClass = 'estado-activo';
            estadoIcono = '<i class="fas fa-check-circle"></i>';
        } else {
            estadoClass = 'estado-inactivo';
            estadoIcono = '<i class="fas fa-ban"></i>';
        }
        
        estadoBadge.className = estadoClass;
        estadoBadge.innerHTML = `${estadoIcono} ${estadoTexto}`;
        tdEstado.appendChild(estadoBadge);
        tr.appendChild(tdEstado);
        
        // Celda de ubicación
        const tdUbicacion = document.createElement('td');
        tdUbicacion.className = 'text-center';
        const ubicacionBadge = document.createElement('span');
        ubicacionBadge.className = 'ubicacion-badge';
        ubicacionBadge.innerHTML = '<i class="fas fa-map-marker-alt"></i> Ver en mapa';
        ubicacionBadge.onclick = () => {
            cambiarVista('mapa');
            setTimeout(() => centrarEnUbicacion(almacen), 500);
        };
        tdUbicacion.appendChild(ubicacionBadge);
        tr.appendChild(tdUbicacion);
        
        // Celda de acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = 'text-center';
        
        const divAcciones = document.createElement('div');
        divAcciones.className = 'acciones-cell';
        
        // Botón editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn btn-warning btn-sm';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
        btnEditar.title = 'Editar almacén';
        btnEditar.onclick = () => editarAlmacen(almacen.almacen_id);
        divAcciones.appendChild(btnEditar);
        
        // Botón cambiar estado
        const btnEstado = document.createElement('button');
        if (almacen.estado === 'ACTIVO') {
            btnEstado.className = 'btn btn-inactivar btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-ban"></i>';
            btnEstado.title = 'Dar de baja';
        } else {
            btnEstado.className = 'btn btn-success btn-sm';
            btnEstado.innerHTML = '<i class="fas fa-check"></i>';
            btnEstado.title = 'Activar';
        }
        btnEstado.onclick = () => cambiarEstadoAlmacen(almacen);
        divAcciones.appendChild(btnEstado);
        
        // Botón eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
        btnEliminar.title = 'Eliminar almacén';
        btnEliminar.onclick = () => eliminarAlmacen(almacen.almacen_id);
        divAcciones.appendChild(btnEliminar);
        
        tdAcciones.appendChild(divAcciones);
        tr.appendChild(tdAcciones);
        
        tbody.appendChild(tr);
    });
    
    actualizarInfoPaginacion(almacenes.length);
    actualizarControlesPaginacion(almacenes.length);
}

// Función para actualizar información de paginación
function actualizarInfoPaginacion(totalItems) {
    const infoElement = document.getElementById('pagination-info');
    if (!infoElement) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    if (totalItems === 0) {
        infoElement.textContent = 'Mostrando 0 de 0 almacenes';
    } else {
        infoElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${totalItems} almacenes`;
    }
}

// Función para actualizar controles de paginación
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
    renderizarTabla(filteredAlmacenes);
    
    const tabla = document.getElementById('tabla-almacenes');
    if (tabla) {
        tabla.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Función para filtrar almacenes
function filtrarAlmacenes() {
    const searchInput = document.getElementById('search-almacenes');
    if (!searchInput) {
        filteredAlmacenes = almacenesData;
        currentPage = 1;
        renderizarTabla(filteredAlmacenes);
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredAlmacenes = almacenesData;
    } else {
        filteredAlmacenes = almacenesData.filter(almacen => {
            const nombre = (almacen.nombre || '').toLowerCase();
            const tipo = (almacen.tipo_almacen || '').toLowerCase();
            const direccion = (almacen.direccion || '').toLowerCase();
            const estado = (almacen.estado || '').toLowerCase();
            
            return nombre.includes(searchTerm) ||
                   tipo.includes(searchTerm) ||
                   direccion.includes(searchTerm) ||
                   estado.includes(searchTerm);
        });
    }
    
    currentPage = 1;
    renderizarTabla(filteredAlmacenes);
}

// Función para buscar con debounce
function buscarConDebounce() {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        filtrarAlmacenes();
    }, 300);
}

// Función para cambiar entre vistas
function cambiarVista(vista) {
    const tabs = document.querySelectorAll('.nav-tab');
    const containers = document.querySelectorAll('.view-container');
    
    tabs.forEach(tab => {
        if (tab.dataset.view === vista) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    containers.forEach(container => {
        if (container.id === `vista-${vista}`) {
            container.classList.add('active');
        } else {
            container.classList.remove('active');
        }
    });
    
    if (vista === 'mapa' && !mapInitialized) {
        initMap();
    } else if (vista === 'mapa' && map) {
        actualizarMarcadoresMapa();
    }
}

// Función para inicializar el mapa principal
function initMap() {
    const mapContainer = document.getElementById('mapa-almacenes');
    if (!mapContainer) return;
    
    // Coordenadas por defecto (Perú)
    const defaultLocation = { lat: -9.189967, lng: -75.015152 };
    
    map = new google.maps.Map(mapContainer, {
        zoom: 6,
        center: defaultLocation,
        mapTypeId: 'roadmap',
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#1e3a5a" }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#152a3a" }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#2c5282" }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                    { "color": "#40e0d0" }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#1e3a5a" }
                ]
            },
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [
                    { "color": "#a5d8ff" }
                ]
            }
        ]
    });
    
    mapInitialized = true;
    actualizarMarcadoresMapa();
}

// Función para actualizar marcadores en el mapa principal
function actualizarMarcadoresMapa() {
    if (!map) return;
    
    // Limpiar marcadores existentes
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    if (filteredAlmacenes.length === 0) {
        // Mostrar mensaje en el mapa si no hay almacenes
        const noAlmacenesDiv = document.createElement('div');
        noAlmacenesDiv.className = 'no-results-mapa';
        noAlmacenesDiv.innerHTML = `
            <i class="fas fa-warehouse"></i>
            <h4>No hay almacenes para mostrar</h4>
            <p>Agrega almacenes para verlos en el mapa</p>
        `;
        
        // Crear un InfoWindow para mostrar el mensaje
        const infoWindowNoData = new google.maps.InfoWindow({
            content: noAlmacenesDiv.outerHTML,
            position: map.getCenter()
        });
        infoWindowNoData.open(map);
        return;
    }
    
    filteredAlmacenes.forEach(almacen => {
        if (!almacen.latitud || !almacen.longitud) return;
        
        const position = {
            lat: parseFloat(almacen.latitud),
            lng: parseFloat(almacen.longitud)
        };
        
        let iconColor = '';
        if (almacen.estado === 'ACTIVO') {
            iconColor = 'green';
        } else {
            iconColor = 'red';
        }
        
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: almacen.nombre,
            animation: google.maps.Animation.DROP,
            icon: `http://maps.google.com/mapfiles/ms/icons/${iconColor}-dot.png`
        });
        
        // Crear contenido personalizado para InfoWindow
        const contentString = `
            <div class="custom-info-window">
                <h4><i class="fas fa-warehouse"></i> ${almacen.nombre}</h4>
                
                <div class="info-row">
                    <i class="fas fa-tag"></i>
                    <strong>Tipo:</strong>
                    <span class="info-content">${almacen.tipo_almacen}</span>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-map-marker-alt"></i>
                    <strong>Dirección:</strong>
                    <span class="info-content">${almacen.direccion || 'No especificada'}</span>
                </div>
                
                <div class="capacidad-info">
                    <div class="info-row">
                        <i class="fas fa-cube"></i>
                        <strong>Capacidad:</strong>
                        <span class="info-content">${parseFloat(almacen.capacidad).toLocaleString('es-PE')} m³</span>
                    </div>
                </div>
                
                <div class="info-row">
                    <i class="fas fa-circle"></i>
                    <strong>Estado:</strong>
                    <span class="info-content">
                        <span class="estado-badge estado-${almacen.estado === 'ACTIVO' ? 'activo' : 'inactivo'}">
                            ${almacen.estado}
                        </span>
                    </span>
                </div>
                
                <div class="coordenadas-info">
                    <div class="info-row">
                        <i class="fas fa-latitude"></i>
                        <strong>Lat:</strong>
                        <span>${almacen.latitud}</span>
                    </div>
                    <div class="info-row">
                        <i class="fas fa-longitude"></i>
                        <strong>Lng:</strong>
                        <span>${almacen.longitud}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Usar InfoWindow personalizado
        const infoWindow = new google.maps.InfoWindow({
            content: contentString,
            pixelOffset: new google.maps.Size(0, -30),
            maxWidth: 350
        });
        
        marker.addListener('click', () => {
            // Cerrar cualquier InfoWindow abierto
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
            infoWindow.open(map, marker);
            currentInfoWindow = infoWindow;
        });
        
        markers.push(marker);
    });
}

// Función para centrar el mapa en una ubicación específica
function centrarEnUbicacion(almacen) {
    if (!map || !almacen.latitud || !almacen.longitud) return;
    
    const position = {
        lat: parseFloat(almacen.latitud),
        lng: parseFloat(almacen.longitud)
    };
    
    map.setZoom(16);
    map.panTo(position);
    
    // Buscar y abrir el InfoWindow del marcador correspondiente con animación
    setTimeout(() => {
        markers.forEach(marker => {
            const markerPos = marker.getPosition();
            if (Math.abs(markerPos.lat() - position.lat) < 0.0001 && 
                Math.abs(markerPos.lng() - position.lng) < 0.0001) {
                
                // Activar animación de rebote
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 1500);
                
                // Abrir InfoWindow
                google.maps.event.trigger(marker, 'click');
            }
        });
    }, 500);
}

// Función para inicializar el mapa de preview en el modal
function initPreviewMap() {
    const previewContainer = document.getElementById('mapa-preview');
    if (!previewContainer) return;
    
    const lat = parseFloat(document.getElementById('latitud').value) || -9.189967;
    const lng = parseFloat(document.getElementById('longitud').value) || -75.015152;
    
    previewMap = new google.maps.Map(previewContainer, {
        zoom: 15,
        center: { lat, lng },
        mapTypeId: 'roadmap',
        styles: [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#1e3a5a" }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#152a3a" }
                ]
            },
            {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#2c5282" }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                    { "color": "#40e0d0" }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "geometry",
                "stylers": [
                    { "color": "#1e3a5a" }
                ]
            }
        ]
    });
    
    previewMarker = new google.maps.Marker({
        position: { lat, lng },
        map: previewMap,
        draggable: true,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        },
        title: 'Arrastra para ajustar la ubicación'
    });
    
    // Crear InfoWindow para el marcador de preview
    const previewInfoWindow = new google.maps.InfoWindow({
        content: '<div style="color: #e0f2fe; background: #152a3a; padding: 5px;">Arrastra para ajustar la ubicación</div>'
    });
    
    previewMarker.addListener('click', () => {
        previewInfoWindow.open(previewMap, previewMarker);
    });
    
    // Evento para actualizar coordenadas al mover el marcador
    previewMarker.addListener('dragend', function() {
        const position = previewMarker.getPosition();
        document.getElementById('latitud').value = position.lat().toFixed(7);
        document.getElementById('longitud').value = position.lng().toFixed(7);
        actualizarCoordenadasPreview();
        
        // Mostrar mensaje de actualización
        previewInfoWindow.setContent('<div style="color: #40e0d0; background: #152a3a; padding: 5px;">¡Ubicación actualizada!</div>');
        previewInfoWindow.open(previewMap, previewMarker);
        setTimeout(() => previewInfoWindow.close(), 2000);
    });
    
    // Evento para centrar el mapa al hacer clic
    previewMap.addListener('click', function(e) {
        previewMarker.setPosition(e.latLng);
        document.getElementById('latitud').value = e.latLng.lat().toFixed(7);
        document.getElementById('longitud').value = e.latLng.lng().toFixed(7);
        actualizarCoordenadasPreview();
        
        // Mostrar mensaje de actualización
        previewInfoWindow.setContent('<div style="color: #40e0d0; background: #152a3a; padding: 5px;">¡Ubicación actualizada!</div>');
        previewInfoWindow.open(previewMap, previewMarker);
        setTimeout(() => previewInfoWindow.close(), 2000);
    });
}

// Función para actualizar el mapa de preview en tiempo real
function actualizarPreviewMapa() {
    if (!previewMap || !previewMarker) return;
    
    const lat = parseFloat(document.getElementById('latitud').value);
    const lng = parseFloat(document.getElementById('longitud').value);
    
    if (!isNaN(lat) && !isNaN(lng)) {
        const position = { lat, lng };
        previewMap.setCenter(position);
        previewMarker.setPosition(position);
        actualizarCoordenadasPreview();
    }
}

// Función para actualizar el texto de coordenadas en el preview
function actualizarCoordenadasPreview() {
    const lat = document.getElementById('latitud').value;
    const lng = document.getElementById('longitud').value;
    const coordenadasSpan = document.getElementById('coordenadas-preview');
    
    if (lat && lng) {
        coordenadasSpan.textContent = `${lat}, ${lng}`;
    } else {
        coordenadasSpan.textContent = '-';
    }
}

// Función para abrir modal de nuevo almacén
function abrirModalNuevoAlmacen() {
    const modalTitulo = document.getElementById('modal-titulo');
    const form = document.getElementById('form-almacen');
    
    if (!modalTitulo || !form) return;
    
    modalTitulo.textContent = 'Nuevo almacén';
    document.getElementById('almacen_id').value = '';
    document.getElementById('nombre').value = '';
    document.getElementById('tipo_almacen').value = '';
    document.getElementById('direccion').value = '';
    document.getElementById('capacidad').value = '';
    document.getElementById('latitud').value = '';
    document.getElementById('longitud').value = '';
    
    form.classList.remove('was-validated');
    
    $('#modal-almacen').modal('show');
    
    // Inicializar mapa de preview después de que el modal esté visible
    setTimeout(() => {
        if (previewMap) {
            previewMap = null;
        }
        initPreviewMap();
    }, 500);
}

// Función para editar almacén
async function editarAlmacen(id) {
    try {
        const response = await fetch(`/main/almacen/obtener_almacen/${id}`);
        if (!response.ok) {
            throw new Error('Error al obtener el almacén');
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener el almacén');
        }
        
        const almacen = data.almacen;
        
        document.getElementById('modal-titulo').textContent = 'Editar almacén';
        document.getElementById('almacen_id').value = almacen.almacen_id;
        document.getElementById('nombre').value = almacen.nombre || '';
        document.getElementById('tipo_almacen').value = almacen.tipo_almacen || '';
        document.getElementById('direccion').value = almacen.direccion || '';
        document.getElementById('capacidad').value = almacen.capacidad || '';
        document.getElementById('latitud').value = almacen.latitud || '';
        document.getElementById('longitud').value = almacen.longitud || '';
        
        $('#modal-almacen').modal('show');
        
        // Inicializar mapa de preview después de que el modal esté visible
        setTimeout(() => {
            if (previewMap) {
                previewMap = null;
            }
            initPreviewMap();
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        mostrarError('No se pudo cargar el almacén para editar');
    }
}

// Función para validar formulario
function validarFormulario() {
    const form = document.getElementById('form-almacen');
    if (!form) return false;
    
    const nombre = document.getElementById('nombre').value.trim();
    const tipo = document.getElementById('tipo_almacen').value;
    const direccion = document.getElementById('direccion').value.trim();
    const capacidad = document.getElementById('capacidad').value.trim();
    const latitud = document.getElementById('latitud').value.trim();
    const longitud = document.getElementById('longitud').value.trim();
    
    if (!nombre) {
        mostrarError('Por favor ingrese el nombre del almacén');
        return false;
    }
    
    if (!tipo) {
        mostrarError('Por favor seleccione el tipo de almacén');
        return false;
    }
    
    if (!direccion) {
        mostrarError('Por favor ingrese la dirección');
        return false;
    }
    
    if (!capacidad) {
        mostrarError('Por favor ingrese la capacidad');
        return false;
    }
    
    if (isNaN(capacidad) || parseFloat(capacidad) <= 0) {
        mostrarError('La capacidad debe ser un número positivo');
        return false;
    }
    
    if (!latitud) {
        mostrarError('Por favor ingrese la latitud');
        return false;
    }
    
    if (!longitud) {
        mostrarError('Por favor ingrese la longitud');
        return false;
    }
    
    if (isNaN(latitud) || latitud < -90 || latitud > 90) {
        mostrarError('La latitud debe ser un número válido entre -90 y 90');
        return false;
    }
    
    if (isNaN(longitud) || longitud < -180 || longitud > 180) {
        mostrarError('La longitud debe ser un número válido entre -180 y 180');
        return false;
    }
    
    return true;
}

// Función para guardar almacén
async function guardarAlmacen() {
    if (!validarFormulario()) {
        const form = document.getElementById('form-almacen');
        if (form) {
            form.classList.add('was-validated');
        }
        return;
    }
    
    const id = document.getElementById('almacen_id').value;
    
    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        tipo_almacen: document.getElementById('tipo_almacen').value,
        direccion: document.getElementById('direccion').value.trim(),
        capacidad: parseFloat(document.getElementById('capacidad').value),
        latitud: parseFloat(document.getElementById('latitud').value),
        longitud: parseFloat(document.getElementById('longitud').value)
    };
    
    const url = id ? `/main/almacen/actualizar_almacen/${id}` : '/main/almacen/registrar';
    const method = id ? 'PUT' : 'POST';
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            mostrarExito(result.mensaje || 'Almacén guardado exitosamente');
            $('#modal-almacen').modal('hide');
            cargarAlmacenes();
        } else {
            throw new Error(result.error || 'Error al guardar el almacén');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError(error.message);
    }
}

// Función para cambiar estado del almacén
async function cambiarEstadoAlmacen(almacen) {
    let titulo, texto, nuevoEstado;
    
    if (almacen.estado === 'ACTIVO') {
        titulo = 'Dar de baja almacén';
        texto = `¿Está seguro que desea dar de baja al almacén "${almacen.nombre}"?`;
        nuevoEstado = 'INACTIVO';
    } else {
        titulo = 'Activar almacén';
        texto = `¿Está seguro que desea activar al almacén "${almacen.nombre}"?`;
        nuevoEstado = 'ACTIVO';
    }
    
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
                const response = await fetch(`/main/almacen/cambiar_estado/${almacen.almacen_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ estado: nuevoEstado })
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    mostrarExito(data.mensaje || 'Estado cambiado exitosamente');
                    cargarAlmacenes();
                } else {
                    throw new Error(data.error || 'Error al cambiar el estado del almacén');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarError('No se pudo cambiar el estado del almacén: ' + error.message);
            }
        }
    });
}

// Función para eliminar almacén
async function eliminarAlmacen(id) {
    const almacen = almacenesData.find(a => a.almacen_id == id);
    if (!almacen) return;
    
    Swal.fire({
        title: 'Eliminar almacén',
        html: `¿Está seguro que desea eliminar permanentemente el almacén "<strong>${almacen.nombre}</strong>"?<br><br><span style="color: #ff6b6b;">Esta acción no se puede deshacer.</span>`,
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
                const response = await fetch(`/main/almacen/eliminar_almacen/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: data.mensaje,
                        background: '#152a3a',
                        color: '#e0f2fe',
                        confirmButtonColor: '#40e0d0'
                    });
                    cargarAlmacenes();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'No se puede eliminar',
                        text: data.error,
                        background: '#152a3a',
                        color: '#e0f2fe',
                        confirmButtonColor: '#40e0d0'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo conectar con el servidor',
                    background: '#152a3a',
                    color: '#e0f2fe',
                    confirmButtonColor: '#40e0d0'
                });
            }
        }
    });
}

// Función para mostrar mensaje de éxito
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

// Función para mostrar mensaje de error
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

// Callback para cuando Google Maps está listo
window.initMapCallback = function() {
    mapInitialized = false;
    if (document.getElementById('vista-mapa').classList.contains('active')) {
        initMap();
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos iniciales
    cargarAlmacenes();
    
    // Pestañas de navegación
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            cambiarVista(this.dataset.view);
        });
    });
    
    // Botón nuevo almacén
    const btnNuevoAlmacen = document.getElementById('btn-nuevo-almacen');
    if (btnNuevoAlmacen) {
        btnNuevoAlmacen.addEventListener('click', abrirModalNuevoAlmacen);
    }
    
    // Botón guardar almacén
    const btnGuardarAlmacen = document.getElementById('btn-guardar-almacen');
    if (btnGuardarAlmacen) {
        btnGuardarAlmacen.addEventListener('click', guardarAlmacen);
    }
    
    // Botón refrescar mapa
    const btnRefreshMapa = document.getElementById('btn-refresh-mapa');
    if (btnRefreshMapa) {
        btnRefreshMapa.addEventListener('click', function() {
            actualizarMarcadoresMapa();
            mostrarExito('Mapa actualizado');
        });
    }
    
    // Búsqueda con debounce
    const searchInput = document.getElementById('search-almacenes');
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
            renderizarTabla(filteredAlmacenes);
        });
    }
    
    // Eventos en tiempo real para el mapa de preview
    const latitudInput = document.getElementById('latitud');
    const longitudInput = document.getElementById('longitud');
    
    if (latitudInput) {
        latitudInput.addEventListener('input', function() {
            actualizarPreviewMapa();
            actualizarCoordenadasPreview();
        });
    }
    
    if (longitudInput) {
        longitudInput.addEventListener('input', function() {
            actualizarPreviewMapa();
            actualizarCoordenadasPreview();
        });
    }
    
    // Limpiar modal al cerrar
    $('#modal-almacen').on('hidden.bs.modal', function() {
        const form = document.getElementById('form-almacen');
        if (form) {
            form.classList.remove('was-validated');
        }
        
        if (previewMap) {
            previewMap = null;
            previewMarker = null;
        }
    });
    
    // Permitir Enter en formulario
    const formAlmacen = document.getElementById('form-almacen');
    if (formAlmacen) {
        formAlmacen.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                guardarAlmacen();
            }
        });
    }
});