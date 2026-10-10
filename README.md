# 🍎 Sistema de Distribución de Productos 🚚

Plataforma web inteligente basada en **Machine Learning** y **Flask** para optimizar la planificación de stock, la distribución a almacenes y la logística de rutas de transporte de productos hortofrutícolas.

---

## 🎯 Características Principales
* 📈 **Predicción de Stock**: Estimaciones dinámicas de demanda hortofrutícola.
* 🏢 **Distribución de Almacenes**: Asignación óptima de envíos por capacidad (con opción de reasignación manual y validación en caliente).
* 🗺️ **Riesgo & Planificación de Rutas**: Cálculo de riesgos de transporte considerando distancia y condiciones del producto (humedad y temperatura).
* 🎨 **Interfaz Dual (Claro/Oscuro)**: Panel moderno con fondo dinámico de frutas flotantes y modales responsive perfectamente centrados.

---

## 🏗️ Arquitectura y Tecnologías
* **Backend**: Python 3.12+ & Flask.
* **Base de Datos**: PostgreSQL (con control de capacidad y persistencia transaccional).
* **Modelos ML**: Scikit-Learn (Predicción de demanda y clasificación).
* **Frontend**: HTML5, Vanilla CSS3 (Diseño responsivo), Javascript (ES6) y SweetAlert2.

---

## 📁 Estructura del Proyecto
```plaintext
📦 TesisDistribucionProductos
├── 📁 src
│   ├── 📁 models       # Definiciones de bases de datos y backups SQL
│   ├── 📁 routes       # Controladores y endpoints de la aplicación Flask
│   ├── 📁 services     # Lógica de negocio (ML, rutas, inventario)
│   ├── 📁 static       # Archivos estáticos (CSS, JS, imágenes de perfil y productos)
│   └── 📁 templates    # Vistas HTML (Jinja2 renderizadas en servidor)
├── 📄 main.py          # Punto de entrada de la aplicación
└── 📄 auth.py          # Middleware de autenticación de usuarios
```

---

## 🚀 Instalación y Ejecución Rápida

### 1. Requisitos Previos
Tener instalado **Python 3.12+** y un servidor **PostgreSQL** activo.

### 2. Configurar el Entorno Virtual
```bash
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate
```

### 3. Instalar Dependencias
```bash
pip install -r requirements.txt  # O instalar individualmente flask, pandas, scikit-learn, sqlalchemy, psycopg2-binary
```

### 4. Configurar la Base de Datos
1. Crea una base de datos PostgreSQL.
2. Crea el archivo `.env` en la raíz con tus credenciales:
   ```env
   DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/nombre_bd
   SECRET_KEY=tu_clave_secreta
   ```
3. Restaura el backup inicial de la base de datos desde `src/models/backup.sql`.

### 5. Iniciar Servidor Local
```bash
python main.py
```
Accede a [http://localhost:5000](http://localhost:5000) en tu navegador.

---
