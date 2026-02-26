// ================================================================
//  PLANIFICAR RUTAS - JS
//  - Google Maps Directions API (rutas reales)
//  - Hora de envío editable por ruta
//  - Link de Google Maps por cada ruta
// ================================================================

var map = null;
var directionsRenderers = [];   // Un renderer por ruta
var rutasPlanificadas = [];
var currentFecha = '';
var selectedRutaIndex = null;

// Coordenadas del centro de distribución (Lima)
var ORIGEN_LAT = -12.0464;
var ORIGEN_LON = -77.0428;
var ORIGEN_NOMBRE = 'Centro de Distribución, Lima, Perú';

// ----------------------------------------------------------------
// INICIALIZACIÓN
// ----------------------------------------------------------------
window.initMapCallback = function () {
    map = new google.maps.Map(document.getElementById('mapa-rutas'), {
        center: { lat: ORIGEN_LAT, lng: ORIGEN_LON },
        zoom: 7,
        mapTypeId: 'roadmap',
        styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#202c3a' }] },
            { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#40e0d0' }] },
            { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ color: '#1e3a5a' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a1e2f' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c4a6a' }] },
            { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#a5d8ff' }] },
            { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#40e0d0' }] }
        ]
    });
    console.log('Mapa inicializado con Directions API');
};

$(document).ready(function () {
    currentFecha = $('#fecha-envio').val();

    cargarEnviosPendientes();

    $('#btn-buscar').on('click', buscarEnvios);
    $('#btn-planificar').on('click', planificarRutas);
    $('#btn-guardar').on('click', guardarPlanificacion);
    $('#fecha-envio').on('change', function () { currentFecha = $(this).val(); });

    $('#btn-cerrar-modal, #btn-cerrar-modal-footer').on('click', cerrarModal);
    $('#modal-overlay').on('click', function (e) {
        if ($(e.target).is('#modal-overlay')) cerrarModal();
    });
});

// ----------------------------------------------------------------
// MAPA - DIRECTIONS API
// ----------------------------------------------------------------

function limpiarMapa() {
    directionsRenderers.forEach(function (r) { r.setMap(null); });
    directionsRenderers = [];
}

var COLORES_RUTAS = [
    '#40e0d0', '#fdd54f', '#f87171', '#a78bfa',
    '#60a5fa', '#fb923c', '#34d399', '#e879f9'
];

/**
 * Traza una ruta real usando DirectionsService para un destino.
 * @param {number} destLat
 * @param {number} destLon
 * @param {string} color  - color de la polilínea
 * @param {number} rutaIdx - índice de la ruta (para el panel)
 */
function trazarRutaReal(destLat, destLon, color, rutaIdx) {
    if (!map) return;

    var lat = parseFloat(destLat);
    var lon = parseFloat(destLon);

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) {
        console.warn('Coordenadas inválidas para ruta ' + rutaIdx);
        return;
    }

    var directionsService = new google.maps.DirectionsService();

    var renderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: color,
            strokeOpacity: 0.85,
            strokeWeight: 4
        },
        markerOptions: {
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
            }
        }
    });

    directionsRenderers.push(renderer);

    var request = {
        origin: new google.maps.LatLng(ORIGEN_LAT, ORIGEN_LON),
        destination: new google.maps.LatLng(lat, lon),
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, function (result, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            renderer.setDirections(result);

            // Actualizar tiempo estimado real en el panel
            var leg = result.routes[0].legs[0];
            if (leg && rutasPlanificadas[rutaIdx]) {
                var duracionSeg = leg.duration.value;
                var distanciaKm = (leg.distance.value / 1000).toFixed(1);
                var duracionHoras = (duracionSeg / 3600).toFixed(2);

                rutasPlanificadas[rutaIdx].distancia_km = parseFloat(distanciaKm);
                rutasPlanificadas[rutaIdx].tiempo_estimado_horas = parseFloat(duracionHoras);

                // Recalcular hora llegada según la hora_envio actual del item
                recalcularHoraLlegada(rutaIdx);
            }
        } else {
            console.warn('DirectionsService falló para ruta ' + rutaIdx + ': ' + status);
            // Fallback: nada (no trazar línea recta)
        }
    });
}

function actualizarMapaConRutas(rutas) {
    limpiarMapa();

    if (!map || !rutas || rutas.length === 0) return;

    rutas.forEach(function (ruta, index) {
        var color = COLORES_RUTAS[index % COLORES_RUTAS.length];
        trazarRutaReal(ruta.lat, ruta.lon, color, index);
    });
}

// ----------------------------------------------------------------
// HORAS - EDICIÓN Y RECÁLCULO
// ----------------------------------------------------------------

/**
 * Cuando el usuario cambia la hora de envío de una ruta,
 * actualiza el modelo de datos y recalcula la hora de llegada.
 */
function onHoraEnvioChange(rutaIdx) {
    var inputId = '#hora-envio-' + rutaIdx;
    var nuevaHora = $(inputId).val();   // "HH:MM"

    if (!nuevaHora) return;

    rutasPlanificadas[rutaIdx].hora_envio = nuevaHora;
    recalcularHoraLlegada(rutaIdx);

    // Refrescar solo el span de llegada
    $('#hora-llegada-' + rutaIdx).text(rutasPlanificadas[rutaIdx].hora_llegada);
}

/**
 * Recalcula la hora_llegada a partir de hora_envio + tiempo_estimado_horas.
 */
function recalcularHoraLlegada(rutaIdx) {
    var ruta = rutasPlanificadas[rutaIdx];
    if (!ruta) return;

    var partes = ruta.hora_envio.split(':');
    var h = parseInt(partes[0]) || 0;
    var m = parseInt(partes[1]) || 0;

    var totalMin = h * 60 + m + Math.round((ruta.tiempo_estimado_horas || 0) * 60);
    totalMin = Math.min(totalMin, 23 * 60 + 59);

    var hLlegada = Math.floor(totalMin / 60);
    var mLlegada = totalMin % 60;

    ruta.hora_llegada = pad2(hLlegada) + ':' + pad2(mLlegada);
}

function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
}

// ----------------------------------------------------------------
// CARGA DE ENVÍOS PENDIENTES
// ----------------------------------------------------------------

function cargarEnviosPendientes() {
    var fecha = $('#fecha-envio').val();
    if (!fecha) return;

    $.ajax({
        url: '/main/vehiculo/obtener_envios_pendientes',
        method: 'GET',
        data: { fecha: fecha },
        success: function (response) {
            if (response.success) {
                mostrarEnviosPendientes(response.data.envios, response.data.fecha);
            }
        },
        error: function () {
            console.error('Error al obtener envíos pendientes');
        }
    });
}

function mostrarEnviosPendientes(envios, fecha) {
    var container = $('#rutas-lista');

    if (!envios || envios.length === 0) {
        container.html(
            '<div class="no-results">' +
            '<i class="fas fa-box-open"></i>' +
            '<h4>No hay envíos pendientes</h4>' +
            '<p>No se encontraron envíos pendientes para <strong>' + fecha + '</strong>.</p>' +
            '</div>'
        );
        return;
    }

    var html = '';
    envios.forEach(function (e) {
        html +=
            '<div class="envio-pendiente-item">' +
            '<div class="ep-nombre"><i class="fas fa-box" style="color:#40e0d0;margin-right:6px;"></i>' + e.producto_nombre + '</div>' +
            '<div class="ep-detalle">' +
            '<span><i class="fas fa-warehouse"></i>' + e.almacen_nombre + '</span>' +
            '<span><i class="fas fa-layer-group"></i>Demanda: ' + e.demanda + '</span>' +
            '<span><i class="fas fa-thermometer-half"></i>' + e.temperatura_optima + '°C</span>' +
            '<span><i class="fas fa-tint"></i>' + e.humedad_optima + '%</span>' +
            '</div>' +
            '</div>';
    });

    container.html(html);
}

// ----------------------------------------------------------------
// BUSCAR (RECARGA)
// ----------------------------------------------------------------

function buscarEnvios() {
    currentFecha = $('#fecha-envio').val();
    if (!currentFecha) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona una fecha.' });
        return;
    }

    limpiarMapa();
    rutasPlanificadas = [];
    selectedRutaIndex = null;
    $('#btn-guardar').prop('disabled', true);
    $('#badge-rutas').text('0 rutas');

    cargarEnviosPendientes();
}

// ----------------------------------------------------------------
// PLANIFICAR RUTAS
// ----------------------------------------------------------------

function planificarRutas() {
    currentFecha = $('#fecha-envio').val();
    if (!currentFecha) {
        Swal.fire({ icon: 'warning', title: 'Atención', text: 'Selecciona una fecha.' });
        return;
    }

    Swal.fire({
        title: 'Planificando rutas...',
        text: 'Analizando envíos con modelo PKT',
        allowOutsideClick: false,
        didOpen: function () { Swal.showLoading(); }
    });

    $.ajax({
        url: '/main/vehiculo/planificar_rutas',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ fecha: currentFecha }),
        success: function (response) {
            Swal.close();

            if (response.success) {
                rutasPlanificadas = response.data.rutas;

                mostrarRutasPlanificadas(rutasPlanificadas);
                actualizarMapaConRutas(rutasPlanificadas);

                $('#badge-rutas').text(rutasPlanificadas.length + ' rutas');
                $('#btn-guardar').prop('disabled', false);

                Swal.fire({
                    icon: 'success',
                    title: 'Rutas planificadas',
                    text: rutasPlanificadas.length + ' rutas generadas exitosamente.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Sin resultados', text: response.error || response.message });
            }
        },
        error: function (xhr) {
            Swal.close();
            var msg = 'Error al conectar con el servidor';
            try { var r = JSON.parse(xhr.responseText); if (r.error) msg = r.error; } catch (e) {}
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        }
    });
}

// ----------------------------------------------------------------
// RENDERIZAR PANEL DE RUTAS
// ----------------------------------------------------------------

function mostrarRutasPlanificadas(rutas) {
    var container = $('#rutas-lista');

    if (!rutas || rutas.length === 0) {
        container.html(
            '<div class="no-results">' +
            '<i class="fas fa-route"></i>' +
            '<h4>Sin rutas planificadas</h4>' +
            '<p>No se pudieron planificar rutas para esta fecha.</p>' +
            '</div>'
        );
        return;
    }

    var html = '';

    rutas.forEach(function (ruta, index) {
        var riesgoClass = ruta.nivel_riesgo === 'BAJO' ? 'riesgo-bajo' :
                          ruta.nivel_riesgo === 'MEDIO' ? 'riesgo-medio' : 'riesgo-alto';
        var selClass = selectedRutaIndex === index ? ' seleccionado' : '';

        // Link de Google Maps para esta ruta
        var gmapsUrl = generarLinkGoogleMaps(ruta);

        html +=
            '<div class="ruta-item' + selClass + '" data-index="' + index + '" onclick="seleccionarRuta(' + index + ')">' +

            // Cabecera
            '<div class="ruta-header">' +
            '<h5><i class="fas fa-warehouse" style="color:#40e0d0;margin-right:6px;"></i>' + ruta.almacen_nombre + '</h5>' +
            '<span class="riesgo-badge ' + riesgoClass + '">' + ruta.nivel_riesgo + '</span>' +
            '</div>' +

            // Detalles básicos
            '<div class="ruta-detalles">' +
            '<div class="detalle-item"><i class="fas fa-box"></i><span>' + ruta.producto_nombre + '</span></div>' +
            '<div class="detalle-item"><i class="fas fa-road"></i><span>' + ruta.distancia_km + ' km</span></div>' +
            '<div class="detalle-item"><i class="fas fa-clock"></i><span>' + ruta.tiempo_estimado_horas + ' hrs</span></div>' +
            '<div class="detalle-item"><i class="fas fa-layer-group"></i><span>Dem: ' + ruta.demanda + '</span></div>' +
            '</div>' +

            // Vehículo / conductor
            '<div class="ruta-vehiculo-info">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
            '<i class="fas fa-truck" style="color:#40e0d0;"></i>' +
            '<span class="vehiculo-placa">' + ruta.vehiculo_asignado.placa + '</span>' +
            '<span style="color:#a5d8ff;font-size:11px;">' + (ruta.vehiculo_asignado.tipo_vehiculo || '') + '</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-user" style="color:#40e0d0;"></i>' +
            '<span style="color:#e0f2fe;font-size:12px;">' + ruta.vehiculo_asignado.conductor + '</span>' +
            '</div>' +
            '</div>' +

            // Hora de envío EDITABLE
            '<div class="hora-envio-row" onclick="event.stopPropagation();">' +
            '<label><i class="fas fa-hourglass-start" style="color:#40e0d0;margin-right:4px;"></i>Hora envío:</label>' +
            '<input type="time" ' +
            '       id="hora-envio-' + index + '" ' +
            '       class="hora-envio-input" ' +
            '       value="' + ruta.hora_envio + '" ' +
            '       onchange="onHoraEnvioChange(' + index + ')" ' +
            '       onclick="event.stopPropagation();">' +
            '<span style="color:#a5d8ff;font-size:11px;">→ llega: <strong id="hora-llegada-' + index + '" style="color:#fdd54f;">' + ruta.hora_llegada + '</strong></span>' +
            '</div>' +

            // Nro envío y gasto
            '<div class="ruta-footer">' +
            '<span class="nro-envio"><i class="fas fa-hashtag" style="margin-right:2px;"></i>' + ruta.nro_envio + '</span>' +
            '<span class="gasto-valor"><i class="fas fa-money-bill-wave" style="margin-right:3px;"></i>S/ ' + ruta.gasto_estimado.toFixed(2) + '</span>' +
            '</div>' +

            // Acciones
            '<div class="ruta-acciones">' +
            '<button class="btn btn-secondary" style="font-size:11px;padding:5px 10px;" onclick="event.stopPropagation();verDetalleRuta(' + index + ')">' +
            '<i class="fas fa-eye"></i> Detalles' +
            '</button>' +
            '<a class="btn-link-maps" href="' + gmapsUrl + '" target="_blank" rel="noopener" onclick="event.stopPropagation();">' +
            '<i class="fab fa-google" style="font-size:11px;"></i> Ver en Maps' +
            '</a>' +
            '</div>' +

            '</div>';
    });

    container.html(html);
}

// ----------------------------------------------------------------
// GENERAR LINK GOOGLE MAPS
// ----------------------------------------------------------------

function generarLinkGoogleMaps(ruta) {
    var lat = parseFloat(ruta.lat);
    var lon = parseFloat(ruta.lon);

    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) {
        return 'https://www.google.com/maps';
    }

    // Formato: https://www.google.com/maps/dir/origen/destino (modo conducción)
    var origen = ORIGEN_LAT + ',' + ORIGEN_LON;
    var destino = lat + ',' + lon;

    return 'https://www.google.com/maps/dir/' + encodeURIComponent(origen) + '/' + encodeURIComponent(destino) + '/@' + lat + ',' + lon + ',8z/data=!3m1!4b1!4m2!4m1!3e0';
}

// ----------------------------------------------------------------
// SELECCIONAR RUTA EN EL PANEL
// ----------------------------------------------------------------

function seleccionarRuta(index) {
    selectedRutaIndex = index;

    // Actualizar clase seleccionado sin re-renderizar todo
    $('.ruta-item').removeClass('seleccionado');
    $('.ruta-item[data-index="' + index + '"]').addClass('seleccionado');

    // Centrar mapa en el destino
    if (map && rutasPlanificadas[index]) {
        var ruta = rutasPlanificadas[index];
        var lat = parseFloat(ruta.lat);
        var lon = parseFloat(ruta.lon);
        if (!isNaN(lat) && !isNaN(lon) && !(lat === 0 && lon === 0)) {
            map.setCenter({ lat: lat, lng: lon });
            map.setZoom(11);
        }
    }
}

// ----------------------------------------------------------------
// MODAL DE DETALLES
// ----------------------------------------------------------------

function verDetalleRuta(index) {
    var ruta = rutasPlanificadas[index];
    if (!ruta) return;

    var riesgoClass = ruta.nivel_riesgo === 'BAJO' ? 'val-bajo' :
                      ruta.nivel_riesgo === 'MEDIO' ? 'val-medio' : 'val-alto';

    var gmapsUrl = generarLinkGoogleMaps(ruta);

    $('#detalle-ruta-titulo').text('Detalles — ' + ruta.almacen_nombre);

    var body =
        // Resumen rápido
        '<div class="modal-resumen-ruta">' +
        '<div class="modal-resumen-item"><div class="modal-resumen-label">Distancia</div><div class="modal-resumen-valor val-dist">' + ruta.distancia_km + ' km</div></div>' +
        '<div class="modal-resumen-item"><div class="modal-resumen-label">Tiempo Est.</div><div class="modal-resumen-valor val-tiempo">' + ruta.tiempo_estimado_horas + ' hrs</div></div>' +
        '<div class="modal-resumen-item"><div class="modal-resumen-label">Gasto Est.</div><div class="modal-resumen-valor val-gasto">S/ ' + ruta.gasto_estimado.toFixed(2) + '</div></div>' +
        '<div class="modal-resumen-item"><div class="modal-resumen-label">Nivel Riesgo</div><div class="modal-resumen-valor ' + riesgoClass + '">' + ruta.nivel_riesgo + '</div></div>' +
        '</div>' +

        // Link Google Maps
        '<div class="gmaps-link-box">' +
        '<span><i class="fas fa-map-marked-alt" style="color:#f4511e;margin-right:6px;"></i>Ver ruta completa en Google Maps</span>' +
        '<a class="btn-link-maps" href="' + gmapsUrl + '" target="_blank" rel="noopener">' +
        '<i class="fab fa-google"></i> Abrir en Maps' +
        '</a>' +
        '</div>' +

        // Tabla de detalles
        '<table class="tabla-detalle">' +
        '<tr><th colspan="2">Información del Envío</th></tr>' +
        '<tr><td class="td-label">N° Envío</td><td>' + ruta.nro_envio + '</td></tr>' +
        '<tr><td class="td-label">Almacén Destino</td><td>' + ruta.almacen_nombre + '</td></tr>' +
        '<tr><td class="td-label">Dirección</td><td>' + (ruta.almacen_direccion || 'No registrada') + '</td></tr>' +
        '<tr><td class="td-label">Producto</td><td>' + ruta.producto_nombre + '</td></tr>' +
        '<tr><td class="td-label">Tipo de Producto</td><td>' + (ruta.producto_tipo || 'N/A') + '</td></tr>' +
        '<tr><td class="td-label">Demanda</td><td>' + ruta.demanda + ' unidades</td></tr>' +
        '<tr><td class="td-label">Temperatura Óptima</td><td>' + ruta.temperatura_optima + ' °C</td></tr>' +
        '<tr><td class="td-label">Humedad Óptima</td><td>' + ruta.humedad_optima + ' %</td></tr>' +
        '<tr><th colspan="2">Vehículo y Conductor</th></tr>' +
        '<tr><td class="td-label">Placa</td><td>' + ruta.vehiculo_asignado.placa + '</td></tr>' +
        '<tr><td class="td-label">Tipo Vehículo</td><td>' + (ruta.vehiculo_asignado.tipo_vehiculo || 'N/A') + '</td></tr>' +
        '<tr><td class="td-label">Conductor</td><td>' + ruta.vehiculo_asignado.conductor + '</td></tr>' +
        '<tr><th colspan="2">Horario</th></tr>' +
        '<tr><td class="td-label">Hora de Envío</td><td>' + ruta.hora_envio + '</td></tr>' +
        '<tr><td class="td-label">Hora de Llegada Est.</td><td>' + ruta.hora_llegada + '</td></tr>' +
        '</table>';

    $('#detalle-ruta-body').html(body);
    $('#modal-overlay').show();
}

function cerrarModal() {
    $('#modal-overlay').hide();
}

// ----------------------------------------------------------------
// GUARDAR PLANIFICACIÓN
// ----------------------------------------------------------------

function guardarPlanificacion() {
    if (!rutasPlanificadas || rutasPlanificadas.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Sin rutas', text: 'No hay rutas planificadas para guardar.' });
        return;
    }

    // Sincronizar horas editadas antes de guardar
    rutasPlanificadas.forEach(function (ruta, idx) {
        var inputVal = $('#hora-envio-' + idx).val();
        if (inputVal) {
            ruta.hora_envio = inputVal;
            recalcularHoraLlegada(idx);
        }
    });

    Swal.fire({
        title: '¿Guardar planificación?',
        text: 'Se asignarán los vehículos y conductores. Su estado cambiará a EN_USO.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, guardar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d'
    }).then(function (result) {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Guardando...',
                allowOutsideClick: false,
                didOpen: function () { Swal.showLoading(); }
            });

            $.ajax({
                url: '/main/vehiculo/guardar_planificacion',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ fecha: currentFecha, rutas: rutasPlanificadas }),
                success: function (response) {
                    Swal.close();
                    if (response.success) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Guardado!',
                            text: response.message,
                            timer: 2500,
                            showConfirmButton: false
                        }).then(function () { location.reload(); });
                    } else {
                        Swal.fire({ icon: 'error', title: 'Error', text: response.error || 'Error al guardar' });
                    }
                },
                error: function () {
                    Swal.close();
                    Swal.fire({ icon: 'error', title: 'Error', text: 'Error al conectar con el servidor.' });
                }
            });
        }
    });
}
