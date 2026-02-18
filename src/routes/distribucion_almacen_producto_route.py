from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import distribucion_almacen_producto_service
from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
import hashlib
import random
from ..services import distribucion_almacen_producto_service
import os
from werkzeug.utils import secure_filename

main = Blueprint("distribucion_almacen_producto", __name__, url_prefix="/distribucion_almacen_producto")

@main.route('/gestionar_envios')
def mainenvios():
    return render_template('envios.html')

@main.route('/seguimiento_envio')
def mainseguimiento():
    return render_template('seguimiento_envio.html')

@main.route('/obtener_envios', methods=['GET'])
def obtener_envios_route():
    try:
        result = distribucion_almacen_producto_service.obtener_envios()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener envíos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_envios: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_envio/<int:asignacion_id>', methods=['GET'])
def obtener_envio_por_id_route(asignacion_id):
    try:
        result = distribucion_almacen_producto_service.obtener_envio_por_id(asignacion_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Envío no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
                
    except Exception as e:
        print(f"Error en obtener_envio_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_envio_detalle/<int:asignacion_id>', methods=['GET'])
def obtener_envio_detalle_route(asignacion_id):
    try:
        result = distribucion_almacen_producto_service.obtener_envio_detalle(asignacion_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Envío no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
                
    except Exception as e:
        print(f"Error en obtener_envio_detalle: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/validar_envio', methods=['POST'])
def validar_envio_route():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        valido, mensaje = distribucion_almacen_producto_service.validar_envio(data)
        
        if valido:
            return jsonify({
                "success": True,
                "message": mensaje
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": mensaje
            }), 400
            
    except Exception as e:
        print(f"Error en validar_envio: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@main.route('/registrar_envio', methods=['POST'])
def registrar_envio_route():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        # Validar campos obligatorios
        campos_requeridos = ['almacen_id', 'producto_id', 'vehiculo_conductor_id', 
                            'fecha_envio', 'hora_envio', 'demanda', 'nro_envio']
        
        for campo in campos_requeridos:
            if campo not in data or not data[campo]:
                return jsonify({"success": False, "error": f"El campo {campo} es requerido"}), 400
        
        nuevo_envio, error = distribucion_almacen_producto_service.registrar_envio(data)
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Envío registrado exitosamente",
            "asignacion_id": nuevo_envio.asignacion_id,
            "nro_envio": nuevo_envio.nro_envio
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_envio: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route('/actualizar_envio/<int:id>', methods=['PUT'])
def actualizar_envio_route(id):
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        envio_actualizado, error = distribucion_almacen_producto_service.actualizar_envio(id, data)
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Envío actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_envio: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/cancelar_envio/<int:id>', methods=['PUT'])
def cancelar_envio_route(id):
    try:
        data = request.get_json()
        
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        # Solo permitir cancelar
        if data['estado'] != 'CANCELADO':
            return jsonify({"success": False, "error": "Solo se permite cancelar envíos"}), 400
        
        success, message = distribucion_almacen_producto_service.cancelar_envio(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
            
    except Exception as e:
        print(f"Error en cancelar_envio: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/registrar_distribucion_excel', methods=['GET', 'POST'])
def registrar_distribucion_excel():
    try:
        # Llamar al servicio para procesar el Excel
        resultado = distribucion_almacen_producto_service.registrar_distribucion_productos_excel()
        
        # Retornar respuesta JSON
        if resultado.get("success"):
            return jsonify({
                "success": True,
                "message": "Registro completado exitosamente",
                "registros_insertados": resultado.get("registros_insertados", 0),
                "errores": resultado.get("errores", [])
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error en el registro",
                "error": resultado.get("error", "Error desconocido"),
                "detalles": resultado.get("errores", [])
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error en el servidor",
            "error": str(e)
        }), 500

@main.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_envio_route(id):
    try:
        data = request.get_json()
        
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        nuevo_estado = data['estado']
        
        if nuevo_estado not in ['PENDIENTE', 'EN_RUTA', 'ENTREGADO', 'CANCELADO']:
            return jsonify({"success": False, "error": "Estado no válido"}), 400
        
        success, message = distribucion_almacen_producto_service.cambiar_estado_envio(id, nuevo_estado)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
            
    except Exception as e:
        print(f"Error en cambiar_estado_envio: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_envio_por_nro/<string:nro_envio>', methods=['GET'])
def obtener_envio_por_nro_route(nro_envio):
    """
    Obtiene un envío específico por su número de envío
    """
    try:
        result = distribucion_almacen_producto_service.obtener_envio_por_nro(nro_envio)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        print(f"Error en obtener_envio_por_nro: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500