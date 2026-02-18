from flask import Blueprint, render_template, request, jsonify
from src.services import vehiculo_conductor_service


from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
import hashlib
import random
from ..services import vehiculo_conductor_service
import os
from werkzeug.utils import secure_filename

main = Blueprint("vehiculo_conductor", __name__, url_prefix="/main/vehiculo_conductor")

# Ruta para cargar la página HTML
@main.route("/asignar_vehiculo")
def mainvehiculoconductor():
    return render_template('vehiculo_conductor.html')

# API: Obtener todas las asignaciones
@main.route('/obtener_asignaciones', methods=['GET'])
def obtener_asignaciones_route():
    try:
        result = vehiculo_conductor_service.obtener_asignaciones()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener asignaciones"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_asignaciones: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

# API: Obtener una asignación por ID
@main.route('/obtener_asignacion_xid/<int:asignacion_id>', methods=['GET'])
def obtener_asignacion_por_id_route(asignacion_id):
    try:
        result = vehiculo_conductor_service.obtener_asignacion_por_id(asignacion_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Asignación no encontrada":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_asignacion_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

# API: Obtener conductores activos (para selects)
@main.route('/obtener_conductores', methods=['GET'])
def obtener_conductores_route():
    try:
        result = vehiculo_conductor_service.obtener_conductores_activos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener conductores"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_conductores: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

# API: Obtener vehículos activos (para selects)
@main.route('/obtener_vehiculos', methods=['GET'])
def obtener_vehiculos_route():
    try:
        result = vehiculo_conductor_service.obtener_vehiculos_activos()
        
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

# API: Registrar nueva asignación
@main.route('/registrar', methods=['POST'])
def registrar_asignacion():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get("conductor_id")
        vehiculo_id = data.get("vehiculo_id")
        fecha_asignacion = data.get("fecha_asignacion")
        estado = data.get("estado")
        
        if not all([conductor_id, vehiculo_id, fecha_asignacion, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        # Validar que el estado sea uno de los permitidos
        if estado not in ['ACTIVO', 'INACTIVO', 'EN_USO']:
            return jsonify({"success": False, "error": "Estado inválido"}), 400
        
        nueva_asignacion, error = vehiculo_conductor_service.crear_asignacion(
            conductor_id=conductor_id,
            vehiculo_id=vehiculo_id,
            fecha_asignacion=fecha_asignacion,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Asignación registrada exitosamente",
            "asignacion_id": nueva_asignacion.vehiculo_conductor_id
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_asignacion: {str(e)}")
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

# API: Actualizar asignación
@main.route('/actualizar_asignacion/<int:id>', methods=['PUT'])
def actualizar_asignacion(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get("conductor_id")
        vehiculo_id = data.get("vehiculo_id")
        fecha_asignacion = data.get("fecha_asignacion")
        estado = data.get("estado")
        
        if not all([conductor_id, vehiculo_id, fecha_asignacion, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        if estado not in ['ACTIVO', 'INACTIVO', 'EN_USO']:
            return jsonify({"success": False, "error": "Estado inválido"}), 400
        
        asignacion_actualizada, error = vehiculo_conductor_service.actualizar_asignacion(
            asignacion_id=id,
            conductor_id=conductor_id,
            vehiculo_id=vehiculo_id,
            fecha_asignacion=fecha_asignacion,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Asignación actualizada exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_asignacion: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# API: Cambiar estado de asignación
@main.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_asignacion(id):
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        success, message = vehiculo_conductor_service.cambiar_estado_asignacion(id, data['estado'])
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en cambiar_estado_asignacion: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# API: Eliminar asignación
@main.route('/eliminar_asignacion/<int:id>', methods=['DELETE'])
def eliminar_asignacion(id):
    try:
        success, message = vehiculo_conductor_service.eliminar_asignacion(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrada" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_asignacion: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_activos', methods=['GET'])
def obtener_asignaciones_activas():
    """Obtiene asignaciones activas de vehículo-conductor para selects"""
    try:
        # Consulta para obtener asignaciones activas con datos de conductor y vehículo
        asignaciones = db.session.query(
            vehiculoconductor, conductor, vehiculo
        ).join(
            conductor, vehiculoconductor.conductor_id == conductor.conductor_id
        ).join(
            vehiculo, vehiculoconductor.vehiculo_id == vehiculo.vehiculo_id
        ).filter(
            vehiculoconductor.estado == 'ACTIVO',
            conductor.estado == 'ACTIVO',
            vehiculo.estado == 'ACTIVO'
        ).all()
        
        asignaciones_lista = []
        for vc, cond, veh in asignaciones:
            asignaciones_lista.append({
                "vehiculo_conductor_id": vc.vehiculo_conductor_id,
                "conductor_id": vc.conductor_id,
                "vehiculo_id": vc.vehiculo_id,
                "conductor_nombre": f"{cond.nombre} {cond.apellido_paterno} {cond.apellido_materno}".strip(),
                "placa": veh.placa,
                "marca": veh.marca,
                "modelo": veh.modelo,
                "cantidad_carga": veh.cantidad_carga
            })
        
        return jsonify({
            "success": True,
            "vehiculos_conductores": asignaciones_lista,
            "total": len(asignaciones_lista)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_activos: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@main.route('/obtener_conductor_por_asignacion/<int:vehiculo_conductor_id>', methods=['GET'])
def obtener_conductor_por_asignacion(vehiculo_conductor_id):
    """Obtiene el conductor_id a partir de una asignación"""
    try:
        asignacion = vehiculoconductor.query.get(vehiculo_conductor_id)
        if not asignacion:
            return jsonify({"success": False, "error": "Asignación no encontrada"}), 404
        
        return jsonify({
            "success": True,
            "conductor_id": asignacion.conductor_id,
            "vehiculo_id": asignacion.vehiculo_id
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_conductor_por_asignacion: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
