from ..models.models import db, vehiculoconductor, conductor, vehiculo
from sqlalchemy import text
from datetime import datetime

def obtener_asignaciones():
    """
    Obtiene todas las asignaciones de vehículo-conductor de la base de datos,
    junto con los nombres de conductor y detalles del vehículo.
    """
    try:
        # Consulta para obtener asignaciones con datos de conductor y vehículo
        asignaciones = db.session.query(
            vehiculoconductor, conductor, vehiculo
        ).join(
            conductor, vehiculoconductor.conductor_id == conductor.conductor_id
        ).join(
            vehiculo, vehiculoconductor.vehiculo_id == vehiculo.vehiculo_id
        ).all()
        
        asignaciones_lista = []
        for vc, cond, veh in asignaciones:
            asignaciones_lista.append({
                "vehiculo_conductor_id": vc.vehiculo_conductor_id,
                "conductor_id": vc.conductor_id,
                "vehiculo_id": vc.vehiculo_id,
                "fecha_asignacion": vc.fecha_asignacion.strftime('%Y-%m-%d') if vc.fecha_asignacion else None,
                "estado": vc.estado,
                "nombre_conductor": f"{cond.nombre} {cond.apellido_paterno} {cond.apellido_materno}".strip(),
                "dni_conductor": cond.dni,
                "placa_vehiculo": veh.placa,
                "marca_vehiculo": veh.marca,
                "modelo_vehiculo": veh.modelo
            })
        
        return {
            "success": True,
            "asignaciones": asignaciones_lista,
            "total": len(asignaciones_lista)
        }
    
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener las asignaciones"
        }


def obtener_asignacion_por_id(asignacion_id):
    """
    Obtiene una asignación específica por su ID
    """
    try:
        vc = vehiculoconductor.query.get(asignacion_id)
        
        if not vc:
            return {
                "success": False,
                "message": "Asignación no encontrada"
            }
        
        asignacion_data = {
            "vehiculo_conductor_id": vc.vehiculo_conductor_id,
            "conductor_id": vc.conductor_id,
            "vehiculo_id": vc.vehiculo_id,
            "fecha_asignacion": vc.fecha_asignacion.strftime('%Y-%m-%d') if vc.fecha_asignacion else None,
            "estado": vc.estado
        }
        
        return {
            "success": True,
            "asignacion": asignacion_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener la asignación"
        }


def obtener_conductores_activos():
    """
    Obtiene todos los conductores activos para llenar el select
    """
    try:
        conductores = conductor.query.filter(conductor.estado == 'ACTIVO').all()
        
        conductores_lista = []
        for cond in conductores:
            conductores_lista.append({
                "conductor_id": cond.conductor_id,
                "nombre": cond.nombre,
                "apellido_paterno": cond.apellido_paterno,
                "apellido_materno": cond.apellido_materno,
                "dni": cond.dni
            })
        
        return {
            "success": True,
            "conductores": conductores_lista
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener conductores"
        }


def obtener_vehiculos_activos():
    """
    Obtiene todos los vehículos activos para llenar el select
    """
    try:
        vehiculos = vehiculo.query.filter(vehiculo.estado == 'ACTIVO').all()
        
        vehiculos_lista = []
        for veh in vehiculos:
            vehiculos_lista.append({
                "vehiculo_id": veh.vehiculo_id,
                "placa": veh.placa,
                "marca": veh.marca,
                "modelo": veh.modelo,
                "cantidad_carga": veh.cantidad_carga
            })
        
        return {
            "success": True,
            "vehiculos": vehiculos_lista
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener vehículos"
        }


def crear_asignacion(conductor_id, vehiculo_id, fecha_asignacion, estado):
    """
    Crea una nueva asignación de vehículo a conductor
    """
    try:
        # Validar que el conductor y vehículo existan (opcional, ya se hace en route)
        if estado not in ['ACTIVO', 'INACTIVO', 'EN_USO']:
            return None, "El estado debe ser ACTIVO, INACTIVO o EN_USO"
        
        # Convertir fecha de string a objeto date
        try:
            fecha_obj = datetime.strptime(fecha_asignacion, '%Y-%m-%d').date()
        except ValueError:
            return None, "Formato de fecha inválido. Use YYYY-MM-DD"
        
        nueva_asignacion = vehiculoconductor(
            conductor_id=conductor_id,
            vehiculo_id=vehiculo_id,
            fecha_asignacion=fecha_obj,
            estado=estado
        )
        
        db.session.add(nueva_asignacion)
        db.session.commit()
        
        return nueva_asignacion, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear la asignación: {str(e)}"


def actualizar_asignacion(asignacion_id, conductor_id, vehiculo_id, fecha_asignacion, estado):
    """
    Actualiza una asignación existente
    """
    try:
        vc = vehiculoconductor.query.get(asignacion_id)
        
        if not vc:
            return None, "Asignación no encontrada"
        
        if estado not in ['ACTIVO', 'INACTIVO', 'EN_USO']:
            return None, "El estado debe ser ACTIVO, INACTIVO o EN_USO"
        
        # No permitir cambio de datos si está EN_USO (validación extra)
        if vc.estado == 'EN_USO' and (conductor_id != vc.conductor_id or vehiculo_id != vc.vehiculo_id):
            return None, "No se puede modificar una asignación que está en uso"
        
        try:
            fecha_obj = datetime.strptime(fecha_asignacion, '%Y-%m-%d').date()
        except ValueError:
            return None, "Formato de fecha inválido. Use YYYY-MM-DD"
        
        vc.conductor_id = conductor_id
        vc.vehiculo_id = vehiculo_id
        vc.fecha_asignacion = fecha_obj
        vc.estado = estado
        
        db.session.commit()
        
        return vc, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar la asignación: {str(e)}"


def cambiar_estado_asignacion(asignacion_id, nuevo_estado):
    """
    Cambia el estado de una asignación
    """
    try:
        vc = vehiculoconductor.query.get(asignacion_id)
        
        if not vc:
            return False, "Asignación no encontrada"
        
        if nuevo_estado not in ['ACTIVO', 'INACTIVO', 'EN_USO']:
            return False, "El estado debe ser ACTIVO, INACTIVO o EN_USO"
        
        vc.estado = nuevo_estado
        db.session.commit()
        
        return True, "Estado actualizado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"


def eliminar_asignacion(asignacion_id):
    """
    Elimina una asignación del sistema
    """
    try:
        vc = vehiculoconductor.query.get(asignacion_id)
        
        if not vc:
            return False, "Asignación no encontrada"
        
        # Validación: no eliminar si está EN_USO
        if vc.estado == 'EN_USO':
            return False, "No se puede eliminar una asignación que está en uso"
        
        db.session.delete(vc)
        db.session.commit()
        
        return True, "Asignación eliminada exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar asignación: {str(e)}"