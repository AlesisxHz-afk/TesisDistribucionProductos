from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import usuario_service
from ..models.models import *
import hashlib
import os
from ..services import usuario_service

main = Blueprint("usuario", __name__, url_prefix="/usuario")

@main.route("/obtener_datos_usuario", methods=["GET"])
def obtener_datos_usuario():
    """Obtiene los datos del usuario actual para usar en JavaScript"""
    try:
        username = request.cookies.get('usuario')
        if not username:
            return jsonify({"success": False, "error": "Usuario no autenticado"}), 401
        
        user = usuario.query.filter_by(usuario=username).first()
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        tipo = tipousuario.query.filter_by(tipo_usuario_id=user.tipo_usuario_id).first()
        
        usuario_data = {
            "usuario_id": user.usuario_id,
            "usuario": user.usuario,
            "nombres": user.nombres,
            "ape_paterno": user.ape_paterno,
            "ape_materno": user.ape_materno,
            "nombre_completo": f"{user.ape_paterno} {user.ape_materno} {user.nombres}",
            "foto_usuario": user.foto_usuario,
            "tipo_usuario_id": user.tipo_usuario_id,
            "tipo_usuario": tipo.tipo_usuario if tipo else "SIN_TIPO",
            "estado_usuario": user.estado_usuario
        }
        
        return jsonify({"success": True, "usuario": usuario_data}), 200
        
    except Exception as e:
        print(f"Error en obtener_datos_usuario: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_usuarios", methods=["GET"])
def obtener_usuarios():
    """Obtiene todos los usuarios con sus tipos"""
    try:
        usuarios = db.session.query(usuario, tipousuario).join(
            tipousuario, usuario.tipo_usuario_id == tipousuario.tipo_usuario_id
        ).all()
        
        usuarios_data = []
        for u, tipo in usuarios:
            usuario_info = {
                'usuario_id': u.usuario_id,
                'usuario': u.usuario,
                'nombres': u.nombres,
                'ape_paterno': u.ape_paterno,
                'ape_materno': u.ape_materno,
                'foto_usuario': u.foto_usuario,
                'tipo_usuario_id': u.tipo_usuario_id,
                'tipo_usuario': tipo.tipo_usuario,
                'estado_usuario': u.estado_usuario
            }
            usuarios_data.append(usuario_info)
        
        return jsonify({
            "success": True,
            "usuarios": usuarios_data,
            "total": len(usuarios_data)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_usuarios: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/obtener_usuario/<int:id>", methods=["GET"])
def obtener_usuario(id):
    """Obtiene un usuario específico por ID"""
    try:
        user = usuario.query.get(id)
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        tipo = tipousuario.query.get(user.tipo_usuario_id)
        
        usuario_data = {
            "usuario_id": user.usuario_id,
            "usuario": user.usuario,
            "nombres": user.nombres,
            "ape_paterno": user.ape_paterno,
            "ape_materno": user.ape_materno,
            "tipo_usuario_id": user.tipo_usuario_id,
            "tipo_usuario": tipo.tipo_usuario if tipo else "Sin tipo",
            "estado_usuario": user.estado_usuario
        }
        
        return jsonify({"success": True, "usuario": usuario_data}), 200
        
    except Exception as e:
        print(f"Error en obtener_usuario: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/es_conductor/<int:id>", methods=["GET"])
def es_conductor(id):
    """Verifica si un usuario es conductor"""
    try:
        conductor_data = conductor.query.filter_by(usuario_id=id).first()
        
        return jsonify({
            "success": True,
            "es_conductor": conductor_data is not None,
            "dni": conductor_data.dni if conductor_data else None
        }), 200
        
    except Exception as e:
        print(f"Error en es_conductor: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/registrar", methods=["POST"])
def registrar_usuario():
    try:
        username = request.form.get("username")
        password = request.form.get("password")
        nombres = request.form.get("nombres")
        paterno = request.form.get("paterno")
        materno = request.form.get("materno")
        tipo_usuario_id = request.form.get("tipo_usuario_id")
        estado_usuario = request.form.get("estado_usuario") == "true"
        dni = request.form.get("dni")
        
        # MODIFICACIÓN: foto puede ser None o no existir en request.files
        foto = None
        if 'foto' in request.files:
            foto_file = request.files['foto']
            # Verificar si realmente se seleccionó un archivo (no vacío)
            if foto_file and foto_file.filename:
                foto = foto_file
        
        if not all([username, password, nombres, paterno, materno, tipo_usuario_id]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        if len(password) < 6:
            return jsonify({"success": False, "error": "La contraseña debe tener al menos 6 caracteres"}), 400
        
        if usuario_service.verificar_usuario_existente(username):
            return jsonify({"success": False, "error": f"El nombre de usuario '{username}' ya está registrado. Por favor, utiliza otro."}), 400
        
        # Verificar si el tipo de usuario es CONDUCTOR (ID 2)
        # Asumimos que el ID para conductores es 2, si no, ajusta según tu BD
        es_conductor_tipo = tipo_usuario_id == '4' or (tipo_usuario_id and int(tipo_usuario_id) == 4)
        
        conductor_data = None
        if es_conductor_tipo:
            if not dni:
                return jsonify({"success": False, "error": "DNI es requerido para conductores"}), 400
            
            if len(dni) != 8 or not dni.isdigit():
                return jsonify({"success": False, "error": "El DNI debe tener 8 dígitos numéricos"}), 400
            
            conductor_data = conductor.query.filter_by(dni=dni).first()
            if not conductor_data:
                return jsonify({"success": False, "error": "Conductor no encontrado en la base de datos"}), 400
            
            if conductor_data.usuario_id:
                return jsonify({"success": False, "error": "El conductor ya tiene un usuario asignado"}), 400
            
            if conductor_data.estado != "ACTIVO":
                return jsonify({"success": False, "error": f"El conductor está {conductor_data.estado}"}), 400
        
        # Crear el usuario
        nuevo_usuario, error = usuario_service.crear_usuario(
            username=username,
            password=password,
            nombres=nombres,
            paterno=paterno,
            materno=materno,
            foto=foto,
            tipo_usuario_id=int(tipo_usuario_id) if tipo_usuario_id else 1
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        # Actualizar estado del usuario
        nuevo_usuario.estado_usuario = estado_usuario
        
        # IMPORTANTE: Vincular conductor si es tipo CONDUCTOR
        if es_conductor_tipo and conductor_data:
            print(f"🔗 Vinculando conductor {conductor_data.dni} con usuario ID {nuevo_usuario.usuario_id}")
            
            # Actualizar datos del conductor con los del usuario
            conductor_data.nombre = nombres
            conductor_data.apellido_paterno = paterno
            conductor_data.apellido_materno = materno
            conductor_data.usuario_id = nuevo_usuario.usuario_id
            
            try:
                db.session.commit()
                print(f"✅ Conductor vinculado exitosamente. usuario_id: {conductor_data.usuario_id}")
            except Exception as e:
                db.session.rollback()
                # Si falla la vinculación, eliminar el usuario creado
                db.session.delete(nuevo_usuario)
                db.session.commit()
                return jsonify({"success": False, "error": f"Error al vincular conductor: {str(e)}"}), 400
        else:
            # Solo guardar el usuario si no es conductor
            try:
                db.session.commit()
                print(f"✅ Usuario registrado exitosamente sin vinculación de conductor")
            except Exception as e:
                db.session.rollback()
                return jsonify({"success": False, "error": f"Error al guardar usuario: {str(e)}"}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Usuario registrado exitosamente",
            "usuario_id": nuevo_usuario.usuario_id,
            "username": username,
            "es_conductor": es_conductor_tipo,
            "conductor_vinculado": conductor_data is not None
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error en registro: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route("/actualizar_usuario/<int:id>", methods=["PUT"])
def actualizar_usuario(id):
    """Actualiza un usuario existente"""
    try:
        # Verificar si la solicitud es JSON o FormData
        if request.is_json:
            data = request.get_json()
        else:
            # Si es FormData, obtener los datos
            data = {}
            if request.form.get('username'):
                data['username'] = request.form.get('username')
            if request.form.get('nombres'):
                data['nombres'] = request.form.get('nombres')
            if request.form.get('paterno'):
                data['paterno'] = request.form.get('paterno')
            if request.form.get('materno'):
                data['materno'] = request.form.get('materno')
            if request.form.get('tipo_usuario_id'):
                data['tipo_usuario_id'] = int(request.form.get('tipo_usuario_id'))
            if request.form.get('password'):
                data['password'] = request.form.get('password')
            if request.form.get('dni'):
                data['dni'] = request.form.get('dni')
        
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        user = usuario.query.get(id)
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        new_username = data.get("username")
        if new_username and new_username != user.usuario:
            if usuario_service.verificar_usuario_existente(new_username):
                return jsonify({"success": False, "error": f"El nombre de usuario '{new_username}' ya está registrado"}), 400
        
        if 'nombres' in data:
            user.nombres = data['nombres']
        if 'paterno' in data:
            user.ape_paterno = data['paterno']
        if 'materno' in data:
            user.ape_materno = data['materno']
        if 'username' in data:
            user.usuario = data['username']
        if 'tipo_usuario_id' in data:
            user.tipo_usuario_id = data['tipo_usuario_id']
        
        # NOTA: NO actualizamos estado_usuario en edición
        
        if 'password' in data and data['password']:
            h = hashlib.new("sha256")
            h.update(bytes(data['password'], encoding="utf-8"))
            user.password_user = h.hexdigest()
        
        # Verificar si el tipo de usuario es CONDUCTOR
        tipo_usuario = tipousuario.query.get(data.get('tipo_usuario_id', user.tipo_usuario_id))
        es_conductor_tipo = tipo_usuario and 'CONDUCTOR' in tipo_usuario.tipo_usuario.upper()
        dni = data.get('dni')
        
        conductor_actual = conductor.query.filter_by(usuario_id=id).first()
        
        if es_conductor_tipo and dni:
            conductor_nuevo = conductor.query.filter_by(dni=dni).first()
            if not conductor_nuevo:
                return jsonify({"success": False, "error": "Conductor no encontrado"}), 400
            
            if conductor_nuevo.estado != "ACTIVO":
                return jsonify({"success": False, "error": f"El conductor está {conductor_nuevo.estado}"}), 400
            
            if conductor_nuevo.usuario_id and conductor_nuevo.usuario_id != id:
                return jsonify({"success": False, "error": "El conductor ya tiene un usuario asignado"}), 400
            
            # Desvincular conductor actual si existe y es diferente
            if conductor_actual and conductor_actual.dni != dni:
                conductor_actual.usuario_id = None
            
            # Vincular nuevo conductor
            conductor_nuevo.usuario_id = id
            
            # Actualizar datos del conductor con los del usuario
            conductor_nuevo.nombre = user.nombres
            conductor_nuevo.apellido_paterno = user.ape_paterno
            conductor_nuevo.apellido_materno = user.ape_materno
            
        elif conductor_actual:
            # Si el usuario ya no es conductor, desvincular
            conductor_actual.usuario_id = None
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": "Usuario actualizado exitosamente"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en actualizar_usuario: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/cambiar_estado/<int:id>", methods=["PUT"])
def cambiar_estado_usuario(id):
    """Cambia el estado de un usuario (activo/inactivo)"""
    try:
        user = usuario.query.get(id)
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        user.estado_usuario = not user.estado_usuario
        
        db.session.commit()
        
        estado = "activado" if user.estado_usuario else "desactivado"
        return jsonify({
            "success": True,
            "mensaje": f"Usuario {estado} exitosamente",
            "estado_usuario": user.estado_usuario
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en cambiar_estado_usuario: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/eliminar_usuario/<int:id>", methods=["DELETE"])
def eliminar_usuario(id):
    """Elimina un usuario del sistema"""
    try:
        user = usuario.query.get(id)
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        conductor_data = conductor.query.filter_by(usuario_id=id).first()
        if conductor_data:
            conductor_data.usuario_id = None
        
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "mensaje": "Usuario eliminado exitosamente"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en eliminar_usuario: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/verificar_usuario/<username>", methods=["GET"])
def verificar_usuario(username):
    """Verifica si un nombre de usuario ya existe"""
    try:
        existe = usuario_service.verificar_usuario_existente(username)
        return jsonify({
            "existe": existe,
            "mensaje": f"El usuario '{username}' ya está registrado" if existe else "Usuario disponible"
        }), 200
    except Exception as e:
        print(f"Error en verificar_usuario: {str(e)}")
        return jsonify({"error": str(e)}), 500

@main.route("/verificar_conductor/<dni>", methods=["GET"])
def verificar_conductor(dni):
    """Verifica si un conductor existe y su estado"""
    try:
        conductor_data = conductor.query.filter_by(dni=dni).first()
        
        if not conductor_data:
            return jsonify({
                "existe": False,
                "mensaje": "Conductor no encontrado",
                "puede_registrarse": False
            }), 200
        
        tiene_usuario = conductor_data.usuario_id is not None
        
        puede_registrarse = True
        mensaje = "Conductor disponible"
        
        if conductor_data.estado != "ACTIVO":
            puede_registrarse = False
            mensaje = f"El conductor está {conductor_data.estado}"
        elif tiene_usuario:
            puede_registrarse = False
            mensaje = "El conductor ya tiene un usuario asignado"
        
        return jsonify({
            "existe": True,
            "conductor": {
                "nombre": conductor_data.nombre,
                "paterno": conductor_data.apellido_paterno,
                "materno": conductor_data.apellido_materno,
                "estado": conductor_data.estado,
                "dni": conductor_data.dni,
                "usuario_id": conductor_data.usuario_id
            },
            "tiene_usuario": tiene_usuario,
            "mensaje": mensaje,
            "puede_registrarse": puede_registrarse
        }), 200
    except Exception as e:
        print(f"Error en verificar_conductor: {str(e)}")
        return jsonify({"error": str(e)}), 500

@main.route('/usuario_perfil')
def usuario_perfil():
    """Renderiza la página del perfil de usuario"""
    return render_template('usuario_perfil.html')

@main.route('/gestionar_usuarios')
def gestionar_usuarios():
    """Renderiza la página de gestionar usuarios"""
    return render_template('usuarios.html')

@main.route("/actualizar_perfil_completo", methods=["POST"])
def actualizar_perfil_completo():
    """Actualiza todos los datos del perfil del usuario (datos personales, contraseña y foto)"""
    try:
        username = request.cookies.get('usuario')
        if not username:
            return jsonify({"success": False, "error": "Usuario no autenticado"}), 401
        
        nombres = request.form.get("nombres")
        paterno = request.form.get("ape_paterno")
        materno = request.form.get("ape_materno")
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        foto = request.files.get("foto") if 'foto' in request.files else None
        
        if not all([nombres, paterno, materno]):
            return jsonify({"success": False, "error": "Todos los campos personales son requeridos"}), 400
        
        user = usuario.query.filter_by(usuario=username).first()
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        if current_password or new_password:
            if not all([current_password, new_password]):
                return jsonify({"success": False, "error": "Para cambiar la contraseña, completa ambos campos"}), 400
            
            if len(new_password) < 6:
                return jsonify({"success": False, "error": "La nueva contraseña debe tener al menos 6 caracteres"}), 400
        
        success, message, usuario_actualizado = usuario_service.actualizar_perfil_completo(
            usuario_id=user.usuario_id,
            nombres=nombres,
            paterno=paterno,
            materno=materno,
            current_password=current_password,
            new_password=new_password,
            foto=foto
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": message,
                "usuario": usuario_actualizado
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en actualizar_perfil_completo: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route("/eliminar_foto", methods=["POST"])
def eliminar_foto():
    """Elimina la foto de perfil del usuario"""
    try:
        username = request.cookies.get('usuario')
        if not username:
            return jsonify({"success": False, "error": "Usuario no autenticado"}), 401
        
        user = usuario.query.filter_by(usuario=username).first()
        if not user:
            return jsonify({"success": False, "error": "Usuario no encontrado"}), 404
        
        success, message = usuario_service.eliminar_foto_usuario(user.usuario_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en eliminar_foto: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500