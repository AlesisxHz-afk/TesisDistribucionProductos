-- ============================
--        TABLA TIPO_USUARIO
-- ============================
CREATE TABLE tipo_usuario (
    tipo_usuario_id  SERIAL PRIMARY KEY,
    tipo_usuario     VARCHAR(255) NOT NULL,
    estado_rol       BOOLEAN NOT NULL,
    descripcion      VARCHAR(255) NULL
);

-- ============================
--           TABLA USUARIO
-- ============================
CREATE TABLE usuario (
    usuario_id      SERIAL  PRIMARY KEY,
    usuario         VARCHAR(50) UNIQUE NOT NULL,
    password_user   VARCHAR(255) NOT NULL,
    token           VARCHAR(255) NULL,
    nombres         VARCHAR(120) NOT NULL,
    ape_paterno     VARCHAR(120) NOT NULL,
    ape_materno     VARCHAR(120) NOT NULL,
    estado_usuario  BOOLEAN NOT NULL,
    foto_usuario    VARCHAR(255) NULL,
    tipo_usuario_id INT NOT NULL,
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipo_usuario(tipo_usuario_id)
);

-- ============================
--         TABLA CONDUCTOR
-- ============================
CREATE TABLE conductor (
    conductor_id     SERIAL PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    dni              VARCHAR(15) UNIQUE NOT NULL,
    telefono         VARCHAR(20),
    direccion        VARCHAR(255),
    fecha_ingreso    DATE,
    estado           VARCHAR(20),
    usuario_id       INT UNIQUE NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuario(usuario_id)
);

-- ============================
--    TABLA CONDUCTOR_UBICACION
-- ============================
CREATE TABLE conductor_ubicacion (
    ubicacion_id SERIAL  PRIMARY KEY,
    conductor_id INT NOT NULL,
    latitud      NUMERIC(10,7) NULL,
    longitud     NUMERIC(10,7) NULL,
    FOREIGN KEY (conductor_id) REFERENCES conductor(conductor_id)
);

-- ============================
-- TABLA DISPONIBILIDAD_CONDUCTOR
-- ============================
CREATE TABLE disponibilidad_conductor (
    disponibilidad_id SERIAL  PRIMARY KEY,
    conductor_id      INT NOT NULL,
    dia               VARCHAR(255),
    hora_inicio       TIME,
    hora_fin          TIME,
    FOREIGN KEY (conductor_id) REFERENCES conductor(conductor_id)
);

-- ============================
--          TABLA VEHICULO
-- ============================
CREATE TABLE vehiculo (
    vehiculo_id       SERIAL  PRIMARY KEY,
    placa             VARCHAR(15) UNIQUE NOT NULL,
    modelo            VARCHAR(50) NOT NULL,
    marca             VARCHAR(50) NOT NULL,
    cantidad_carga    INT NOT NULL,
    tipo_vehiculo     VARCHAR(50) NOT NULL,
    anio_fabricacion  INT NOT NULL,
    estado            VARCHAR(20) NOT NULL
);

-- ============================
--     TABLA VEHICULO_CONDUCTOR
-- ============================
CREATE TABLE vehiculo_conductor (
    vehiculo_conductor_id SERIAL  PRIMARY KEY,
    vehiculo_id           INT NOT NULL,
    conductor_id          INT NOT NULL,
    fecha_asignacion      DATE NOT NULL,
    estado                VARCHAR(20) NOT NULL,
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculo(vehiculo_id),
    FOREIGN KEY (conductor_id) REFERENCES conductor(conductor_id)
);

-- ============================
--          TABLA PRODUCTO
-- ============================
CREATE TABLE producto (
    producto_id        SERIAL  PRIMARY KEY,
    nombre             VARCHAR(255) NOT NULL,
    tipo               VARCHAR(50) NOT NULL,
    variedad           VARCHAR(50) NOT NULL,
    descripcion        VARCHAR(255) NULL,
    temperatura_optima NUMERIC(5,2) NOT NULL,
    humedad_optima     NUMERIC(5,2) NOT NULL,
    cant_productos_act NUMERIC(12,2) NOT NULL,
    estado_producto    VARCHAR(20) NOT NULL,
    foto_producto      VARCHAR(255) NULL
);

-- ============================
--           TABLA ALMACEN
-- ============================
CREATE TABLE almacen (
    almacen_id     SERIAL  PRIMARY KEY,
    nombre         VARCHAR(100) NOT NULL,
    tipo_almacen   VARCHAR(100) NOT NULL,
    direccion      VARCHAR(255) NULL,
    capacidad      NUMERIC(12,2) NOT NULL,
    latitud        NUMERIC(10,7) NOT NULL,
    longitud       NUMERIC(10,7) NOT NULL,
    estado         VARCHAR(20) NOT NULL
);

-- ============================
--    TABLA ALMACEN_CAPACIDAD
-- ============================
CREATE TABLE almacen_capacidad (
    almacen_capacidad_id SERIAL  PRIMARY KEY,
    almacen_id           INT NOT NULL,
    producto_id          INT NOT NULL,
    cant_productos_act   NUMERIC(12,2) NOT NULL,
    FOREIGN KEY (almacen_id) REFERENCES almacen(almacen_id),
    FOREIGN KEY (producto_id) REFERENCES producto(producto_id)
);

-- ============================
-- TABLA DISTRIBUCION_ALMACEN_PRODUCTO
-- ============================
CREATE TABLE distribucion_almacen_producto (
    asignacion_id         SERIAL  PRIMARY KEY,
    almacen_id            INT NULL,
    producto_id           INT NULL,
    vehiculo_conductor_id INT NULL,
    dia           INT NULL,
    mes           INT NULL,
    anio          INT NULL,
    fecha_envio   DATE NULL,
    hora_envio    TIME NULL,
    hora_llegada  TIME NULL,
    estado_envio  VARCHAR(80) NULL,
    demanda       NUMERIC(12,2) NULL,
    gasto         NUMERIC(12,2) NULL,
    nro_envio     VARCHAR(255) UNIQUE NULL,
    FOREIGN KEY (almacen_id) REFERENCES almacen(almacen_id),
    FOREIGN KEY (producto_id) REFERENCES producto(producto_id),
    FOREIGN KEY (vehiculo_conductor_id) REFERENCES vehiculo_conductor(vehiculo_conductor_id)
);