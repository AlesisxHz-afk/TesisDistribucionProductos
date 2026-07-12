from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import vehiculo_service
from ..models.models import *
import hashlib
import os
from src.services import vehiculo_service
from werkzeug.utils import secure_filename
from datetime import datetime, date

main = Blueprint("vehiculo", __name__, url_prefix="/main/vehiculo")

@main.route("/gestionar_vehiculos")
def mainvehiculo():
    return render_template('vehiculos.html')

@main.route("/vista_planificar_rutas")
def vista_planificar_rutas():
    hoy = date.today().strftime('%Y-%m-%d')
    return render_template('planificar_rutas.html', hoy=hoy)

@main.route("/obtener_vehiculos", methods=["GET"])
def obtener_vehiculos():
    """Obtiene todos los vehículos"""
    try:
        result = vehiculo_service.obtener_vehiculos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener vehículos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_vehiculos: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500


@main.route("/obtener_vehiculo_xid/<int:vehiculo_id>", methods=["GET"])
def obtener_vehiculo_por_id(vehiculo_id):
    """Obtiene un vehículo específico por su ID"""
    try:
        result = vehiculo_service.obtener_vehiculo_por_id(vehiculo_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Vehículo no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_vehiculo_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500


@main.route("/registrar", methods=["POST"])
def registrar_vehiculo():
    """Registra un nuevo vehículo"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        placa = data.get("placa")
        modelo = data.get("modelo")
        marca = data.get("marca")
        cantidad_carga = data.get("cantidad_carga")
        tipo_vehiculo = data.get("tipo_vehiculo")
        anio_fabricacion = data.get("anio_fabricacion")
        estado = data.get("estado")
        
        if not all([placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        try:
            cantidad_carga = float(cantidad_carga)
            anio_fabricacion = int(anio_fabricacion)
        except ValueError:
            return jsonify({"success": False, "error": "Los valores numéricos deben ser válidos"}), 400
        
        nuevo_vehiculo, error = vehiculo_service.crear_vehiculo(
            placa=placa,
            modelo=modelo,
            marca=marca,
            cantidad_carga=cantidad_carga,
            tipo_vehiculo=tipo_vehiculo,
            anio_fabricacion=anio_fabricacion,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Vehículo registrado exitosamente",
            "vehiculo_id": nuevo_vehiculo.vehiculo_id,
            "placa": placa
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_vehiculo: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500


@main.route("/actualizar_vehiculo/<int:id>", methods=["PUT"])
def actualizar_vehiculo(id):
    """Actualiza un vehículo existente"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        placa = data.get("placa")
        modelo = data.get("modelo")
        marca = data.get("marca")
        cantidad_carga = data.get("cantidad_carga")
        tipo_vehiculo = data.get("tipo_vehiculo")
        anio_fabricacion = data.get("anio_fabricacion")
        estado = data.get("estado")
        
        if not all([placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        try:
            cantidad_carga = float(cantidad_carga)
            anio_fabricacion = int(anio_fabricacion)
        except ValueError:
            return jsonify({"success": False, "error": "Los valores numéricos deben ser válidos"}), 400
        
        vehiculo_actualizado, error = vehiculo_service.actualizar_vehiculo(
            vehiculo_id=id,
            placa=placa,
            modelo=modelo,
            marca=marca,
            cantidad_carga=cantidad_carga,
            tipo_vehiculo=tipo_vehiculo,
            anio_fabricacion=anio_fabricacion,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Vehículo actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_vehiculo: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@main.route("/cambiar_estado/<int:id>", methods=["PUT"])
def cambiar_estado_vehiculo(id):
    """Cambia el estado de un vehículo"""
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        success, message = vehiculo_service.cambiar_estado_vehiculo(id, data['estado'])
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en cambiar_estado_vehiculo: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@main.route("/eliminar_vehiculo/<int:id>", methods=["DELETE"])
def eliminar_vehiculo(id):
    """Elimina un vehículo del sistema"""
    try:
        success, message = vehiculo_service.eliminar_vehiculo(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_vehiculo: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@main.route("/filtrar", methods=["GET"])
def filtrar_vehiculos():
    """Filtra vehículos según criterios"""
    try:
        filtros = {}
        if request.args.get('tipo_vehiculo'):
            filtros['tipo_vehiculo'] = request.args.get('tipo_vehiculo')
        if request.args.get('estado'):
            filtros['estado'] = request.args.get('estado')
        if request.args.get('marca'):
            filtros['marca'] = request.args.get('marca')
        if request.args.get('placa'):
            filtros['placa'] = request.args.get('placa')
        
        result = vehiculo_service.obtener_vehiculos_filtrados(filtros)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al filtrar vehículos"
            }), 500
            
    except Exception as e:
        print(f"Error en filtrar_vehiculos: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500


# ============================================================================
# RUTAS PARA PLANIFICACIÓN DE RUTAS
# ============================================================================

@main.route("/obtener_envios_pendientes", methods=["GET"])
def obtener_envios_pendientes():
    """Obtiene envíos pendientes para una fecha"""
    try:
        fecha_str = request.args.get('fecha')
        
        if fecha_str:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = date.today()
        
        envios = vehiculo_service.obtener_envios_pendientes(fecha)
        
        return jsonify({
            'success': True,
            'data': {
                'fecha': fecha.strftime('%Y-%m-%d'),
                'total': len(envios),
                'envios': envios
            }
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_envios_pendientes: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@main.route("/planificar_rutas", methods=["POST"])
def planificar_rutas_post():
    """Planifica rutas para una fecha"""
    try:
        data = request.get_json()
        fecha_str = data.get('fecha')
        
        if not fecha_str:
            return jsonify({
                'success': False,
                'error': 'Fecha no proporcionada'
            }), 400
        
        fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        
        resultado = vehiculo_service.planificar_rutas(fecha)
        
        return jsonify(resultado), 200 if resultado.get('success') else 500
        
    except Exception as e:
        print(f"Error en planificar_rutas: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@main.route("/guardar_planificacion", methods=["POST"])
def guardar_planificacion():
    """Guarda la planificación de rutas"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No se recibieron datos'
            }), 400
        
        resultado = vehiculo_service.guardar_planificacion_rutas(data)
        
        return jsonify(resultado), 200 if resultado.get('success') else 500
        
    except Exception as e:
        print(f"Error en guardar_planificacion: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@main.route("/estadisticas_rutas", methods=["GET"])
def estadisticas_rutas():
    """Obtiene estadísticas de rutas"""
    try:
        fecha_str = request.args.get('fecha')
        
        if fecha_str:
            fecha = datetime.strptime(fecha_str, '%Y-%m-%d').date()
        else:
            fecha = date.today()
        
        resultado = vehiculo_service.obtener_estadisticas_rutas(fecha)
        
        return jsonify(resultado), 200 if resultado.get('success') else 500
        
    except Exception as e:
        print(f"Error en estadisticas_rutas: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@main.route("/vehiculos_conductores_disponibles", methods=["GET"])
def vehiculos_conductores_disponibles():
    """Obtiene vehículos con conductores disponibles"""
    try:
        vc_disponible = vehiculo_service.obtener_vehiculo_conductor_disponible()
        
        return jsonify({
            'success': True,
            'data': vc_disponible
        }), 200
        
    except Exception as e:
        print(f"Error en vehiculos_conductores_disponibles: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@main.route("/obtener_vc_activos", methods=["GET"])
def obtener_vc_activos():
    """
    Devuelve todos los pares vehiculo_conductor con estado ACTIVO
    (tanto vehículo como conductor deben estar ACTIVOS, no EN_USO).
    Se usa para el modal de edición manual de asignación en planificar rutas.
    """
    try:
        resultado = vehiculo_service.obtener_vc_activos_disponibles()
        return jsonify(resultado), 200 if resultado.get('success') else 500
    except Exception as e:
        print(f"Error en obtener_vc_activos: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500