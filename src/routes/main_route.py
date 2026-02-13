from flask import Blueprint, make_response, redirect, render_template, request
from src.services import main_service
from ..services import main_service
from auth import require_role

from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
from src.routes import login_route
from src.routes import producto_route
from src.routes import usuario_route
from src.routes import tipo_usuario_route
from src.routes import configuracion_route
from src.routes import distribucion_almacen_producto_route
from src.routes import almacen_route
from src.routes import vehiculo_route
from src.routes import conductor_route

main = Blueprint("main", __name__, url_prefix="/main")

main.register_blueprint(usuario_route.main)
main.register_blueprint(login_route.main)
main.register_blueprint(producto_route.main)
main.register_blueprint(tipo_usuario_route.main)
main.register_blueprint(configuracion_route.main)
main.register_blueprint(distribucion_almacen_producto_route.main)
main.register_blueprint(almacen_route.main)
main.register_blueprint(vehiculo_route.main)
main.register_blueprint(conductor_route.main)

@main.route("/")
def mainhtml():
    # Verificar si el usuario tiene credenciales
    credenciales = main_service.obtener_credenciales()
    
    if not credenciales or not all(credenciales[:3]):
        # Si no tiene credenciales, redirigir a la página de no login
        return render_template("no_login.html")
    
    # Si tiene credenciales, mostrar el panel principal
    username, apellidosynombres, tipo_usuario, tipo_nombre, foto = credenciales
    return render_template("main.html", 
                         username=username,
                         apellidosynombres=apellidosynombres,
                         tipo_usuario=tipo_usuario,
                         tipo_nombre=tipo_nombre,
                         foto_usuario=foto)