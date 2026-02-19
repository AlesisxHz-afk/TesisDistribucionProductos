from ..models.models import db, conductor, vehiculoconductor, vehiculo, disponibilidadconductor, distribucionalmacenproducto, producto, almacen, almacencapacidad
from sqlalchemy import text, func, and_, extract
from datetime import datetime
import pandas as pd
import os

# ============================
# FUNCIONES PARA REPORTES 01-03 (PRODUCTOS)
# ============================

def obtener_productos():
    """
    Obtiene todos los productos con su información básica
    """
    try:
        productos = producto.query.all()
        
        productos_lista = []
        for prod in productos:
            productos_lista.append({
                'producto_id': prod.producto_id,
                'nombre': prod.nombre,
                'tipo': prod.tipo,
                'variedad': prod.variedad,
                'descripcion': prod.descripcion,
                'temperatura_optima': float(prod.temperatura_optima) if prod.temperatura_optima else 0,
                'humedad_optima': float(prod.humedad_optima) if prod.humedad_optima else 0,
                'cant_productos_act': float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                'estado_producto': prod.estado_producto,
                'foto_producto': prod.foto_producto
            })
        
        return {
            'success': True,
            'productos': productos_lista,
            'total': len(productos_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener productos'
        }

def obtener_tipos_producto():
    """
    Obtiene los tipos de producto únicos
    """
    try:
        tipos = db.session.query(producto.tipo).distinct().all()
        tipos_lista = [t[0] for t in tipos if t[0]]
        
        return {
            'success': True,
            'tipos': tipos_lista
        }
    
    except Exception as e:
        print(f"Error en obtener_tipos_producto: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener tipos de producto'
        }

def obtener_anios_distribucion():
    """
    Obtiene los años disponibles en la tabla de distribución
    """
    try:
        anios = db.session.query(distribucionalmacenproducto.anio).distinct().filter(
            distribucionalmacenproducto.anio.isnot(None)
        ).order_by(distribucionalmacenproducto.anio).all()
        
        anios_lista = [a[0] for a in anios if a[0]]
        
        return {
            'success': True,
            'anios': anios_lista
        }
    
    except Exception as e:
        print(f"Error en obtener_anios_distribucion: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener años'
        }

def obtener_predicciones_excel():
    """
    Lee el archivo Excel de predicciones y devuelve los datos
    """
    try:
        # Buscar el archivo más reciente en la carpeta excel
        excel_dir = os.path.join(os.path.dirname(__file__), '..', 'models', 'excel')
        archivos = [f for f in os.listdir(excel_dir) if f.startswith('stock_optimo_') and f.endswith('.xlsx')]
        
        if not archivos:
            return {
                'success': False,
                'message': 'No se encontró archivo de predicciones'
            }
        
        # Tomar el más reciente (por fecha en el nombre)
        archivos.sort(reverse=True)
        archivo_path = os.path.join(excel_dir, archivos[0])
        
        # Leer el archivo Excel
        df = pd.read_excel(archivo_path, sheet_name='Predicciones')
        
        predicciones = []
        for _, row in df.iterrows():
            if 'fecha' in row and 'demanda_predicha' in row:
                fecha = row['fecha']
                if isinstance(fecha, datetime):
                    fecha = fecha.strftime('%Y-%m-%d')
                
                predicciones.append({
                    'fecha': fecha,
                    'demanda_predicha': float(row['demanda_predicha']) if pd.notna(row['demanda_predicha']) else 0
                })
        
        return {
            'success': True,
            'predicciones': predicciones,
            'total': len(predicciones)
        }
    
    except Exception as e:
        print(f"Error en obtener_predicciones_excel: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al leer archivo de predicciones'
        }

def obtener_analisis_productos(filtros=None):
    """
    Obtiene análisis detallado de productos con estadísticas de envíos
    """
    try:
        # Consulta para obtener estadísticas por producto
        stats = db.session.query(
            producto.producto_id,
            producto.nombre,
            producto.tipo,
            producto.variedad,
            producto.cant_productos_act,
            producto.temperatura_optima,
            producto.humedad_optima,
            func.count(distribucionalmacenproducto.asignacion_id).label('total_envios'),
            func.sum(distribucionalmacenproducto.demanda).label('demanda_total'),
            func.avg(distribucionalmacenproducto.demanda).label('promedio_demanda')
        ).outerjoin(
            distribucionalmacenproducto,
            producto.producto_id == distribucionalmacenproducto.producto_id
        ).group_by(
            producto.producto_id
        ).all()
        
        resultados = []
        for stat in stats:
            resultados.append({
                'producto_id': stat.producto_id,
                'nombre': stat.nombre,
                'tipo': stat.tipo,
                'variedad': stat.variedad,
                'stock_actual': float(stat.cant_productos_act) if stat.cant_productos_act else 0,
                'temperatura_optima': float(stat.temperatura_optima) if stat.temperatura_optima else 0,
                'humedad_optima': float(stat.humedad_optima) if stat.humedad_optima else 0,
                'total_envios': stat.total_envios or 0,
                'demanda_total': float(stat.demanda_total) if stat.demanda_total else 0,
                'promedio_demanda': float(stat.promedio_demanda) if stat.promedio_demanda else 0
            })
        
        return {
            'success': True,
            'analisis': resultados,
            'total': len(resultados)
        }
    
    except Exception as e:
        print(f"Error en obtener_analisis_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener análisis de productos'
        }

def obtener_tendencia_producto(producto_id, anio=None):
    """
    Obtiene la tendencia mensual de un producto específico
    """
    try:
        query = db.session.query(
            extract('year', distribucionalmacenproducto.fecha_envio).label('anio'),
            extract('month', distribucionalmacenproducto.fecha_envio).label('mes'),
            func.count(distribucionalmacenproducto.asignacion_id).label('total_envios'),
            func.sum(distribucionalmacenproducto.demanda).label('demanda_total')
        ).filter(
            distribucionalmacenproducto.producto_id == producto_id,
            distribucionalmacenproducto.fecha_envio.isnot(None)
        )
        
        if anio:
            query = query.filter(extract('year', distribucionalmacenproducto.fecha_envio) == anio)
        
        query = query.group_by(
            'anio', 'mes'
        ).order_by('anio', 'mes')
        
        resultados = query.all()
        
        tendencia = []
        for r in resultados:
            tendencia.append({
                'anio': int(r.anio) if r.anio else None,
                'mes': int(r.mes) if r.mes else None,
                'total_envios': r.total_envios or 0,
                'demanda_total': float(r.demanda_total) if r.demanda_total else 0,
                'promedio_por_envio': float(r.demanda_total / r.total_envios) if r.total_envios and r.total_envios > 0 else 0
            })
        
        return {
            'success': True,
            'tendencia': tendencia,
            'total': len(tendencia)
        }
    
    except Exception as e:
        print(f"Error en obtener_tendencia_producto: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener tendencia del producto'
        }

# ============================
# FUNCIONES PARA CONDUCTORES (Reportes 10-12)
# ============================

def obtener_conductores():
    """
    Obtiene todos los conductores con su información básica
    """
    try:
        conductores = conductor.query.all()
        
        conductores_lista = []
        for cond in conductores:
            # Obtener vehículos asignados al conductor
            vehiculos_asignados = db.session.query(vehiculo)\
                .join(vehiculoconductor, vehiculo.vehiculo_id == vehiculoconductor.vehiculo_id)\
                .filter(
                    vehiculoconductor.conductor_id == cond.conductor_id,
                    vehiculoconductor.estado == 'ACTIVO'
                ).all()
            
            vehiculos_data = []
            for v in vehiculos_asignados:
                vehiculos_data.append({
                    'vehiculo_id': v.vehiculo_id,
                    'placa': v.placa,
                    'modelo': v.modelo,
                    'marca': v.marca,
                    'tipo_vehiculo': v.tipo_vehiculo,
                    'anio_fabricacion': v.anio_fabricacion
                })
            
            # Obtener disponibilidad del conductor
            disponibilidad = disponibilidadconductor.query.filter_by(conductor_id=cond.conductor_id).all()
            disponibilidad_data = []
            for disp in disponibilidad:
                disponibilidad_data.append({
                    'dia': disp.dia,
                    'hora_inicio': str(disp.hora_inicio) if disp.hora_inicio else None,
                    'hora_fin': str(disp.hora_fin) if disp.hora_fin else None
                })
            
            conductores_lista.append({
                'conductor_id': cond.conductor_id,
                'nombre': cond.nombre,
                'apellido_paterno': cond.apellido_paterno,
                'apellido_materno': cond.apellido_materno,
                'nombre_completo': f"{cond.nombre} {cond.apellido_paterno} {cond.apellido_materno}",
                'dni': cond.dni,
                'telefono': cond.telefono,
                'direccion': cond.direccion,
                'fecha_ingreso': cond.fecha_ingreso.strftime('%Y-%m-%d') if cond.fecha_ingreso else None,
                'estado': cond.estado,
                'vehiculos': vehiculos_data,
                'disponibilidad': disponibilidad_data
            })
        
        return {
            'success': True,
            'conductores': conductores_lista,
            'total': len(conductores_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_conductores: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener conductores'
        }

def obtener_envios_por_conductor(conductor_id, fecha_inicio=None, fecha_fin=None):
    """
    Obtiene los envíos de un conductor específico
    """
    try:
        query = db.session.query(
            distribucionalmacenproducto,
            producto.nombre.label('producto_nombre'),
            producto.tipo.label('producto_tipo'),
            producto.variedad.label('producto_variedad'),
            almacen.nombre.label('almacen_nombre'),
            almacen.direccion.label('almacen_direccion')
        ).outerjoin(
            producto, distribucionalmacenproducto.producto_id == producto.producto_id
        ).outerjoin(
            almacen, distribucionalmacenproducto.almacen_id == almacen.almacen_id
        ).join(
            vehiculoconductor, distribucionalmacenproducto.vehiculo_conductor_id == vehiculoconductor.vehiculo_conductor_id
        ).filter(
            vehiculoconductor.conductor_id == conductor_id
        )
        
        if fecha_inicio:
            query = query.filter(distribucionalmacenproducto.fecha_envio >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(distribucionalmacenproducto.fecha_envio <= fecha_fin)
        
        envios = query.all()
        
        total_demanda = 0
        envios_entregados = 0
        
        envios_lista = []
        for envio, prod_nombre, prod_tipo, prod_variedad, alm_nombre, alm_direccion in envios:
            if envio.estado_envio == 'ENTREGADO':
                envios_entregados += 1
            if envio.demanda:
                total_demanda += float(envio.demanda)
                
            envios_lista.append({
                'asignacion_id': envio.asignacion_id,
                'nro_envio': envio.nro_envio,
                'fecha_envio': envio.fecha_envio.strftime('%Y-%m-%d') if envio.fecha_envio else None,
                'hora_envio': str(envio.hora_envio) if envio.hora_envio else None,
                'hora_llegada': str(envio.hora_llegada) if envio.hora_llegada else None,
                'estado_envio': envio.estado_envio,
                'demanda': float(envio.demanda) if envio.demanda else 0,
                'producto_id': envio.producto_id,
                'producto_nombre': prod_nombre,
                'producto_tipo': prod_tipo,
                'producto_variedad': prod_variedad,
                'producto_desc': f"{prod_nombre} - {prod_tipo} ({prod_variedad})" if prod_nombre else "Sin producto",
                'almacen_id': envio.almacen_id,
                'almacen_nombre': alm_nombre,
                'almacen_direccion': alm_direccion
            })
        
        # Calcular tiempo promedio de entrega
        tiempo_promedio = 0
        envios_con_tiempo = 0
        for envio in envios_lista:
            if envio['hora_envio'] and envio['hora_llegada'] and envio['estado_envio'] == 'ENTREGADO':
                try:
                    hora_envio = datetime.strptime(envio['hora_envio'], '%H:%M:%S')
                    hora_llegada = datetime.strptime(envio['hora_llegada'], '%H:%M:%S')
                    diferencia = (hora_llegada - hora_envio).seconds / 60  # en minutos
                    tiempo_promedio += diferencia
                    envios_con_tiempo += 1
                except:
                    pass
        
        if envios_con_tiempo > 0:
            tiempo_promedio = tiempo_promedio / envios_con_tiempo
        
        return {
            'success': True,
            'envios': envios_lista,
            'total': len(envios_lista),
            'resumen': {
                'total_envios': len(envios_lista),
                'completados': envios_entregados,
                'total_demanda': round(total_demanda, 2),
                'tiempo_promedio': round(tiempo_promedio, 1)
            }
        }
    
    except Exception as e:
        print(f"Error en obtener_envios_por_conductor: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener envíos del conductor'
        }

def obtener_todos_envios_conductores(fecha_inicio=None, fecha_fin=None):
    """
    Obtiene los envíos de todos los conductores para análisis de rendimiento
    """
    try:
        query = db.session.query(
            distribucionalmacenproducto,
            producto.nombre.label('producto_nombre'),
            almacen.nombre.label('almacen_nombre'),
            conductor.conductor_id,
            conductor.nombre.label('conductor_nombre'),
            conductor.apellido_paterno,
            conductor.apellido_materno
        ).outerjoin(
            producto, distribucionalmacenproducto.producto_id == producto.producto_id
        ).outerjoin(
            almacen, distribucionalmacenproducto.almacen_id == almacen.almacen_id
        ).join(
            vehiculoconductor, distribucionalmacenproducto.vehiculo_conductor_id == vehiculoconductor.vehiculo_conductor_id
        ).join(
            conductor, vehiculoconductor.conductor_id == conductor.conductor_id
        )
        
        if fecha_inicio:
            query = query.filter(distribucionalmacenproducto.fecha_envio >= fecha_inicio)
        
        if fecha_fin:
            query = query.filter(distribucionalmacenproducto.fecha_envio <= fecha_fin)
        
        envios = query.all()
        
        # Agrupar por conductor
        conductores_data = {}
        
        for envio, prod_nombre, alm_nombre, cond_id, cond_nombre, cond_ape_pat, cond_ape_mat in envios:
            if cond_id not in conductores_data:
                conductores_data[cond_id] = {
                    'conductor_id': cond_id,
                    'conductor_nombre': f"{cond_nombre} {cond_ape_pat} {cond_ape_mat}",
                    'total_envios': 0,
                    'completados': 0,
                    'envios': []
                }
            
            conductores_data[cond_id]['total_envios'] += 1
            if envio.estado_envio == 'ENTREGADO':
                conductores_data[cond_id]['completados'] += 1
            
            conductores_data[cond_id]['envios'].append({
                'fecha_envio': envio.fecha_envio.strftime('%Y-%m-%d') if envio.fecha_envio else None,
                'estado_envio': envio.estado_envio,
                'producto': prod_nombre,
                'almacen': alm_nombre
            })
        
        # Calcular eficiencia para cada conductor
        for cond_id, data in conductores_data.items():
            if data['total_envios'] > 0:
                tasa_exito = (data['completados'] / data['total_envios']) * 100
                data['tasa_exito'] = round(tasa_exito, 1)
                data['eficiencia'] = 'ALTA' if tasa_exito >= 90 else 'MEDIA' if tasa_exito >= 70 else 'BAJA'
        
        # Convertir a lista y ordenar por total de envíos
        conductores_lista = list(conductores_data.values())
        conductores_lista.sort(key=lambda x: x['total_envios'], reverse=True)
        
        return {
            'success': True,
            'conductores': conductores_lista,
            'total_conductores': len(conductores_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_todos_envios_conductores: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener datos de conductores'
        }

def obtener_disponibilidad_completa():
    """
    Obtiene la disponibilidad de todos los conductores con información detallada
    """
    try:
        disponibilidad = disponibilidadconductor.query.all()
        
        disponibilidad_lista = []
        for disp in disponibilidad:
            cond = conductor.query.get(disp.conductor_id)
            if cond:
                disponibilidad_lista.append({
                    'disponibilidad_id': disp.disponibilidad_id,
                    'conductor_id': disp.conductor_id,
                    'conductor_nombre': f"{cond.nombre} {cond.apellido_paterno} {cond.apellido_materno}",
                    'conductor_dni': cond.dni,
                    'conductor_estado': cond.estado,
                    'dia': disp.dia,
                    'hora_inicio': str(disp.hora_inicio) if disp.hora_inicio else None,
                    'hora_fin': str(disp.hora_fin) if disp.hora_fin else None
                })
        
        # Ordenar por conductor y día
        orden_dias = {'lunes':1, 'martes':2, 'miercoles':3, 'jueves':4, 'viernes':5, 'sabado':6}
        disponibilidad_lista.sort(key=lambda x: (x['conductor_nombre'], orden_dias.get(x['dia'].lower() if x['dia'] else '', 8)))
        
        return {
            'success': True,
            'disponibilidad': disponibilidad_lista,
            'total': len(disponibilidad_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_disponibilidad_completa: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener disponibilidad'
        }

# ============================
# FUNCIONES PARA VEHÍCULOS (Reportes 07-09)
# ============================

def obtener_vehiculos():
    """
    Obtiene la lista de vehículos con sus asignaciones actuales
    """
    try:
        vehiculos = vehiculo.query.all()
        
        vehiculos_lista = []
        for v in vehiculos:
            # Obtener conductor actual
            asignacion_actual = vehiculoconductor.query.filter_by(
                vehiculo_id=v.vehiculo_id,
                estado='ACTIVO'
            ).first()
            
            conductor_nombre = None
            if asignacion_actual:
                cond = conductor.query.get(asignacion_actual.conductor_id)
                if cond:
                    conductor_nombre = f"{cond.nombre} {cond.apellido_paterno}"
            
            vehiculos_lista.append({
                'vehiculo_id': v.vehiculo_id,
                'placa': v.placa,
                'modelo': v.modelo,
                'marca': v.marca,
                'cantidad_carga': v.cantidad_carga,
                'tipo_vehiculo': v.tipo_vehiculo,
                'anio_fabricacion': v.anio_fabricacion,
                'estado': v.estado,
                'conductor_asignado': conductor_nombre
            })
        
        return {
            'success': True,
            'vehiculos': vehiculos_lista,
            'total': len(vehiculos_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_vehiculos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener vehículos'
        }

def obtener_asignaciones_completo():
    """
    Obtiene todas las asignaciones vehículo-conductor con detalles
    """
    try:
        asignaciones = vehiculoconductor.query.all()
        
        asignaciones_lista = []
        for a in asignaciones:
            v = vehiculo.query.get(a.vehiculo_id)
            c = conductor.query.get(a.conductor_id)
            
            # Contar envíos realizados con esta asignación
            total_envios = distribucionalmacenproducto.query.filter_by(
                vehiculo_conductor_id=a.vehiculo_conductor_id
            ).count()
            
            asignaciones_lista.append({
                'asignacion_id': a.vehiculo_conductor_id,
                'vehiculo_id': a.vehiculo_id,
                'vehiculo_placa': v.placa if v else None,
                'vehiculo_modelo': f"{v.marca} {v.modelo}" if v else None,
                'conductor_id': a.conductor_id,
                'conductor_nombre': f"{c.nombre} {c.apellido_paterno}" if c else None,
                'conductor_dni': c.dni if c else None,
                'fecha_asignacion': a.fecha_asignacion.strftime('%Y-%m-%d') if a.fecha_asignacion else None,
                'estado': a.estado,
                'total_envios': total_envios
            })
        
        return {
            'success': True,
            'asignaciones': asignaciones_lista,
            'total': len(asignaciones_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_asignaciones_completo: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener asignaciones'
        }

def obtener_rendimiento_vehiculos():
    """
    Obtiene datos de rendimiento de vehículos basado en envíos
    """
    try:
        # Obtener todos los vehículos
        vehiculos = vehiculo.query.all()
        
        rendimiento_lista = []
        for v in vehiculos:
            # Obtener asignaciones del vehículo
            asignaciones = vehiculoconductor.query.filter_by(vehiculo_id=v.vehiculo_id).all()
            
            total_envios = 0
            total_demanda = 0
            total_gasto = 0
            envios_detalle = []
            conductor_actual = None
            
            for a in asignaciones:
                # Obtener conductor de esta asignación
                c = conductor.query.get(a.conductor_id)
                if a.estado == 'ACTIVO' and c:
                    conductor_actual = f"{c.nombre} {c.apellido_paterno}"
                
                # Obtener envíos de esta asignación
                envios = distribucionalmacenproducto.query.filter_by(
                    vehiculo_conductor_id=a.vehiculo_conductor_id
                ).all()
                
                for e in envios:
                    total_envios += 1
                    if e.demanda:
                        total_demanda += float(e.demanda)
                    if e.gasto:
                        total_gasto += float(e.gasto)
                    
                    envios_detalle.append({
                        'fecha_envio': e.fecha_envio.strftime('%Y-%m-%d') if e.fecha_envio else None,
                        'demanda': float(e.demanda) if e.demanda else 0,
                        'gasto': float(e.gasto) if e.gasto else 0
                    })
            
            # Calcular eficiencia
            eficiencia = 0
            if total_envios > 0 and total_demanda > 0:
                # Eficiencia basada en kg por envío vs gasto promedio
                kg_por_envio = total_demanda / total_envios
                gasto_por_envio = total_gasto / total_envios if total_gasto > 0 else 1
                eficiencia = min(round((kg_por_envio / gasto_por_envio) * 10), 100)
            
            rendimiento_lista.append({
                'vehiculo_id': v.vehiculo_id,
                'placa': v.placa,
                'modelo': v.modelo,
                'marca': v.marca,
                'tipo_vehiculo': v.tipo_vehiculo,
                'capacidad': v.cantidad_carga,
                'conductor_nombre': conductor_actual,
                'total_envios': total_envios,
                'total_demanda': round(total_demanda, 2),
                'total_gasto': round(total_gasto, 2),
                'eficiencia': eficiencia,
                'envios': envios_detalle
            })
        
        return {
            'success': True,
            'rendimiento': rendimiento_lista,
            'total': len(rendimiento_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_rendimiento_vehiculos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener rendimiento de vehículos'
        }

# ============================
# FUNCIONES PARA ALMACENES (Reportes 04-06)
# ============================

def obtener_inventario_almacenes():
    """
    Obtiene el inventario actual de todos los almacenes, incluyendo stock por producto.
    """
    try:
        print("Iniciando obtener_inventario_almacenes...")
        
        # Obtener todos los almacenes con su capacidad y estado
        almacenes = almacen.query.all()
        print(f"Se encontraron {len(almacenes)} almacenes")
        
        inventario_lista = []
        
        for alm in almacenes:
            # Obtener el stock actual por producto para este almacén
            stocks = almacencapacidad.query.filter_by(almacen_id=alm.almacen_id).all()
            
            if stocks:
                for stock in stocks:
                    prod = producto.query.get(stock.producto_id)
                    inventario_lista.append({
                        'almacen_id': alm.almacen_id,
                        'almacen_nombre': alm.nombre,
                        'tipo_almacen': alm.tipo_almacen,
                        'direccion': alm.direccion,
                        'estado': alm.estado,
                        'capacidad_total': float(alm.capacidad),
                        'stock_actual': float(stock.cant_productos_act),
                        'ocupacion': round((float(stock.cant_productos_act) / float(alm.capacidad)) * 100, 1) if alm.capacidad and float(alm.capacidad) > 0 else 0,
                        'producto_id': prod.producto_id if prod else None,
                        'producto_nombre': prod.nombre if prod else 'Sin producto',
                        'producto_tipo': prod.tipo if prod else '-'
                    })
            else:
                # Si el almacén no tiene productos en stock, aun así lo mostramos con stock 0
                inventario_lista.append({
                    'almacen_id': alm.almacen_id,
                    'almacen_nombre': alm.nombre,
                    'tipo_almacen': alm.tipo_almacen,
                    'direccion': alm.direccion,
                    'estado': alm.estado,
                    'capacidad_total': float(alm.capacidad),
                    'stock_actual': 0,
                    'ocupacion': 0,
                    'producto_id': None,
                    'producto_nombre': 'Sin productos',
                    'producto_tipo': '-'
                })
        
        # Ordenar por almacén y producto
        inventario_lista.sort(key=lambda x: (x['almacen_nombre'], x['producto_nombre'] or ''))
        
        print(f"Procesados {len(inventario_lista)} registros de inventario")
        
        return {
            'success': True,
            'inventario': inventario_lista,
            'total': len(inventario_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_inventario_almacenes: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener inventario de almacenes'
        }

def obtener_movimiento_productos():
    """
    Obtiene los movimientos (envíos) de productos desde/hacia almacenes.
    """
    try:
        print("Iniciando obtener_movimiento_productos...")
        
        # Obtener los últimos 500 movimientos (para no sobrecargar)
        movimientos = distribucionalmacenproducto.query\
            .order_by(distribucionalmacenproducto.fecha_envio.desc(),
                      distribucionalmacenproducto.hora_envio.desc())\
            .limit(500).all()
        
        print(f"Se encontraron {len(movimientos)} movimientos")
        
        movimientos_lista = []
        for mov in movimientos:
            prod = None
            if mov.producto_id:
                prod = producto.query.get(mov.producto_id)
            
            alm = None
            if mov.almacen_id:
                alm = almacen.query.get(mov.almacen_id)
            
            movimientos_lista.append({
                'asignacion_id': mov.asignacion_id,
                'nro_envio': mov.nro_envio or f"ENV-{mov.asignacion_id}",
                'producto_id': mov.producto_id,
                'producto_nombre': prod.nombre if prod else 'Sin producto',
                'producto_tipo': prod.tipo if prod else '-',
                'almacen_id': mov.almacen_id,
                'almacen_nombre': alm.nombre if alm else 'Sin almacén',
                'fecha_envio': mov.fecha_envio.strftime('%Y-%m-%d') if mov.fecha_envio else None,
                'hora_envio': str(mov.hora_envio) if mov.hora_envio else None,
                'hora_llegada': str(mov.hora_llegada) if mov.hora_llegada else None,
                'estado_envio': mov.estado_envio or 'PENDIENTE',
                'demanda': float(mov.demanda) if mov.demanda else 0
            })
        
        print(f"Procesados {len(movimientos_lista)} movimientos")
        
        return {
            'success': True,
            'movimientos': movimientos_lista,
            'total': len(movimientos_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_movimiento_productos: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener movimientos de productos'
        }

def obtener_rendimiento_almacenes():
    """
    Obtiene métricas de rendimiento para cada almacén (ocupación, total envíos, etc.)
    """
    try:
        print("Iniciando obtener_rendimiento_almacenes...")
        
        almacenes = almacen.query.all()
        print(f"Se encontraron {len(almacenes)} almacenes")
        
        rendimiento_lista = []
        
        for alm in almacenes:
            # Stock total actual en el almacén
            stocks = almacencapacidad.query.filter_by(almacen_id=alm.almacen_id).all()
            stock_total = sum(float(s.cant_productos_act) for s in stocks) if stocks else 0
            
            # Total de envíos realizados desde/hacia este almacén
            total_envios = distribucionalmacenproducto.query\
                .filter_by(almacen_id=alm.almacen_id)\
                .count()
            
            # Envíos completados (entregados)
            envios_completados = distribucionalmacenproducto.query\
                .filter_by(almacen_id=alm.almacen_id, estado_envio='ENTREGADO')\
                .count()
            
            ocupacion = round((stock_total / float(alm.capacidad)) * 100, 1) if alm.capacidad and float(alm.capacidad) > 0 else 0
            
            # Determinar rendimiento
            if envios_completados > 0 and total_envios > 0:
                tasa_exito = (envios_completados / total_envios) * 100
                if tasa_exito >= 90 and ocupacion <= 80:
                    rendimiento = 'ALTO'
                elif tasa_exito >= 70 and ocupacion <= 90:
                    rendimiento = 'MEDIO'
                else:
                    rendimiento = 'BAJO'
            else:
                rendimiento = 'BAJO' if total_envios == 0 else 'MEDIO'
            
            rendimiento_lista.append({
                'almacen_id': alm.almacen_id,
                'almacen_nombre': alm.nombre,
                'tipo_almacen': alm.tipo_almacen,
                'direccion': alm.direccion,
                'capacidad_total': float(alm.capacidad),
                'stock_actual': stock_total,
                'ocupacion': ocupacion,
                'total_envios': total_envios,
                'envios_completados': envios_completados,
                'rendimiento': rendimiento
            })
        
        print(f"Procesados {len(rendimiento_lista)} registros de rendimiento")
        
        return {
            'success': True,
            'rendimiento': rendimiento_lista,
            'total': len(rendimiento_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_rendimiento_almacenes: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener rendimiento de almacenes'
        }
    
def obtener_demanda_mensual_historica():
    """
    Obtiene la demanda total por mes y año de la base de datos
    Corregido para PostgreSQL
    """
    try:
        # Consulta para obtener demanda agregada por año y mes
        # Usando func.extract correctamente con SQLAlchemy
        resultados = db.session.query(
            func.extract('year', distribucionalmacenproducto.fecha_envio).label('anio'),
            func.extract('month', distribucionalmacenproducto.fecha_envio).label('mes'),
            func.sum(distribucionalmacenproducto.demanda).label('demanda_total'),
            func.count(distribucionalmacenproducto.asignacion_id).label('total_envios')
        ).filter(
            distribucionalmacenproducto.fecha_envio.isnot(None),
            distribucionalmacenproducto.demanda.isnot(None)
        ).group_by(
            func.extract('year', distribucionalmacenproducto.fecha_envio),
            func.extract('month', distribucionalmacenproducto.fecha_envio)
        ).order_by(
            func.extract('year', distribucionalmacenproducto.fecha_envio),
            func.extract('month', distribucionalmacenproducto.fecha_envio)
        ).all()
        
        demanda_mensual = []
        for r in resultados:
            if r.anio and r.mes:
                demanda_mensual.append({
                    'anio': int(r.anio),
                    'mes': int(r.mes),
                    'demanda_total': float(r.demanda_total) if r.demanda_total else 0,
                    'total_envios': r.total_envios or 0
                })
        
        return {
            'success': True,
            'demanda_mensual': demanda_mensual,
            'total': len(demanda_mensual)
        }
    
    except Exception as e:
        print(f"Error en obtener_demanda_mensual_historica: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener demanda mensual histórica'
        }