from ..models.models import db, conductor, disponibilidadconductor
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename
from datetime import datetime, time

def obtener_conductores():
    """
    Obtiene todos los conductores de la base de datos
    """
    try:
        conductores = conductor.query.all()
        
        conductores_lista = []
        for cond in conductores:
            conductores_lista.append({
                "conductor_id": cond.conductor_id,
                "nombre": cond.nombre,
                "apellido_paterno": cond.apellido_paterno,
                "apellido_materno": cond.apellido_materno,
                "dni": cond.dni,
                "telefono": cond.telefono,
                "direccion": cond.direccion,
                "fecha_ingreso": cond.fecha_ingreso.isoformat() if cond.fecha_ingreso else None,
                "estado": cond.estado,
                "usuario_id": cond.usuario_id
            })
        
        return {
            "success": True,
            "conductores": conductores_lista,
            "total": len(conductores_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los conductores"
        }


def obtener_conductor_por_id(conductor_id):
    """
    Obtiene un conductor específico por su ID
    """
    try:
        cond = conductor.query.get(conductor_id)
        
        if not cond:
            return {
                "success": False,
                "message": "Conductor no encontrado"
            }
        
        conductor_data = {
            "conductor_id": cond.conductor_id,
            "nombre": cond.nombre,
            "apellido_paterno": cond.apellido_paterno,
            "apellido_materno": cond.apellido_materno,
            "dni": cond.dni,
            "telefono": cond.telefono,
            "direccion": cond.direccion,
            "fecha_ingreso": cond.fecha_ingreso.isoformat() if cond.fecha_ingreso else None,
            "estado": cond.estado,
            "usuario_id": cond.usuario_id
        }
        
        return {
            "success": True,
            "conductor": conductor_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el conductor"
        }


def obtener_conductores_filtrados(filtros=None):
    """
    Obtiene conductores con filtros opcionales
    """
    try:
        query = conductor.query
        
        if filtros:
            if 'estado' in filtros and filtros['estado']:
                query = query.filter(conductor.estado == filtros['estado'])
            
            if 'dni' in filtros and filtros['dni']:
                query = query.filter(conductor.dni.ilike(f"%{filtros['dni']}%"))
            
            if 'nombre' in filtros and filtros['nombre']:
                query = query.filter(
                    (conductor.nombre.ilike(f"%{filtros['nombre']}%")) |
                    (conductor.apellido_paterno.ilike(f"%{filtros['nombre']}%")) |
                    (conductor.apellido_materno.ilike(f"%{filtros['nombre']}%"))
                )
        
        conductores = query.all()
        
        conductores_lista = []
        for cond in conductores:
            conductores_lista.append({
                "conductor_id": cond.conductor_id,
                "nombre": cond.nombre,
                "apellido_paterno": cond.apellido_paterno,
                "apellido_materno": cond.apellido_materno,
                "dni": cond.dni,
                "telefono": cond.telefono,
                "direccion": cond.direccion,
                "fecha_ingreso": cond.fecha_ingreso.isoformat() if cond.fecha_ingreso else None,
                "estado": cond.estado,
                "usuario_id": cond.usuario_id
            })
        
        return {
            "success": True,
            "conductores": conductores_lista,
            "total": len(conductores_lista),
            "filtros_aplicados": filtros if filtros else {}
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener conductores filtrados"
        }


def crear_conductor(nombre, apellido_paterno, apellido_materno, dni, telefono, direccion, fecha_ingreso, estado):
    """
    Crea un nuevo conductor en el sistema
    """
    try:
        # Validar que el DNI no esté duplicado
        existe_conductor = conductor.query.filter_by(dni=dni).first()
        if existe_conductor:
            return None, "El DNI ingresado ya está registrado en el sistema"
        
        # Validar estados permitidos
        estados_permitidos = ['ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA']
        if estado not in estados_permitidos:
            return None, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        # Convertir fecha de string a objeto date si es necesario
        if isinstance(fecha_ingreso, str):
            fecha_ingreso = datetime.strptime(fecha_ingreso, '%Y-%m-%d').date()
        
        nuevo_conductor = conductor(
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            dni=dni,
            telefono=telefono,
            direccion=direccion,
            fecha_ingreso=fecha_ingreso,
            estado=estado,
            usuario_id=None
        )
        
        db.session.add(nuevo_conductor)
        db.session.commit()
        
        return nuevo_conductor, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear el conductor: {str(e)}"


def actualizar_conductor(conductor_id, nombre, apellido_paterno, apellido_materno, dni, telefono, direccion, fecha_ingreso, estado):
    """
    Actualiza un conductor existente
    """
    try:
        cond = conductor.query.get(conductor_id)
        
        if not cond:
            return None, "Conductor no encontrado"
        
        # Validar que el DNI no esté duplicado (excepto el del mismo conductor)
        existe_conductor = conductor.query.filter(conductor.dni == dni, conductor.conductor_id != conductor_id).first()
        if existe_conductor:
            return None, "El DNI ingresado ya está registrado en el sistema"
        
        # Validar estados permitidos
        estados_permitidos = ['ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA']
        if estado not in estados_permitidos:
            return None, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        # Convertir fecha de string a objeto date si es necesario
        if isinstance(fecha_ingreso, str):
            fecha_ingreso = datetime.strptime(fecha_ingreso, '%Y-%m-%d').date()
        
        cond.nombre = nombre
        cond.apellido_paterno = apellido_paterno
        cond.apellido_materno = apellido_materno
        cond.dni = dni
        cond.telefono = telefono
        cond.direccion = direccion
        cond.fecha_ingreso = fecha_ingreso
        cond.estado = estado
        
        db.session.commit()
        
        return cond, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar el conductor: {str(e)}"


def cambiar_estado_conductor(conductor_id, nuevo_estado):
    """
    Cambia el estado de un conductor
    """
    try:
        cond = conductor.query.get(conductor_id)
        
        if not cond:
            return False, "Conductor no encontrado"
        
        # Validar estados permitidos
        estados_permitidos = ['ACTIVO', 'INACTIVO', 'VACACIONES', 'LICENCIA']
        if nuevo_estado not in estados_permitidos:
            return False, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        cond.estado = nuevo_estado
        db.session.commit()
        
        return True, "Estado actualizado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"


def eliminar_conductor(conductor_id):
    """
    Elimina un conductor del sistema
    """
    try:
        cond = conductor.query.get(conductor_id)
        
        if not cond:
            return False, "Conductor no encontrado"
        
        # Verificar si el conductor tiene registros relacionados
        from ..models.models import vehiculoconductor, conductorubicacion
        
        tiene_vehiculos = vehiculoconductor.query.filter_by(conductor_id=conductor_id).first()
        tiene_ubicaciones = conductorubicacion.query.filter_by(conductor_id=conductor_id).first()
        tiene_disponibilidad = disponibilidadconductor.query.filter_by(conductor_id=conductor_id).first()
        
        if tiene_vehiculos or tiene_ubicaciones or tiene_disponibilidad:
            return False, "No se puede eliminar el conductor porque tiene registros asociados"
        
        db.session.delete(cond)
        db.session.commit()
        
        return True, "Conductor eliminado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar conductor: {str(e)}"


# ============================
# FUNCIONES DE DISPONIBILIDAD
# ============================

def obtener_disponibilidad_por_conductor(conductor_id):
    """
    Obtiene todos los horarios de disponibilidad de un conductor específico
    """
    try:
        # Verificar que el conductor existe
        cond = conductor.query.get(conductor_id)
        if not cond:
            return {
                "success": False,
                "message": "Conductor no encontrado"
            }
        
        horarios = disponibilidadconductor.query.filter_by(conductor_id=conductor_id).all()
        
        horarios_lista = []
        for horario in horarios:
            horarios_lista.append({
                "disponibilidad_id": horario.disponibilidad_id,
                "conductor_id": horario.conductor_id,
                "dia": horario.dia,
                "hora_inicio": horario.hora_inicio.strftime('%H:%M') if horario.hora_inicio else None,
                "hora_fin": horario.hora_fin.strftime('%H:%M') if horario.hora_fin else None
            })
        
        # Ordenar por día y hora
        dias_orden = {
            'lunes': 1,
            'martes': 2,
            'miercoles': 3,
            'jueves': 4,
            'viernes': 5,
            'sabado': 6
        }
        
        horarios_lista.sort(key=lambda x: (dias_orden.get(x['dia'], 7), x['hora_inicio']))
        
        return {
            "success": True,
            "horarios": horarios_lista,
            "total": len(horarios_lista),
            "conductor_id": conductor_id
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener la disponibilidad del conductor"
        }


def obtener_disponibilidad_por_id(disponibilidad_id):
    """
    Obtiene un horario específico por su ID
    """
    try:
        horario = disponibilidadconductor.query.get(disponibilidad_id)
        
        if not horario:
            return {
                "success": False,
                "message": "Horario no encontrado"
            }
        
        horario_data = {
            "disponibilidad_id": horario.disponibilidad_id,
            "conductor_id": horario.conductor_id,
            "dia": horario.dia,
            "hora_inicio": horario.hora_inicio.strftime('%H:%M') if horario.hora_inicio else None,
            "hora_fin": horario.hora_fin.strftime('%H:%M') if horario.hora_fin else None
        }
        
        return {
            "success": True,
            "horario": horario_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el horario"
        }


def crear_disponibilidad(conductor_id, dia, hora_inicio, hora_fin):
    """
    Crea un nuevo horario de disponibilidad para un conductor
    """
    try:
        # Validar que el conductor existe
        cond = conductor.query.get(conductor_id)
        if not cond:
            return None, "Conductor no encontrado"
        
        # Validar día
        dias_permitidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
        if dia not in dias_permitidos:
            return None, f"El día debe ser uno de: {', '.join(dias_permitidos)}"
        
        # Validar horas (7:00 - 20:00)
        if isinstance(hora_inicio, str):
            hora_inicio = time.fromisoformat(hora_inicio)
        if isinstance(hora_fin, str):
            hora_fin = time.fromisoformat(hora_fin)
        
        hora_min = time(7, 0)
        hora_max = time(20, 0)
        
        if hora_inicio < hora_min or hora_inicio > hora_max:
            return None, "La hora de inicio debe estar entre las 7:00 y 20:00"
        
        if hora_fin < hora_min or hora_fin > hora_max:
            return None, "La hora de fin debe estar entre las 7:00 y 20:00"
        
        if hora_inicio >= hora_fin:
            return None, "La hora de fin debe ser posterior a la hora de inicio"
        
        # Verificar si ya existe un horario similar
        existe = disponibilidadconductor.query.filter_by(
            conductor_id=conductor_id,
            dia=dia,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin
        ).first()
        
        if existe:
            return None, "Ya existe un horario idéntico para este conductor"
        
        nuevo_horario = disponibilidadconductor(
            conductor_id=conductor_id,
            dia=dia,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin
        )
        
        db.session.add(nuevo_horario)
        db.session.commit()
        
        return nuevo_horario, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear el horario: {str(e)}"


def actualizar_disponibilidad(disponibilidad_id, dia, hora_inicio, hora_fin):
    """
    Actualiza un horario de disponibilidad existente
    """
    try:
        horario = disponibilidadconductor.query.get(disponibilidad_id)
        
        if not horario:
            return None, "Horario no encontrado"
        
        # Validar día
        dias_permitidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
        if dia not in dias_permitidos:
            return None, f"El día debe ser uno de: {', '.join(dias_permitidos)}"
        
        # Validar horas (7:00 - 20:00)
        if isinstance(hora_inicio, str):
            hora_inicio = time.fromisoformat(hora_inicio)
        if isinstance(hora_fin, str):
            hora_fin = time.fromisoformat(hora_fin)
        
        hora_min = time(7, 0)
        hora_max = time(20, 0)
        
        if hora_inicio < hora_min or hora_inicio > hora_max:
            return None, "La hora de inicio debe estar entre las 7:00 y 20:00"
        
        if hora_fin < hora_min or hora_fin > hora_max:
            return None, "La hora de fin debe estar entre las 7:00 y 20:00"
        
        if hora_inicio >= hora_fin:
            return None, "La hora de fin debe ser posterior a la hora de inicio"
        
        # Verificar si ya existe un horario similar (excepto el actual)
        existe = disponibilidadconductor.query.filter(
            disponibilidadconductor.conductor_id == horario.conductor_id,
            disponibilidadconductor.dia == dia,
            disponibilidadconductor.hora_inicio == hora_inicio,
            disponibilidadconductor.hora_fin == hora_fin,
            disponibilidadconductor.disponibilidad_id != disponibilidad_id
        ).first()
        
        if existe:
            return None, "Ya existe un horario idéntico para este conductor"
        
        horario.dia = dia
        horario.hora_inicio = hora_inicio
        horario.hora_fin = hora_fin
        
        db.session.commit()
        
        return horario, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar el horario: {str(e)}"


def eliminar_disponibilidad(disponibilidad_id):
    """
    Elimina un horario de disponibilidad
    """
    try:
        horario = disponibilidadconductor.query.get(disponibilidad_id)
        
        if not horario:
            return False, "Horario no encontrado"
        
        db.session.delete(horario)
        db.session.commit()
        
        return True, "Horario eliminado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar el horario: {str(e)}"


def eliminar_disponibilidad_por_conductor(conductor_id):
    """
    Elimina todos los horarios de un conductor
    """
    try:
        # Verificar que el conductor existe
        cond = conductor.query.get(conductor_id)
        if not cond:
            return False, "Conductor no encontrado"
        
        # Eliminar todos los horarios del conductor
        disponibilidadconductor.query.filter_by(conductor_id=conductor_id).delete()
        db.session.commit()
        
        return True, "Todos los horarios del conductor han sido eliminados"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar horarios: {str(e)}"


def procesar_horarios_excel(horarios):
    """
    Procesa y guarda múltiples horarios desde Excel
    Elimina los horarios anteriores del conductor y guarda los nuevos
    """
    try:
        if not horarios or len(horarios) == 0:
            return False, "No se recibieron horarios para procesar"
        
        # Agrupar horarios por conductor
        horarios_por_conductor = {}
        for h in horarios:
            conductor_id = h['conductor_id']
            if conductor_id not in horarios_por_conductor:
                horarios_por_conductor[conductor_id] = []
            horarios_por_conductor[conductor_id].append(h)
        
        resultados = []
        errores = []
        
        for conductor_id, horarios_conductor in horarios_por_conductor.items():
            try:
                # Verificar que el conductor existe
                cond = conductor.query.get(conductor_id)
                if not cond:
                    errores.append(f"Conductor ID {conductor_id} no encontrado")
                    continue
                
                # Eliminar horarios anteriores del conductor
                disponibilidadconductor.query.filter_by(conductor_id=conductor_id).delete()
                
                # Insertar nuevos horarios
                horarios_creados = 0
                for h in horarios_conductor:
                    try:
                        # Validar día
                        dias_permitidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
                        if h['dia'] not in dias_permitidos:
                            errores.append(f"Conductor {cond.nombre}: Día inválido '{h['dia']}'")
                            continue
                        
                        # Validar y convertir horas
                        try:
                            hora_inicio = time.fromisoformat(h['hora_inicio'])
                            hora_fin = time.fromisoformat(h['hora_fin'])
                        except:
                            errores.append(f"Conductor {cond.nombre}: Formato de hora inválido")
                            continue
                        
                        # Validar rango de horas
                        hora_min = time(7, 0)
                        hora_max = time(20, 0)
                        
                        if hora_inicio < hora_min or hora_inicio > hora_max:
                            errores.append(f"Conductor {cond.nombre}: Hora inicio fuera de rango (7:00-20:00)")
                            continue
                        
                        if hora_fin < hora_min or hora_fin > hora_max:
                            errores.append(f"Conductor {cond.nombre}: Hora fin fuera de rango (7:00-20:00)")
                            continue
                        
                        if hora_inicio >= hora_fin:
                            errores.append(f"Conductor {cond.nombre}: Hora fin debe ser posterior a hora inicio")
                            continue
                        
                        nuevo_horario = disponibilidadconductor(
                            conductor_id=conductor_id,
                            dia=h['dia'],
                            hora_inicio=hora_inicio,
                            hora_fin=hora_fin
                        )
                        
                        db.session.add(nuevo_horario)
                        horarios_creados += 1
                        
                    except Exception as e:
                        errores.append(f"Conductor {cond.nombre}: {str(e)}")
                
                if horarios_creados > 0:
                    resultados.append(f"Conductor {cond.nombre}: {horarios_creados} horarios procesados")
                
            except Exception as e:
                errores.append(f"Error procesando conductor ID {conductor_id}: {str(e)}")
        
        db.session.commit()
        
        mensaje = f"Procesados {len(resultados)} conductores"
        if len(errores) > 0:
            mensaje += f" con {len(errores)} errores"
        
        return True, {
            "mensaje": mensaje,
            "resultados": resultados,
            "errores": errores
        }
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al procesar horarios: {str(e)}"