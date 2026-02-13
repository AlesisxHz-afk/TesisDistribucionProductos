from flask import request
from ..models.models import usuario, tipousuario

def obtener_credenciales():
    username = request.cookies.get('usuario')
    apellidosynombres = request.cookies.get('apellidosynombres')
    tipo = request.cookies.get('tipo')
    tipo_nombre = request.cookies.get('tipo_nombre')

    if not username or not apellidosynombres or not tipo:
        return None, None, None, None, None
    
    try:
        user = usuario.query.filter_by(usuario=username).first()
        
        if user:
            return username, apellidosynombres, tipo, tipo_nombre, user.foto_usuario
    except Exception as e:
        print(f"Error al obtener credenciales: {e}")
    
    return None, None, None, None, None