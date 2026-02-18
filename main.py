import os
from decouple import config 
from flask import Flask, redirect, render_template, request
from flask_sqlalchemy import SQLAlchemy
from auth import require_role
import psycopg2

from src.routes import login_route
from src.routes import producto_route
from src.routes import main_route
from src.routes import usuario_route
from src.routes import tipo_usuario_route
from src.routes import configuracion_route
from src.routes import distribucion_almacen_producto_route
from src.routes import almacen_route
from src.routes import vehiculo_route
from src.routes import conductor_route
from src.routes import vehiculo_conductor_route
from src.routes import reportes_route

from src.models.models import db

app = Flask(__name__, template_folder='src/templates/', static_folder='src/static/')

# Configurar la URI de la base de datos (ajústala según tu configuración)
app.config["SECRET_KEY"] = config('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{config("POSTGRES_USER")}:{config("POSTGRES_PASSWORD")}@{config("POSTGRES_HOST")}:{config("POSTGRES_PORT")}/{config("POSTGRES_DB")}'

db.init_app(app)

app.register_blueprint(login_route.main)
app.register_blueprint(producto_route.main)
app.register_blueprint(main_route.main)
app.register_blueprint(usuario_route.main)
app.register_blueprint(tipo_usuario_route.main)
app.register_blueprint(configuracion_route.main)
app.register_blueprint(distribucion_almacen_producto_route.main)
app.register_blueprint(almacen_route.main)
app.register_blueprint(vehiculo_route.main)
app.register_blueprint(conductor_route.main)
app.register_blueprint(vehiculo_conductor_route.main)
app.register_blueprint(reportes_route.main)

@app.route('/')
def index():
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0',port=5000, debug=True)