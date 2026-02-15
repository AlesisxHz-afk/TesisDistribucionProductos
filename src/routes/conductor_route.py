from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import conductor_service
from ..models.models import *
import hashlib
import os
from werkzeug.utils import secure_filename

main = Blueprint("conductor", __name__, url_prefix="/conductor")

@main.route('/gestionar_conductores')
def mainconductor():
    return render_template('conductores.html')

@main.route('/obtener_conductores', methods=['GET'])
def obtener_conductores_route():
    """
    Obtiene todos los conductores
    """
    try:
        result = conductor_service.obtener_conductores()
        
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

@main.route('/obtener_conductor_xid/<int:conductor_id>', methods=['GET'])
def obtener_conductor_por_id_route(conductor_id):
    """
    Obtiene un conductor específico por su ID
    """
    try:
        result = conductor_service.obtener_conductor_por_id(conductor_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Conductor no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_conductor_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/registrar', methods=['POST'])
def registrar_conductor():
    """
    Registra un nuevo conductor
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        apellido_paterno = data.get("apellido_paterno")
        apellido_materno = data.get("apellido_materno")
        dni = data.get("dni")
        telefono = data.get("telefono")
        direccion = data.get("direccion")
        fecha_ingreso = data.get("fecha_ingreso")
        estado = data.get("estado")
        
        if not all([nombre, apellido_paterno, apellido_materno, dni, fecha_ingreso, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        nuevo_conductor, error = conductor_service.crear_conductor(
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            dni=dni,
            telefono=telefono,
            direccion=direccion,
            fecha_ingreso=fecha_ingreso,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Conductor registrado exitosamente",
            "conductor_id": nuevo_conductor.conductor_id
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_conductor: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route('/actualizar_conductor/<int:id>', methods=['PUT'])
def actualizar_conductor(id):
    """
    Actualiza un conductor existente
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        apellido_paterno = data.get("apellido_paterno")
        apellido_materno = data.get("apellido_materno")
        dni = data.get("dni")
        telefono = data.get("telefono")
        direccion = data.get("direccion")
        fecha_ingreso = data.get("fecha_ingreso")
        estado = data.get("estado")
        
        if not all([nombre, apellido_paterno, apellido_materno, dni, fecha_ingreso, estado]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        conductor_actualizado, error = conductor_service.actualizar_conductor(
            conductor_id=id,
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            dni=dni,
            telefono=telefono,
            direccion=direccion,
            fecha_ingreso=fecha_ingreso,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Conductor actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_conductor(id):
    """
    Cambia el estado de un conductor
    """
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        success, message = conductor_service.cambiar_estado_conductor(id, data['estado'])
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en cambiar_estado_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/eliminar_conductor/<int:id>', methods=['DELETE'])
def eliminar_conductor(id):
    """
    Elimina un conductor del sistema
    """
    try:
        success, message = conductor_service.eliminar_conductor(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500