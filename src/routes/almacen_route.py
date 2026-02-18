from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import almacen_service
from ..models.models import *
import hashlib
import os
from ..services import almacen_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime

main = Blueprint("almacen", __name__, url_prefix="/main/almacen")

@main.route('/gestionar_almacenes')
def gestionar_almacenes():
    """Renderiza la página de gestión de almacenes"""
    return render_template('almacenes.html')

@main.route("/obtener_almacenes", methods=["GET"])
def obtener_almacenes():
    """Obtiene todos los almacenes"""
    try:
        almacenes = almacen.query.all()
        
        almacenes_lista = []
        for alm in almacenes:
            almacenes_lista.append({
                "almacen_id": alm.almacen_id,
                "nombre": alm.nombre,
                "tipo_almacen": alm.tipo_almacen,
                "direccion": alm.direccion,
                "capacidad": float(alm.capacidad) if alm.capacidad else 0,
                "latitud": float(alm.latitud) if alm.latitud else None,
                "longitud": float(alm.longitud) if alm.longitud else None,
                "estado": alm.estado
            })
        
        return jsonify({
            "success": True,
            "almacenes": almacenes_lista,
            "total": len(almacenes_lista)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_almacenes: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_almacen/<int:id>", methods=["GET"])
def obtener_almacen(id):
    """Obtiene un almacén específico por ID"""
    try:
        alm = almacen.query.get(id)
        if not alm:
            return jsonify({"success": False, "error": "Almacén no encontrado"}), 404
        
        almacen_data = {
            "almacen_id": alm.almacen_id,
            "nombre": alm.nombre,
            "tipo_almacen": alm.tipo_almacen,
            "direccion": alm.direccion,
            "capacidad": float(alm.capacidad) if alm.capacidad else 0,
            "latitud": float(alm.latitud) if alm.latitud else None,
            "longitud": float(alm.longitud) if alm.longitud else None,
            "estado": alm.estado
        }
        
        return jsonify({"success": True, "almacen": almacen_data}), 200
        
    except Exception as e:
        print(f"Error en obtener_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/registrar", methods=["POST"])
def registrar_almacen():
    """Registra un nuevo almacén"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        tipo_almacen = data.get("tipo_almacen")
        direccion = data.get("direccion")
        capacidad = data.get("capacidad")
        latitud = data.get("latitud")
        longitud = data.get("longitud")
        estado = data.get("estado", "ACTIVO")
        
        if not all([nombre, tipo_almacen, direccion, capacidad, latitud, longitud]):
            return jsonify({"success": False, "error": "Todos los campos son requeridos"}), 400
        
        if not isinstance(capacidad, (int, float)) or capacidad <= 0:
            return jsonify({"success": False, "error": "La capacidad debe ser un número positivo"}), 400
        
        if latitud < -90 or latitud > 90:
            return jsonify({"success": False, "error": "Latitud fuera de rango (-90 a 90)"}), 400
        
        if longitud < -180 or longitud > 180:
            return jsonify({"success": False, "error": "Longitud fuera de rango (-180 a 180)"}), 400
        
        # Verificar si ya existe un almacén con el mismo nombre
        existe = almacen.query.filter_by(nombre=nombre).first()
        if existe:
            return jsonify({"success": False, "error": f"Ya existe un almacén con el nombre '{nombre}'"}), 400
        
        nuevo_almacen = almacen(
            nombre=nombre,
            tipo_almacen=tipo_almacen,
            direccion=direccion,
            capacidad=capacidad,
            latitud=latitud,
            longitud=longitud,
            estado=estado
        )
        
        db.session.add(nuevo_almacen)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": "Almacén registrado exitosamente",
            "almacen_id": nuevo_almacen.almacen_id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en registrar_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/actualizar_almacen/<int:id>", methods=["PUT"])
def actualizar_almacen(id):
    """Actualiza un almacén existente"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        alm = almacen.query.get(id)
        if not alm:
            return jsonify({"success": False, "error": "Almacén no encontrado"}), 404
        
        nombre = data.get("nombre")
        tipo_almacen = data.get("tipo_almacen")
        direccion = data.get("direccion")
        capacidad = data.get("capacidad")
        latitud = data.get("latitud")
        longitud = data.get("longitud")
        estado = data.get("estado")
        
        if not all([nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado]):
            return jsonify({"success": False, "error": "Todos los campos son requeridos"}), 400
        
        if not isinstance(capacidad, (int, float)) or capacidad <= 0:
            return jsonify({"success": False, "error": "La capacidad debe ser un número positivo"}), 400
        
        if latitud < -90 or latitud > 90:
            return jsonify({"success": False, "error": "Latitud fuera de rango (-90 a 90)"}), 400
        
        if longitud < -180 or longitud > 180:
            return jsonify({"success": False, "error": "Longitud fuera de rango (-180 a 180)"}), 400
        
        # Verificar si ya existe otro almacén con el mismo nombre
        existe = almacen.query.filter(almacen.nombre == nombre, almacen.almacen_id != id).first()
        if existe:
            return jsonify({"success": False, "error": f"Ya existe otro almacén con el nombre '{nombre}'"}), 400
        
        alm.nombre = nombre
        alm.tipo_almacen = tipo_almacen
        alm.direccion = direccion
        alm.capacidad = capacidad
        alm.latitud = latitud
        alm.longitud = longitud
        alm.estado = estado
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": "Almacén actualizado exitosamente"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/cambiar_estado/<int:id>", methods=["PUT"])
def cambiar_estado_almacen(id):
    """Cambia el estado de un almacén"""
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se especificó el nuevo estado"}), 400
        
        alm = almacen.query.get(id)
        if not alm:
            return jsonify({"success": False, "error": "Almacén no encontrado"}), 404
        
        nuevo_estado = data.get('estado')
        if nuevo_estado not in ['ACTIVO', 'INACTIVO']:
            return jsonify({"success": False, "error": "Estado no válido"}), 400
        
        alm.estado = nuevo_estado
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": f"Estado cambiado a {nuevo_estado} exitosamente",
            "estado": alm.estado
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en cambiar_estado_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/eliminar_almacen/<int:id>", methods=["DELETE"])
def eliminar_almacen(id):
    """Elimina un almacén del sistema"""
    try:
        alm = almacen.query.get(id)
        if not alm:
            return jsonify({"success": False, "error": "Almacén no encontrado"}), 404
        
        # Verificar si hay relaciones antes de eliminar
        # Por ahora, eliminación directa. En producción, verificar almacen_capacidad y distribucion_almacen_producto
        
        db.session.delete(alm)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": "Almacén eliminado exitosamente"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en eliminar_almacen: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/verificar_nombre/<nombre>", methods=["GET"])
def verificar_nombre(nombre):
    """Verifica si un nombre de almacén está disponible"""
    try:
        existe = almacen.query.filter_by(nombre=nombre).first() is not None
        return jsonify({
            "disponible": not existe,
            "mensaje": "Nombre disponible" if not existe else "El nombre ya está en uso"
        }), 200
    except Exception as e:
        print(f"Error en verificar_nombre: {str(e)}")
        return jsonify({"error": str(e)}), 500

@main.route("/obtener_almacenes_cercanos", methods=["GET"])
def obtener_almacenes_cercanos():
    """Obtiene almacenes cercanos a una ubicación"""
    try:
        latitud = request.args.get('latitud', type=float)
        longitud = request.args.get('longitud', type=float)
        radio = request.args.get('radio', 10, type=float)
        
        if latitud is None or longitud is None:
            return jsonify({"success": False, "error": "Latitud y longitud son requeridas"}), 400
        
        # Esta consulta usa la fórmula de Haversine para calcular distancia
        from sqlalchemy import text
        
        almacenes_cercanos = db.session.query(almacen).filter(
            text(f"""
                6371 * acos(
                    cos(radians({latitud})) * 
                    cos(radians(latitud)) * 
                    cos(radians(longitud) - radians({longitud})) + 
                    sin(radians({latitud})) * 
                    sin(radians(latitud))
                ) <= {radio}
            """)
        ).all()
        
        resultados = []
        for alm in almacenes_cercanos:
            resultados.append({
                "almacen_id": alm.almacen_id,
                "nombre": alm.nombre,
                "tipo_almacen": alm.tipo_almacen,
                "direccion": alm.direccion,
                "capacidad": float(alm.capacidad) if alm.capacidad else 0,
                "latitud": float(alm.latitud) if alm.latitud else None,
                "longitud": float(alm.longitud) if alm.longitud else None,
                "estado": alm.estado
            })
        
        return jsonify({
            "success": True,
            "almacenes": resultados,
            "total": len(resultados)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_almacenes_cercanos: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/estadisticas", methods=["GET"])
def obtener_estadisticas():
    """Obtiene estadísticas de los almacenes"""
    try:
        total = almacen.query.count()
        activos = almacen.query.filter_by(estado='ACTIVO').count()
        inactivos = almacen.query.filter_by(estado='INACTIVO').count()
        mantenimiento = almacen.query.filter_by(estado='MANTENIMIENTO').count()
        
        return jsonify({
            "success": True,
            "estadisticas": {
                "total": total,
                "activos": activos,
                "inactivos": inactivos,
                "mantenimiento": mantenimiento
            }
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_estadisticas: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_almacenes_activos', methods=['GET'])
def obtener_almacenes_activos():
    """Obtiene todos los almacenes activos para selects"""
    try:
        almacenes_activos = almacen.query.filter_by(estado='ACTIVO').all()
        
        almacenes_lista = []
        for alm in almacenes_activos:
            almacenes_lista.append({
                "almacen_id": alm.almacen_id,
                "nombre": alm.nombre,
                "tipo_almacen": alm.tipo_almacen,
                "capacidad": float(alm.capacidad) if alm.capacidad else 0
            })
        
        return jsonify({
            "success": True,
            "almacenes": almacenes_lista,
            "total": len(almacenes_lista)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_almacenes_activos: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500