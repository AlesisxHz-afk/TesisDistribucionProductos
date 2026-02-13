from ..models.models import db, producto
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename

def obtener_productos():
    """
    Obtiene todos los productos de la base de datos
    """
    try:
        # Obtener todos los productos
        productos = producto.query.all()
        
        # Convertir los resultados a una lista de diccionarios
        productos_lista = []
        for prod in productos:
            # Obtener el nombre de la foto directamente
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            # Si la foto no tiene extensión, agregar .jpg
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los productos"
        }


def obtener_producto_por_id(producto_id):
    """
    Obtiene un producto específico por su ID
    """
    try:
        prod = producto.query.get(producto_id)
        
        if not prod:
            return {
                "success": False,
                "message": "Producto no encontrado"
            }
        
        # Obtener el nombre de la foto directamente
        foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
        
        # Si la foto no tiene extensión, agregar .jpg
        if foto_producto and '.' not in foto_producto:
            foto_producto = f"{foto_producto}.jpg"
        
        producto_data = {
            "producto_id": prod.producto_id,
            "nombre": prod.nombre,
            "tipo": prod.tipo,
            "variedad": prod.variedad,
            "descripcion": prod.descripcion,
            "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
            "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
            "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
            "estado_producto": prod.estado_producto,
            "foto_producto": foto_producto
        }
        
        return {
            "success": True,
            "producto": producto_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el producto"
        }


def obtener_productos_destacados(limit=8):
    """
    Obtiene productos destacados (los primeros 'limit' productos)
    """
    try:
        productos = producto.query.limit(limit).all()
        
        productos_lista = []
        for prod in productos:
            # Obtener el nombre de la foto directamente
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            # Si la foto no tiene extensión, agregar .jpg
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener productos destacados"
        }


def obtener_productos_filtrados(filtros=None):
    """
    Obtiene productos con filtros opcionales
    """
    try:
        query = producto.query
        
        if filtros:
            # Aplicar filtros si se proporcionan
            if 'tipo' in filtros and filtros['tipo']:
                query = query.filter(producto.tipo == filtros['tipo'])
            
            if 'variedad' in filtros and filtros['variedad']:
                query = query.filter(producto.variedad == filtros['variedad'])
            
            if 'estado_producto' in filtros and filtros['estado_producto']:
                query = query.filter(producto.estado_producto == filtros['estado_producto'])
            
            if 'nombre' in filtros and filtros['nombre']:
                query = query.filter(producto.nombre.ilike(f"%{filtros['nombre']}%"))
        
        productos = query.all()
        
        # Convertir a lista de diccionarios
        productos_lista = []
        for prod in productos:
            # Obtener el nombre de la foto directamente
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            # Si la foto no tiene extensión, agregar .jpg
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista),
            "filtros_aplicados": filtros if filtros else {}
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener productos filtrados"
        }