from ..models.models import db, almacen, almacencapacidad, producto, distribucionalmacenproducto
from sqlalchemy import text, func
import traceback
import pickle
import os
import random
import numpy as np
import pandas as pd
from datetime import datetime

# ============================
# FUNCIONES PARA ALMACENES (CRUD BÁSICO)
# ============================

def obtener_almacenes():
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
        return {"success": True, "almacenes": almacenes_lista, "total": len(almacenes_lista)}
    except Exception as e:
        print(f"Error en obtener_almacenes: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "message": "Error al obtener los almacenes"}

def obtener_almacen_por_id(almacen_id):
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
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
        return {"success": False, "error": str(e)}

def crear_almacen(nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado):
    try:
        existe = almacen.query.filter_by(nombre=nombre).first()
        if existe:
            return {"success": False, "error": f"Ya existe un almacén con el nombre '{nombre}'"}
        nuevo_almacen = almacen(
            nombre=nombre, tipo_almacen=tipo_almacen, direccion=direccion,
            capacidad=capacidad, latitud=latitud, longitud=longitud, estado=estado
        )
        db.session.add(nuevo_almacen)
        db.session.commit()
        return {"success": True, "mensaje": "Almacén creado exitosamente", "almacen_id": nuevo_almacen.almacen_id}
    except Exception as e:
        db.session.rollback()
        print(f"Error en crear_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def actualizar_almacen(almacen_id, nombre, tipo_almacen, direccion, capacidad, latitud, longitud, estado=None):
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
        existe = almacen.query.filter(almacen.nombre == nombre, almacen.almacen_id != almacen_id).first()
        if existe:
            return {"success": False, "error": f"Ya existe otro almacén con el nombre '{nombre}'"}
        alm.nombre = nombre
        alm.tipo_almacen = tipo_almacen
        alm.direccion = direccion
        alm.capacidad = capacidad
        alm.latitud = latitud
        alm.longitud = longitud
        # Solo actualizar estado si se proporciona
        if estado is not None:
            alm.estado = estado
        db.session.commit()
        return {"success": True, "mensaje": "Almacén actualizado exitosamente"}
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def cambiar_estado_almacen(almacen_id, nuevo_estado):
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
        alm.estado = nuevo_estado
        db.session.commit()
        return {"success": True, "mensaje": f"Estado del almacén cambiado a {nuevo_estado}"}
    except Exception as e:
        db.session.rollback()
        print(f"Error en cambiar_estado_almacen: {str(e)}")
        return {"success": False, "error": str(e)}

def eliminar_almacen(almacen_id):
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
        
        # Contar cuántos envíos tiene asociados
        cantidad_envios = distribucionalmacenproducto.query.filter_by(almacen_id=almacen_id).count()
        
        if cantidad_envios > 0:
            return {
                "success": False, 
                "error": f"No se puede eliminar el almacén '{alm.nombre}' porque tiene {cantidad_envios} envío(s) registrado(s)"
            }
        
        # Verificar si tiene productos asociados en almacencapacidad
        productos_asociados = almacencapacidad.query.filter_by(almacen_id=almacen_id).first()
        if productos_asociados:
            return {
                "success": False, 
                "error": f"No se puede eliminar el almacén '{alm.nombre}' porque tiene productos almacenados"
            }
        
        db.session.delete(alm)
        db.session.commit()
        return {"success": True, "mensaje": "Almacén eliminado exitosamente"}
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en eliminar_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": f"Error al eliminar: {str(e)}"}

def verificar_nombre_disponible(nombre, exclude_id=None):
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
        return {"success": False, "error": str(e)}

def obtener_almacenes_activos():
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
        return {"success": True, "almacenes": almacenes_lista, "total": len(almacenes_lista)}
    except Exception as e:
        print(f"Error en obtener_almacenes_activos: {str(e)}")
        return {"success": False, "error": str(e)}

def obtener_almacenes_cercanos(latitud, longitud, radio_km=10):
    try:
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
        return {"success": True, "almacenes": resultados, "total": len(resultados)}
    except Exception as e:
        print(f"Error en obtener_almacenes_cercanos: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def contar_almacenes_por_estado():
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
        return {"success": False, "error": str(e)}

# ============================
# FUNCIONES PARA GESTIÓN DE STOCK (ALMACEN_CAPACIDAD)
# ============================

def obtener_almacenes_con_stock():
    try:
        subquery = db.session.query(
            almacencapacidad.almacen_id,
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0).label('total_ocupado')
        ).group_by(almacencapacidad.almacen_id).subquery()

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
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}

        total_ocupado = db.session.query(
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0)
        ).filter(almacencapacidad.almacen_id == almacen_id).scalar()

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
                "nombre": prod.nombre,
                "foto_producto": prod.foto_producto,
                "cant_productos_act": float(ac.cant_productos_act) if ac.cant_productos_act else 0,
                "cantidad": float(ac.cant_productos_act) if ac.cant_productos_act else 0
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
            "productos": productos_lista,
            "total_productos": len(productos_lista)
        }
        return {"success": True, "almacen": almacen_data}
    except Exception as e:
        print(f"Error en obtener_almacen_con_detalle: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def obtener_productos_para_agregar(almacen_id):
    try:
        productos_con_stock = producto.query.filter(producto.cant_productos_act > 0).all()
        productos_lista = []
        for prod in productos_con_stock:
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "variedad": prod.variedad if hasattr(prod, 'variedad') else "",  # Agregar variedad
                "cant_productos_act": float(prod.cant_productos_act)
            })
        return {"success": True, "productos": productos_lista}
    except Exception as e:
        print(f"Error en obtener_productos_para_agregar: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def agregar_producto_a_almacen(almacen_id, producto_id, cantidad):
    try:
        alm = almacen.query.get(almacen_id)
        if not alm:
            return {"success": False, "error": "Almacén no encontrado"}
        total_ocupado = db.session.query(
            func.coalesce(func.sum(almacencapacidad.cant_productos_act), 0)
        ).filter(almacencapacidad.almacen_id == almacen_id).scalar()
        if (total_ocupado + cantidad) > alm.capacidad:
            espacio_disponible = alm.capacidad - total_ocupado
            return {"success": False, "error": f"La operación excede la capacidad del almacén. Espacio disponible: {espacio_disponible:.2f} kg"}
        prod = producto.query.get(producto_id)
        if not prod:
            return {"success": False, "error": "Producto no encontrado"}
        if prod.cant_productos_act < cantidad:
            return {"success": False, "error": f"Stock global insuficiente. Stock disponible: {prod.cant_productos_act:.2f} kg"}
        almacen_prod = almacencapacidad.query.filter_by(almacen_id=almacen_id, producto_id=producto_id).first()
        if almacen_prod:
            almacen_prod.cant_productos_act += cantidad
        else:
            almacen_prod = almacencapacidad(almacen_id=almacen_id, producto_id=producto_id, cant_productos_act=cantidad)
            db.session.add(almacen_prod)
        prod.cant_productos_act -= cantidad
        db.session.commit()
        return {"success": True, "mensaje": "Producto agregado/actualizado en el almacén"}
    except Exception as e:
        db.session.rollback()
        print(f"Error en agregar_producto_a_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def quitar_producto_de_almacen(almacen_capacidad_id, almacen_id, producto_id, cantidad):
    try:
        almacen_prod = almacencapacidad.query.get(almacen_capacidad_id)
        if not almacen_prod:
            return {"success": False, "error": "Registro de producto en almacén no encontrado"}
        if almacen_prod.cant_productos_act < cantidad:
            return {"success": False, "error": f"No se puede quitar más de lo que hay. Cantidad actual: {almacen_prod.cant_productos_act:.2f} kg"}
        prod = producto.query.get(producto_id)
        if not prod:
            return {"success": False, "error": "Producto no encontrado"}
        almacen_prod.cant_productos_act -= cantidad
        if almacen_prod.cant_productos_act == 0:
            db.session.delete(almacen_prod)
        prod.cant_productos_act += cantidad
        db.session.commit()
        return {"success": True, "mensaje": "Producto quitado del almacén"}
    except Exception as e:
        db.session.rollback()
        print(f"Error en quitar_producto_de_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


# ============================================================================
# FUNCIONES PARA DISTRIBUCIÓN CON MODELO PKT
# ============================================================================

def obtener_periodos_distribucion():
    """
    Obtiene los periodos desde el mes actual en adelante que tienen registros
    en distribucion_almacen_producto, indicando si ya están completamente
    asignados o tienen envíos pendientes.
    """
    try:
        fecha_actual = datetime.now().date()
        mes_actual = fecha_actual.month
        anio_actual = fecha_actual.year

        query = text("""
            SELECT 
                anio,
                mes,
                COUNT(*) as total_envios,
                SUM(CASE WHEN almacen_id IS NOT NULL AND almacen_id != 0 THEN 1 ELSE 0 END) as envios_asignados
            FROM distribucion_almacen_producto
            WHERE anio IS NOT NULL AND mes IS NOT NULL
            AND (anio > :anio_actual OR (anio = :anio_actual AND mes >= :mes_actual))
            GROUP BY anio, mes
            ORDER BY anio, mes
        """)
        result = db.session.execute(query, {'anio_actual': anio_actual, 'mes_actual': mes_actual})
        periodos = result.fetchall()

        periodos_lista = []
        meses_nombre = {
            1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
            7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
        }

        for anio, mes, total_envios, envios_asignados in periodos:
            ya_asignado = (envios_asignados == total_envios and total_envios > 0)
            periodos_lista.append({
                'anio': anio,
                'mes': mes,
                'nombre': f"{meses_nombre.get(mes, 'Mes')} {anio}",
                'total_envios': total_envios,
                'envios_asignados': envios_asignados,
                'ya_asignado': ya_asignado
            })

        return {"success": True, "periodos": periodos_lista}
    except Exception as e:
        print(f"Error en obtener_periodos_distribucion: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def obtener_periodos_futuros():
    """
    Mantiene compatibilidad - redirige a obtener_periodos_distribucion
    """
    return obtener_periodos_distribucion()


def verificar_periodo_asignado(anio, mes):
    """
    Verifica si todos los envíos de un periodo ya tienen almacén asignado.
    Retorna True si ya están todos asignados.
    """
    try:
        total = db.session.query(func.count(distribucionalmacenproducto.asignacion_id)).filter(
            distribucionalmacenproducto.anio == anio,
            distribucionalmacenproducto.mes == mes
        ).scalar()

        sin_asignar = db.session.query(func.count(distribucionalmacenproducto.asignacion_id)).filter(
            distribucionalmacenproducto.anio == anio,
            distribucionalmacenproducto.mes == mes,
            (distribucionalmacenproducto.almacen_id == None) | (distribucionalmacenproducto.almacen_id == 0)
        ).scalar()

        return total > 0 and sin_asignar == 0
    except Exception as e:
        print(f"Error en verificar_periodo_asignado: {str(e)}")
        return False


def obtener_distribucion_existente(anio, mes):
    """
    Obtiene la distribución ya guardada para un periodo, agrupada por almacén.
    """
    try:
        query = db.session.query(
            distribucionalmacenproducto,
            producto,
            almacen
        ).join(
            producto, distribucionalmacenproducto.producto_id == producto.producto_id
        ).join(
            almacen, distribucionalmacenproducto.almacen_id == almacen.almacen_id
        ).filter(
            distribucionalmacenproducto.anio == anio,
            distribucionalmacenproducto.mes == mes,
            distribucionalmacenproducto.almacen_id != None
        ).all()

        # Agrupar por almacén
        almacenes_dict = {}
        for asig, prod, alm in query:
            alm_id = alm.almacen_id
            if alm_id not in almacenes_dict:
                almacenes_dict[alm_id] = {
                    'almacen_id': alm_id,
                    'almacen_nombre': alm.nombre,
                    'tipo_almacen': alm.tipo_almacen,
                    'envios': []
                }
            almacenes_dict[alm_id]['envios'].append({
                'asignacion_id': asig.asignacion_id,
                'producto_id': prod.producto_id,
                'producto_nombre': prod.nombre,
                'foto_producto': prod.foto_producto,
                'demanda': float(asig.demanda) if asig.demanda else 0,
                'fecha_envio': asig.fecha_envio.strftime('%Y-%m-%d') if asig.fecha_envio else None,
                'dia': asig.dia,
                'mes': asig.mes,
                'anio': asig.anio,
                'estado_envio': asig.estado_envio
            })

        # Obtener todos los almacenes con su stock actualizado
        almacenes_con_stock = obtener_almacenes_con_stock()
        almacenes_stock = {a['almacen_id']: a for a in almacenes_con_stock.get('almacenes', [])}

        resultado_almacenes = []
        for alm_id, alm_data in almacenes_dict.items():
            stock_info = almacenes_stock.get(alm_id, {})
            alm_data['capacidad'] = stock_info.get('capacidad', 0)
            alm_data['total_ocupado'] = stock_info.get('total_ocupado', 0)
            alm_data['latitud'] = stock_info.get('latitud')
            alm_data['longitud'] = stock_info.get('longitud')
            alm_data['total_demanda'] = sum(e['demanda'] for e in alm_data['envios'])
            resultado_almacenes.append(alm_data)

        return {
            "success": True,
            "ya_asignado": True,
            "almacenes": resultado_almacenes,
            "almacenes_stock": list(almacenes_stock.values()),
            "total_envios": sum(len(a['envios']) for a in resultado_almacenes)
        }
    except Exception as e:
        print(f"Error en obtener_distribucion_existente: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def cargar_modelo_clasificacion():
    try:
        modelos_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'pkt')
        modelo_path = os.path.join(modelos_path, 'clasificacion_almacenes.pkl')
        if not os.path.exists(modelo_path):
            print("Modelo de clasificación no encontrado.")
            return None, None, None, None
        with open(modelo_path, 'rb') as f:
            modelo_data = pickle.load(f)
        modelo = modelo_data['modelo']
        label_encoders = modelo_data['label_encoders']
        almacen_map = modelo_data.get('almacen_map', {})
        features = modelo_data['features']
        print("Modelo de clasificación cargado exitosamente.")
        return modelo, label_encoders, almacen_map, features
    except Exception as e:
        print(f"Error cargando modelo de clasificación: {e}")
        traceback.print_exc()
        return None, None, None, None


def clasificar_envios_para_periodo(anio, mes):
    """
    Clasifica los envíos de un mes/año específico usando el modelo PKT.
    Si el periodo ya está completamente asignado, retorna la distribución existente.
    """
    try:
        # Verificar si ya está asignado
        if verificar_periodo_asignado(anio, mes):
            return obtener_distribucion_existente(anio, mes)

        # 1. Cargar modelo
        modelo, label_encoders, almacen_map, features = cargar_modelo_clasificacion()
        if modelo is None:
            return {"success": False, "error": "Modelo de clasificación no disponible. Entrena el modelo primero en Configuración."}

        # 2. Obtener envíos sin almacén asignado
        query_envios = text("""
            SELECT
                d.asignacion_id,
                d.producto_id,
                p.nombre as producto_nombre,
                p.tipo,
                p.variedad,
                p.temperatura_optima,
                p.humedad_optima,
                d.demanda,
                d.mes,
                d.anio,
                d.dia,
                d.fecha_envio,
                d.estado_envio,
                p.foto_producto
            FROM distribucion_almacen_producto d
            INNER JOIN producto p ON d.producto_id = p.producto_id
            WHERE d.anio = :anio AND d.mes = :mes
            AND (d.almacen_id IS NULL OR d.almacen_id = 0)
            ORDER BY d.asignacion_id
        """)
        envios = db.session.execute(query_envios, {'anio': anio, 'mes': mes}).fetchall()

        if not envios:
            return {"success": False, "error": f"No hay envíos sin asignar para el periodo {mes}/{anio}"}

        # 3. Obtener almacenes activos
        almacenes_activos = obtener_almacenes_con_stock()
        if not almacenes_activos['success']:
            return {"success": False, "error": "No se pudieron cargar los almacenes activos"}
        almacenes = [a for a in almacenes_activos['almacenes'] if a.get('estado') == 'ACTIVO']

        if len(almacenes) == 0:
            return {"success": False, "error": "No hay almacenes activos para asignar"}

        almacenes_dict = {alm['almacen_id']: alm for alm in almacenes}
        stocks_simulados = {alm_id: alm['total_ocupado'] for alm_id, alm in almacenes_dict.items()}

        # 4. Clasificar cada envío
        envios_clasificados = []

        for envio in envios:
            demanda_envio = float(envio.demanda) if envio.demanda else 0

            df_pred = pd.DataFrame([{
                'tipo': envio.tipo,
                'variedad': envio.variedad,
                'temperatura_optima': float(envio.temperatura_optima),
                'humedad_optima': float(envio.humedad_optima),
                'mes': int(envio.mes)
            }])

            df_pred['tipo_encoded'] = label_encoders['tipo'].transform(df_pred['tipo'])
            df_pred['variedad_encoded'] = label_encoders['variedad'].transform(df_pred['variedad'])
            df_pred['rango_temp'] = pd.cut(df_pred['temperatura_optima'],
                                          bins=[-np.inf, 5, 15, np.inf],
                                          labels=[0, 1, 2]).astype(int)
            df_pred['rango_hum'] = pd.cut(df_pred['humedad_optima'],
                                        bins=[-np.inf, 60, 80, np.inf],
                                        labels=[0, 1, 2]).astype(int)
            df_pred['mes_sin'] = np.sin(2 * np.pi * df_pred['mes'] / 12)
            df_pred['mes_cos'] = np.cos(2 * np.pi * df_pred['mes'] / 12)
            df_pred['demanda_norm'] = 0.5
            df_pred['ocupacion_porcentaje'] = 50
            df_pred['capacidad_almacen'] = 1000

            X_pred = df_pred[[f for f in features if f in df_pred.columns]]
            almacen_encoded_pred = modelo.predict(X_pred)[0]
            almacen_id_predicho = label_encoders['almacen'].inverse_transform([almacen_encoded_pred])[0]

            almacen_asignado_id = None

            # Verificar si el predicho tiene espacio
            if almacen_id_predicho in almacenes_dict:
                capacidad_total = float(almacenes_dict[almacen_id_predicho]['capacidad'])
                ocupado_actual = stocks_simulados.get(almacen_id_predicho, 0)
                if (capacidad_total - ocupado_actual) >= demanda_envio:
                    almacen_asignado_id = almacen_id_predicho

            # Si no tiene espacio, buscar otro
            if almacen_asignado_id is None:
                almacenes_con_espacio = []
                for alm_id, alm in almacenes_dict.items():
                    capacidad_total = float(alm['capacidad'])
                    ocupado_actual = stocks_simulados.get(alm_id, 0)
                    if (capacidad_total - ocupado_actual) >= demanda_envio:
                        almacenes_con_espacio.append(alm_id)

                if almacenes_con_espacio:
                    almacen_asignado_id = random.choice(almacenes_con_espacio)
                else:
                    print(f"ADVERTENCIA: Ningún almacén tiene espacio para demanda {demanda_envio}.")
                    almacen_asignado_id = almacen_id_predicho

            if almacen_asignado_id in stocks_simulados:
                stocks_simulados[almacen_asignado_id] += demanda_envio

            envios_clasificados.append({
                'asignacion_id': envio.asignacion_id,
                'producto_id': envio.producto_id,
                'producto_nombre': envio.producto_nombre,
                'foto_producto': envio.foto_producto,
                'almacen_id_sugerido': almacen_asignado_id,
                'almacen_nombre_sugerido': almacenes_dict.get(almacen_asignado_id, {}).get('nombre', 'Desconocido'),
                'demanda': demanda_envio,
                'fecha_envio': envio.fecha_envio.strftime('%Y-%m-%d') if envio.fecha_envio else None,
                'dia': envio.dia,
                'mes': envio.mes,
                'anio': envio.anio,
                'estado_envio': envio.estado_envio
            })

        # 5. Agrupar envíos clasificados por almacén
        almacenes_agrupados = {}
        for envio in envios_clasificados:
            alm_id = envio['almacen_id_sugerido']
            if alm_id not in almacenes_agrupados:
                alm_info = almacenes_dict.get(alm_id, {})
                almacenes_agrupados[alm_id] = {
                    'almacen_id': alm_id,
                    'almacen_nombre': alm_info.get('nombre', 'Desconocido'),
                    'tipo_almacen': alm_info.get('tipo_almacen', ''),
                    'capacidad': alm_info.get('capacidad', 0),
                    'total_ocupado': stocks_simulados.get(alm_id, 0),
                    'latitud': alm_info.get('latitud'),
                    'longitud': alm_info.get('longitud'),
                    'envios': []
                }
            almacenes_agrupados[alm_id]['envios'].append({
                'asignacion_id': envio['asignacion_id'],
                'producto_id': envio['producto_id'],
                'producto_nombre': envio['producto_nombre'],
                'foto_producto': envio['foto_producto'],
                'demanda': envio['demanda'],
                'fecha_envio': envio['fecha_envio'],
                'dia': envio['dia'],
                'mes': envio['mes'],
                'anio': envio['anio'],
                'estado_envio': envio['estado_envio']
            })

        for alm_id in almacenes_agrupados:
            almacenes_agrupados[alm_id]['total_demanda'] = sum(
                e['demanda'] for e in almacenes_agrupados[alm_id]['envios']
            )

        # 6. Actualizar stocks para lista de almacenes del mapa
        almacenes_actualizados = []
        for alm in almacenes:
            alm_copy = alm.copy()
            alm_copy['total_ocupado'] = stocks_simulados.get(alm['almacen_id'], alm['total_ocupado'])
            almacenes_actualizados.append(alm_copy)

        clasificacion_dict = {envio['asignacion_id']: envio['almacen_id_sugerido'] for envio in envios_clasificados}

        return {
            "success": True,
            "ya_asignado": False,
            "message": f"Se clasificaron {len(envios_clasificados)} envíos correctamente.",
            "envios": envios_clasificados,
            "almacenes_agrupados": list(almacenes_agrupados.values()),
            "almacenes_actualizados": almacenes_actualizados,
            "clasificacion": clasificacion_dict
        }

    except Exception as e:
        print(f"Error en clasificar_envios_para_periodo: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def guardar_asignacion_almacenes(clasificacion):
    """
    Guarda la clasificación:
    1. Actualiza almacen_id en distribucion_almacen_producto.
    2. Inserta o suma la demanda en almacen_capacidad (almacen_id + producto_id + demanda).
    """
    try:
        if not clasificacion:
            return {"success": False, "error": "No hay clasificación para guardar"}

        asignaciones_actualizadas = 0

        for asignacion_id, almacen_id in clasificacion.items():
            # Verificar que el almacén existe
            alm = almacen.query.get(almacen_id)
            if not alm:
                print(f"Advertencia: Almacén {almacen_id} no encontrado. Se omite asignación {asignacion_id}.")
                continue

            # 1. Obtener el registro de distribución para saber producto_id y demanda
            asig = distribucionalmacenproducto.query.get(int(asignacion_id))
            if not asig:
                print(f"Advertencia: Asignación {asignacion_id} no encontrada.")
                continue

            # 2. Actualizar almacen_id en distribucion_almacen_producto
            asig.almacen_id = almacen_id
            asignaciones_actualizadas += 1

            # 3. Actualizar almacen_capacidad: sumar demanda si ya existe el registro,
            #    o insertar uno nuevo si no existe.
            if asig.producto_id and asig.demanda:
                demanda = float(asig.demanda)
                registro_cap = almacencapacidad.query.filter_by(
                    almacen_id=almacen_id,
                    producto_id=asig.producto_id
                ).first()

                if registro_cap:
                    # Ya existe: sumar la demanda al stock actual
                    registro_cap.cant_productos_act = float(registro_cap.cant_productos_act) + demanda
                else:
                    # No existe: insertar nuevo registro
                    nuevo_cap = almacencapacidad(
                        almacen_id=almacen_id,
                        producto_id=asig.producto_id,
                        cant_productos_act=demanda
                    )
                    db.session.add(nuevo_cap)

        db.session.commit()
        return {
            "success": True,
            "message": f"Asignación guardada exitosamente. Se actualizaron {asignaciones_actualizadas} envío(s) y se registraron en almacén."
        }
    except Exception as e:
        db.session.rollback()
        print(f"Error en guardar_asignacion_almacenes: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def obtener_asignaciones_por_almacen(almacen_id, periodo=None):
    """
    Obtiene las asignaciones de envíos para un almacén específico.
    """
    try:
        query = db.session.query(
            distribucionalmacenproducto,
            producto
        ).join(
            producto,
            distribucionalmacenproducto.producto_id == producto.producto_id
        ).filter(
            distribucionalmacenproducto.almacen_id == almacen_id
        )

        if periodo and 'mes' in periodo and 'anio' in periodo:
            query = query.filter(
                distribucionalmacenproducto.mes == periodo['mes'],
                distribucionalmacenproducto.anio == periodo['anio']
            )

        asignaciones = query.all()

        asignaciones_lista = []
        for asignacion, prod in asignaciones:
            asignaciones_lista.append({
                "asignacion_id": asignacion.asignacion_id,
                "producto_id": prod.producto_id,
                "producto_nombre": prod.nombre,
                "foto_producto": prod.foto_producto,
                "demanda": float(asignacion.demanda) if asignacion.demanda else 0,
                "mes": asignacion.mes,
                "anio": asignacion.anio,
                "dia": asignacion.dia,
                "fecha_envio": asignacion.fecha_envio.strftime('%Y-%m-%d') if asignacion.fecha_envio else None,
                "estado_envio": asignacion.estado_envio
            })

        productos_en_almacen = db.session.query(
            almacencapacidad, producto
        ).join(
            producto, almacencapacidad.producto_id == producto.producto_id
        ).filter(
            almacencapacidad.almacen_id == almacen_id
        ).all()

        productos_fisicos = []
        for ac, prod in productos_en_almacen:
            productos_fisicos.append({
                "almacen_capacidad_id": ac.almacen_capacidad_id,
                "producto_id": prod.producto_id,
                "producto_nombre": prod.nombre,
                "foto_producto": prod.foto_producto,
                "cantidad": float(ac.cant_productos_act) if ac.cant_productos_act else 0
            })

        return {
            "success": True,
            "asignaciones": asignaciones_lista,
            "productos_fisicos": productos_fisicos,
            "total_asignaciones": len(asignaciones_lista),
            "total_productos_fisicos": len(productos_fisicos)
        }
    except Exception as e:
        print(f"Error en obtener_asignaciones_por_almacen: {str(e)}")
        traceback.print_exc()
        return {"success": False, "error": str(e)}