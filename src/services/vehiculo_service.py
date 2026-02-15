from ..models.models import db, vehiculo
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename

def obtener_vehiculos():
    """
    Obtiene todos los vehículos de la base de datos
    """
    try:
        vehiculos = vehiculo.query.all()
        
        vehiculos_lista = []
        for veh in vehiculos:
            vehiculos_lista.append({
                "vehiculo_id": veh.vehiculo_id,
                "placa": veh.placa,
                "modelo": veh.modelo,
                "marca": veh.marca,
                "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
                "tipo_vehiculo": veh.tipo_vehiculo,
                "anio_fabricacion": veh.anio_fabricacion,
                "estado": veh.estado
            })
        
        return {
            "success": True,
            "vehiculos": vehiculos_lista,
            "total": len(vehiculos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los vehículos"
        }


def obtener_vehiculo_por_id(vehiculo_id):
    """
    Obtiene un vehículo específico por su ID
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return {
                "success": False,
                "message": "Vehículo no encontrado"
            }
        
        vehiculo_data = {
            "vehiculo_id": veh.vehiculo_id,
            "placa": veh.placa,
            "modelo": veh.modelo,
            "marca": veh.marca,
            "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
            "tipo_vehiculo": veh.tipo_vehiculo,
            "anio_fabricacion": veh.anio_fabricacion,
            "estado": veh.estado
        }
        
        return {
            "success": True,
            "vehiculo": vehiculo_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el vehículo"
        }


def obtener_vehiculos_filtrados(filtros=None):
    """
    Obtiene vehículos con filtros opcionales
    """
    try:
        query = vehiculo.query
        
        if filtros:
            if 'tipo_vehiculo' in filtros and filtros['tipo_vehiculo']:
                query = query.filter(vehiculo.tipo_vehiculo == filtros['tipo_vehiculo'])
            
            if 'estado' in filtros and filtros['estado']:
                query = query.filter(vehiculo.estado == filtros['estado'])
            
            if 'marca' in filtros and filtros['marca']:
                query = query.filter(vehiculo.marca.ilike(f"%{filtros['marca']}%"))
            
            if 'placa' in filtros and filtros['placa']:
                query = query.filter(vehiculo.placa.ilike(f"%{filtros['placa']}%"))
        
        vehiculos = query.all()
        
        vehiculos_lista = []
        for veh in vehiculos:
            vehiculos_lista.append({
                "vehiculo_id": veh.vehiculo_id,
                "placa": veh.placa,
                "modelo": veh.modelo,
                "marca": veh.marca,
                "cantidad_carga": float(veh.cantidad_carga) if veh.cantidad_carga else 0,
                "tipo_vehiculo": veh.tipo_vehiculo,
                "anio_fabricacion": veh.anio_fabricacion,
                "estado": veh.estado
            })
        
        return {
            "success": True,
            "vehiculos": vehiculos_lista,
            "total": len(vehiculos_lista),
            "filtros_aplicados": filtros if filtros else {}
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener vehículos filtrados"
        }


def crear_vehiculo(placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado):
    """
    Crea un nuevo vehículo en el sistema
    """
    try:
        # Validar que la placa no exista
        if vehiculo.query.filter_by(placa=placa).first():
            return None, "Ya existe un vehículo con esa placa"
        
        # Validar tipos permitidos
        tipos_permitidos = ['Camión', 'Camioneta', 'Furgón', 'Tráiler', 'Volquete', 'Otro']
        if tipo_vehiculo not in tipos_permitidos:
            return None, f"El tipo de vehículo debe ser uno de: {', '.join(tipos_permitidos)}"
        
        # Validar estados permitidos (CORREGIDO: ACTIVO, EN_USO, INACTIVO)
        estados_permitidos = ['ACTIVO', 'EN_USO', 'INACTIVO']
        if estado not in estados_permitidos:
            return None, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        # Validar año de fabricación
        if anio_fabricacion < 1900 or anio_fabricacion > 2025:
            return None, "El año de fabricación debe estar entre 1900 y 2025"
        
        # Validar cantidad de carga
        if cantidad_carga <= 0:
            return None, "La capacidad de carga debe ser mayor a 0"
        
        nuevo_vehiculo = vehiculo(
            placa=placa.upper(),
            modelo=modelo,
            marca=marca,
            cantidad_carga=cantidad_carga,
            tipo_vehiculo=tipo_vehiculo,
            anio_fabricacion=anio_fabricacion,
            estado=estado
        )
        
        db.session.add(nuevo_vehiculo)
        db.session.commit()
        
        return nuevo_vehiculo, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear el vehículo: {str(e)}"


def actualizar_vehiculo(vehiculo_id, placa, modelo, marca, cantidad_carga, tipo_vehiculo, anio_fabricacion, estado):
    """
    Actualiza un vehículo existente
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return None, "Vehículo no encontrado"
        
        # Validar que la placa no exista en otro vehículo
        placa_existente = vehiculo.query.filter(vehiculo.placa == placa, vehiculo.vehiculo_id != vehiculo_id).first()
        if placa_existente:
            return None, "Ya existe otro vehículo con esa placa"
        
        # Validar tipos permitidos
        tipos_permitidos = ['Camión', 'Camioneta', 'Furgón', 'Tráiler', 'Volquete', 'Otro']
        if tipo_vehiculo not in tipos_permitidos:
            return None, f"El tipo de vehículo debe ser uno de: {', '.join(tipos_permitidos)}"
        
        # Validar estados permitidos (CORREGIDO: ACTIVO, EN_USO, INACTIVO)
        estados_permitidos = ['ACTIVO', 'EN_USO', 'INACTIVO']
        if estado not in estados_permitidos:
            return None, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        # Validar año de fabricación
        if anio_fabricacion < 1900 or anio_fabricacion > 2025:
            return None, "El año de fabricación debe estar entre 1900 y 2025"
        
        # Validar cantidad de carga
        if cantidad_carga <= 0:
            return None, "La capacidad de carga debe ser mayor a 0"
        
        veh.placa = placa.upper()
        veh.modelo = modelo
        veh.marca = marca
        veh.cantidad_carga = cantidad_carga
        veh.tipo_vehiculo = tipo_vehiculo
        veh.anio_fabricacion = anio_fabricacion
        veh.estado = estado
        
        db.session.commit()
        
        return veh, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar el vehículo: {str(e)}"


def cambiar_estado_vehiculo(vehiculo_id, nuevo_estado):
    """
    Cambia el estado de un vehículo
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return False, "Vehículo no encontrado"
        
        # Validar estados permitidos (CORREGIDO: ACTIVO, EN_USO, INACTIVO)
        estados_permitidos = ['ACTIVO', 'EN_USO', 'INACTIVO']
        if nuevo_estado not in estados_permitidos:
            return False, f"El estado debe ser uno de: {', '.join(estados_permitidos)}"
        
        veh.estado = nuevo_estado
        db.session.commit()
        
        return True, "Estado actualizado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"


def eliminar_vehiculo(vehiculo_id):
    """
    Elimina un vehículo del sistema
    """
    try:
        veh = vehiculo.query.get(vehiculo_id)
        
        if not veh:
            return False, "Vehículo no encontrado"
        
        # Verificar si tiene asignaciones activas
        from ..models.models import vehiculoconductor
        
        asignaciones_activas = vehiculoconductor.query.filter_by(
            vehiculo_id=vehiculo_id, 
            estado='ACTIVO'
        ).first()
        
        if asignaciones_activas:
            return False, "No se puede eliminar el vehículo porque tiene asignaciones activas con conductores"
        
        db.session.delete(veh)
        db.session.commit()
        
        return True, "Vehículo eliminado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar vehículo: {str(e)}"