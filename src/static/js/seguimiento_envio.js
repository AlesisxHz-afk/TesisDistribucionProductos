// Variables globales
let map;
let directionsService;
let directionsRenderer;
let markerAlmacen;
let markerConductor;
let infoWindow;
let updateInterval;
let currentNroEnvio = null;
let currentEnvioData = null;

// Coordenadas por defecto (Lima, Perú)
const DEFAULT_LAT = -12.046374;
const DEFAULT_LNG = -77.042793;

// Inicialización del mapa de Google
function initMap() {
    console.log('Inicializando Google Maps...');
    
    // Verificar que la API de Google Maps esté cargada
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
        console.error('Google Maps no se cargó correctamente');
        mostrarError('Error al cargar Google Maps. Verifica tu conexión a internet.');
        return;
    }
    
    // Configuración del mapa
    const mapOptions = {
        center: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        fullscreenControl: true,
        streetViewControl: true,
        zoomControl: false
    };
    
    // Crear el mapa
    const mapElement = document.getElementById('google-map');
    if (!mapElement) {
        console.error('Elemento del mapa no encontrado');
        return;
    }
    
    map = new google.maps.Map(mapElement, mapOptions);
    
    // Inicializar servicios de direcciones
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#40e0d0',
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    
    // Inicializar ventana de información
    infoWindow = new google.maps.InfoWindow();
    
    console.log('Google Maps inicializado correctamente');
    
    // Configurar eventos de los botones de control
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });
    
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });
    
    document.getElementById('btn-center-route').addEventListener('click', centerRoute);
    
    // Buscar al presionar Enter
    const searchInput = document.getElementById('search-nro-envio');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                buscarEnvio();
            }
        });
    }
    
    // Botón buscar
    const btnBuscar = document.getElementById('btn-buscar-envio');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarEnvio);
    }
    
    // Botón cerrar ticket
    const btnCloseTicket = document.getElementById('btn-close-ticket');
    if (btnCloseTicket) {
        btnCloseTicket.addEventListener('click', function() {
            cerrarTicket();
            detenerActualizacion();
            document.getElementById('no-busqueda').style.display = 'block';
        });
    }
}

// Función para detener la actualización automática
function detenerActualizacion() {
    if (updateInterval) {
        clearInterval(updateInterval);
        updateInterval = null;
        console.log('Actualización automática detenida');
    }
}

// Función para iniciar la actualización automática cada 10 segundos
function iniciarActualizacion(nroEnvio) {
    // Detener cualquier intervalo anterior
    detenerActualizacion();
    
    if (!nroEnvio) return;
    
    currentNroEnvio = nroEnvio;
    
    // Iniciar nuevo intervalo (10 segundos = 10000 milisegundos)
    updateInterval = setInterval(() => {
        console.log('Actualizando ubicación del conductor...');
        actualizarUbicacionConductor(currentNroEnvio);
    }, 10000);
    
    console.log('Actualización automática iniciada cada 10 segundos');
}

// Función para actualizar solo la ubicación del conductor
async function actualizarUbicacionConductor(nroEnvio) {
    if (!nroEnvio) return;
    
    try {
        const url = `/main/distribucion_almacen_producto/obtener_envio_por_nro/${encodeURIComponent(nroEnvio)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Envío no encontrado durante actualización');
                detenerActualizacion();
                return;
            }
            throw new Error(`Error al actualizar (${response.status})`);
        }
        
        const data = await response.json();
        
        if (data.success && data.envio) {
            const envio = data.envio;
            
            // Actualizar solo si cambió la ubicación del conductor
            if (envio.conductor_ubicacion_latitud && envio.conductor_ubicacion_longitud) {
                const nuevaLat = parseFloat(envio.conductor_ubicacion_latitud);
                const nuevaLng = parseFloat(envio.conductor_ubicacion_longitud);
                
                // Obtener ubicación actual del marcador
                if (markerConductor) {
                    const posActual = markerConductor.getPosition();
                    const latActual = posActual.lat();
                    const lngActual = posActual.lng();
                    
                    // Solo actualizar si la ubicación cambió (diferencia significativa)
                    const distancia = calcularDistancia(latActual, lngActual, nuevaLat, nuevaLng);
                    
                    if (distancia > 0.01) { // Si se movió más de 10 metros aprox
                        console.log('Ubicación del conductor actualizada:', { 
                            nuevaLat, 
                            nuevaLng, 
                            distancia: distancia.toFixed(3) + 'km' 
                        });
                        
                        // Actualizar posición del marcador
                        markerConductor.setPosition({ lat: nuevaLat, lng: nuevaLng });
                        
                        // Actualizar la ruta con la API de Google Maps
                        actualizarRutaConAPI(envio);
                        
                        // Animar el marcador para indicar movimiento
                        markerConductor.setAnimation(google.maps.Animation.BOUNCE);
                        setTimeout(() => {
                            markerConductor.setAnimation(null);
                        }, 700);
                        
                        // Actualizar también la información del ticket
                        actualizarTicketUbicacion(envio);
                        
                        // Centrar el mapa para mostrar el nuevo recorrido
                        setTimeout(() => {
                            centerRoute();
                        }, 500);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error en actualización automática:', error);
    }
}

// Función para actualizar la ruta usando la API de Google Maps
function actualizarRutaConAPI(envio) {
    try {
        if (!envio.almacen_latitud || !envio.almacen_longitud) {
            return;
        }
        
        const almacenLat = parseFloat(envio.almacen_latitud);
        const almacenLng = parseFloat(envio.almacen_longitud);
        
        let conductorLat, conductorLng;
        
        if (envio.conductor_ubicacion_latitud && envio.conductor_ubicacion_longitud) {
            conductorLat = parseFloat(envio.conductor_ubicacion_latitud);
            conductorLng = parseFloat(envio.conductor_ubicacion_longitud);
        } else {
            return;
        }
        
        console.log('Actualizando ruta con API de Google Maps');
        
        const request = {
            origin: { lat: conductorLat, lng: conductorLng },
            destination: { lat: almacenLat, lng: almacenLng },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };
        
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                // Actualizar el directionsRenderer con la nueva ruta
                directionsRenderer.setDirections(result);
                
                // Actualizar información de la ruta
                const route = result.routes[0].legs[0];
                document.getElementById('route-distance').textContent = route.distance.text;
                document.getElementById('route-time').textContent = route.duration.text;
                document.getElementById('route-info').style.display = 'block';
                
                console.log('Ruta actualizada con éxito:', route.distance.text, route.duration.text);
            } else {
                console.warn('No se pudo actualizar la ruta:', status);
            }
        });
        
    } catch (error) {
        console.error('Error al actualizar ruta con API:', error);
    }
}

// Función para actualizar la ubicación en el ticket
function actualizarTicketUbicacion(envio) {
    const ticketBody = document.getElementById('ticket-body');
    if (!ticketBody) return;
    
    // Actualizar la sección de ubicación
    const ubicacionElement = ticketBody.querySelector('.ubicacion-conductor');
    if (ubicacionElement) {
        ubicacionElement.innerHTML = `
            <span class="ticket-item-label">Ubicación conductor:</span>
            <span class="ticket-item-value">${parseFloat(envio.conductor_ubicacion_latitud).toFixed(6)}, ${parseFloat(envio.conductor_ubicacion_longitud).toFixed(6)}</span>
        `;
    }
    
    // Actualizar timestamp
    const actualizacionElement = ticketBody.querySelector('.actualizacion-timestamp');
    if (actualizacionElement) {
        actualizacionElement.innerHTML = `
            <span class="ticket-item-label">Última actualización:</span>
            <span class="ticket-item-value">${new Date().toLocaleTimeString()}</span>
        `;
    }
}

// Función para buscar envío por número
async function buscarEnvio() {
    const nroEnvio = document.getElementById('search-nro-envio').value.trim();
    
    if (!nroEnvio) {
        mostrarError('Por favor ingrese un número de envío');
        return;
    }
    
    mostrarLoading(true);
    limpiarMapa();
    cerrarTicket();
    
    try {
        const url = `/main/distribucion_almacen_producto/obtener_envio_por_nro/${encodeURIComponent(nroEnvio)}`;
        console.log('Buscando envío en:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('No se encontró ningún envío con ese número');
            } else {
                throw new Error(`Error al buscar el envío (${response.status})`);
            }
        }
        
        const data = await response.json();
        console.log('Respuesta de búsqueda:', data);
        
        if (data.success && data.envio) {
            const envio = data.envio;
            currentEnvioData = envio;
            
            console.log('Coordenadas del almacén:', envio.almacen_latitud, envio.almacen_longitud);
            console.log('Coordenadas del conductor:', envio.conductor_ubicacion_latitud, envio.conductor_ubicacion_longitud);
            
            // Mostrar ticket y ruta
            mostrarTicketEnvio(envio);
            mostrarRutaEnMapa(envio);
            ocultarInfoBusqueda();
            ocultarMensajeNoBusqueda();
            
            // Iniciar actualización automática
            iniciarActualizacion(nroEnvio);
        } else {
            mostrarError(data.message || 'No se encontró ningún envío con ese número');
            mostrarInfoBusqueda('Envío no encontrado', 'Verifique el número e intente nuevamente');
            document.getElementById('no-busqueda').style.display = 'block';
            detenerActualizacion();
        }
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarError(error.message || 'Error al buscar el envío');
        mostrarInfoBusqueda('Error en la búsqueda', error.message || 'Ocurrió un problema al consultar el envío');
        document.getElementById('no-busqueda').style.display = 'block';
        detenerActualizacion();
    } finally {
        mostrarLoading(false);
    }
}

// Función para mostrar la ruta en el mapa
function mostrarRutaEnMapa(envio) {
    try {
        // Validar coordenadas del almacén
        if (!envio.almacen_latitud || !envio.almacen_longitud) {
            console.warn('El almacén no tiene coordenadas registradas');
            mostrarInfoMapa('El almacén no tiene coordenadas registradas');
            return false;
        }
        
        const almacenLat = parseFloat(envio.almacen_latitud);
        const almacenLng = parseFloat(envio.almacen_longitud);
        
        if (isNaN(almacenLat) || isNaN(almacenLng)) {
            console.warn('Coordenadas de almacén inválidas');
            return false;
        }
        
        // Obtener coordenadas del conductor
        let conductorLat, conductorLng;
        if (envio.conductor_ubicacion_latitud && envio.conductor_ubicacion_longitud) {
            conductorLat = parseFloat(envio.conductor_ubicacion_latitud);
            conductorLng = parseFloat(envio.conductor_ubicacion_longitud);
        } else {
            // Si no hay ubicación, usar coordenadas por defecto
            conductorLat = DEFAULT_LAT;
            conductorLng = DEFAULT_LNG;
        }
        
        if (isNaN(conductorLat) || isNaN(conductorLng)) {
            console.warn('Coordenadas de conductor inválidas');
            return false;
        }
        
        // Limpiar mapa
        limpiarMapa();
        
        // Crear marcadores personalizados
        crearMarcadores(envio, almacenLat, almacenLng, conductorLat, conductorLng);
        
        // Calcular y mostrar la ruta con la API de Google Maps
        const request = {
            origin: { lat: conductorLat, lng: conductorLng },
            destination: { lat: almacenLat, lng: almacenLng },
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        };
        
        directionsService.route(request, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
                
                // Mostrar información de la ruta
                const route = result.routes[0].legs[0];
                document.getElementById('route-info').style.display = 'block';
                document.getElementById('route-distance').textContent = route.distance.text;
                document.getElementById('route-time').textContent = route.duration.text;
                
                console.log('Ruta inicial calculada:', route.distance.text, route.duration.text);
                
                // Ajustar zoom para mostrar ambos puntos
                const bounds = new google.maps.LatLngBounds();
                bounds.extend({ lat: almacenLat, lng: almacenLng });
                bounds.extend({ lat: conductorLat, lng: conductorLng });
                map.fitBounds(bounds, 50);
            } else {
                console.error('Error al calcular ruta inicial:', status);
                document.getElementById('route-info').style.display = 'none';
            }
        });
        
        return true;
        
    } catch (error) {
        console.error('Error al mostrar ruta:', error);
        mostrarError('No se pudo trazar la ruta en el mapa');
        return false;
    }
}

// Función para crear marcadores personalizados
function crearMarcadores(envio, almacenLat, almacenLng, conductorLat, conductorLng) {
    try {
        // Marcador del almacén
        markerAlmacen = new google.maps.Marker({
            position: { lat: almacenLat, lng: almacenLng },
            map: map,
            title: envio.almacen_nombre || 'Almacén',
            icon: {
                path: 'M12 2L2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7l-10-5zm0 2.5L19.5 8v9h-15V8L12 4.5zM8 11h8v6H8v-6z',
                fillColor: '#ffc107',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 24)
            }
        });
        
        // Marcador del conductor
        markerConductor = new google.maps.Marker({
            position: { lat: conductorLat, lng: conductorLng },
            map: map,
            title: envio.conductor_nombre || 'Conductor',
            icon: {
                path: 'M18 18.5a1.5 1.5 0 0 1-1.5-1.5a1.5 1.5 0 0 1 1.5-1.5a1.5 1.5 0 0 1 1.5 1.5a1.5 1.5 0 0 1-1.5 1.5m1.5-9l1.96 2.5H17V9.5M6 18.5a1.5 1.5 0 0 1-1.5-1.5A1.5 1.5 0 0 1 6 15.5A1.5 1.5 0 0 1 7.5 17A1.5 1.5 0 0 1 6 18.5M20 8h-3V4H3c-1.11 0-2 .89-2 2v11h2a3 3 0 0 0 3 3a3 3 0 0 0 3-3h6a3 3 0 0 0 3 3a3 3 0 0 0 3-3h2v-5l-3-4z',
                fillColor: '#40e0d0',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 1.5,
                anchor: new google.maps.Point(12, 24)
            }
        });
        
        // Info windows
        markerAlmacen.addListener('click', () => {
            infoWindow.setContent(`
                <div style="padding: 10px; max-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #1e3a5a; font-size: 14px;">
                        <i class="fas fa-warehouse" style="color: #ffc107; margin-right: 5px;"></i>
                        ${envio.almacen_nombre || 'Almacén'}
                    </h4>
                    <p style="margin: 4px 0; font-size: 12px; color: #555;">
                        ${envio.almacen_direccion || 'Dirección no disponible'}
                    </p>
                </div>
            `);
            infoWindow.open(map, markerAlmacen);
        });
        
        markerConductor.addListener('click', () => {
            infoWindow.setContent(`
                <div style="padding: 10px; max-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #1e3a5a; font-size: 14px;">
                        <i class="fas fa-user-tie" style="color: #40e0d0; margin-right: 5px;"></i>
                        ${envio.conductor_nombre || 'Conductor'}
                    </h4>
                    <p style="margin: 4px 0; font-size: 12px; color: #555;">
                        <strong>Vehículo:</strong> ${envio.vehiculo_placa || 'N/A'}
                    </p>
                    <p style="margin: 4px 0; font-size: 12px; color: #555;">
                        <strong>Tel:</strong> ${envio.conductor_telefono || 'N/A'}
                    </p>
                </div>
            `);
            infoWindow.open(map, markerConductor);
        });
        
        console.log('Marcadores creados correctamente');
        
    } catch (error) {
        console.error('Error al crear marcadores:', error);
    }
}

// Función para calcular distancia entre dos puntos
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Función para mostrar ticket de envío
function mostrarTicketEnvio(envio) {
    const ticket = document.getElementById('envio-ticket');
    const body = document.getElementById('ticket-body');
    
    if (!ticket || !body) return;
    
    const estadoClass = getEstadoClass(envio.estado_envio);
    const estadoTexto = getEstadoTexto(envio.estado_envio);
    
    const tieneCoordenadasConductor = envio.conductor_ubicacion_latitud && envio.conductor_ubicacion_longitud;
    
    body.innerHTML = `
        <div class="ticket-seccion">
            <div class="ticket-seccion-titulo">
                <i class="fas fa-info-circle"></i>
                Información del envío
            </div>
            <div class="ticket-item">
                <span class="ticket-item-label">N° de envío:</span>
                <span class="ticket-item-value highlight">${envio.nro_envio || 'N/A'}</span>
            </div>
            <div class="ticket-item">
                <span class="ticket-item-label">Estado:</span>
                <span class="ticket-estado ${estadoClass}">${estadoTexto}</span>
            </div>
            <div class="ticket-item">
                <span class="ticket-item-label">Fecha envío:</span>
                <span class="ticket-item-value">${formatearFecha(envio.fecha_envio)}</span>
            </div>
        </div>
        
        <div class="ticket-seccion">
            <div class="ticket-seccion-titulo">
                <i class="fas fa-warehouse"></i>
                Almacén de origen
            </div>
            <div class="ticket-icono">
                <i class="fas fa-warehouse"></i>
                <div class="ticket-icono-info">
                    <div class="ticket-icono-nombre">${envio.almacen_nombre || 'N/A'}</div>
                </div>
            </div>
            <div class="ticket-item">
                <span class="ticket-item-label">Dirección:</span>
                <span class="ticket-item-value">${envio.almacen_direccion || 'N/A'}</span>
            </div>
        </div>
        
        <div class="ticket-seccion">
            <div class="ticket-seccion-titulo">
                <i class="fas fa-box"></i>
                Producto
            </div>
            <div class="ticket-icono">
                <i class="fas fa-box"></i>
                <div class="ticket-icono-info">
                    <div class="ticket-icono-nombre">${envio.producto_nombre || 'N/A'}</div>
                </div>
            </div>
            <div class="ticket-item">
                <span class="ticket-item-label">Demanda:</span>
                <span class="ticket-item-value highlight">${envio.demanda || 0} kg</span>
            </div>
        </div>
        
        <div class="ticket-seccion">
            <div class="ticket-seccion-titulo">
                <i class="fas fa-truck"></i>
                Vehículo y conductor
            </div>
            <div class="ticket-icono">
                <i class="fas fa-user-tie"></i>
                <div class="ticket-icono-info">
                    <div class="ticket-icono-nombre">${envio.conductor_nombre || 'N/A'}</div>
                </div>
            </div>
            <div class="ticket-icono">
                <i class="fas fa-truck"></i>
                <div class="ticket-icono-info">
                    <div class="ticket-icono-nombre">${envio.vehiculo_placa || 'N/A'}</div>
                </div>
            </div>
            <div class="ticket-item ubicacion-conductor">
                <span class="ticket-item-label">Ubicación conductor:</span>
                <span class="ticket-item-value">${tieneCoordenadasConductor ? parseFloat(envio.conductor_ubicacion_latitud).toFixed(6) + ', ' + parseFloat(envio.conductor_ubicacion_longitud).toFixed(6) : 'No registrada'}</span>
            </div>
            <div class="ticket-item actualizacion-timestamp">
                <span class="ticket-item-label">Última actualización:</span>
                <span class="ticket-item-value">${new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    `;
    
    ticket.style.display = 'flex';
}

// Función para mostrar información en el mapa
function mostrarInfoMapa(mensaje) {
    const infoMarker = new google.maps.Marker({
        position: map.getCenter(),
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#ffc107',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 10
        }
    });
    
    infoWindow.setContent(`
        <div style="padding: 10px; max-width: 200px;">
            <p style="margin: 0; font-size: 12px; color: #555;">
                ${mensaje}
            </p>
        </div>
    `);
    infoWindow.open(map, infoMarker);
    
    setTimeout(() => {
        infoMarker.setMap(null);
    }, 5000);
}

// Función para limpiar el mapa
function limpiarMapa() {
    if (directionsRenderer) {
        directionsRenderer.setDirections({ routes: [] });
    }
    
    if (markerAlmacen) {
        markerAlmacen.setMap(null);
        markerAlmacen = null;
    }
    
    if (markerConductor) {
        markerConductor.setMap(null);
        markerConductor = null;
    }
    
    document.getElementById('route-info').style.display = 'none';
}

// Función para centrar la ruta en el mapa
function centerRoute() {
    if (markerAlmacen && markerConductor) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(markerAlmacen.getPosition());
        bounds.extend(markerConductor.getPosition());
        map.fitBounds(bounds, 50);
    }
}

// Función para cerrar ticket
function cerrarTicket() {
    const ticket = document.getElementById('envio-ticket');
    if (ticket) {
        ticket.style.display = 'none';
    }
}

// Funciones auxiliares
function mostrarLoading(mostrar) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = mostrar ? 'flex' : 'none';
    }
}

function mostrarInfoBusqueda(titulo, mensaje) {
    const infoDiv = document.getElementById('busqueda-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <div class="info-message">
                <i class="fas fa-info-circle"></i>
                <h4>${titulo}</h4>
                <span>${mensaje}</span>
            </div>
        `;
        infoDiv.style.display = 'flex';
    }
}

function ocultarInfoBusqueda() {
    const infoDiv = document.getElementById('busqueda-info');
    if (infoDiv) {
        infoDiv.style.display = 'none';
    }
}

function ocultarMensajeNoBusqueda() {
    const noBusqueda = document.getElementById('no-busqueda');
    if (noBusqueda) {
        noBusqueda.style.display = 'none';
    }
}

function getEstadoClass(estado) {
    switch(estado) {
        case 'PENDIENTE': return 'estado-pendiente';
        case 'EN_RUTA': return 'estado-en-ruta';
        case 'ENTREGADO': return 'estado-entregado';
        case 'CANCELADO': return 'estado-cancelado';
        default: return 'estado-pendiente';
    }
}

function getEstadoTexto(estado) {
    switch(estado) {
        case 'PENDIENTE': return 'Pendiente';
        case 'EN_RUTA': return 'En ruta';
        case 'ENTREGADO': return 'Entregado';
        case 'CANCELADO': return 'Cancelado';
        default: return estado || 'Desconocido';
    }
}

function formatearFecha(fechaStr) {
    if (!fechaStr) return 'N/A';
    try {
        const fecha = new Date(fechaStr);
        return fecha.toLocaleDateString('es-PE');
    } catch {
        return fechaStr;
    }
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando...');
});