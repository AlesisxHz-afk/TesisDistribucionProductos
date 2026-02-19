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
# RUTAS PARA REPORTES 01-03 (PRODUCTOS)
# ============================

@main.route('/reporte01')
def reporte01():
    """Reporte de Comparativa de Stock vs Predicciones"""
    return render_template('reporte01.html')

@main.route('/reporte02')
def reporte02():
    """Reporte de Análisis de Productos"""
    return render_template('reporte02.html')

@main.route('/reporte03')
def reporte03():
    """Reporte de Tendencias de Productos"""
    return render_template('reporte03.html')

# ============================
# RUTAS PARA REPORTES 04-06 (ALMACENES)
# ============================

@main.route('/reporte04')
def reporte04():
    """Reporte de Inventario de Almacenes"""
    return render_template('reporte04.html')

@main.route('/reporte05')
def reporte05():
    """Reporte de Movimiento de Productos"""
    return render_template('reporte05.html')

@main.route('/reporte06')
def reporte06():
    """Reporte de Rendimiento de Almacenes"""
    return render_template('reporte06.html')

# ============================
# RUTAS PARA REPORTES 07-09 (VEHÍCULOS)
# ============================

@main.route('/reporte07')
def reporte07():
    """Reporte de Inventario de Vehículos"""
    return render_template('reporte07.html')

@main.route('/reporte08')
def reporte08():
    """Reporte de Asignaciones Vehículo-Conductor"""
    return render_template('reporte08.html')

@main.route('/reporte09')
def reporte09():
    """Reporte de Rendimiento de Vehículos"""
    return render_template('reporte09.html')

# ============================
# RUTAS PARA REPORTES 10-12 (CONDUCTORES)
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
# RUTAS PARA DATOS - REPORTES 01, 02, 03 (PRODUCTOS)
# ============================

@main.route('/obtener_productos', methods=['GET'])
def obtener_productos_route():
    """Obtiene la lista de productos"""
    try:
        result = reportes_service.obtener_productos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener productos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_tipos_producto', methods=['GET'])
def obtener_tipos_producto_route():
    """Obtiene los tipos de producto únicos"""
    try:
        result = reportes_service.obtener_tipos_producto()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener tipos de producto"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_tipos_producto: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_anios_distribucion', methods=['GET'])
def obtener_anios_distribucion_route():
    """Obtiene los años disponibles en distribución"""
    try:
        result = reportes_service.obtener_anios_distribucion()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener años"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_anios_distribucion: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_predicciones_excel', methods=['GET'])
def obtener_predicciones_excel_route():
    """Obtiene las predicciones del archivo Excel"""
    try:
        result = reportes_service.obtener_predicciones_excel()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": result.get('message', 'Error al obtener predicciones')
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_predicciones_excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_analisis_productos', methods=['GET'])
def obtener_analisis_productos_route():
    """Obtiene análisis detallado de productos"""
    try:
        filtros = request.args.to_dict()
        result = reportes_service.obtener_analisis_productos(filtros)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener análisis de productos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_analisis_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

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
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener tendencia del producto"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_tendencia_producto: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

# ============================
# RUTAS PARA DATOS - REPORTES 04, 05, 06 (ALMACENES)
# ============================

@main.route('/obtener_inventario_almacenes', methods=['GET'])
def obtener_inventario_almacenes_route():
    """Obtiene el inventario actual de almacenes"""
    try:
        result = reportes_service.obtener_inventario_almacenes()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener inventario de almacenes"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_inventario_almacenes: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_movimiento_productos', methods=['GET'])
def obtener_movimiento_productos_route():
    """Obtiene los movimientos de productos (envíos)"""
    try:
        print("Solicitud recibida en /obtener_movimiento_productos")
        result = reportes_service.obtener_movimiento_productos()
        
        if result['success']:
            print(f"Respuesta exitosa, cantidad de movimientos: {len(result.get('movimientos', []))}")
            return jsonify(result), 200
        else:
            print("Error en la función:", result.get('message'))
            return jsonify({
                "success": False,
                "message": result.get('message', 'Error al obtener movimientos de productos')
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_movimiento_productos_route: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_rendimiento_almacenes', methods=['GET'])
def obtener_rendimiento_almacenes_route():
    """Obtiene el rendimiento de los almacenes"""
    try:
        result = reportes_service.obtener_rendimiento_almacenes()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener rendimiento de almacenes"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_rendimiento_almacenes: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

# ============================
# RUTAS PARA DATOS - REPORTES 07-12
# ============================

@main.route('/obtener_vehiculos', methods=['GET'])
def obtener_vehiculos_route():
    """Obtiene la lista de vehículos con sus asignaciones actuales"""
    try:
        result = reportes_service.obtener_vehiculos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener vehículos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_vehiculos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_asignaciones_completo', methods=['GET'])
def obtener_asignaciones_completo_route():
    """Obtiene todas las asignaciones vehículo-conductor con detalles"""
    try:
        result = reportes_service.obtener_asignaciones_completo()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener asignaciones"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_asignaciones_completo: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_rendimiento_vehiculos', methods=['GET'])
def obtener_rendimiento_vehiculos_route():
    """Obtiene datos de rendimiento de vehículos basado en envíos"""
    try:
        result = reportes_service.obtener_rendimiento_vehiculos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener rendimiento de vehículos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_rendimiento_vehiculos: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

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
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
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
        producto_id = request.args.get('producto_id')
        anio = request.args.get('anio')
        
        if fecha_inicio:
            fecha_inicio = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
        if fecha_fin:
            fecha_fin = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
        
        if tipo == 1:
            # Reporte de comparativa de stock
            data = reportes_service.obtener_inventario_almacenes()
        elif tipo == 2:
            # Reporte de análisis de productos
            data = reportes_service.obtener_analisis_productos()
        elif tipo == 3 and producto_id:
            # Reporte de tendencia de producto
            data = reportes_service.obtener_tendencia_producto(int(producto_id), int(anio) if anio else None)
        elif tipo == 4:
            # Reporte de inventario de almacenes
            data = reportes_service.obtener_inventario_almacenes()
        elif tipo == 5:
            # Reporte de movimiento de productos
            data = reportes_service.obtener_movimiento_productos()
        elif tipo == 6:
            # Reporte de rendimiento de almacenes
            data = reportes_service.obtener_rendimiento_almacenes()
        elif tipo == 10:
            # Reporte de rendimiento de conductores
            data = reportes_service.obtener_todos_envios_conductores(fecha_inicio, fecha_fin)
        elif tipo == 11 and conductor_id:
            # Reporte de productividad por conductor
            data = reportes_service.obtener_envios_por_conductor(int(conductor_id), fecha_inicio, fecha_fin)
        elif tipo == 12:
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
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500
    
@main.route('/obtener_demanda_mensual_historica', methods=['GET'])
def obtener_demanda_mensual_historica_route():
    """Obtiene la demanda mensual histórica de la base de datos"""
    try:
        result = reportes_service.obtener_demanda_mensual_historica()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener demanda mensual histórica"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_demanda_mensual_historica: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500