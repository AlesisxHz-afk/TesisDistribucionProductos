from ..models.models import db, conductor
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename
from datetime import datetime

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
        from ..models.models import vehiculoconductor, conductorubicacion, disponibilidadconductor
        
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