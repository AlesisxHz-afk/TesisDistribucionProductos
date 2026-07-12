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
# RUTAS PARA REPORTES — PRODUCTOS (P1, P2, P3)
# ============================

@main.route('/reporte_p1')
def reporte_p1():
    """Reporte Interactivo: Stock por Tipo de Producto"""
    return render_template('reporte_p1.html')

@main.route('/reporte_p2')
def reporte_p2():
    """Reporte Interactivo: Temperatura y Humedad Óptima por Producto"""
    return render_template('reporte_p2.html')

@main.route('/reporte_p3')
def reporte_p3():
    """Reporte Interactivo: Envíos por Producto en el Tiempo"""
    return render_template('reporte_p3.html')

# ============================
# RUTAS PARA REPORTES — ALMACENES (A1, A2, A3)
# ============================

@main.route('/reporte_a1')
def reporte_a1():
    """Reporte Interactivo: Inventario vs Capacidad por Almacén"""
    return render_template('reporte_a1.html')

@main.route('/reporte_a2')
def reporte_a2():
    """Reporte Interactivo: Mapa de Calor de Envíos por Almacén"""
    return render_template('reporte_a2.html')

@main.route('/reporte_a3')
def reporte_a3():
    """Reporte Interactivo: Capacidad Disponible por Almacén"""
    return render_template('reporte_a3.html')

# ============================
# RUTAS PARA REPORTES — VEHÍCULOS (V1, V2, V3)
# ============================

@main.route('/reporte_v1')
def reporte_v1():
    """Reporte Interactivo: Flota de Vehículos"""
    return render_template('reporte_v1.html')

@main.route('/reporte_v2')
def reporte_v2():
    """Reporte Interactivo: Rutas Realizadas por Vehículo"""
    return render_template('reporte_v2.html')

@main.route('/reporte_v3')
def reporte_v3():
    """Reporte Interactivo: Gasto de Combustible por Vehículo"""
    return render_template('reporte_v3.html')

# ============================
# RUTAS PARA REPORTES — CONDUCTORES (C1, C2, C3)
# ============================

@main.route('/reporte_c1')
def reporte_c1():
    """Reporte Interactivo: Desempeño de Conductores"""
    return render_template('reporte_c1.html')

@main.route('/reporte_c2')
def reporte_c2():
    """Reporte Interactivo: Disponibilidad Semanal de Conductores"""
    return render_template('reporte_c2.html')

@main.route('/reporte_c3')
def reporte_c3():
    """Reporte Interactivo: Envíos por Conductor en el Tiempo"""
    return render_template('reporte_c3.html')


# ============================
# ENDPOINTS DE DATOS (compartidos/nuevos)
# ============================

@main.route('/obtener_productos', methods=['GET'])
def obtener_productos_route():
    """Obtiene la lista de productos"""
    try:
        result = reportes_service.obtener_productos()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener productos"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_tipos_producto', methods=['GET'])
def obtener_tipos_producto_route():
    """Obtiene los tipos de producto únicos"""
    try:
        result = reportes_service.obtener_tipos_producto()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener tipos"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_anios_distribucion', methods=['GET'])
def obtener_anios_distribucion_route():
    """Obtiene los años disponibles en distribución"""
    try:
        result = reportes_service.obtener_anios_distribucion()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener años"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_analisis_productos', methods=['GET'])
def obtener_analisis_productos_route():
    """Obtiene análisis detallado de productos"""
    try:
        filtros = request.args.to_dict()
        result = reportes_service.obtener_analisis_productos(filtros)
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_tendencia_producto/<int:producto_id>', methods=['GET'])
def obtener_tendencia_producto_route(producto_id):
    """Obtiene la tendencia de un producto específico"""
    try:
        anio = request.args.get('anio')
        if anio:
            anio = int(anio)
        result = reportes_service.obtener_tendencia_producto(producto_id, anio)
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_inventario_almacenes', methods=['GET'])
def obtener_inventario_almacenes_route():
    """Obtiene el inventario actual de almacenes"""
    try:
        result = reportes_service.obtener_inventario_almacenes()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_movimiento_productos', methods=['GET'])
def obtener_movimiento_productos_route():
    """Obtiene los movimientos de productos (envíos)"""
    try:
        result = reportes_service.obtener_movimiento_productos()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": result.get('message', 'Error')}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_rendimiento_almacenes', methods=['GET'])
def obtener_rendimiento_almacenes_route():
    """Obtiene el rendimiento de los almacenes"""
    try:
        result = reportes_service.obtener_rendimiento_almacenes()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_vehiculos', methods=['GET'])
def obtener_vehiculos_route():
    """Obtiene la lista de vehículos con sus asignaciones actuales"""
    try:
        result = reportes_service.obtener_vehiculos()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener vehículos"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_asignaciones_completo', methods=['GET'])
def obtener_asignaciones_completo_route():
    """Obtiene todas las asignaciones vehículo-conductor con detalles"""
    try:
        result = reportes_service.obtener_asignaciones_completo()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener asignaciones"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_rendimiento_vehiculos', methods=['GET'])
def obtener_rendimiento_vehiculos_route():
    """Obtiene datos de rendimiento de vehículos basado en envíos"""
    try:
        result = reportes_service.obtener_rendimiento_vehiculos()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_conductores', methods=['GET'])
def obtener_conductores_route():
    """Obtiene la lista de conductores"""
    try:
        result = reportes_service.obtener_conductores()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener conductores"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

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
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

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
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_disponibilidad_completa', methods=['GET'])
def obtener_disponibilidad_completa_route():
    """Obtiene la disponibilidad completa de conductores"""
    try:
        result = reportes_service.obtener_disponibilidad_completa()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error al obtener disponibilidad"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_demanda_mensual_historica', methods=['GET'])
def obtener_demanda_mensual_historica_route():
    """Obtiene la demanda mensual histórica de la base de datos"""
    try:
        result = reportes_service.obtener_demanda_mensual_historica()
        if result['success']:
            return jsonify(result), 200
        return jsonify({"success": False, "message": "Error"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500