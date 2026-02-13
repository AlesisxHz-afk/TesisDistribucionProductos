# 🍎 Sistema de Distribución de Productos Hortofrutícolas 🚚

<!-- Banner GIF Divider -->
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4500-a447-11eb-908a-139a6edaec5c.gif" alt="divider" width="100%"/>

<!-- Main Header -->
<div align="center">
  <h1 align="center">🍎 Sistema de Distribución de Productos 🍊</h1>
  <h3 align="center">🚚 Planificación Inteligente + 🤖 Machine Learning para Agroindustria</h3>

  <!-- Project Badges -->
  <p align="center">
    <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Machine_Learning-FF6B6B?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="ML">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
    <img src="https://img.shields.io/badge/SQL-4479A1?style=for-the-badge&logo=postgresql&logoColor=white" alt="SQL">
  </p>
</div>

<br/>

## 📋 **Descripción del Proyecto**

<div align="center">
  <img src="https://media.giphy.com/media/3o7TKtM7kG2g44csfu/giphy.gif" width="300" align="right" alt="agriculture gif">
</div>

Sistema web inteligente basado en **Machine Learning** para optimizar la distribución de productos hortofrutícolas en **Agroindustrial Ayala S.A.C.** Integra modelos predictivos, clasificación inteligente y planificación logística en una plataforma web completa.

### 🎯 **Objetivos**
- 📊 **Predicción de Stock**: Modelo ML para niveles óptimos de inventario
- 🏭 **Clasificación de Almacenes**: Selección estratégica para conservación
- 🗺️ **Optimización de Rutas**: Considerando condiciones ambientales
- 🌐 **Sistema Web Integrado**: Interfaz intuitiva y funcional

<br/>

## 🏗️ **Arquitectura del Sistema**

### 🔧 **Stack Tecnológico**

#### 🐍 **Backend & ML**
<div>
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-000000?style=flat-square&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/Scikit_Learn-F7931E?style=flat-square&logo=scikit-learn&logoColor=white" alt="Scikit-learn">
  <img src="https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white" alt="Pandas">
  <img src="https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white" alt="NumPy">
</div>

#### 🗄️ **Base de Datos**
<div>
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/SQL_Queries-4479A1?style=flat-square&logo=postgresql&logoColor=white" alt="SQL">
</div>

#### 🎨 **Frontend**
<div>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Jinja-B41717?style=flat-square&logo=jinja&logoColor=white" alt="Jinja2">
</div>

<br/>

## 📁 **Estructura del Proyecto**

```plaintext
📦 DistribucionProductos
├── 📁 src
│   ├── 📁 models
│   │   ├── backup.sql          # Backup de la base de datos
│   │   ├── base de datos.jpg   # Diagrama de la base de datos
│   │   ├── consultas.sql       # Consultas SQL personalizadas
│   │   ├── insert-update-delete.sql # Operaciones CRUD en SQL
│   │   └── models.py           # Modelos de datos de la aplicación
│   ├── 📁 routes
│   │   └── (rutas de la aplicación)
│   ├── 📁 services
│   │   └── (servicios de negocio)
│   ├── 📁 static
│   │   ├── 📁 css
│   │   ├── 📁 images
│   │   ├── 📁 js
│   │   └── 📁 uploads
│   ├── 📁 templates
│   │   └── (plantillas HTML)
│   └── (otros módulos)
├── 📄 auth.py                  # Autenticación y autorización
├── 📄 main.py                  # Punto de entrada principal
└── 📄 README.md                # Documentación del proyecto
```

### 🗂️ **Explicación de la Estructura**

| Carpeta/Archivo | Descripción |
|----------------|-------------|
| **📁 src/models/** | Contiene todo lo relacionado con datos y ML |
| ├── `backup.sql` | Respaldos completos de la base de datos |
| ├── `base de datos.jpg` | Diagrama visual de la estructura de datos |
| ├── `consultas.sql` | Consultas SQL para reportes y análisis |
| ├── `insert-update-delete.sql` | Operaciones básicas de mantenimiento |
| └── `models.py` | Definición de modelos de datos en Python |
| **📁 src/routes/** | Controladores y endpoints de la API |
| **📁 src/services/** | Lógica de negocio y servicios |
| **📁 src/static/** | Recursos estáticos (CSS, JS, imágenes) |
| **📁 src/templates/** | Plantillas HTML para las vistas |
| **📄 auth.py** | Sistema de autenticación y permisos |
| **📄 main.py** | Aplicación principal Flask |

<br/>

## 🚀 **Instalación y Configuración**

### 1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/DistribucionProductos.git
cd DistribucionProductos
```

### 2. **Crear entorno virtual**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 3. **Instalar dependencias**
```bash
pip install flask pandas scikit-learn numpy
pip install psycopg2-binary sqlalchemy
```

### 4. **Configurar base de datos**
```sql
-- Usar consultas.sql para crear la estructura inicial
psql -U usuario -d basedatos -f src/models/consultas.sql

-- O usar backup.sql para restaurar datos existentes
psql -U usuario -d basedatos -f src/models/backup.sql
```

### 5. **Ejecutar la aplicación**
```bash
python main.py
```

La aplicación estará disponible en: [http://localhost:5000](http://localhost:5000)

<br/>

## 📊 **Características Principales**

<div align="center">
  <table>
    <tr>
      <td align="center" width="200">
        <img src="https://img.icons8.com/color/96/000000/database.png" width="60">
        <br>
        <strong>Gestión SQL</strong>
        <p>Backups y consultas avanzadas</p>
      </td>
      <td align="center" width="200">
        <img src="https://img.icons8.com/color/96/000000/machine-learning.png" width="60">
        <br>
        <strong>ML Integrado</strong>
        <p>Modelos predictivos</p>
      </td>
      <td align="center" width="200">
        <img src="https://img.icons8.com/color/96/000000/route.png" width="60">
        <br>
        <strong>Rutas Óptimas</strong>
        <p>Planificación inteligente</p>
      </td>
    </tr>
  </table>
</div>

### 🎯 **Módulos del Sistema**

| Módulo | Descripción | Icono |
|--------|-------------|-------|
| **📈 Predicción de Stock** | Modelo ML para predecir demanda y optimizar inventario | 📊 |
| **🏭 Clasificación de Almacenes** | Asignación inteligente según tipo de producto | 🏢 |
| **🗺️ Optimización de Rutas** | Planificación considerando clima y tráfico | 🚛 |
| **📱 Dashboard Interactivo** | Visualización en tiempo real | 📈 |

<br/>

## 🗃️ **Gestión de Base de Datos**

### 📊 **Archivos SQL Incluidos**

| Archivo | Propósito | Ejemplo de Uso |
|---------|-----------|----------------|
| `backup.sql` | Restauración completa | Recuperación después de fallos |
| `consultas.sql` | Reportes y análisis | Análisis de ventas por temporada |
| `insert-update-delete.sql` | Mantenimiento diario | Actualización de precios, stock |

### 🔍 **Diagrama de Base de Datos**
![Diagrama BD](src/models/base%20de%20datos.jpg)

<br/>

## 🖥️ **Interfaz de Usuario**

### ✨ **Características Visuales**
- 🎨 **Diseño Moderno**: Interfaz limpia y profesional
- 📱 **Responsive**: Adaptable a móviles y tablets
- 🚀 **Rápida**: Carga optimizada de recursos
- 🎯 **Intuitiva**: Navegación fácil para usuarios

### 📊 **Vistas Principales**
1. **Dashboard Principal** - Vista general del sistema
2. **Gestión de Inventario** - Control de stock con predicciones
3. **Panel de Almacenes** - Visualización y clasificación
4. **Planificador de Rutas** - Mapas y optimización
5. **Reportes Analíticos** - Gráficos y estadísticas

<br/>

## 🔧 **Despliegue Rápido**

### 🐳 **Usando Docker (Recomendado)**
```bash
# Construir la imagen
docker build -t distribucion-productos .

# Ejecutar contenedor
docker run -p 5000:5000 distribucion-productos
```

### ☁️ **Despliegue en la Nube**
- **Render**: 1-click deploy desde GitHub
- **Heroku**: Simple y efectivo para Flask
- **AWS**: Máxima escalabilidad y control

<br/>

## 🤝 **Contribuir al Proyecto**

<div align="center">
  
```diff
+ ¡Tu contribución es bienvenida!
```

</div>

1. **Reporta bugs** - Abre un issue con detalles
2. **Sugiere features** - Comparte tus ideas
3. **Envía Pull Requests** - Mejoras de código
4. **Mejora documentación** - Ayuda a otros

<br/>

## 📄 **Licencia**

Este proyecto está bajo la **Licencia MIT**. Ver el archivo [LICENSE](LICENSE) para más detalles.

<br/>

## 👨‍💻 **Autores**

- **Desarrollador Principal** - [Tu Nombre](https://github.com/tu-usuario)
- **Agroindustrial Ayala S.A.C.** - Cliente y colaborador

## 🌟 **Reconocimientos**

<div align="center">
  
| Herramienta | Uso |
|------------|-----|
| Flask | Backend principal |
| PostgreSQL | Base de datos |
| Scikit-learn | Modelos ML |
| HTML/CSS/JS | Frontend |

</div>

---

<div align="center">
  <h3>✨ Sistema de Distribución Inteligente ✨</h3>
  
  <p>
    <img src="https://img.shields.io/badge/🚀-Producción-brightgreen" alt="Producción">
    <img src="https://img.shields.io/badge/📊-ML_Integrado-orange" alt="ML">
    <img src="https://img.shields.io/badge/💾-SQL_Completo-blue" alt="SQL">
  </p>
  
  <p>
    <em>Optimizando la distribución de productos frescos desde 2024</em>
  </p>
  
  <!-- Footer GIF -->
  <img src="https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif" width="200" alt="fruits gif">
</div>