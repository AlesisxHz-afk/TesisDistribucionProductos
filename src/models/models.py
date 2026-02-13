from flask_sqlalchemy import SQLAlchemy
from datetime import date, time

db = SQLAlchemy()

# ============================
#        TIPO_USUARIO
# ============================
class tipousuario(db.Model):
    __tablename__ = 'tipo_usuario'

    tipo_usuario_id = db.Column(db.Integer, primary_key=True)
    tipo_usuario = db.Column(db.String(255), nullable=False)
    estado_rol = db.Column(db.Boolean, nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)

# ============================
#           USUARIO
# ============================
class usuario(db.Model):
    __tablename__ = 'usuario'

    usuario_id = db.Column(db.Integer, primary_key=True)
    usuario = db.Column(db.String(50), unique=True, nullable=False)
    password_user = db.Column(db.String(255), nullable=False)
    token = db.Column(db.String(255), nullable=True)
    nombres = db.Column(db.String(180), nullable=False)
    ape_paterno = db.Column(db.String(120), nullable=False)
    ape_materno = db.Column(db.String(120), nullable=False)
    estado_usuario = db.Column(db.Boolean, nullable=False)
    foto_usuario = db.Column(db.String(255), nullable=True)
    tipo_usuario_id = db.Column(db.Integer,db.ForeignKey('tipo_usuario.tipo_usuario_id'),nullable=False)

# ============================
#         CONDUCTOR
# ============================
class conductor(db.Model):
    __tablename__ = 'conductor'

    conductor_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    apellido_paterno = db.Column(db.String(100), nullable=False)
    apellido_materno = db.Column(db.String(100), nullable=False)
    dni = db.Column(db.String(15), unique=True, nullable=False)
    telefono = db.Column(db.String(20), nullable=True)
    direccion = db.Column(db.String(255), nullable=True)
    fecha_ingreso = db.Column(db.Date, nullable=True)
    estado = db.Column(db.String(20), nullable=False)
    usuario_id = db.Column(db.Integer,db.ForeignKey('usuario.usuario_id'),unique=True,nullable=True)

# ============================
#    CONDUCTOR_UBICACION
# ============================
class conductorubicacion(db.Model):
    __tablename__ = 'conductor_ubicacion'

    ubicacion_id = db.Column(db.Integer, primary_key=True)
    conductor_id = db.Column(db.Integer,db.ForeignKey('conductor.conductor_id'),nullable=False)
    latitud = db.Column(db.Numeric(10, 7), nullable=False)
    longitud = db.Column(db.Numeric(10, 7), nullable=False)

# ============================
# DISPONIBILIDAD_CONDUCTOR
# ============================
class disponibilidadconductor(db.Model):
    __tablename__ = 'disponibilidad_conductor'

    disponibilidad_id = db.Column(db.Integer, primary_key=True)
    conductor_id = db.Column(db.Integer,db.ForeignKey('conductor.conductor_id'),nullable=False)
    dia = db.Column(db.String(255), nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)

# ============================
#          VEHICULO
# ============================
class vehiculo(db.Model):
    __tablename__ = 'vehiculo'

    vehiculo_id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(15), unique=True, nullable=False)
    modelo = db.Column(db.String(50), nullable=False)
    marca = db.Column(db.String(50), nullable=False)
    cantidad_carga = db.Column(db.Integer, nullable=False)
    tipo_vehiculo = db.Column(db.String(50), nullable=False)
    anio_fabricacion = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.String(20), nullable=False)

# ============================
#     VEHICULO_CONDUCTOR
# ============================
class vehiculoconductor(db.Model):
    __tablename__ = 'vehiculo_conductor'

    vehiculo_conductor_id = db.Column(db.Integer, primary_key=True)
    vehiculo_id = db.Column(db.Integer,db.ForeignKey('vehiculo.vehiculo_id'),nullable=False)
    conductor_id = db.Column(db.Integer,db.ForeignKey('conductor.conductor_id'),nullable=False)
    fecha_asignacion = db.Column(db.Date, nullable=False)
    estado = db.Column(db.String(20), nullable=False)

# ============================
#          PRODUCTO
# ============================
class producto(db.Model):
    __tablename__ = 'producto'

    producto_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(255), nullable=False)
    tipo = db.Column(db.String(30), nullable=False)
    variedad = db.Column(db.String(30), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    temperatura_optima = db.Column(db.Numeric(5, 2), nullable=False)
    humedad_optima = db.Column(db.Numeric(5, 2), nullable=False)
    cant_productos_act = db.Column(db.Numeric(12, 2), nullable=False)
    estado_producto = db.Column(db.String(20), nullable=False)
    foto_producto = db.Column(db.String(255), nullable=True)

# ============================
#           ALMACEN
# ============================
class almacen(db.Model):
    __tablename__ = 'almacen'

    almacen_id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    tipo_almacen = db.Column(db.String(100), nullable=False)
    direccion = db.Column(db.String(255), nullable=True)
    capacidad = db.Column(db.Numeric(12, 2), nullable=False)
    latitud = db.Column(db.Numeric(10, 7), nullable=False)
    longitud = db.Column(db.Numeric(10, 7), nullable=False)
    estado = db.Column(db.String(20), nullable=False)

# ============================
#    ALMACEN_CAPACIDAD
# ============================
class almacencapacidad(db.Model):
    __tablename__ = 'almacen_capacidad'

    almacen_capacidad_id = db.Column(db.Integer, primary_key=True)
    almacen_id = db.Column(db.Integer,db.ForeignKey('almacen.almacen_id'),nullable=False)
    producto_id = db.Column(db.Integer,db.ForeignKey('producto.producto_id'),nullable=False)
    cant_productos_act = db.Column(db.Numeric(12, 2), nullable=False)

# ============================
# DISTRIBUCION_ALMACEN_PRODUCTO
# ============================
class distribucionalmacenproducto(db.Model):
    __tablename__ = 'distribucion_almacen_producto'

    asignacion_id = db.Column(db.Integer, primary_key=True)
    almacen_id = db.Column(db.Integer,db.ForeignKey('almacen.almacen_id'),nullable=True)
    producto_id = db.Column(db.Integer,db.ForeignKey('producto.producto_id'),nullable=True)
    vehiculo_conductor_id = db.Column(db.Integer,db.ForeignKey('vehiculo_conductor.vehiculo_conductor_id'),nullable=True)
    dia = db.Column(db.Integer, nullable=True)
    mes = db.Column(db.Integer, nullable=True)
    anio = db.Column(db.Integer, nullable=True)
    fecha_envio = db.Column(db.Date, nullable=True)
    hora_envio = db.Column(db.Time, nullable=True)
    hora_llegada = db.Column(db.Time, nullable=True)
    estado_envio = db.Column(db.String(80), nullable=True)
    demanda = db.Column(db.Numeric(12, 2), nullable=True)
    gasto = db.Column(db.Numeric(12, 2), nullable=True)
    nro_envio = db.Column(db.String(255), unique=True, nullable=True)