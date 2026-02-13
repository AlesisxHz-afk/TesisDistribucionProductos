from functools import wraps
from flask import request
from src.services import usuario_service
from flask import request, render_template

def require_role(*roles):  # Acepta uno o más roles como argumentos
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = usuario_service.obtener_credenciales()
            if not user:
                return render_template("error404.html")

            user_role = user.get('role')
            if user_role not in roles:
                return render_template("error404.html")

            return func(*args, **kwargs)
        return wrapper
    return decorator