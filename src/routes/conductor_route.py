from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import conductor_service
from ..models.models import *

from ..services import conductor_service
from werkzeug.utils import secure_filename
import traceback

main = Blueprint("conductor", __name__, url_prefix="/conductor")

@main.route('/gestionar_conductores')
def mainconductor():
    return render_template('conductores.html')

@main.route('/gestionar_disponibilidad')
def gestionar_disponibilidad():
    return render_template('disponibilidad_conductor.html')

@main.route('/obtener_conductores', methods=['GET'])
def obtener_conductores_route():
    """
    Obtiene todos los conductores
    """
    try:
        result = conductor_service.obtener_conductores()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener conductores"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_conductores: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_conductor_xid/<int:conductor_id>', methods=['GET'])
def obtener_conductor_por_id_route(conductor_id):
    """
    Obtiene un conductor específico por su ID
    """
    try:
        result = conductor_service.obtener_conductor_por_id(conductor_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Conductor no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_conductor_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/registrar', methods=['POST'])
def registrar_conductor():
    """
    Registra un nuevo conductor
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        apellido_paterno = data.get("apellido_paterno")
        apellido_materno = data.get("apellido_materno")
        dni = data.get("dni")
        telefono = data.get("telefono")
        direccion = data.get("direccion")
        fecha_ingreso = data.get("fecha_ingreso")
        estado = data.get("estado", "ACTIVO")  # Por defecto ACTIVO si no se envía
        
        if not all([nombre, apellido_paterno, apellido_materno, dni, fecha_ingreso]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        nuevo_conductor, error = conductor_service.crear_conductor(
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            dni=dni,
            telefono=telefono,
            direccion=direccion,
            fecha_ingreso=fecha_ingreso,
            estado=estado
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Conductor registrado exitosamente",
            "conductor_id": nuevo_conductor.conductor_id
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_conductor: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route('/actualizar_conductor/<int:id>', methods=['PUT'])
def actualizar_conductor(id):
    """
    Actualiza un conductor existente
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        apellido_paterno = data.get("apellido_paterno")
        apellido_materno = data.get("apellido_materno")
        dni = data.get("dni")
        telefono = data.get("telefono")
        direccion = data.get("direccion")
        fecha_ingreso = data.get("fecha_ingreso")
        
        # Validar campos obligatorios (estado ya no es obligatorio en actualización)
        if not all([nombre, apellido_paterno, apellido_materno, dni, fecha_ingreso]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        # Obtener el conductor actual para mantener su estado
        conductor_actual = conductor_service.obtener_conductor_por_id(id)
        if not conductor_actual['success']:
            return jsonify({"success": False, "error": "Conductor no encontrado"}), 404
        
        # Mantener el estado actual del conductor
        estado = conductor_actual['conductor']['estado']
        
        conductor_actualizado, error = conductor_service.actualizar_conductor(
            conductor_id=id,
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            dni=dni,
            telefono=telefono,
            direccion=direccion,
            fecha_ingreso=fecha_ingreso,
            estado=estado  # Mantener el estado actual
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Conductor actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_conductor(id):
    """
    Cambia el estado de un conductor
    """
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        success, message = conductor_service.cambiar_estado_conductor(id, data['estado'])
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en cambiar_estado_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/eliminar_conductor/<int:id>', methods=['DELETE'])
def eliminar_conductor(id):
    """
    Elimina un conductor del sistema
    """
    try:
        success, message = conductor_service.eliminar_conductor(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


# ============================
# RUTAS DE DISPONIBILIDAD
# ============================

@main.route('/disponibilidad/obtener_por_conductor/<int:conductor_id>', methods=['GET'])
def obtener_disponibilidad_por_conductor(conductor_id):
    """
    Obtiene todos los horarios de disponibilidad de un conductor específico
    """
    try:
        result = conductor_service.obtener_disponibilidad_por_conductor(conductor_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Conductor no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_disponibilidad_por_conductor: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/disponibilidad/obtener_por_id/<int:disponibilidad_id>', methods=['GET'])
def obtener_disponibilidad_por_id(disponibilidad_id):
    """
    Obtiene un horario específico por su ID
    """
    try:
        result = conductor_service.obtener_disponibilidad_por_id(disponibilidad_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Horario no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_disponibilidad_por_id: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/disponibilidad/registrar', methods=['POST'])
def registrar_disponibilidad():
    """
    Registra un nuevo horario de disponibilidad
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get("conductor_id")
        dia = data.get("dia")
        hora_inicio = data.get("hora_inicio")
        hora_fin = data.get("hora_fin")
        
        if not all([conductor_id, dia, hora_inicio, hora_fin]):
            return jsonify({"success": False, "error": "Todos los campos son requeridos"}), 400
        
        nuevo_horario, error = conductor_service.crear_disponibilidad(
            conductor_id=conductor_id,
            dia=dia,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Horario registrado exitosamente",
            "disponibilidad_id": nuevo_horario.disponibilidad_id
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_disponibilidad: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route('/disponibilidad/actualizar/<int:id>', methods=['PUT'])
def actualizar_disponibilidad(id):
    """
    Actualiza un horario de disponibilidad existente
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        dia = data.get("dia")
        hora_inicio = data.get("hora_inicio")
        hora_fin = data.get("hora_fin")
        
        if not all([dia, hora_inicio, hora_fin]):
            return jsonify({"success": False, "error": "Todos los campos son requeridos"}), 400
        
        horario_actualizado, error = conductor_service.actualizar_disponibilidad(
            disponibilidad_id=id,
            dia=dia,
            hora_inicio=hora_inicio,
            hora_fin=hora_fin
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Horario actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_disponibilidad: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/disponibilidad/eliminar/<int:id>', methods=['DELETE'])
def eliminar_disponibilidad(id):
    """
    Elimina un horario de disponibilidad
    """
    try:
        success, message = conductor_service.eliminar_disponibilidad(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_disponibilidad: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/disponibilidad/eliminar_por_conductor/<int:conductor_id>', methods=['DELETE'])
def eliminar_disponibilidad_por_conductor(conductor_id):
    """
    Elimina todos los horarios de un conductor
    """
    try:
        success, message = conductor_service.eliminar_disponibilidad_por_conductor(conductor_id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_disponibilidad_por_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/disponibilidad/procesar_excel', methods=['POST'])
def procesar_excel_disponibilidad():
    """
    Procesa un conjunto de horarios desde Excel
    """
    try:
        data = request.get_json()
        if not data or 'horarios' not in data:
            return jsonify({"success": False, "error": "No se recibieron horarios para procesar"}), 400
        
        horarios = data['horarios']
        
        if not horarios or len(horarios) == 0:
            return jsonify({"success": False, "error": "La lista de horarios está vacía"}), 400
        
        success, result = conductor_service.procesar_horarios_excel(horarios)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": result['mensaje'],
                "resultados": result['resultados'],
                "errores": result['errores']
            }), 200
        else:
            return jsonify({"success": False, "error": result}), 400
        
    except Exception as e:
        print(f"Error en procesar_excel_disponibilidad: {str(e)}")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ============================
# RUTAS DE UBICACIÓN (existentes)
# ============================

@main.route('/actualizar_ubicacion', methods=['POST'])
def actualizar_ubicacion():
    """Actualiza la ubicación de un conductor (UPDATE en lugar de INSERT)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get('conductor_id')
        latitud = data.get('latitud')
        longitud = data.get('longitud')
        
        if not all([conductor_id, latitud, longitud]):
            return jsonify({"success": False, "error": "Faltan datos requeridos"}), 400
        
        # Validar que el conductor exista
        cond = conductor.query.get(conductor_id)
        if not cond:
            return jsonify({"success": False, "error": "Conductor no encontrado"}), 404
        
        # Buscar si ya existe una ubicación para este conductor
        ubicacion = conductorubicacion.query.filter_by(conductor_id=conductor_id).first()
        
        if ubicacion:
            # ACTUALIZAR ubicación existente
            ubicacion.latitud = latitud
            ubicacion.longitud = longitud
            mensaje = "Ubicación actualizada exitosamente"
        else:
            # Si no existe, CREAR nuevo registro
            ubicacion = conductorubicacion(
                conductor_id=conductor_id,
                latitud=latitud,
                longitud=longitud
            )
            db.session.add(ubicacion)
            mensaje = "Ubicación creada exitosamente"
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": mensaje,
            "ubicacion_id": ubicacion.ubicacion_id if hasattr(ubicacion, 'ubicacion_id') else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_ubicacion: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_ultima_ubicacion/<int:conductor_id>', methods=['GET'])
def obtener_ultima_ubicacion(conductor_id):
    """Obtiene la ubicación actual de un conductor"""
    try:
        # Buscar ubicación del conductor
        ubicacion = conductorubicacion.query.filter_by(
            conductor_id=conductor_id
        ).first()
        
        if not ubicacion:
            return jsonify({
                "success": False,
                "error": "No hay ubicación registrada para este conductor"
            }), 404
        
        return jsonify({
            "success": True,
            "ubicacion": {
                "ubicacion_id": ubicacion.ubicacion_id,
                "conductor_id": ubicacion.conductor_id,
                "latitud": float(ubicacion.latitud),
                "longitud": float(ubicacion.longitud)
            }
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_ultima_ubicacion: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_historial_ubicaciones/<int:conductor_id>', methods=['GET'])
def obtener_historial_ubicaciones(conductor_id):
    """Obtiene el historial de ubicaciones de un conductor"""
    try:
        limite = request.args.get('limite', 10, type=int)
        
        ubicaciones = conductorubicacion.query.filter_by(
            conductor_id=conductor_id
        ).order_by(
            conductorubicacion.ubicacion_id.desc()
        ).limit(limite).all()
        
        if not ubicaciones:
            return jsonify({
                "success": False,
                "error": "No hay ubicaciones registradas para este conductor"
            }), 404
        
        ubicaciones_lista = []
        for ub in ubicaciones:
            ubicaciones_lista.append({
                "ubicacion_id": ub.ubicacion_id,
                "latitud": float(ub.latitud),
                "longitud": float(ub.longitud),
                "fecha": ub.fecha_registro.isoformat() if hasattr(ub, 'fecha_registro') else None
            })
        
        return jsonify({
            "success": True,
            "ubicaciones": ubicaciones_lista,
            "total": len(ubicaciones_lista)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_historial_ubicaciones: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@main.route('/disponibilidad/guardar_horarios', methods=['POST'])
def guardar_horarios_disponibilidad():
    """
    Guarda los horarios para un día específico (reemplaza los existentes)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get("conductor_id")
        dia = data.get("dia")
        horarios = data.get("horarios", [])
        
        if not all([conductor_id, dia]):
            return jsonify({"success": False, "error": "Faltan datos requeridos"}), 400
        
        # Validar que el conductor existe
        cond = conductor.query.get(conductor_id)
        if not cond:
            return jsonify({"success": False, "error": "Conductor no encontrado"}), 404
        
        # Eliminar horarios existentes para este día
        disponibilidadconductor.query.filter_by(
            conductor_id=conductor_id,
            dia=dia
        ).delete()
        
        # Insertar nuevos horarios
        horarios_creados = 0
        for h in horarios:
            try:
                hora_inicio = time.fromisoformat(h['hora_inicio'])
                hora_fin = time.fromisoformat(h['hora_fin'])
                
                nuevo_horario = disponibilidadconductor(
                    conductor_id=conductor_id,
                    dia=dia,
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin
                )
                db.session.add(nuevo_horario)
                horarios_creados += 1
            except Exception as e:
                print(f"Error al crear horario: {e}")
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": f"Se guardaron {horarios_creados} horarios para {dia}",
            "horarios_creados": horarios_creados
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en guardar_horarios_disponibilidad: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
    
@main.route('/disponibilidad/guardar_todos_horarios', methods=['POST'])
def guardar_todos_horarios():
    """
    Guarda todos los horarios de un conductor (reemplaza todos los existentes)
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        conductor_id = data.get("conductor_id")
        horarios = data.get("horarios", [])
        
        if not conductor_id:
            return jsonify({"success": False, "error": "Falta ID del conductor"}), 400
        
        # Validar que el conductor existe
        cond = conductor.query.get(conductor_id)
        if not cond:
            return jsonify({"success": False, "error": "Conductor no encontrado"}), 404
        
        # Eliminar todos los horarios existentes del conductor
        disponibilidadconductor.query.filter_by(conductor_id=conductor_id).delete()
        
        # Insertar nuevos horarios
        horarios_creados = 0
        for h in horarios:
            try:
                # Validar día
                if h['dia'] not in ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']:
                    continue
                
                hora_inicio = time.fromisoformat(h['hora_inicio'])
                hora_fin = time.fromisoformat(h['hora_fin'])
                
                # Validar rango de horas (7:00 - 20:00)
                hora_min = time(7, 0)
                hora_max = time(20, 0)
                
                if hora_inicio < hora_min or hora_inicio > hora_max:
                    continue
                
                if hora_fin < hora_min or hora_fin > hora_max:
                    continue
                
                if hora_inicio >= hora_fin:
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
                print(f"Error al crear horario: {e}")
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": f"Se guardaron {horarios_creados} horarios para el conductor",
            "horarios_creados": horarios_creados
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en guardar_todos_horarios: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500