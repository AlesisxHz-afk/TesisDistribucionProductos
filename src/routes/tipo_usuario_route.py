from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import tipo_usuario_service

from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
import hashlib
import random
from ..services import tipo_usuario_service
import os
from werkzeug.utils import secure_filename

main = Blueprint("tipo_usuario", __name__, url_prefix="/main/tipo_usuario")

@main.route('/gestionar_roles')
def gestionar_roles():
    """Renderiza la página de gestión de roles"""
    return render_template('roles.html')

@main.route('/obtener_tipos_activos', methods=['GET'])
def obtener_tipos_activos():
    """Obtiene todos los tipos de usuario activos"""
    try:
        # Filtrar solo tipos activos
        roles = tipousuario.query.filter_by(estado_rol=True).all()
        roles_list = []
        for rol in roles:
            roles_list.append({
                'tipo_usuario_id': rol.tipo_usuario_id,
                'tipo_usuario': rol.tipo_usuario,
                'descripcion': rol.descripcion,
                'estado_rol': rol.estado_rol
            })
        return jsonify({'success': True, 'tipos': roles_list})
    except Exception as e:
        return jsonify({'success': False, 'error': f"Error al obtener tipos activos: {str(e)}"}), 500

@main.route('/obtener_roles', methods=['GET'])
def obtener_roles():
    """Obtiene todos los roles"""
    success, result = tipo_usuario_service.obtener_todos_roles()
    
    if success:
        return jsonify({'success': True, 'roles': result})
    else:
        return jsonify({'success': False, 'error': result}), 500

@main.route('/obtener_rol/<int:tipo_usuario_id>', methods=['GET'])
def obtener_rol(tipo_usuario_id):
    """Obtiene un rol por su ID"""
    success, result = tipo_usuario_service.obtener_rol_por_id(tipo_usuario_id)
    
    if success:
        return jsonify({'success': True, 'rol': result})
    else:
        return jsonify({'success': False, 'error': result}), 404 if result == "Rol no encontrado" else 500

@main.route('/agregar_rol', methods=['POST'])
def agregar_rol():
    """Agrega un nuevo rol"""
    data = request.get_json()
    
    tipo_usuario = data.get('tipo_usuario', '').strip()
    descripcion = data.get('descripcion', '').strip()
    
    if not tipo_usuario:
        return jsonify({
            'success': False,
            'error': 'El nombre del rol es requerido'
        }), 400
    
    success, mensaje, *extra = tipo_usuario_service.crear_rol(tipo_usuario, descripcion)
    
    if success:
        response = {'success': True, 'mensaje': mensaje}
        if extra:
            response['id'] = extra[0]
        return jsonify(response)
    else:
        return jsonify({'success': False, 'error': mensaje}), 400

@main.route('/actualizar_rol/<int:tipo_usuario_id>', methods=['PUT'])
def actualizar_rol(tipo_usuario_id):
    """Actualiza un rol existente"""
    data = request.get_json()
    
    tipo_usuario = data.get('tipo_usuario', '').strip()
    descripcion = data.get('descripcion', '').strip()
    estado_rol = data.get('estado_rol')
    
    # Convertir estado_rol a booleano si viene como string
    if isinstance(estado_rol, str):
        estado_rol = estado_rol.lower() == 'true'
    else:
        estado_rol = bool(estado_rol)
    
    if not tipo_usuario:
        return jsonify({
            'success': False,
            'error': 'El nombre del rol es requerido'
        }), 400
    
    success, mensaje = tipo_usuario_service.actualizar_rol(tipo_usuario_id, tipo_usuario, descripcion, estado_rol)
    
    if success:
        return jsonify({'success': True, 'mensaje': mensaje})
    else:
        return jsonify({'success': False, 'error': mensaje}), 400

@main.route('/cambiar_estado/<int:tipo_usuario_id>', methods=['PUT'])
def cambiar_estado_rol(tipo_usuario_id):
    """Cambia el estado de un rol (activo/inactivo)"""
    success, mensaje = tipo_usuario_service.cambiar_estado_rol(tipo_usuario_id)
    
    if success:
        return jsonify({'success': True, 'mensaje': mensaje})
    else:
        return jsonify({'success': False, 'error': mensaje}), 400

@main.route('/eliminar_rol/<int:tipo_usuario_id>', methods=['DELETE'])
def eliminar_rol(tipo_usuario_id):
    """Elimina físicamente un rol"""
    success, mensaje = tipo_usuario_service.eliminar_rol_fisicamente(tipo_usuario_id)
    
    if success:
        return jsonify({'success': True, 'mensaje': mensaje})
    else:
        return jsonify({'success': False, 'error': mensaje}), 400