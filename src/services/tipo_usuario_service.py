from ..models.models import db, tipousuario, usuario
from sqlalchemy import text

def obtener_todos_roles():
    """Obtiene todos los tipos de usuario"""
    try:
        roles = tipousuario.query.all()
        roles_list = []
        for rol in roles:
            roles_list.append({
                'tipo_usuario_id': rol.tipo_usuario_id,
                'tipo_usuario': rol.tipo_usuario,
                'descripcion': rol.descripcion,
                'estado_rol': rol.estado_rol
            })
        return True, roles_list
    except Exception as e:
        return False, f"Error al obtener roles: {str(e)}"

def obtener_rol_por_id(tipo_usuario_id):
    """Obtiene un tipo de usuario por su ID"""
    try:
        rol = tipousuario.query.get(tipo_usuario_id)
        if not rol:
            return False, "Rol no encontrado"
        
        rol_data = {
            'tipo_usuario_id': rol.tipo_usuario_id,
            'tipo_usuario': rol.tipo_usuario,
            'descripcion': rol.descripcion,
            'estado_rol': rol.estado_rol
        }
        return True, rol_data
    except Exception as e:
        return False, f"Error al obtener rol: {str(e)}"

def crear_rol(tipo_usuario, descripcion):
    """Crea un nuevo tipo de usuario"""
    try:
        # Verificar si ya existe un rol con el mismo nombre
        rol_existente = tipousuario.query.filter_by(tipo_usuario=tipo_usuario).first()
        if rol_existente:
            return False, "Ya existe un rol con ese nombre"
        
        # Crear nuevo rol (siempre activo por defecto)
        nuevo_rol = tipousuario(
            tipo_usuario=tipo_usuario,
            descripcion=descripcion,
            estado_rol=True  # BOOLEAN: True = activo
        )
        
        db.session.add(nuevo_rol)
        db.session.commit()
        
        return True, "Rol creado exitosamente", nuevo_rol.tipo_usuario_id
    except Exception as e:
        db.session.rollback()
        return False, f"Error al crear rol: {str(e)}"

def actualizar_rol(tipo_usuario_id, tipo_usuario, descripcion, estado_rol):
    """Actualiza un tipo de usuario existente"""
    try:
        rol = tipousuario.query.get(tipo_usuario_id)
        if not rol:
            return False, "Rol no encontrado"
        
        # Verificar si el nombre ya existe (excluyendo el actual)
        if tipo_usuario != rol.tipo_usuario:
            rol_existente = tipousuario.query.filter(
                tipousuario.tipo_usuario == tipo_usuario,
                tipousuario.tipo_usuario_id != tipo_usuario_id
            ).first()
            if rol_existente:
                return False, "Ya existe un rol con ese nombre"
        
        # Convertir estado_rol a booleano si viene como string
        if isinstance(estado_rol, str):
            estado_rol = estado_rol.lower() == 'true'
        
        # Actualizar datos - estado_rol es BOOLEAN
        rol.tipo_usuario = tipo_usuario
        rol.descripcion = descripcion
        rol.estado_rol = bool(estado_rol)
        
        db.session.commit()
        
        return True, "Rol actualizado exitosamente"
    except Exception as e:
        db.session.rollback()
        return False, f"Error al actualizar rol: {str(e)}"

def cambiar_estado_rol(tipo_usuario_id):
    """Cambia el estado de un tipo de usuario (activo/inactivo)"""
    try:
        rol = tipousuario.query.get(tipo_usuario_id)
        if not rol:
            return False, "Rol no encontrado"
        
        # Si estamos dando de baja (cambiando de True a False)
        if rol.estado_rol:  # estado_rol es BOOLEAN: True = activo
            # Verificar si hay usuarios activos asociados
            # estado_usuario también es BOOLEAN: True = activo, False = inactivo
            usuarios_activos = usuario.query.filter(
                usuario.tipo_usuario_id == tipo_usuario_id,
                usuario.estado_usuario == True  # BOOLEAN True, no string 'activo'
            ).count()
            
            if usuarios_activos > 0:
                return False, f"No se puede dar de baja el rol porque tiene {usuarios_activos} usuario(s) activo(s) asociado(s). Cambie el estado de los usuarios primero."
        
        # Cambiar estado - estado_rol es BOOLEAN
        rol.estado_rol = not rol.estado_rol
        
        db.session.commit()
        
        estado = "activado" if rol.estado_rol else "dado de baja"
        mensaje = f"Rol {estado} exitosamente"
        return True, mensaje
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado del rol: {str(e)}"

def eliminar_rol_fisicamente(tipo_usuario_id):
    """Elimina físicamente un tipo de usuario"""
    try:
        rol = tipousuario.query.get(tipo_usuario_id)
        if not rol:
            return False, "Rol no encontrado"
        
        # Verificar si hay usuarios asociados (activos o inactivos)
        usuarios_asociados = usuario.query.filter_by(tipo_usuario_id=tipo_usuario_id).count()
        
        if usuarios_asociados > 0:
            # Verificar el estado de los usuarios asociados
            # estado_usuario es BOOLEAN: True = activo, False = inactivo
            usuarios_activos = usuario.query.filter(
                usuario.tipo_usuario_id == tipo_usuario_id,
                usuario.estado_usuario == True  # BOOLEAN True
            ).count()
            
            usuarios_inactivos = usuario.query.filter(
                usuario.tipo_usuario_id == tipo_usuario_id,
                usuario.estado_usuario == False  # BOOLEAN False
            ).count()
            
            return False, f"No se puede eliminar el rol porque tiene {usuarios_asociados} usuario(s) asociado(s) ({usuarios_activos} activos, {usuarios_inactivos} inactivos). Cambie el tipo de usuario de los usuarios primero."
        
        # Eliminar físicamente
        db.session.delete(rol)
        db.session.commit()
        
        return True, "Rol eliminado exitosamente"
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar rol: {str(e)}"
    
def obtener_tipos_activos_service():
    """Obtiene todos los tipos de usuario activos"""
    try:
        roles = tipousuario.query.filter_by(estado_rol=True).all()
        roles_list = []
        for rol in roles:
            roles_list.append({
                'tipo_usuario_id': rol.tipo_usuario_id,
                'tipo_usuario': rol.tipo_usuario,
                'descripcion': rol.descripcion,
                'estado_rol': rol.estado_rol
            })
        return True, roles_list
    except Exception as e:
        return False, f"Error al obtener tipos activos: {str(e)}"