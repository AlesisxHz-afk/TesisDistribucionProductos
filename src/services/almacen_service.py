from ..models.models import db, almacen
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename

def obtener_almacenes():
    """
    Obtiene todos los almacenes de la base de datos
    """
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
        
        return {
            "success": True,
            "almacenes": almacenes_lista,
            "total": len(almacenes_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los almacenes"
        }

def obtener_almacen_por_id(almacen_id):
    """
    Obtiene un almacén específico por su ID
    """
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {
                "success": False,
                "error": "Almacén no encontrado"
            }
        
        return {
            "success": True,
            "almacen": {
                "almacen_id": alm.almacen_id,
                "nombre": alm.nombre,
                "tipo_almacen": alm.tipo_almacen,
                "direccion": alm.direccion,
                "capacidad": float(alm.capacidad) if alm.capacidad else 0,
                "latitud": float(alm.latitud) if alm.latitud else None,
                "longitud": float(alm.longitud) if alm.longitud else None,
                "estado": alm.estado
            }
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def crear_almacen(nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado):
    """
    Crea un nuevo almacén en la base de datos
    """
    try:
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
        
        return {
            "success": True,
            "mensaje": "Almacén creado exitosamente",
            "almacen_id": nuevo_almacen.almacen_id
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "error": str(e)
        }

def actualizar_almacen(almacen_id, nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado):
    """
    Actualiza un almacén existente
    """
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {
                "success": False,
                "error": "Almacén no encontrado"
            }
        
        alm.nombre = nombre
        alm.tipo_almacen = tipo_almacen
        alm.direccion = direccion
        alm.capacidad = capacidad
        alm.latitud = latitud
        alm.longitud = longitud
        alm.estado = estado
        
        db.session.commit()
        
        return {
            "success": True,
            "mensaje": "Almacén actualizado exitosamente"
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "error": str(e)
        }

def cambiar_estado_almacen(almacen_id, nuevo_estado):
    """
    Cambia el estado de un almacén
    """
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {
                "success": False,
                "error": "Almacén no encontrado"
            }
        
        alm.estado = nuevo_estado
        db.session.commit()
        
        return {
            "success": True,
            "mensaje": f"Estado del almacén cambiado a {nuevo_estado}"
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "error": str(e)
        }

def eliminar_almacen(almacen_id):
    """
    Elimina un almacén de la base de datos
    """
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {
                "success": False,
                "error": "Almacén no encontrado"
            }
        
        db.session.delete(alm)
        db.session.commit()
        
        return {
            "success": True,
            "mensaje": "Almacén eliminado exitosamente"
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "error": str(e)
        }

def verificar_nombre_disponible(nombre, exclude_id=None):
    """
    Verifica si un nombre de almacén está disponible
    """
    try:
        query = almacen.query.filter_by(nombre=nombre)
        if exclude_id:
            query = query.filter(almacen.almacen_id != exclude_id)
        
        existe = query.first() is not None
        
        return {
            "success": True,
            "disponible": not existe,
            "mensaje": "Nombre disponible" if not existe else "El nombre ya está en uso"
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def obtener_almacenes_cercanos(latitud, longitud, radio_km=10):
    """
    Obtiene almacenes cercanos a una ubicación específica
    """
    try:
        # Fórmula de Haversine para calcular distancia
        # 6371 es el radio de la Tierra en km
        almacenes_cercanos = db.session.query(almacen).filter(
            text(f"""
                6371 * acos(
                    cos(radians({latitud})) * 
                    cos(radians(latitud)) * 
                    cos(radians(longitud) - radians({longitud})) + 
                    sin(radians({latitud})) * 
                    sin(radians(latitud))
                ) <= {radio_km}
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
        
        return {
            "success": True,
            "almacenes": resultados,
            "total": len(resultados)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def contar_almacenes_por_estado():
    """
    Obtiene el conteo de almacenes agrupados por estado
    """
    try:
        activos = almacen.query.filter_by(estado='ACTIVO').count()
        inactivos = almacen.query.filter_by(estado='INACTIVO').count()
        mantenimiento = almacen.query.filter_by(estado='MANTENIMIENTO').count()
        
        return {
            "success": True,
            "conteo": {
                "ACTIVO": activos,
                "INACTIVO": inactivos,
                "MANTENIMIENTO": mantenimiento,
                "total": activos + inactivos + mantenimiento
            }
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }