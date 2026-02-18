from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import reportes_service
from ..models.models import *
import hashlib
import os
from ..services import reportes_service
from werkzeug.utils import secure_filename
import traceback
from datetime import datetime

main = Blueprint("reporte", __name__, url_prefix="/reporte")

# ============================
# RUTAS PARA LOS TEMPLATES
# ============================

@main.route('/reporte10')
def reporte10():
    """Reporte de Rendimiento de Conductores"""
    return render_template('reporte10.html')

@main.route('/reporte11')
def reporte11():
    """Reporte de Productividad por Conductor"""
    return render_template('reporte11.html')

@main.route('/reporte12')
def reporte12():
    """Reporte de Disponibilidad de Conductores"""
    return render_template('reporte12.html')

# ============================
# RUTAS PARA DATOS
# ============================

@main.route('/obtener_conductores', methods=['GET'])
def obtener_conductores_route():
    """Obtiene la lista de conductores"""
    try:
        result = reportes_service.obtener_conductores()
        
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

@main.route('/obtener_rendimiento_conductores', methods=['GET'])
def obtener_rendimiento_conductores_route():
    """Obtiene datos de rendimiento de todos los conductores"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        result = reportes_service.obtener_todos_envios_conductores(fecha_inicio, fecha_fin)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener datos de rendimiento"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_rendimiento_conductores: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_envios_conductor/<int:conductor_id>', methods=['GET'])
def obtener_envios_conductor_route(conductor_id):
    """Obtiene los envíos de un conductor específico"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        result = reportes_service.obtener_envios_por_conductor(conductor_id, fecha_inicio, fecha_fin)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener envíos del conductor"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_envios_conductor: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_disponibilidad_completa', methods=['GET'])
def obtener_disponibilidad_completa_route():
    """Obtiene la disponibilidad completa de conductores"""
    try:
        result = reportes_service.obtener_disponibilidad_completa()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener disponibilidad"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_disponibilidad_completa: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/exportar_reporte/<int:tipo>', methods=['GET'])
def exportar_reporte(tipo):
    """Exporta un reporte en formato HTML"""
    try:
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')
        conductor_id = request.args.get('conductor_id')
        
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        if tipo == 1:
            # Reporte de rendimiento
            data = reportes_service.obtener_todos_envios_conductores(fecha_inicio, fecha_fin)
        elif tipo == 2 and conductor_id:
            # Reporte de productividad por conductor
            data = reportes_service.obtener_envios_por_conductor(conductor_id, fecha_inicio, fecha_fin)
        elif tipo == 3:
            # Reporte de disponibilidad
            data = reportes_service.obtener_disponibilidad_completa()
        else:
            return jsonify({
                "success": False,
                "message": "Tipo de reporte no válido"
            }), 400
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
        
    except Exception as e:
        print(f"Error en exportar_reporte: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500