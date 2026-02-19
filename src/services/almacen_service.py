from ..models.models import db, almacen, almacencapacidad, producto
from sqlalchemy import text, func
import traceback

# ============================
# FUNCIONES PARA ALMACENES (CRUD BÁSICO)
# ============================

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
        print(f"Error en obtener_almacenes: {str(e)}")
        traceback.print_exc()
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
        print(f"Error en obtener_almacen_por_id: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def crear_almacen(nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado):
    """
    Crea un nuevo almacén en la base de datos
    """
    try:
        # Verificar si ya existe un almacén con el mismo nombre
        existe = almacen.query.filter_by(nombre=nombre).first()
        if existe:
            return {
                "success": False,
                "error": f"Ya existe un almacén con el nombre '{nombre}'"
            }
        
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
        print(f"Error en crear_almacen: {str(e)}")
        traceback.print_exc()
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
        
        # Verificar si ya existe otro almacén con el mismo nombre
        existe = almacen.query.filter(almacen.nombre == nombre, almacen.almacen_id != almacen_id).first()
        if existe:
            return {
                "success": False,
                "error": f"Ya existe otro almacén con el nombre '{nombre}'"
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
        print(f"Error en actualizar_almacen: {str(e)}")
        traceback.print_exc()
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
        print(f"Error en cambiar_estado_almacen: {str(e)}")
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
        
        # Verificar si hay productos asociados en almacen_capacidad
        productos_asociados = almacencapacidad.query.filter_by(almacen_id=almacen_id).first()
        if productos_asociados:
            return {
                "success": False,
                "error": "No se puede eliminar el almacén porque tiene productos asociados. Elimine primero los productos del almacén."
            }
        
        db.session.delete(alm)
        db.session.commit()
        
        return {
            "success": True,
            "mensaje": "Almacén eliminado exitosamente"
        }
    
    except Exception as e:
        db.session.rollback()
        print(f"Error en eliminar_almacen: {str(e)}")
        traceback.print_exc()
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
        print(f"Error en verificar_nombre_disponible: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

def obtener_almacenes_activos():
    """
    Obtiene todos los almacenes activos
    """
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
        
        return {
            "success": True,
            "almacenes": almacenes_lista,
            "total": len(almacenes_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_almacenes_activos: {str(e)}")
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
        query = text(f"""
            SELECT * FROM almacen
            WHERE estado = 'ACTIVO'
            AND 6371 * acos(
                cos(radians({latitud})) * 
                cos(radians(latitud)) * 
                cos(radians(longitud) - radians({longitud})) + 
                sin(radians({latitud})) * 
                sin(radians(latitud))
            ) <= {radio_km}
        """)
        
        almacenes_cercanos = db.session.execute(query).fetchall()
        
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
        print(f"Error en obtener_almacenes_cercanos: {str(e)}")
        traceback.print_exc()
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
            "estadisticas": {
                "ACTIVO": activos,
                "INACTIVO": inactivos,
                "MANTENIMIENTO": mantenimiento,
                "total": activos + inactivos + mantenimiento
            }
        }
    
    except Exception as e:
        print(f"Error en contar_almacenes_por_estado: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }

# ============================
# FUNCIONES PARA GESTIÓN DE STOCK (ALMACEN_CAPACIDAD)
# ============================

def obtener_almacenes_con_stock():
    """
    Obtiene todos los almacenes con la suma total de productos que tienen almacenados.
    """
    try:
        # Subconsulta para calcular el total ocupado por almacén
        subquery = db.session.query(
            almacencapacidad.almacen_id,
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0).label('total_ocupado')
        ).group_by(almacencapacidad.almacen_id).subquery()

        # Consulta principal que une almacenes con la subconsulta
        almacenes_con_total = db.session.query(
            almacen,
            func.coalesce(subquery.c.total_ocupado, 0).label('total_ocupado')
        ).outerjoin(subquery, almacen.almacen_id == subquery.c.almacen_id).all()

        resultados = []
        for alm, total_ocupado in almacenes_con_total:
            resultados.append({
                "almacen_id": alm.almacen_id,
                "nombre": alm.nombre,
                "tipo_almacen": alm.tipo_almacen,
                "direccion": alm.direccion,
                "capacidad": float(alm.capacidad) if alm.capacidad else 0,
                "latitud": float(alm.latitud) if alm.latitud else None,
                "longitud": float(alm.longitud) if alm.longitud else None,
                "estado": alm.estado,
                "total_ocupado": float(total_ocupado)
            })
        
        return {"success": True, "almacenes": resultados}
    
    except Exception as e:
        print(f"Error en obtener_almacenes_con_stock: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def obtener_almacen_con_detalle(almacen_id):
    """
    Obtiene un almacén específico, incluyendo la lista de productos que contiene.
    """
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}

        # Calcular el total ocupado
        total_ocupado = db.session.query(
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0)
        ).filter(almacencapacidad.almacen_id == almacen_id).scalar()

        # Obtener los productos en este almacén
        productos_en_almacen = db.session.query(
            almacencapacidad, producto
        ).join(
            producto, almacencapacidad.producto_id == producto.producto_id
        ).filter(
            almacencapacidad.almacen_id == almacen_id
        ).all()

        productos_lista = []
        for ac, prod in productos_en_almacen:
            productos_lista.append({
                "almacen_capacidad_id": ac.almacen_capacidad_id,
                "producto_id": prod.producto_id,
                "producto_nombre": prod.nombre,
                "cant_productos_act": float(ac.cant_productos_act)
            })

        almacen_data = {
            "almacen_id": alm.almacen_id,
            "nombre": alm.nombre,
            "tipo_almacen": alm.tipo_almacen,
            "direccion": alm.direccion,
            "capacidad": float(alm.capacidad),
            "latitud": float(alm.latitud) if alm.latitud else None,
            "longitud": float(alm.longitud) if alm.longitud else None,
            "estado": alm.estado,
            "total_ocupado": float(total_ocupado),
            "productos": productos_lista
        }
        return {"success": True, "almacen": almacen_data}

    except Exception as e:
        print(f"Error en obtener_almacen_con_detalle: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def obtener_productos_para_agregar(almacen_id):
    """
    Obtiene productos que tienen stock global (cant_productos_act > 0)
    """
    try:
        # Productos con stock disponible
        productos_con_stock = producto.query.filter(producto.cant_productos_act > 0).all()
        
        productos_lista = []
        for prod in productos_con_stock:
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "cant_productos_act": float(prod.cant_productos_act)
            })
        
        return {"success": True, "productos": productos_lista}
    
    except Exception as e:
        print(f"Error en obtener_productos_para_agregar: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def agregar_producto_a_almacen(almacen_id, producto_id, cantidad):
    """
    Agrega o incrementa la cantidad de un producto en un almacén.
    Valida el stock global del producto y la capacidad del almacén.
    """
    try:
        # 1. Obtener el almacén y validar capacidad
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
        
        # Calcular espacio actualmente ocupado
        total_ocupado = db.session.query(
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0)
        ).filter(almacencapacidad.almacen_id == almacen_id).scalar()
        
        if (total_ocupado + cantidad) > alm.capacidad:
            espacio_disponible = alm.capacidad - total_ocupado
            return {
                "success": False, 
                "error": f"La operación excede la capacidad del almacén. Espacio disponible: {espacio_disponible:.2f} kg"
            }

        # 2. Obtener el producto y validar stock global
        prod = producto.query.get(producto_id)
        if not prod:
            return {"success": False, "error": "Producto no encontrado"}
        
        if prod.cant_productos_act < cantidad:
            return {
                "success": False, 
                "error": f"Stock global insuficiente. Stock disponible: {prod.cant_productos_act:.2f} kg"
            }

        # 3. Buscar si ya existe el producto en el almacén
        almacen_prod = almacencapacidad.query.filter_by(
            almacen_id=almacen_id, 
            producto_id=producto_id
        ).first()

        if almacen_prod:
            # Si existe, incrementar la cantidad
            almacen_prod.cant_productos_act += cantidad
        else:
            # Si no existe, crear nuevo registro
            almacen_prod = almacencapacidad(
                almacen_id=almacen_id,
                producto_id=producto_id,
                cant_productos_act=cantidad
            )
            db.session.add(almacen_prod)

        # 4. Disminuir el stock global del producto
        prod.cant_productos_act -= cantidad

        db.session.commit()
        return {"success": True, "mensaje": "Producto agregado/actualizado en el almacén"}

    except Exception as e:
        db.session.rollback()
        print(f"Error en agregar_producto_a_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def quitar_producto_de_almacen(almacen_capacidad_id, almacen_id, producto_id, cantidad):
    """
    Disminuye o elimina la cantidad de un producto en un almacén.
    Valida que no se pueda quitar más de lo que hay.
    """
    try:
        # 1. Buscar el registro en almacen_capacidad
        almacen_prod = almacencapacidad.query.get(almacen_capacidad_id)
        if not almacen_prod:
            return {"success": False, "error": "Registro de producto en almacén no encontrado"}

        # 2. Validar que la cantidad a quitar no sea mayor a la existente
        if almacen_prod.cant_productos_act < cantidad:
            return {
                "success": False, 
                "error": f"No se puede quitar más de lo que hay. Cantidad actual: {almacen_prod.cant_productos_act:.2f} kg"
            }

        # 3. Obtener el producto para devolver el stock global
        prod = producto.query.get(producto_id)
        if not prod:
            return {"success": False, "error": "Producto no encontrado"}

        # 4. Disminuir o eliminar el registro de almacen_capacidad
        almacen_prod.cant_productos_act -= cantidad

        # Si la cantidad llega a cero, eliminar el registro
        if almacen_prod.cant_productos_act == 0:
            db.session.delete(almacen_prod)

        # 5. Aumentar el stock global del producto
        prod.cant_productos_act += cantidad

        db.session.commit()
        return {"success": True, "mensaje": "Producto quitado del almacén"}

    except Exception as e:
        db.session.rollback()
        print(f"Error en quitar_producto_de_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}