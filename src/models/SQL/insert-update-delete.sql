-- ============================
--        TIPO USUARIO
-- ============================
INSERT INTO tipo_usuario (tipo_usuario_id, tipo_usuario, estado, descripcion) VALUES
(1, 'USUARIO', TRUE, ''),
(2, 'ADMIN', TRUE, 'Acceso completo al sistema, puede gestionar usuarios, roles, productos, almacenes, vehículos y reportes'),
(3, 'DISTRIBUIDOR', TRUE, 'Gestiona productos, almacenes y vehículos para distribución logística'),
(4, 'CONDUCTOR', TRUE, 'Visualiza sus rutas asignadas, disponibilidad y estado de vehículos'),
(5, 'JEFE_TRANSPORTE', TRUE, 'Gestiona vehículos, conductores y planificación de rutas');

-- ============================
--           USUARIO
-- ============================
INSERT INTO usuario (
    usuario_id,
    usuario,
    password_user,
    token,
    nombres,
    ape_paterno,
    ape_materno,
    estado_usuario,
    foto_usuario,
    tipo_usuario_id
) VALUES
(1, 'user01', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NULL, 'Alejandro', 'Purizaca', 'Salazar', 'VERDADERO', '1.jpg', 1),
(2, 'admin01', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NULL, 'Angelo', 'Bobadilla', 'Martinez', 'VERDADERO', '2.jpg', 2),
(3, 'distrib01', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NULL, 'Daniel', 'Ortega', 'Ramirez', 'VERDADERO', '3.jpg', 3),
(4, 'conductor01', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NULL, 'Kevin', 'Villanueva', 'Enrriquez', 'VERDADERO', '4.jpg', 4),
(5, 'jefetransporte01', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NULL, 'Rosa', 'Calle', 'Navarro', 'VERDADERO', '5.jpg', 5);

-- ============================
--          CONDUCTOR
-- ============================
INSERT INTO conductor (
    conductor_id,
    nombre,
    apellido_paterno,
    apellido_materno,
    dni,
    telefono,
    direccion,
    fecha_ingreso,
    estado,
    usuario_id
) VALUES
(1, 'Alex', 'Vasquez', 'Cabrejos', '41234567', '987654121', 'Av. José Abelardo Quiñones, Lambayeque', '2021-03-22', 'ACTIVO', NULL),
(2, 'Cesar', 'Salazar', 'Bazan', '52345678', '987654122', 'Av. Pomalca, Chiclayo', '2023-05-14', 'ACTIVO', NULL),
(3, 'Jose', 'Obando', 'Mena', '43456789', '987654124', 'Mza. H, P. J. José Olaya, Chiclayo', '2023-06-10', 'ACTIVO', NULL),
(4, 'Bruno', 'Vilchez', 'Garay', '54567890', '987654125', 'Jr. Independencia, Monsefú', '2021-08-07', 'ACTIVO', NULL),
(5, 'Alberto', 'Quispe', 'Julca', '45678901', '987654126', 'Urb. Los Cipreses, Chiclayo', '2022-12-19', 'ACTIVO', NULL),
(6, 'Wilson', 'Tello', 'Mendoza', '56789012', '987654127', 'Urb. La Primavera, José Leonardo Ortiz', '2022-04-25', 'ACTIVO', NULL),
(7, 'Leonardo', 'Lopez', 'Vilchez', '47890123', '987654128', 'Av. Santa Victoria, Chiclayo', '2023-02-03', 'ACTIVO', NULL),
(8, 'Jaime', 'Acosta', 'Bances', '48901234', '987654129', 'Pueblo Joven San Antonio, Lambayeque', '2021-07-17', 'ACTIVO', NULL),
(9, 'Victor', 'Reyes', 'Gallardo', '49012345', '987654130', 'Av. Progreso, Chiclayo', '2020-10-12', 'ACTIVO', NULL),
(10, 'Enrique', 'Villalobos', 'Sandoval', '50123456', '987654131', 'Urb. El Bosque, Chiclayo', '2023-01-08', 'ACTIVO', NULL),
(11, 'Marco', 'Espino', 'De la Cruz', '51239876', '987654132', 'Urb. Miraflores, Lambayeque', '2022-06-29', 'ACTIVO', NULL),
(12, 'Raul', 'Castaneda', 'Zegarra', '52340987', '987654133', 'Pueblo Joven Nueva Esperanza, Chiclayo', '2023-03-21', 'ACTIVO', NULL),
(13, 'Jhonatan', 'Medrano', 'Julca', '53451098', '987654134', 'Av. Principal, Pimentel', '2021-05-13', 'ACTIVO', NULL),
(14, 'Cristian', 'Guevara', 'Saavedra', '54562109', '987654135', 'Urb. El Retablo, La Victoria', '2020-09-17', 'ACTIVO', NULL),
(15, 'Esteban', 'Zapata', 'Peche', '55673210', '987654139', 'Jr. 9 de Octubre, Reque', '2022-08-09', 'ACTIVO', NULL),
(16, 'Kevin', 'Villanueva', 'Enrriquez', '46061239', '987654120', 'Av. San Jose, Chiclayo', '2022-01-10', 'ACTIVO', 4);

-- ============================
--     CONDUCTOR_UBICACION
-- ============================
INSERT INTO conductor_ubicacion (
    ubicacion_id,
    conductor_id,
    latitud,
    longitud
) VALUES
(1, 1, -120464000, -770428000),
(2, 2, -120464000, -770428000),
(3, 3, -120464000, -770428000),
(4, 4, -120464000, -770428000),
(5, 5, -120464000, -770428000),
(6, 6, -120464000, -770428000),
(7, 7, -120464000, -770428000),
(8, 8, -120464000, -770428000),
(9, 9, -120464000, -770428000),
(10, 10, -120464000, -770428000),
(11, 11, -120464000, -770428000),
(12, 12, -120464000, -770428000),
(13, 13, -120464000, -770428000),
(14, 14, -120464000, -770428000),
(15, 15, -120464000, -770428000),
(16, 16, -120464000, -770428000);

-- ============================
--           VEHICULO
-- ============================
INSERT INTO vehiculo (
    vehiculo_id,
    placa,
    modelo,
    marca,
    cantidad_carga,
    tipo_vehiculo,
    anio_fabricacion,
    estado
) VALUES
(1, 'B7L-123', 'Hilux', 'Toyota', 3000, 'Camion', 2021, 'ACTIVO'),
(2, 'C8P-234', 'H100', 'Hyundai', 3200, 'Furgoneta', 2020, 'ACTIVO'),
(3, 'D5R-345', 'Hilux', 'Toyota', 4200, 'Camion', 2022, 'ACTIVO'),
(4, 'E4S-456', 'H100', 'Hyundai', 3500, 'Camion', 2019, 'ACTIVO'),
(5, 'F2T-567', 'Hilux', 'Toyota', 4000, 'Furgoneta', 2023, 'ACTIVO'),
(6, 'G6V-678', 'H100', 'Hyundai', 3400, 'Camion', 2021, 'ACTIVO'),
(7, 'H9X-789', 'Hilux', 'Toyota', 3500, 'Furgoneta', 2022, 'ACTIVO'),
(8, 'J3Z-890', 'H100', 'Hyundai', 4400, 'Furgoneta', 2020, 'ACTIVO'),
(9, 'K1A-901', 'Hilux', 'Toyota', 3200, 'Camion', 2023, 'ACTIVO'),
(10, 'L4C-012', 'H100', 'Hyundai', 2900, 'Camion', 2021, 'ACTIVO'),
(11, 'M8E-123', 'Hilux', 'Toyota', 2950, 'Furgoneta', 2022, 'ACTIVO'),
(12, 'N7F-234', 'H100', 'Hyundai', 3400, 'Camion', 2020, 'ACTIVO');

-- ============================
--     VEHICULO_CONDUCTOR
-- ============================
INSERT INTO vehiculo_conductor (
    vehiculo_conductor_id,
    vehiculo_id,
    conductor_id,
    fecha_asignacion,
    estado
) VALUES
(1, 1, 16, '2025-08-29', 'ACTIVO'),
(2, 2, 10, '2025-08-29', 'ACTIVO'),
(3, 3, 11, '2025-08-29', 'ACTIVO'),
(4, 5, 12, '2025-08-29', 'ACTIVO'),
(5, 6, 12, '2025-08-29', 'ACTIVO'),
(6, 10, 11, '2025-08-29', 'ACTIVO'),
(7, 8, 15, '2025-08-29', 'ACTIVO'),
(8, 9, 10, '2025-08-29', 'ACTIVO'),
(9, 4, 11, '2025-08-29', 'ACTIVO'),
(10, 7, 15, '2025-08-29', 'ACTIVO');

-- ============================
--           PRODUCTO
-- ============================
INSERT INTO producto (
    producto_id,
    nombre,
    tipo,
    variedad,
    descripcion,
    temperatura_optima,
    humedad_optima,
    cant_productos_act,
    estado_producto,
    foto_producto
) VALUES
(1, 'Arandano', 'Fruta', 'Biloxi Orgánico', 'Arándano variedad Biloxi orgánico premium.', 5.00, 95.00, 120.00, 'ACTIVO', '1.jpg'),
(2, 'Arandano', 'Fruta', 'Ventura Convencional', 'Arándano Ventura para consumo local.', 6.00, 92.00, 110.00, 'ACTIVO', '2.jpg'),
(3, 'Arandano', 'Fruta', 'Emerald Exportación', 'Arándano de exportación calidad extra.', 4.00, 97.00, 130.00, 'ACTIVO', '3.jpg'),
(4, 'Arandano', 'Fruta', 'Sekoya Premium', 'Arándano Sekoya de gran tamaño y dulzura.', 4.50, 96.00, 125.00, 'ACTIVO', '4.jpg'),
(5, 'Arandano', 'Fruta', 'Congelado Industrial', 'Arándano congelado para industria alimentaria.', 3.00, 98.00, 200.00, 'ACTIVO', '5.jpg'),
(6, 'Palta', 'Fruta', 'Hass Orgánica', 'Palta Hass orgánica premium para exportación.', 5.00, 90.00, 110.00, 'ACTIVO', '6.jpg'),
(7, 'Palta', 'Fruta', 'Fuerte Convencional', 'Palta Fuerte de consumo local.', 6.00, 88.00, 105.00, 'ACTIVO', '7.jpg'),
(8, 'Palta', 'Fruta', 'Zutano Exportación', 'Palta Zutano seleccionada para exportación.', 5.50, 89.00, 115.00, 'ACTIVO', '8.jpg'),
(9, 'Palta', 'Fruta', 'Bacon Verde', 'Palta Bacon de textura suave.', 5.20, 87.00, 100.00, 'ACTIVO', '9.jpg'),
(10, 'Palta', 'Fruta', 'Reed Premium', 'Palta Reed de gran tamaño y calidad superior.', 5.00, 91.00, 120.00, 'ACTIVO', '10.jpg');