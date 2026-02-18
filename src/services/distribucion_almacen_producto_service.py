from ..models.models import db, distribucionalmacenproducto, producto, almacen, vehiculoconductor, almacencapacidad, conductor, vehiculo, disponibilidadconductor, conductorubicacion
from sqlalchemy import text, and_, or_
from datetime import datetime, date, time
import traceback
import random
import string
import os

def obtener_envios():
    """
    Obtiene todos los envíos con fecha posterior a la actual
    """
    try:
        fecha_actual = date.today()
        
        # Consulta con joins para obtener nombres
        query = db.session.query(
            distribucionalmacenproducto,
            almacen.nombre.label('almacen_nombre'),
            almacen.tipo_almacen.label('almacen_tipo'),
            producto.nombre.label('producto_nombre'),
            producto.tipo.label('producto_tipo'),
            vehiculo.placa.label('vehiculo_placa'),
            vehiculo.marca.label('vehiculo_marca'),
            vehiculo.modelo.label('vehiculo_modelo'),
            conductor.nombre.label('conductor_nombre'),
            conductor.apellido_paterno.label('conductor_apellido_paterno')
        ).outerjoin(
            almacen, distribucionalmacenproducto.almacen_id == almacen.almacen_id
        ).outerjoin(
            producto, distribucionalmacenproducto.producto_id == producto.producto_id
        ).outerjoin(
            vehiculoconductor, distribucionalmacenproducto.vehiculo_conductor_id == vehiculoconductor.vehiculo_conductor_id
        ).outerjoin(
            vehiculo, vehiculoconductor.vehiculo_id == vehiculo.vehiculo_id
        ).outerjoin(
            conductor, vehiculoconductor.conductor_id == conductor.conductor_id
        ).filter(
            distribucionalmacenproducto.fecha_envio >= fecha_actual
        ).order_by(
            distribucionalmacenproducto.fecha_envio.desc()
        ).all()
        
        envios_lista = []
        for row in query:
            envio = row[0]
            
            # Construir nombre completo del conductor
            nombre_conductor = None
            if row.conductor_nombre:
                nombre_conductor = f"{row.conductor_nombre} {row.conductor_apellido_paterno or ''}".strip()
            
            envios_lista.append({
                "asignacion_id": envio.asignacion_id,
                "nro_envio": envio.nro_envio,
                "almacen_id": envio.almacen_id,
                "almacen_nombre": row.almacen_nombre,
                "almacen_tipo": row.almacen_tipo,
                "producto_id": envio.producto_id,
                "producto_nombre": row.producto_nombre,
                "producto_tipo": row.producto_tipo,
                "vehiculo_conductor_id": envio.vehiculo_conductor_id,
                "vehiculo_placa": row.vehiculo_placa,
                "vehiculo_marca": row.vehiculo_marca,
                "vehiculo_modelo": row.vehiculo_modelo,
                "conductor_nombre": nombre_conductor,
                "fecha_envio": envio.fecha_envio.isoformat() if envio.fecha_envio else None,
                "hora_envio": envio.hora_envio.strftime('%H:%M') if envio.hora_envio else None,
                "hora_llegada": envio.hora_llegada.strftime('%H:%M') if envio.hora_llegada else None,
                "estado_envio": envio.estado_envio,
                "demanda": float(envio.demanda) if envio.demanda else 0,
                "gasto": float(envio.gasto) if envio.gasto else None,
                "dia": envio.dia,
                "mes": envio.mes,
                "anio": envio.anio
            })
        
        return {
            "success": True,
            "envios": envios_lista,
            "total": len(envios_lista)
        }
        
    except Exception as e:
        print(f"Error en obtener_envios: {str(e)}")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los envíos"
        }

def obtener_envio_por_id(asignacion_id):
    """
    Obtiene un envío específico por su ID
    """
    try:
        envio = distribucionalmacenproducto.query.get(asignacion_id)
        
        if not envio:
            return {
                "success": False,
                "message": "Envío no encontrado"
            }
        
        # Obtener nombres relacionados
        almacen_obj = almacen.query.get(envio.almacen_id) if envio.almacen_id else None
        producto_obj = producto.query.get(envio.producto_id) if envio.producto_id else None
        vehiculo_conductor_obj = vehiculoconductor.query.get(envio.vehiculo_conductor_id) if envio.vehiculo_conductor_id else None
        
        vehiculo_obj = None
        conductor_obj = None
        
        if vehiculo_conductor_obj:
            vehiculo_obj = vehiculo.query.get(vehiculo_conductor_obj.vehiculo_id)
            conductor_obj = conductor.query.get(vehiculo_conductor_obj.conductor_id)
        
        # Construir nombre completo del conductor
        nombre_conductor = None
        if conductor_obj:
            nombre_conductor = f"{conductor_obj.nombre} {conductor_obj.apellido_paterno or ''} {conductor_obj.apellido_materno or ''}".strip()
        
        envio_data = {
            "asignacion_id": envio.asignacion_id,
            "nro_envio": envio.nro_envio,
            "almacen_id": envio.almacen_id,
            "almacen_nombre": almacen_obj.nombre if almacen_obj else None,
            "almacen_tipo": almacen_obj.tipo_almacen if almacen_obj else None,
            "almacen_direccion": almacen_obj.direccion if almacen_obj else None,
            "almacen_capacidad": float(almacen_obj.capacidad) if almacen_obj else None,
            "producto_id": envio.producto_id,
            "producto_nombre": producto_obj.nombre if producto_obj else None,
            "producto_tipo": producto_obj.tipo if producto_obj else None,
            "producto_variedad": producto_obj.variedad if producto_obj else None,
            "producto_stock": float(producto_obj.cant_productos_act) if producto_obj else None,
            "vehiculo_conductor_id": envio.vehiculo_conductor_id,
            "vehiculo_id": vehiculo_obj.vehiculo_id if vehiculo_obj else None,
            "vehiculo_placa": vehiculo_obj.placa if vehiculo_obj else None,
            "vehiculo_marca": vehiculo_obj.marca if vehiculo_obj else None,
            "vehiculo_modelo": vehiculo_obj.modelo if vehiculo_obj else None,
            "vehiculo_capacidad": vehiculo_obj.cantidad_carga if vehiculo_obj else None,
            "conductor_id": conductor_obj.conductor_id if conductor_obj else None,
            "conductor_nombre": nombre_conductor,
            "conductor_dni": conductor_obj.dni if conductor_obj else None,
            "conductor_telefono": conductor_obj.telefono if conductor_obj else None,
            "fecha_envio": envio.fecha_envio.isoformat() if envio.fecha_envio else None,
            "hora_envio": envio.hora_envio.strftime('%H:%M') if envio.hora_envio else None,
            "hora_llegada": envio.hora_llegada.strftime('%H:%M') if envio.hora_llegada else None,
            "estado_envio": envio.estado_envio,
            "demanda": float(envio.demanda) if envio.demanda else 0,
            "gasto": float(envio.gasto) if envio.gasto else None,
            "dia": envio.dia,
            "mes": envio.mes,
            "anio": envio.anio
        }
        
        return {
            "success": True,
            "envio": envio_data
        }
        
    except Exception as e:
        print(f"Error en obtener_envio_por_id: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el envío"
        }

def obtener_envio_detalle(asignacion_id):
    """
    Obtiene detalle completo de un envío
    """
    try:
        envio = distribucionalmacenproducto.query.get(asignacion_id)
        
        if not envio:
            return {
                "success": False,
                "message": "Envío no encontrado"
            }
        
        # Obtener todos los datos relacionados
        almacen_obj = almacen.query.get(envio.almacen_id) if envio.almacen_id else None
        producto_obj = producto.query.get(envio.producto_id) if envio.producto_id else None
        vehiculo_conductor_obj = vehiculoconductor.query.get(envio.vehiculo_conductor_id) if envio.vehiculo_conductor_id else None
        
        vehiculo_obj = None
        conductor_obj = None
        
        if vehiculo_conductor_obj:
            vehiculo_obj = vehiculo.query.get(vehiculo_conductor_obj.vehiculo_id)
            conductor_obj = conductor.query.get(vehiculo_conductor_obj.conductor_id)
        
        # Obtener disponibilidad del conductor
        disponibilidad = []
        if conductor_obj:
            disp_query = disponibilidadconductor.query.filter_by(
                conductor_id=conductor_obj.conductor_id
            ).all()
            
            disponibilidad = [{
                "dia": d.dia,
                "hora_inicio": d.hora_inicio.strftime('%H:%M'),
                "hora_fin": d.hora_fin.strftime('%H:%M')
            } for d in disp_query]
        
        # Obtener capacidad actual en almacén para este producto
        capacidad_actual = 0
        if almacen_obj and producto_obj:
            cap = almacencapacidad.query.filter_by(
                almacen_id=almacen_obj.almacen_id,
                producto_id=producto_obj.producto_id
            ).first()
            
            if cap:
                capacidad_actual = float(cap.cant_productos_act)
        
        # Construir nombre completo del conductor
        nombre_conductor = None
        if conductor_obj:
            nombre_conductor = f"{conductor_obj.nombre} {conductor_obj.apellido_paterno or ''} {conductor_obj.apellido_materno or ''}".strip()
        
        envio_data = {
            "asignacion_id": envio.asignacion_id,
            "nro_envio": envio.nro_envio,
            "almacen_id": envio.almacen_id,
            "almacen_nombre": almacen_obj.nombre if almacen_obj else None,
            "almacen_tipo": almacen_obj.tipo_almacen if almacen_obj else None,
            "almacen_direccion": almacen_obj.direccion if almacen_obj else None,
            "almacen_capacidad": float(almacen_obj.capacidad) if almacen_obj else None,
            "almacen_capacidad_actual": capacidad_actual,
            "producto_id": envio.producto_id,
            "producto_nombre": producto_obj.nombre if producto_obj else None,
            "producto_tipo": producto_obj.tipo if producto_obj else None,
            "producto_variedad": producto_obj.variedad if producto_obj else None,
            "producto_stock": float(producto_obj.cant_productos_act) if producto_obj else None,
            "vehiculo_conductor_id": envio.vehiculo_conductor_id,
            "vehiculo_id": vehiculo_obj.vehiculo_id if vehiculo_obj else None,
            "vehiculo_placa": vehiculo_obj.placa if vehiculo_obj else None,
            "vehiculo_marca": vehiculo_obj.marca if vehiculo_obj else None,
            "vehiculo_modelo": vehiculo_obj.modelo if vehiculo_obj else None,
            "vehiculo_capacidad": vehiculo_obj.cantidad_carga if vehiculo_obj else None,
            "conductor_id": conductor_obj.conductor_id if conductor_obj else None,
            "conductor_nombre": nombre_conductor,
            "conductor_dni": conductor_obj.dni if conductor_obj else None,
            "conductor_telefono": conductor_obj.telefono if conductor_obj else None,
            "conductor_disponibilidad": disponibilidad,
            "fecha_envio": envio.fecha_envio.isoformat() if envio.fecha_envio else None,
            "hora_envio": envio.hora_envio.strftime('%H:%M') if envio.hora_envio else None,
            "hora_llegada": envio.hora_llegada.strftime('%H:%M') if envio.hora_llegada else None,
            "estado_envio": envio.estado_envio,
            "demanda": float(envio.demanda) if envio.demanda else 0,
            "gasto": float(envio.gasto) if envio.gasto else None,
            "dia": envio.dia,
            "mes": envio.mes,
            "anio": envio.anio
        }
        
        return {
            "success": True,
            "envio": envio_data
        }
        
    except Exception as e:
        print(f"Error en obtener_envio_detalle: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el detalle del envío"
        }

def validar_envio(data):
    """
    Valida un envío antes de guardarlo
    """
    try:
        # Obtener datos
        asignacion_id = data.get('asignacion_id')
        fecha_envio = datetime.strptime(data.get('fecha_envio'), '%Y-%m-%d').date()
        hora_envio = datetime.strptime(data.get('hora_envio'), '%H:%M').time()
        almacen_id = data.get('almacen_id')
        producto_id = data.get('producto_id')
        vehiculo_conductor_id = data.get('vehiculo_conductor_id')
        demanda = data.get('demanda')
        
        original_producto_id = data.get('original_producto_id')
        original_almacen_id = data.get('original_almacen_id')
        original_demanda = data.get('original_demanda')
        
        # Validar que la fecha no sea pasada
        fecha_actual = date.today()
        if fecha_envio < fecha_actual:
            return False, "La fecha de envío no puede ser anterior a la fecha actual"
        
        # Validar existencia y estado de los objetos
        almacen_obj = almacen.query.get(almacen_id)
        if not almacen_obj or almacen_obj.estado != 'ACTIVO':
            return False, "El almacén seleccionado no está activo o no existe"
        
        producto_obj = producto.query.get(producto_id)
        if not producto_obj or producto_obj.estado_producto != 'ACTIVO':
            return False, "El producto seleccionado no está activo o no existe"
        
        vehiculo_conductor_obj = vehiculoconductor.query.get(vehiculo_conductor_id)
        if not vehiculo_conductor_obj or vehiculo_conductor_obj.estado != 'ACTIVO':
            return False, "La asignación vehículo-conductor no está activa o no existe"
        
        vehiculo_obj = vehiculo.query.get(vehiculo_conductor_obj.vehiculo_id)
        if not vehiculo_obj or vehiculo_obj.estado != 'ACTIVO':
            return False, "El vehículo no está activo"
        
        conductor_obj = conductor.query.get(vehiculo_conductor_obj.conductor_id)
        if not conductor_obj or conductor_obj.estado != 'ACTIVO':
            return False, "El conductor no está activo"
        
        # Mapeo de días de inglés a español (como están en la BD)
        dias_mapeo = {
            'MONDAY': 'lunes',
            'TUESDAY': 'martes',
            'WEDNESDAY': 'miercoles',
            'THURSDAY': 'jueves',
            'FRIDAY': 'viernes',
            'SATURDAY': 'sabado',
            'SUNDAY': 'domingo'
        }
        
        # Obtener día de la semana en inglés y convertirlo al formato de BD
        dia_ingles = fecha_envio.strftime('%A').upper()
        dia_bd = dias_mapeo.get(dia_ingles, dia_ingles.lower())
        
        # Validar disponibilidad del conductor
        disponibilidad = disponibilidadconductor.query.filter(
            and_(
                disponibilidadconductor.conductor_id == conductor_obj.conductor_id,
                disponibilidadconductor.dia == dia_bd,
                disponibilidadconductor.hora_inicio <= hora_envio,
                disponibilidadconductor.hora_fin >= hora_envio
            )
        ).first()
        
        if not disponibilidad:
            # Buscar si hay disponibilidad para el conductor en general
            disponibilidades = disponibilidadconductor.query.filter_by(
                conductor_id=conductor_obj.conductor_id
            ).all()
            
            if disponibilidades:
                dias_disponibles = [d.dia for d in disponibilidades]
                return False, f"El conductor no está disponible el {dia_bd} a las {hora_envio}. Días disponibles: {', '.join(dias_disponibles)}"
            else:
                return False, f"El conductor no tiene días de disponibilidad configurados"
        
        # Validar capacidad del vehículo
        if demanda > vehiculo_obj.cantidad_carga:
            return False, f"La demanda excede la capacidad del vehículo ({vehiculo_obj.cantidad_carga} kg)"
        
        # Validar stock del producto
        stock_disponible = float(producto_obj.cant_productos_act)
        
        # Si es edición, considerar el stock original
        if asignacion_id and original_producto_id == producto_id and original_demanda:
            # Mismo producto, ajustar diferencia
            diferencia = demanda - original_demanda
            if diferencia > 0 and diferencia > stock_disponible:
                return False, f"Stock insuficiente. Se necesita {diferencia} kg adicionales pero solo hay {stock_disponible} kg disponibles"
        else:
            # Producto diferente o nuevo envío
            if demanda > stock_disponible:
                return False, f"Stock insuficiente. Demanda: {demanda} kg, Stock disponible: {stock_disponible} kg"
        
        # Validar capacidad del almacén
        # Obtener capacidad actual del almacén para este producto
        capacidad_actual = 0
        cap = almacencapacidad.query.filter_by(
            almacen_id=almacen_id,
            producto_id=producto_id
        ).first()
        
        if cap:
            capacidad_actual = float(cap.cant_productos_act)
        
        # Calcular nueva capacidad
        nueva_capacidad = capacidad_actual + demanda
        
        # Si es edición y se cambia de almacén o producto, ajustar
        if asignacion_id:
            if original_almacen_id != almacen_id or original_producto_id != producto_id:
                # Restar del almacén original si corresponde
                if original_almacen_id and original_producto_id:
                    cap_original = almacencapacidad.query.filter_by(
                        almacen_id=original_almacen_id,
                        producto_id=original_producto_id
                    ).first()
                    
                    if cap_original:
                        nueva_capacidad = nueva_capacidad - original_demanda
        
        if nueva_capacidad > float(almacen_obj.capacidad):
            return False, f"La demanda excede la capacidad del almacén. Capacidad máxima: {float(almacen_obj.capacidad)} kg"
        
        return True, "Validación exitosa"
        
    except Exception as e:
        print(f"Error en validar_envio: {str(e)}")
        return False, str(e)

def registrar_envio(data):
    """
    Registra un nuevo envío
    """
    try:
        # Validar primero
        valido, mensaje = validar_envio(data)
        if not valido:
            return None, mensaje
        
        # Crear el envío
        nuevo_envio = distribucionalmacenproducto(
            almacen_id=data.get('almacen_id'),
            producto_id=data.get('producto_id'),
            vehiculo_conductor_id=data.get('vehiculo_conductor_id'),
            fecha_envio=datetime.strptime(data.get('fecha_envio'), '%Y-%m-%d').date(),
            hora_envio=datetime.strptime(data.get('hora_envio'), '%H:%M').time(),
            hora_llegada=None,
            dia=data.get('dia'),
            mes=data.get('mes'),
            anio=data.get('anio'),
            demanda=data.get('demanda'),
            gasto=None,
            estado_envio='PENDIENTE',
            nro_envio=data.get('nro_envio')
        )
        
        db.session.add(nuevo_envio)
        db.session.flush()
        
        # Actualizar stock del producto
        producto_obj = producto.query.get(data.get('producto_id'))
        producto_obj.cant_productos_act = float(producto_obj.cant_productos_act) - data.get('demanda')
        
        # Actualizar capacidad del almacén
        cap = almacencapacidad.query.filter_by(
            almacen_id=data.get('almacen_id'),
            producto_id=data.get('producto_id')
        ).first()
        
        if cap:
            cap.cant_productos_act = float(cap.cant_productos_act) + data.get('demanda')
        else:
            nueva_cap = almacencapacidad(
                almacen_id=data.get('almacen_id'),
                producto_id=data.get('producto_id'),
                cant_productos_act=data.get('demanda')
            )
            db.session.add(nueva_cap)
        
        db.session.commit()
        
        return nuevo_envio, None
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en registrar_envio: {str(e)}")
        print(traceback.format_exc())
        return None, f"Error al registrar el envío: {str(e)}"

def actualizar_envio(asignacion_id, data):
    """
    Actualiza un envío existente
    """
    try:
        envio = distribucionalmacenproducto.query.get(asignacion_id)
        
        if not envio:
            return None, "Envío no encontrado"
        
        # No permitir actualizar si está ENTREGADO o EN_RUTA
        if envio.estado_envio in ['ENTREGADO', 'EN_RUTA']:
            return None, "No se puede modificar un envío que ya está en ruta o entregado"
        
        # Validar primero
        valido, mensaje = validar_envio(data)
        if not valido:
            return None, mensaje
        
        # Guardar valores originales para revertir si es necesario
        producto_original_id = envio.producto_id
        almacen_original_id = envio.almacen_id
        demanda_original = float(envio.demanda)
        
        # Actualizar el envío
        envio.almacen_id = data.get('almacen_id')
        envio.producto_id = data.get('producto_id')
        envio.vehiculo_conductor_id = data.get('vehiculo_conductor_id')
        envio.fecha_envio = datetime.strptime(data.get('fecha_envio'), '%Y-%m-%d').date()
        envio.hora_envio = datetime.strptime(data.get('hora_envio'), '%H:%M').time()
        envio.hora_llegada = None
        envio.dia = data.get('dia')
        envio.mes = data.get('mes')
        envio.anio = data.get('anio')
        envio.demanda = data.get('demanda')
        envio.gasto = None
        envio.estado_envio = 'PENDIENTE'
        
        db.session.flush()
        
        # Revertir cambios en el producto original
        if producto_original_id:
            producto_original = producto.query.get(producto_original_id)
            if producto_original:
                producto_original.cant_productos_act = float(producto_original.cant_productos_act) + demanda_original
        
        # Aplicar cambios en el nuevo producto
        producto_nuevo = producto.query.get(data.get('producto_id'))
        if producto_nuevo:
            producto_nuevo.cant_productos_act = float(producto_nuevo.cant_productos_act) - data.get('demanda')
        
        # Actualizar capacidad del almacén original (restar)
        if almacen_original_id and producto_original_id:
            cap_original = almacencapacidad.query.filter_by(
                almacen_id=almacen_original_id,
                producto_id=producto_original_id
            ).first()
            
            if cap_original:
                cap_original.cant_productos_act = float(cap_original.cant_productos_act) - demanda_original
        
        # Actualizar capacidad del nuevo almacén (sumar)
        cap_nuevo = almacencapacidad.query.filter_by(
            almacen_id=data.get('almacen_id'),
            producto_id=data.get('producto_id')
        ).first()
        
        if cap_nuevo:
            cap_nuevo.cant_productos_act = float(cap_nuevo.cant_productos_act) + data.get('demanda')
        else:
            nueva_cap = almacencapacidad(
                almacen_id=data.get('almacen_id'),
                producto_id=data.get('producto_id'),
                cant_productos_act=data.get('demanda')
            )
            db.session.add(nueva_cap)
        
        db.session.commit()
        
        return envio, None
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_envio: {str(e)}")
        print(traceback.format_exc())
        return None, f"Error al actualizar el envío: {str(e)}"

def cancelar_envio(asignacion_id):
    """
    Cancela un envío (solo si está PENDIENTE)
    """
    try:
        envio = distribucionalmacenproducto.query.get(asignacion_id)
        
        if not envio:
            return False, "Envío no encontrado"
        
        if envio.estado_envio != 'PENDIENTE':
            return False, "Solo se pueden cancelar envíos pendientes"
        
        # Revertir cambios en stock y capacidad
        producto_obj = producto.query.get(envio.producto_id)
        if producto_obj:
            producto_obj.cant_productos_act = float(producto_obj.cant_productos_act) + float(envio.demanda)
        
        cap = almacencapacidad.query.filter_by(
            almacen_id=envio.almacen_id,
            producto_id=envio.producto_id
        ).first()
        
        if cap:
            cap.cant_productos_act = float(cap.cant_productos_act) - float(envio.demanda)
        
        envio.estado_envio = 'CANCELADO'
        
        db.session.commit()
        
        return True, "Envío cancelado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en cancelar_envio: {str(e)}")
        return False, f"Error al cancelar el envío: {str(e)}"

def registrar_distribucion_productos_excel():
    """
    Función existente para registrar desde Excel
    """
    try:
        # Ruta del archivo Excel
        excel_path = "src/static/uploads/distribucion_almacen_producto.xlsx"
        
        # Verificar si el archivo existe
        if not os.path.exists(excel_path):
            return {
                "success": False,
                "error": "Archivo no encontrado",
                "message": f"El archivo {excel_path} no existe"
            }
        
        # Leer el archivo Excel
        import pandas as pd
        df = pd.read_excel(excel_path)
        
        # Verificar que el DataFrame no esté vacío
        if df.empty:
            return {
                "success": False,
                "error": "Archivo vacío",
                "message": "El archivo Excel está vacío"
            }
        
        print(f"Total de registros en Excel: {len(df)}")
        
        # Función para convertir fecha
        def convertir_fecha(fecha_val):
            if pd.isna(fecha_val):
                return None
            
            try:
                # Si es string con formato dd/mm/yyyy
                if isinstance(fecha_val, str):
                    # Limpiar espacios
                    fecha_val = fecha_val.strip()
                    # Convertir dd/mm/yyyy a datetime
                    try:
                        return datetime.strptime(fecha_val, '%d/%m/%Y').date()
                    except:
                        # Intentar otros formatos
                        try:
                            return datetime.strptime(fecha_val, '%Y-%m-%d').date()
                        except:
                            try:
                                return datetime.strptime(fecha_val, '%m/%d/%Y').date()
                            except:
                                return None
                # Si ya es datetime o Timestamp
                elif isinstance(fecha_val, (datetime, pd.Timestamp)):
                    return fecha_val.date()
                else:
                    return None
            except Exception as e:
                print(f"Error convirtiendo fecha {fecha_val}: {e}")
                return None
        
        # Función para convertir hora
        def convertir_hora(hora_val):
            if pd.isna(hora_val):
                return None
            
            try:
                # Si es string
                if isinstance(hora_val, str):
                    hora_val = hora_val.strip()
                    try:
                        return datetime.strptime(hora_val, '%H:%M:%S').time()
                    except:
                        try:
                            return datetime.strptime(hora_val, '%H:%M').time()
                        except:
                            return None
                # Si ya es time
                elif isinstance(hora_val, time):
                    return hora_val
                # Si es datetime o timestamp
                elif isinstance(hora_val, (datetime, pd.Timestamp)):
                    return hora_val.time()
                else:
                    return None
            except Exception as e:
                print(f"Error convirtiendo hora {hora_val}: {e}")
                return None
        
        # Convertir columnas
        if 'fecha_envio' in df.columns:
            df['fecha_envio_conv'] = df['fecha_envio'].apply(convertir_fecha)
        else:
            df['fecha_envio_conv'] = None
        
        if 'hora_envio' in df.columns:
            df['hora_envio_conv'] = df['hora_envio'].apply(convertir_hora)
        else:
            df['hora_envio_conv'] = None
        
        if 'hora_llegada' in df.columns:
            df['hora_llegada_conv'] = df['hora_llegada'].apply(convertir_hora)
        else:
            df['hora_llegada_conv'] = None
        
        # Convertir otras columnas
        df['almacen_id'] = pd.to_numeric(df['almacen_id'], errors='coerce')
        df['producto_id'] = pd.to_numeric(df['producto_id'], errors='coerce')
        df['vehiculo_conductor_id'] = pd.to_numeric(df['vehiculo_conductor_id'], errors='coerce')
        df['dia'] = pd.to_numeric(df['dia'], errors='coerce')
        df['mes'] = pd.to_numeric(df['mes'], errors='coerce')
        df['anio'] = pd.to_numeric(df['anio'], errors='coerce')
        df['demanda'] = pd.to_numeric(df['demanda'], errors='coerce')
        df['gasto'] = pd.to_numeric(df['gasto'], errors='coerce')
        
        # Manejar nro_envio
        if 'nro_envio' in df.columns:
            df['nro_envio'] = df['nro_envio'].fillna('').astype(str)
        
        # Reemplazar NaN por None
        df = df.where(pd.notnull(df), None)
        
        # Insertar usando SQL directo para mejor control
        registros_insertados = 0
        errores = []
        
        # Obtener conexión de la base de datos
        connection = db.engine.connect()
        
        # Preparar consulta SQL
        sql = """
            INSERT INTO distribucion_almacen_producto 
            (asignacion_id, almacen_id, producto_id, vehiculo_conductor_id, 
             dia, mes, anio, fecha_envio, hora_envio, hora_llegada, 
             estado_envio, demanda, gasto, nro_envio)
            VALUES 
            (:asignacion_id, :almacen_id, :producto_id, :vehiculo_conductor_id, 
             :dia, :mes, :anio, :fecha_envio, :hora_envio, :hora_llegada, 
             :estado_envio, :demanda, :gasto, :nro_envio)
            ON CONFLICT (asignacion_id) DO NOTHING
        """
        
        # Procesar en lotes
        batch_size = 100
        total_batches = (len(df) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(df))
            batch = df.iloc[start_idx:end_idx]
            
            try:
                # Preparar datos para el lote
                data_list = []
                
                for idx, row in batch.iterrows():
                    data = {
                        'asignacion_id': row.get('asignacion_id'),
                        'almacen_id': row.get('almacen_id'),
                        'producto_id': row.get('producto_id'),
                        'vehiculo_conductor_id': row.get('vehiculo_conductor_id'),
                        'dia': row.get('dia'),
                        'mes': row.get('mes'),
                        'anio': row.get('anio'),
                        'fecha_envio': row.get('fecha_envio_conv'),
                        'hora_envio': row.get('hora_envio_conv'),
                        'hora_llegada': row.get('hora_llegada_conv'),
                        'estado_envio': row.get('estado_envio'),
                        'demanda': row.get('demanda'),
                        'gasto': row.get('gasto'),
                        'nro_envio': row.get('nro_envio') if row.get('nro_envio') not in ['', 'nan', 'None', None] else None
                    }
                    data_list.append(data)
                
                # Ejecutar inserción del lote
                if data_list:
                    with connection.begin() as trans:
                        connection.execute(text(sql), data_list)
                    
                    registros_insertados += len(data_list)
                    print(f"Procesado lote {batch_num + 1}/{total_batches}: {len(data_list)} registros")
                    
            except Exception as e:
                errores.append(f"Lote {batch_num + 1}: {str(e)}")
                print(f"Error en lote {batch_num + 1}: {e}")
                # Continuar con el siguiente lote
                continue
        
        connection.close()
        
        # Preparar respuesta
        mensaje = f"Proceso completado. Se insertaron {registros_insertados} de {len(df)} registros."
        if errores:
            mensaje += f" Se encontraron {len(errores)} lotes con errores."
        
        return {
            "success": True,
            "message": mensaje,
            "registros_insertados": registros_insertados,
            "total_registros": len(df),
            "errores_en_lotes": len(errores),
            "errores_detalle": errores[:10]  # Mostrar solo primeros 10 errores
        }
        
    except Exception as e:
        print(f"Error general: {e}")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Error al registrar la distribucion productos"
        }

def cambiar_estado_envio(asignacion_id, nuevo_estado):
    """
    Cambia el estado de un envío
    """
    try:
        envio = distribucionalmacenproducto.query.get(asignacion_id)
        
        if not envio:
            return False, "Envío no encontrado"
        
        # Validar transiciones de estado permitidas
        if envio.estado_envio == 'PENDIENTE' and nuevo_estado not in ['EN_RUTA', 'CANCELADO']:
            return False, "Transición de estado no permitida"
        
        if envio.estado_envio == 'EN_RUTA' and nuevo_estado not in ['ENTREGADO']:
            return False, "Transición de estado no permitida"
        
        if envio.estado_envio == 'ENTREGADO':
            return False, "No se puede cambiar el estado de un envío entregado"
        
        if envio.estado_envio == 'CANCELADO':
            return False, "No se puede cambiar el estado de un envío cancelado"
        
        envio.estado_envio = nuevo_estado
        
        db.session.commit()
        
        return True, f"Estado cambiado a {nuevo_estado} exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"

def obtener_envio_por_nro(nro_envio):
    """
    Obtiene un envío específico por su número de envío CON TODOS LOS DATOS
    """
    try:
        # Buscar el envío por nro_envio con JOIN a todas las tablas necesarias
        query = db.session.query(
            distribucionalmacenproducto,
            almacen.nombre.label('almacen_nombre'),
            almacen.tipo_almacen.label('almacen_tipo'),
            almacen.direccion.label('almacen_direccion'),
            almacen.capacidad.label('almacen_capacidad'),
            almacen.latitud.label('almacen_latitud'),
            almacen.longitud.label('almacen_longitud'),
            producto.nombre.label('producto_nombre'),
            producto.tipo.label('producto_tipo'),
            producto.variedad.label('producto_variedad'),
            producto.cant_productos_act.label('producto_stock'),
            vehiculo.vehiculo_id.label('vehiculo_id'),
            vehiculo.placa.label('vehiculo_placa'),
            vehiculo.marca.label('vehiculo_marca'),
            vehiculo.modelo.label('vehiculo_modelo'),
            vehiculo.cantidad_carga.label('vehiculo_capacidad'),
            conductor.conductor_id.label('conductor_id'),
            conductor.nombre.label('conductor_nombre'),
            conductor.apellido_paterno.label('conductor_apellido_paterno'),
            conductor.apellido_materno.label('conductor_apellido_materno'),
            conductor.dni.label('conductor_dni'),
            conductor.telefono.label('conductor_telefono'),
            conductorubicacion.latitud.label('conductor_ubicacion_latitud'),
            conductorubicacion.longitud.label('conductor_ubicacion_longitud')
        ).outerjoin(
            almacen, distribucionalmacenproducto.almacen_id == almacen.almacen_id
        ).outerjoin(
            producto, distribucionalmacenproducto.producto_id == producto.producto_id
        ).outerjoin(
            vehiculoconductor, distribucionalmacenproducto.vehiculo_conductor_id == vehiculoconductor.vehiculo_conductor_id
        ).outerjoin(
            vehiculo, vehiculoconductor.vehiculo_id == vehiculo.vehiculo_id
        ).outerjoin(
            conductor, vehiculoconductor.conductor_id == conductor.conductor_id
        ).outerjoin(
            conductorubicacion, conductor.conductor_id == conductorubicacion.conductor_id
        ).filter(
            distribucionalmacenproducto.nro_envio == nro_envio
        ).first()
        
        if not query:
            return {
                "success": False,
                "message": "Envío no encontrado"
            }
        
        # Desempaquetar el resultado
        envio = query[0]
        
        # Construir nombre completo del conductor
        nombre_conductor = None
        if query.conductor_nombre:
            nombre_conductor = f"{query.conductor_nombre} {query.conductor_apellido_paterno or ''} {query.conductor_apellido_materno or ''}".strip()
        
        # Preparar datos completos del envío
        envio_data = {
            "asignacion_id": envio.asignacion_id,
            "nro_envio": envio.nro_envio,
            "almacen_id": envio.almacen_id,
            "almacen_nombre": query.almacen_nombre,
            "almacen_tipo": query.almacen_tipo,
            "almacen_direccion": query.almacen_direccion,
            "almacen_capacidad": float(query.almacen_capacidad) if query.almacen_capacidad else None,
            "almacen_latitud": float(query.almacen_latitud) if query.almacen_latitud else None,
            "almacen_longitud": float(query.almacen_longitud) if query.almacen_longitud else None,
            "producto_id": envio.producto_id,
            "producto_nombre": query.producto_nombre,
            "producto_tipo": query.producto_tipo,
            "producto_variedad": query.producto_variedad,
            "producto_stock": float(query.producto_stock) if query.producto_stock else 0,
            "vehiculo_conductor_id": envio.vehiculo_conductor_id,
            "vehiculo_id": query.vehiculo_id,
            "vehiculo_placa": query.vehiculo_placa,
            "vehiculo_marca": query.vehiculo_marca,
            "vehiculo_modelo": query.vehiculo_modelo,
            "vehiculo_capacidad": float(query.vehiculo_capacidad) if query.vehiculo_capacidad else None,
            "conductor_id": query.conductor_id,
            "conductor_nombre": nombre_conductor,
            "conductor_dni": query.conductor_dni,
            "conductor_telefono": query.conductor_telefono,
            "conductor_ubicacion_latitud": float(query.conductor_ubicacion_latitud) if query.conductor_ubicacion_latitud else None,
            "conductor_ubicacion_longitud": float(query.conductor_ubicacion_longitud) if query.conductor_ubicacion_longitud else None,
            "fecha_envio": envio.fecha_envio.isoformat() if envio.fecha_envio else None,
            "hora_envio": envio.hora_envio.strftime('%H:%M') if envio.hora_envio else None,
            "hora_llegada": envio.hora_llegada.strftime('%H:%M') if envio.hora_llegada else None,
            "estado_envio": envio.estado_envio,
            "demanda": float(envio.demanda) if envio.demanda else 0,
            "gasto": float(envio.gasto) if envio.gasto else None,
            "dia": envio.dia,
            "mes": envio.mes,
            "anio": envio.anio
        }
        
        return {
            "success": True,
            "envio": envio_data
        }
        
    except Exception as e:
        print(f"Error en obtener_envio_por_nro: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el envío por número"
        }