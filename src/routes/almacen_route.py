from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import almacen_service
from ..models.models import db, almacen
import hashlib
import os
from src.services import almacen_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime
import traceback

main = Blueprint("almacen", __name__, url_prefix="/main/almacen")

# ============================
# RUTAS PARA VISTAS
# ============================

@main.route('/gestionar_almacenes')
def gestionar_almacenes():
    return render_template('almacenes.html')

@main.route('/cantidad_almacenes')
def cantidad_almacenes():
    return render_template('cantidad_almacenes.html')

@main.route('/distribuir_almacenes')
def distribuir_almacenes():
    return render_template('distribuir_almacenes.html')

# ============================
# RUTAS PARA ALMACENES (CRUD BÁSICO)
# ============================

@main.route("/obtener_almacenes", methods=["GET"])
def obtener_almacenes():
    try:
        result = almacen_service.obtener_almacenes()
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_almacenes: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_almacen/<int:id>", methods=["GET"])
def obtener_almacen(id):
    try:
        result = almacen_service.obtener_almacen_por_id(id)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if "no encontrado" in result.get("error", "") else 500
    except Exception as e:
        print(f"Error en obtener_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/registrar", methods=["POST"])
def registrar_almacen():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        campos_requeridos = ["nombre", "tipo_almacen", "direccion", "capacidad", "latitud", "longitud"]
        for campo in campos_requeridos:
            if campo not in data or data[campo] is None or data[campo] == "":
                return jsonify({"success": False, "error": f"El campo {campo} es requerido"}), 400
        nombre = data.get("nombre")
        tipo_almacen = data.get("tipo_almacen")
        direccion = data.get("direccion")
        capacidad = data.get("capacidad")
        latitud = data.get("latitud")
        longitud = data.get("longitud")
        # Estado por defecto ACTIVO
        estado = "ACTIVO"
        # Opcional: si se envía estado, usarlo (para mantener compatibilidad)
        if "estado" in data and data["estado"]:
            estado = data.get("estado")
        
        if not isinstance(capacidad, (int, float)) or capacidad <= 0:
            return jsonify({"success": False, "error": "La capacidad debe ser un número positivo"}), 400
        if latitud < -90 or latitud > 90:
            return jsonify({"success": False, "error": "Latitud fuera de rango (-90 a 90)"}), 400
        if longitud < -180 or longitud > 180:
            return jsonify({"success": False, "error": "Longitud fuera de rango (-180 a 180)"}), 400
        result = almacen_service.crear_almacen(nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado)
        if result["success"]:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error en registrar_almacen: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/actualizar_almacen/<int:id>", methods=["PUT"])
def actualizar_almacen(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        campos_requeridos = ["nombre", "tipo_almacen", "direccion", "capacidad", "latitud", "longitud"]
        for campo in campos_requeridos:
            if campo not in data or data[campo] is None or data[campo] == "":
                return jsonify({"success": False, "error": f"El campo {campo} es requerido"}), 400
        nombre = data.get("nombre")
        tipo_almacen = data.get("tipo_almacen")
        direccion = data.get("direccion")
        capacidad = data.get("capacidad")
        latitud = data.get("latitud")
        longitud = data.get("longitud")
        # Mantener estado actual si no se envía, o usar el enviado
        estado = data.get("estado") if "estado" in data else None
        
        if not isinstance(capacidad, (int, float)) or capacidad <= 0:
            return jsonify({"success": False, "error": "La capacidad debe ser un número positivo"}), 400
        if latitud < -90 or latitud > 90:
            return jsonify({"success": False, "error": "Latitud fuera de rango (-90 a 90)"}), 400
        if longitud < -180 or longitud > 180:
            return jsonify({"success": False, "error": "Longitud fuera de rango (-180 a 180)"}), 400
        result = almacen_service.actualizar_almacen(id, nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if "no encontrado" in result.get("error", "") else 400
    except Exception as e:
        print(f"Error en actualizar_almacen: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/cambiar_estado/<int:id>", methods=["PUT"])
def cambiar_estado_almacen(id):
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se especificó el nuevo estado"}), 400
        nuevo_estado = data.get('estado')
        if nuevo_estado not in ['ACTIVO', 'INACTIVO', 'MANTENIMIENTO']:
            return jsonify({"success": False, "error": "Estado no válido"}), 400
        result = almacen_service.cambiar_estado_almacen(id, nuevo_estado)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if "no encontrado" in result.get("error", "") else 400
    except Exception as e:
        print(f"Error en cambiar_estado_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/eliminar_almacen/<int:id>", methods=["DELETE"])
def eliminar_almacen(id):
    try:
        result = almacen_service.eliminar_almacen(id)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if "no encontrado" in result.get("error", "") else 400
    except Exception as e:
        print(f"Error en eliminar_almacen: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/verificar_nombre/<nombre>", methods=["GET"])
def verificar_nombre(nombre):
    try:
        exclude_id = request.args.get('exclude_id', type=int)
        result = almacen_service.verificar_nombre_disponible(nombre, exclude_id)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en verificar_nombre: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_almacenes_activos", methods=["GET"])
def obtener_almacenes_activos():
    try:
        result = almacen_service.obtener_almacenes_activos()
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_almacenes_activos: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_almacenes_cercanos", methods=["GET"])
def obtener_almacenes_cercanos():
    try:
        latitud = request.args.get('latitud', type=float)
        longitud = request.args.get('longitud', type=float)
        radio = request.args.get('radio', 10, type=float)
        if latitud is None or longitud is None:
            return jsonify({"success": False, "error": "Latitud y longitud son requeridas"}), 400
        result = almacen_service.obtener_almacenes_cercanos(latitud, longitud, radio)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_almacenes_cercanos: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/estadisticas", methods=["GET"])
def obtener_estadisticas():
    try:
        result = almacen_service.contar_almacenes_por_estado()
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_estadisticas: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# ============================
# RUTAS PARA GESTIÓN DE STOCK
# ============================

@main.route("/obtener_almacenes_con_stock", methods=["GET"])
def obtener_almacenes_con_stock():
    try:
        result = almacen_service.obtener_almacenes_con_stock()
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_almacenes_con_stock: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_almacen_con_detalle/<int:id>", methods=["GET"])
def obtener_almacen_con_detalle(id):
    try:
        result = almacen_service.obtener_almacen_con_detalle(id)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if "no encontrado" in result.get("error", "") else 500
    except Exception as e:
        print(f"Error en obtener_almacen_con_detalle: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_productos_para_agregar/<int:almacen_id>", methods=["GET"])
def obtener_productos_para_agregar(almacen_id):
    try:
        result = almacen_service.obtener_productos_para_agregar(almacen_id)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_productos_para_agregar: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/agregar_producto", methods=["POST"])
def agregar_producto_a_almacen():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        almacen_id = data.get("almacen_id")
        producto_id = data.get("producto_id")
        cantidad = data.get("cantidad")
        if not all([almacen_id, producto_id, cantidad]):
            return jsonify({"success": False, "error": "Faltan datos: almacen_id, producto_id, cantidad"}), 400
        if not isinstance(cantidad, (int, float)) or cantidad <= 0:
            return jsonify({"success": False, "error": "La cantidad debe ser un número positivo"}), 400
        result = almacen_service.agregar_producto_a_almacen(almacen_id, producto_id, cantidad)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error en agregar_producto_a_almacen: {str(e)}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/quitar_producto", methods=["POST"])
def quitar_producto_de_almacen():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        almacen_capacidad_id = data.get("almacen_capacidad_id")
        almacen_id = data.get("almacen_id")
        producto_id = data.get("producto_id")
        cantidad = data.get("cantidad")
        if not all([almacen_capacidad_id, almacen_id, producto_id, cantidad]):
            return jsonify({"success": False, "error": "Faltan datos requeridos"}), 400
        if not isinstance(cantidad, (int, float)) or cantidad <= 0:
            return jsonify({"success": False, "error": "La cantidad debe ser un número positivo"}), 400
        result = almacen_service.quitar_producto_de_almacen(almacen_capacidad_id, almacen_id, producto_id, cantidad)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error en quitar_producto_de_almacen: {str(e)}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================
# RUTAS PARA DISTRIBUCIÓN CON MODELO PKT
# ============================

@main.route('/obtener_periodos_futuros', methods=['GET'])
def obtener_periodos_futuros():
    """Obtiene todos los periodos disponibles para distribución"""
    try:
        result = almacen_service.obtener_periodos_distribucion()
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_periodos_futuros: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/clasificar_envios', methods=['POST'])
def clasificar_envios():
    """Clasifica los envíos de un periodo usando el modelo PKT.
    Si ya está asignado, retorna la distribución existente."""
    try:
        data = request.get_json()
        if not data or 'periodo' not in data:
            return jsonify({"success": False, "error": "Periodo no especificado"}), 400

        anio_str, mes_str = data['periodo'].split('-')
        anio = int(anio_str)
        mes = int(mes_str)

        result = almacen_service.clasificar_envios_para_periodo(anio, mes)

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error en clasificar_envios: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/guardar_asignacion', methods=['POST'])
def guardar_asignacion():
    """Guarda la asignación de almacenes para los envíos clasificados"""
    try:
        data = request.get_json()
        if not data or 'clasificacion' not in data:
            return jsonify({"success": False, "error": "No se recibió la clasificación"}), 400

        result = almacen_service.guardar_asignacion_almacenes(data['clasificacion'])

        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        print(f"Error en guardar_asignacion: {str(e)}")
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_asignaciones_almacen/<int:id>", methods=["GET"])
def obtener_asignaciones_almacen(id):
    """Obtiene las asignaciones de envíos para un almacén específico"""
    try:
        mes = request.args.get('mes', type=int)
        anio = request.args.get('anio', type=int)
        periodo = None
        if mes and anio:
            periodo = {'mes': mes, 'anio': anio}
        result = almacen_service.obtener_asignaciones_por_almacen(id, periodo)
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 500
    except Exception as e:
        print(f"Error en obtener_asignaciones_almacen: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500