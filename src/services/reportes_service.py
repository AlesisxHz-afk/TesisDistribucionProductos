from ..models.models import db, conductor, vehiculoconductor, vehiculo, disponibilidadconductor, distribucionalmacenproducto, producto, almacen
from sqlalchemy import text, func, and_
from datetime import datetime

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
        disponibilidad_lista.sort(key=lambda x: (x['conductor_nombre'], orden_dias.get(x['dia'], 8)))
        
        return {
            'success': True,
            'disponibilidad': disponibilidad_lista,
            'total': len(disponibilidad_lista)
        }
    
    except Exception as e:
        print(f"Error en obtener_disponibilidad_completa: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'message': 'Error al obtener disponibilidad'
        }