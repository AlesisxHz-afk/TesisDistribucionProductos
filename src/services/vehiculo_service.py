from ..models.models import db, vehiculo, vehiculoconductor, conductor, distribucionalmacenproducto, almacen, producto
from sqlalchemy import text, and_, or_
import hashlib
import os
from werkzeug.utils import secure_filename
import math
import random
import numpy as np
from datetime import datetime, timedelta, date, time
import pickle
import joblib

# ============================================================================
# FUNCIONES EXISTENTES (SIN MODIFICAR)
# ============================================================================

def obtener_vehiculos():
    """
    Obtiene todos los vehículos de la base de datos
    """
    try:
        vehiculos = vehiculo.query.all()
        
        vehiculos_lista = []
        for veh in vehiculos:
            vehiculos_lista.append({
                "vehiculo_id": veh.vehiculo_id,
                "placa": veh.placa,
                "modelo": veh.modelo,
                "marca": veh.marca,
                "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
                "tipo_vehiculo": veh.tipo_vehiculo,
                "anio_fabricacion": veh.anio_fabricacion,
                "estado": veh.estado
            })
        
        return {
            "success": True,
            "vehiculos": vehiculos_lista,
            "total": len(vehiculos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los vehículos"
        }


def obtener_vehiculo_por_id(vehiculo_id):
    """
    Obtiene un vehículo específico por su ID
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return {
                "success": False,
                "message": "Vehículo no encontrado"
            }
        
        vehiculo_data = {
            "vehiculo_id": veh.vehiculo_id,
            "placa": veh.placa,
            "modelo": veh.modelo,
            "marca": veh.marca,
            "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
            "tipo_vehiculo": veh.tipo_vehiculo,
            "anio_fabricacion": veh.anio_fabricacion,
            "estado": veh.estado
        }
        
        return {
            "success": True,
            "vehiculo": vehiculo_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el vehículo"
        }


def obtener_vehiculos_filtrados(filtros=None):
    """
    Obtiene vehículos con filtros opcionales
    """
    try:
        query = vehiculo.query
        
        if filtros:
            if 'tipo_vehiculo' in filtros and filtros['tipo_vehiculo']:
                query = query.filter(vehiculo.tipo_vehiculo == filtros['tipo_vehiculo'])
            
            if 'estado' in filtros and filtros['estado']:
                query = query.filter(vehiculo.estado == filtros['estado'])
            
            if 'marca' in filtros and filtros['marca']:
                query = query.filter(vehiculo.marca.ilike(f"%{filtros['marca']}%"))
            
            if 'placa' in filtros and filtros['placa']:
                query = query.filter(vehiculo.placa.ilike(f"%{filtros['placa']}%"))
        
        vehiculos = query.all()
        
        vehiculos_lista = []
        for veh in vehiculos:
            vehiculos_lista.append({
                "vehiculo_id": veh.vehiculo_id,
                "placa": veh.placa,
                "modelo": veh.modelo,
                "marca": veh.marca,
                "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
                "tipo_vehiculo": veh.tipo_vehiculo,
                "anio_fabricacion": veh.anio_fabricacion,
                "estado": veh.estado
            })
        
        return {
            "success": True,
            "vehiculos": vehiculos_lista,
            "total": len(vehiculos_lista),
            "filtros_aplicados": filtros if filtros else {}
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener vehículos filtrados"
        }


def crear_vehiculo(placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado):
    """
    Crea un nuevo vehículo en el sistema
    NOTA: El parámetro estado se ignora, siempre se guarda como 'ACTIVO'
    """
    try:
        # Validar que la placa no exista
        if vehiculo.query.filter_by(placa=placa).first():
            return None, "Ya existe un vehículo con esa placa"
        
        # Validar tipos permitidos
        tipos_permitidos = ['Camión', 'Camioneta', 'Furgón', 'Tráiler', 'Volquete', 'Otro', 'Camion', 'Furgoneta']
        if tipo_vehiculo not in tipos_permitidos:
            return None, f"El tipo de vehículo debe ser uno de: {', '.join(tipos_permitidos)}"
        
        # Validar año de fabricación
        if anio_fabricacion < 1900 or anio_fabricacion > 2025:
            return None, "El año de fabricación debe estar entre 1900 y 2025"
        
        # Validar cantidad de carga
        if cantidad_carga <= 0:
            return None, "La capacidad de carga debe ser mayor a 0"
        
        # Siempre se guarda como ACTIVO
        nuevo_vehiculo = vehiculo(
            placa=placa.upper(),
            modelo=modelo,
            marca=marca,
            cantidad_carga=cantidad_carga,
            tipo_vehiculo=tipo_vehiculo,
            anio_fabricacion=anio_fabricacion,
            estado='ACTIVO'  # Forzar estado ACTIVO
        )
        
        db.session.add(nuevo_vehiculo)
        db.session.commit()
        
        return nuevo_vehiculo, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear el vehículo: {str(e)}"


def actualizar_vehiculo(vehiculo_id, placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado):
    """
    Actualiza un vehículo existente
    NOTA: El parámetro estado se ignora, no se actualiza el estado del vehículo
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return None, "Vehículo no encontrado"
        
        # No permitir actualizar si está EN_USO
        if veh.estado == 'EN_USO':
            return None, "No se puede editar un vehículo que está en uso"
        
        # Validar que la placa no exista en otro vehículo
        placa_existente = vehiculo.query.filter(vehiculo.placa == placa, vehiculo.vehiculo_id != vehiculo_id).first()
        if placa_existente:
            return None, "Ya existe otro vehículo con esa placa"
        
        # Validar tipos permitidos
        tipos_permitidos = ['Camión', 'Camioneta', 'Furgón', 'Tráiler', 'Volquete', 'Otro', 'Camion', 'Furgoneta']
        if tipo_vehiculo not in tipos_permitidos:
            return None, f"El tipo de vehículo debe ser uno de: {', '.join(tipos_permitidos)}"
        
        # Validar año de fabricación
        if anio_fabricacion < 1900 or anio_fabricacion > 2025:
            return None, "El año de fabricación debe estar entre 1900 y 2025"
        
        # Validar cantidad de carga
        if cantidad_carga <= 0:
            return None, "La capacidad de carga debe ser mayor a 0"
        
        veh.placa = placa.upper()
        veh.modelo = modelo
        veh.marca = marca
        veh.cantidad_carga = cantidad_carga
        veh.tipo_vehiculo = tipo_vehiculo
        veh.anio_fabricacion = anio_fabricacion
        # No se actualiza el estado, se mantiene el actual
        
        db.session.commit()
        
        return veh, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar el vehículo: {str(e)}"


def cambiar_estado_vehiculo(vehiculo_id, nuevo_estado):
    """
    Cambia el estado de un vehículo
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return False, "Vehículo no encontrado"
        
        # No permitir cambiar estado si está EN_USO
        if veh.estado == 'EN_USO':
            return False, "No se puede cambiar el estado de un vehículo que está en uso"
        
        # Validar estados permitidos
        estados_permitidos = ['ACTIVO', 'INACTIVO']  # EN_USO no se puede asignar manualmente
        if nuevo_estado not in estados_permitidos:
            return False, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        veh.estado = nuevo_estado
        db.session.commit()
        
        return True, "Estado actualizado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"


def eliminar_vehiculo(vehiculo_id):
    """
    Elimina un vehículo del sistema
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return False, "Vehículo no encontrado"
        
        # No permitir eliminar si está EN_USO
        if veh.estado == 'EN_USO':
            return False, "No se puede eliminar un vehículo que está en uso"
        
        # Verificar si tiene asignaciones activas
        from ..models.models import vehiculoconductor
        
        asignaciones_activas = vehiculoconductor.query.filter_by(
            vehiculo_id=vehiculo_id, 
            estado='ACTIVO'
        ).first()
        
        if asignaciones_activas:
            return False, "No se puede eliminar el vehículo porque tiene asignaciones activas con conductores"
        
        db.session.delete(veh)
        db.session.commit()
        
        return True, "Vehículo eliminado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar vehículo: {str(e)}"


# ============================================================================
# NUEVAS FUNCIONES PARA PLANIFICACIÓN DE RUTAS
# ============================================================================

def cargar_modelo_planificacion_rutas():
    """Carga el modelo PKT de planificación de rutas entrenado"""
    try:
        modelos_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'pkt', 'planificacion_rutas.pkl')
        
        if os.path.exists(modelos_path):
            with open(modelos_path, 'rb') as f:
                modelo_data = pickle.load(f)
            print(f"Modelo PKT cargado: {modelos_path}")
            return modelo_data
        else:
            print(f"No se encontró modelo PKT en {modelos_path}")
            return None
    except Exception as e:
        print(f"Error cargando modelo PKT: {e}")
        return None


def calcular_distancia(lat1, lon1, lat2, lon2):
    """Calcula distancia en km usando fórmula de Haversine"""
    try:
        R = 6371  # Radio de la Tierra en km
        
        lat1, lon1, lat2, lon2 = map(float, [lat1, lon1, lat2, lon2])
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    except Exception as e:
        print(f"Error calculando distancia: {e}")
        return random.uniform(50, 200)


def calcular_tiempo_estimado(distancia_km):
    """Calcula tiempo estimado en horas basado en distancia"""
    velocidad_promedio = 60  # km/h
    tiempo_horas = distancia_km / velocidad_promedio
    return round(tiempo_horas, 2)


def sumar_tiempo(hora_base_h, hora_base_m, minutos_extra):
    """
    Suma minutos a una hora base y retorna (hora, minuto) válidos (0-23, 0-59).
    """
    total_minutos = hora_base_h * 60 + hora_base_m + int(minutos_extra)
    # Limitar a 23:59 como máximo
    total_minutos = min(total_minutos, 23 * 60 + 59)
    hora = total_minutos // 60
    minuto = total_minutos % 60
    return hora, minuto


def generar_numero_envio():
    """Genera un número de envío único"""
    import string
    
    fecha = datetime.now().strftime("%Y%m%d")
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    numero = f"ENV-{fecha}-{random_chars}"
    
    # Verificar que no exista
    intentos = 0
    while distribucionalmacenproducto.query.filter_by(nro_envio=numero).first() and intentos < 10:
        random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        numero = f"ENV-{fecha}-{random_chars}"
        intentos += 1
    
    return numero


def obtener_vehiculo_conductor_disponible():
    """Obtiene un vehículo_conductor en estado ACTIVO"""
    try:
        query = text("""
            SELECT 
                vc.vehiculo_conductor_id,
                vc.vehiculo_id,
                vc.conductor_id,
                v.placa,
                v.cantidad_carga,
                v.tipo_vehiculo,
                c.nombre,
                c.apellido_paterno,
                c.apellido_materno,
                c.dni
            FROM vehiculo_conductor vc
            INNER JOIN vehiculo v ON vc.vehiculo_id = v.vehiculo_id
            INNER JOIN conductor c ON vc.conductor_id = c.conductor_id
            WHERE vc.estado = 'ACTIVO'
            AND v.estado = 'ACTIVO'
            AND c.estado = 'ACTIVO'
            LIMIT 10
        """)
        
        result = db.session.execute(query)
        disponibles = result.fetchall()
        
        if disponibles:
            seleccionado = random.choice(disponibles)
            
            return {
                'vehiculo_conductor_id': seleccionado[0],
                'vehiculo_id': seleccionado[1],
                'conductor_id': seleccionado[2],
                'placa': seleccionado[3],
                'capacidad_carga': float(seleccionado[4]) if seleccionado[4] else 0,
                'tipo_vehiculo': seleccionado[5],
                'conductor_nombre': f"{seleccionado[6]} {seleccionado[7]} {seleccionado[8]}"
            }
        
        return None
    except Exception as e:
        print(f"Error obteniendo vehículo_conductor: {e}")
        return None


def obtener_vehiculo_conductor_por_id(vehiculo_conductor_id):
    """Obtiene un vehículo_conductor específico por su ID"""
    try:
        query = text("""
            SELECT 
                vc.vehiculo_conductor_id,
                vc.vehiculo_id,
                vc.conductor_id,
                v.placa,
                v.cantidad_carga,
                v.tipo_vehiculo,
                c.nombre,
                c.apellido_paterno,
                c.apellido_materno,
                c.dni
            FROM vehiculo_conductor vc
            INNER JOIN vehiculo v ON vc.vehiculo_id = v.vehiculo_id
            INNER JOIN conductor c ON vc.conductor_id = c.conductor_id
            WHERE vc.vehiculo_conductor_id = :vc_id
            AND vc.estado = 'ACTIVO'
            AND v.estado = 'ACTIVO'
            AND c.estado = 'ACTIVO'
        """)
        
        result = db.session.execute(query, {'vc_id': vehiculo_conductor_id})
        seleccionado = result.fetchone()
        
        if seleccionado:
            return {
                'vehiculo_conductor_id': seleccionado[0],
                'vehiculo_id': seleccionado[1],
                'conductor_id': seleccionado[2],
                'placa': seleccionado[3],
                'capacidad_carga': float(seleccionado[4]) if seleccionado[4] else 0,
                'tipo_vehiculo': seleccionado[5],
                'conductor_nombre': f"{seleccionado[6]} {seleccionado[7]} {seleccionado[8]}"
            }
        
        return None
    except Exception as e:
        print(f"Error obteniendo vehículo_conductor por ID: {e}")
        return None


def obtener_envios_pendientes(fecha=None):
    """Obtiene los envíos pendientes para una fecha específica (incluye los que ya tienen vehículo asignado)"""
    try:
        if not fecha:
            fecha = date.today()
        
        print(f"Buscando envíos pendientes para fecha: {fecha}")
        
        query = text("""
            SELECT 
                d.asignacion_id,
                p.producto_id,
                p.nombre as producto_nombre,
                p.tipo as producto_tipo,
                p.variedad as producto_variedad,
                p.temperatura_optima,
                p.humedad_optima,
                a.almacen_id,
                a.nombre as almacen_nombre,
                a.direccion as almacen_direccion,
                a.latitud as almacen_lat,
                a.longitud as almacen_lon,
                a.tipo_almacen,
                d.demanda,
                d.fecha_envio,
                d.estado_envio,
                d.nro_envio,
                d.vehiculo_conductor_id
            FROM distribucion_almacen_producto d
            INNER JOIN producto p ON d.producto_id = p.producto_id
            INNER JOIN almacen a ON d.almacen_id = a.almacen_id
            WHERE d.fecha_envio = :fecha
            AND d.estado_envio = 'PENDIENTE'
        """)
        
        result = db.session.execute(query, {'fecha': fecha})
        envios = result.fetchall()
        
        print(f"Envíos encontrados: {len(envios)}")
        
        envios_lista = []
        for envio in envios:
            envios_lista.append({
                'asignacion_id': envio[0],
                'producto_id': envio[1],
                'producto_nombre': envio[2],
                'producto_tipo': envio[3],
                'producto_variedad': envio[4],
                'temperatura_optima': float(envio[5]) if envio[5] else 0,
                'humedad_optima': float(envio[6]) if envio[6] else 0,
                'almacen_id': envio[7],
                'almacen_nombre': envio[8],
                'almacen_direccion': envio[9],
                'almacen_lat': float(envio[10]) if envio[10] else 0,
                'almacen_lon': float(envio[11]) if envio[11] else 0,
                'tipo_almacen': envio[12],
                'demanda': float(envio[13]) if envio[13] else 0,
                'fecha_envio': envio[14].strftime('%Y-%m-%d') if envio[14] else '',
                'estado_envio': envio[15] if envio[15] else 'PENDIENTE',
                'nro_envio': envio[16],
                'vehiculo_conductor_id': envio[17]  # Incluir para saber si ya tiene asignación
            })
        
        return envios_lista
    except Exception as e:
        print(f"Error obteniendo envíos pendientes: {e}")
        import traceback
        traceback.print_exc()
        return []


def determinar_nivel_riesgo_con_modelo(modelo_data, distancia_km, temperatura_optima, humedad_optima):
    """
    Usa las métricas del modelo PKT para determinar el nivel de riesgo de una ruta.
    Si no hay modelo, usa lógica de distancia por defecto.
    """
    try:
        # 1. Definir el riesgo base según los umbrales de distancia (muy flexibles para evitar ALTO)
        if distancia_km <= 150:
            riesgo_base = 1  # BAJO
        elif distancia_km <= 350:
            riesgo_base = 2  # MEDIO
        else:
            riesgo_base = 3  # ALTO

        # 2. Calcular factor de sensibilidad del producto (clima)
        sensibilidad_temp = max(0, (15 - temperatura_optima) / 15.0)  # max 1.0
        sensibilidad_hum = max(0, (humedad_optima - 60) / 40.0)      # max 1.0
        sensibilidad_total = (sensibilidad_temp * 0.6) + (sensibilidad_hum * 0.4)

        # 3. Ajustar el riesgo según la sensibilidad y eficiencia si hay modelo
        if modelo_data and 'metricas' in modelo_data:
            eficiencia = float(modelo_data['metricas'].get('eficiencia_promedio', 0.7))
            
            # Si la eficiencia del modelo es muy baja (< 0.4) y el producto es sensible, aumenta el riesgo
            if eficiencia < 0.4 and sensibilidad_total > 0.6:
                riesgo_base += 1
            # Si la eficiencia es alta (> 0.6) y el producto es estable, disminuye el riesgo
            elif eficiencia > 0.6 and sensibilidad_total < 0.4:
                riesgo_base -= 1

        # Ajuste por sensibilidad extrema en distancias límites
        if riesgo_base == 1:
            if sensibilidad_total > 0.80 and distancia_km > 100:
                riesgo_base = 2  # Sube a MEDIO si es extremadamente crítico y dist > 100km
            else:
                # Para distancias < 150km, nunca dejar que suba a ALTO
                riesgo_base = min(riesgo_base, 2)
        elif riesgo_base == 2:
            if sensibilidad_total < 0.30:
                riesgo_base = 1  # Baja a BAJO si es muy estable
            elif sensibilidad_total > 0.90:
                riesgo_base = 3  # Sube a ALTO solo si es sumamente crítico (e.g. refrigerado extremo)
        elif riesgo_base == 3:
            # Para distancias largas, si el producto no es extremadamente crítico, bajarlo a MEDIO
            if sensibilidad_total < 0.75:
                riesgo_base = 2  # Baja a MEDIO

        # Asegurar rango de riesgo válido [1, 3]
        riesgo_base = max(1, min(3, riesgo_base))

        if riesgo_base == 1:
            return 'BAJO'
        elif riesgo_base == 2:
            return 'MEDIO'
        else:
            return 'ALTO'
    except Exception as e:
        print(f"Error determinando nivel de riesgo: {e}")
        # Fallback de distancia simple
        if distancia_km <= 150:
            return 'BAJO'
        elif distancia_km <= 350:
            return 'MEDIO'
        else:
            return 'ALTO'


def analizar_rutas_con_modelo_pkt(envios):
    """Analiza las rutas usando el modelo PKT de configuración"""
    try:
        modelo_data = cargar_modelo_planificacion_rutas()
        
        rutas_analizadas = []
        
        # [TAG] Punto de origen: Agrícola Ayala S.A.C. (coordenadas reales brindadas por el usuario)
        origen_lat = -6.0461763
        origen_lon = -80.1964131
        
        for envio in envios:
            # Calcular distancia
            distancia = calcular_distancia(
                origen_lat, origen_lon,
                envio['almacen_lat'], envio['almacen_lon']
            )
            
            if distancia < 1:
                distancia = random.uniform(10, 50)
            
            tiempo_estimado = calcular_tiempo_estimado(distancia)
            
            nivel_riesgo = determinar_nivel_riesgo_con_modelo(
                modelo_data,
                distancia,
                envio.get('temperatura_optima', 15),
                envio.get('humedad_optima', 70)
            )
            
            # El gasto de combustible ya NO se calcula automáticamente.
            # Queda en 0 y lo ingresa el usuario manualmente desde el frontend
            # (panel "Ingrese el gasto de combustible" en planificar_rutas.js).
            gasto_estimado = 0.0
            
            rutas_analizadas.append({
                'asignacion_id': envio['asignacion_id'],
                'producto_nombre': envio['producto_nombre'],
                'producto_tipo': envio.get('producto_tipo', ''),
                'almacen_nombre': envio['almacen_nombre'],
                'almacen_direccion': envio.get('almacen_direccion', ''),
                'temperatura_optima': envio.get('temperatura_optima', 0),
                'humedad_optima': envio.get('humedad_optima', 0),
                'demanda': envio.get('demanda', 0),
                'distancia_km': round(distancia, 2),
                'tiempo_estimado_horas': tiempo_estimado,
                'nivel_riesgo': nivel_riesgo,
                'gasto_estimado': gasto_estimado,
                'lat': envio['almacen_lat'],
                'lon': envio['almacen_lon'],
                'nro_envio': envio.get('nro_envio'),
                'vehiculo_conductor_id_actual': envio.get('vehiculo_conductor_id')  # Guardar el ID actual si existe
            })
        
        return rutas_analizadas
    except Exception as e:
        print(f"Error analizando rutas: {e}")
        return []


def planificar_rutas(fecha_envio):
    """Planifica las rutas para una fecha específica"""
    try:
        print(f"Planificando rutas para fecha: {fecha_envio}")
        
        # 1. Obtener envíos pendientes (incluye los que ya tienen vehículo)
        envios = obtener_envios_pendientes(fecha_envio)
        
        if not envios:
            return {
                'success': False,
                'message': f'No hay envíos pendientes para la fecha {fecha_envio}'
            }
        
        print(f"Envíos encontrados: {len(envios)}")
        
        # 2. Analizar rutas con modelo PKT
        rutas_analizadas = analizar_rutas_con_modelo_pkt(envios)
        
        if not rutas_analizadas:
            return {
                'success': False,
                'message': 'No se pudieron analizar las rutas'
            }
        
        # 3. Ordenar por distancia para una planificación eficiente
        rutas_analizadas.sort(key=lambda x: x['distancia_km'])
        
        rutas_agrupadas = []
        
        # Hora base de inicio de envíos: 8:00 AM
        hora_base_h = 8
        hora_base_m = 0
        
        for idx, ruta in enumerate(rutas_analizadas):
            # Verificar si el envío ya tiene vehículo asignado
            vehiculo_conductor_id_actual = ruta.get('vehiculo_conductor_id_actual')
            vc_info = None
            
            if vehiculo_conductor_id_actual and vehiculo_conductor_id_actual != 0:
                # Si ya tiene vehículo, obtener esa información
                vc_info = obtener_vehiculo_conductor_por_id(vehiculo_conductor_id_actual)
            
            # Si no tiene vehículo o no se encontró, asignar uno nuevo
            if not vc_info:
                vc_info = obtener_vehiculo_conductor_disponible()
            
            if vc_info:
                # Calcular hora de envío: cada ruta sale con 20 minutos de diferencia
                offset_envio_minutos = idx * 20
                hora_envio_h, hora_envio_m = sumar_tiempo(hora_base_h, hora_base_m, offset_envio_minutos)
                hora_envio = time(hora_envio_h, hora_envio_m, 0)
                
                # Calcular hora de llegada: hora_envio + tiempo de viaje en minutos
                minutos_viaje = int(ruta['tiempo_estimado_horas'] * 60)
                hora_llegada_h, hora_llegada_m = sumar_tiempo(hora_envio_h, hora_envio_m, minutos_viaje)
                hora_llegada = time(hora_llegada_h, hora_llegada_m, 0)
                
                ruta_info = {
                    'asignacion_id': ruta['asignacion_id'],
                    'producto_nombre': ruta['producto_nombre'],
                    'producto_tipo': ruta.get('producto_tipo', ''),
                    'almacen_nombre': ruta['almacen_nombre'],
                    'almacen_direccion': ruta.get('almacen_direccion', ''),
                    'temperatura_optima': ruta.get('temperatura_optima', 0),
                    'humedad_optima': ruta.get('humedad_optima', 0),
                    'demanda': ruta.get('demanda', 0),
                    'distancia_km': ruta['distancia_km'],
                    'tiempo_estimado_horas': ruta['tiempo_estimado_horas'],
                    'nivel_riesgo': ruta['nivel_riesgo'],
                    # El gasto de combustible llega en 0 y se ingresa manualmente
                    # en el frontend antes de guardar la planificación.
                    'gasto_estimado': ruta['gasto_estimado'],
                    'lat': ruta['lat'],
                    'lon': ruta['lon'],
                    'vehiculo_asignado': {
                        'vehiculo_conductor_id': vc_info['vehiculo_conductor_id'],
                        'vehiculo_id': vc_info['vehiculo_id'],
                        'conductor_id': vc_info['conductor_id'],
                        'placa': vc_info['placa'],
                        'tipo_vehiculo': vc_info.get('tipo_vehiculo', ''),
                        'conductor': vc_info['conductor_nombre']
                    },
                    'hora_envio': hora_envio.strftime('%H:%M'),
                    'hora_llegada': hora_llegada.strftime('%H:%M'),
                    'nro_envio': ruta.get('nro_envio') or generar_numero_envio(),  # Mantener el nro_envio existente o crear uno nuevo
                    'es_reaasignacion': bool(vehiculo_conductor_id_actual and vehiculo_conductor_id_actual != 0)  # Indicar si es una reasignación
                }
                
                rutas_agrupadas.append(ruta_info)
        
        print(f"Rutas planificadas: {len(rutas_agrupadas)}")
        
        return {
            'success': True,
            'message': f'Se planificaron {len(rutas_agrupadas)} rutas exitosamente',
            'data': {
                'fecha': str(fecha_envio),
                'total_envios': len(envios),
                'rutas_planificadas': len(rutas_agrupadas),
                'rutas': rutas_agrupadas
            }
        }
        
    except Exception as e:
        print(f"Error en planificar_rutas: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def guardar_planificacion_rutas(rutas_data):
    """Guarda la planificación de rutas en la base de datos"""
    try:
        rutas = rutas_data.get('rutas', [])
        fecha_envio = rutas_data.get('fecha')
        
        if not rutas:
            return {
                'success': False,
                'message': 'No hay rutas para guardar'
            }
        
        actualizados = 0
        errores = []
        
        for ruta in rutas:
            try:
                asignacion_id = ruta['asignacion_id']
                vehiculo_conductor_id = ruta['vehiculo_asignado']['vehiculo_conductor_id']
                hora_envio_str = ruta['hora_envio']
                hora_llegada_str = ruta['hora_llegada']
                # El gasto de combustible viene ingresado manualmente desde el frontend
                gasto = float(ruta.get('gasto_estimado') or 0)
                nro_envio = ruta['nro_envio']
                
                # Convertir hora string a time
                hora_envio_parts = hora_envio_str.split(':')
                hora_envio_time = time(int(hora_envio_parts[0]), int(hora_envio_parts[1]), 0)
                
                hora_llegada_parts = hora_llegada_str.split(':')
                hora_llegada_time = time(int(hora_llegada_parts[0]), int(hora_llegada_parts[1]), 0)
                
                # Actualizar distribución
                distribucion = distribucionalmacenproducto.query.get(asignacion_id)
                
                if distribucion:
                    distribucion.vehiculo_conductor_id = vehiculo_conductor_id
                    distribucion.hora_envio = hora_envio_time
                    distribucion.hora_llegada = hora_llegada_time
                    distribucion.estado_envio = 'PENDIENTE'
                    distribucion.gasto = gasto
                    distribucion.nro_envio = nro_envio
                    
                    actualizados += 1
                else:
                    errores.append(f"Asignación {asignacion_id} no encontrada")
                
            except Exception as e:
                errores.append(f"Error en ruta {ruta.get('asignacion_id')}: {str(e)}")
                continue
        
        # Actualizar estado de vehículo_conductor, vehículo y conductor a EN_USO
        # Solo para los que no estaban ya en uso
        vc_ids_procesados = set()
        for ruta in rutas:
            vc_id = ruta['vehiculo_asignado']['vehiculo_conductor_id']
            
            if vc_id in vc_ids_procesados:
                continue
            vc_ids_procesados.add(vc_id)
            
            vc = vehiculoconductor.query.get(vc_id)
            if vc and vc.estado != 'EN_USO':
                vc.estado = 'EN_USO'
                
                # Actualizar estado del vehículo
                vehiculo_obj = vehiculo.query.get(vc.vehiculo_id)
                if vehiculo_obj and vehiculo_obj.estado != 'EN_USO':
                    vehiculo_obj.estado = 'EN_USO'
                
                # Actualizar estado del conductor
                conductor_obj = conductor.query.get(vc.conductor_id)
                if conductor_obj and conductor_obj.estado != 'EN_USO':
                    conductor_obj.estado = 'EN_USO'
        
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Se guardaron {actualizados} rutas exitosamente',
            'actualizados': actualizados,
            'errores': errores if errores else None
        }
        
    except Exception as e:
        db.session.rollback()
        print(f"Error guardando planificación: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def obtener_estadisticas_rutas(fecha=None):
    """Obtiene estadísticas de rutas para una fecha"""
    try:
        if not fecha:
            fecha = date.today()
        
        query = text("""
            SELECT 
                COUNT(*) as total_envios,
                SUM(CASE WHEN estado_envio = 'ASIGNADO' THEN 1 ELSE 0 END) as asignados,
                SUM(CASE WHEN estado_envio = 'PENDIENTE' THEN 1 ELSE 0 END) as pendientes,
                SUM(CASE WHEN estado_envio = 'COMPLETADO' THEN 1 ELSE 0 END) as completados,
                COALESCE(SUM(gasto), 0) as total_gastos
            FROM distribucion_almacen_producto
            WHERE fecha_envio = :fecha
        """)
        
        result = db.session.execute(query, {'fecha': fecha})
        stats = result.fetchone()
        
        return {
            'success': True,
            'data': {
                'fecha': fecha.strftime('%Y-%m-%d'),
                'total_envios': stats[0] if stats[0] else 0,
                'asignados': stats[1] if stats[1] else 0,
                'pendientes': stats[2] if stats[2] else 0,
                'completados': stats[3] if stats[3] else 0,
                'total_gastos': float(stats[4]) if stats[4] else 0
            }
        }
        
    except Exception as e:
        print(f"Error obteniendo estadísticas: {e}")
        return {
            'success': False,
            'error': str(e)
        }