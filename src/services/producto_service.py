from ..models.models import db, producto, distribucionalmacenproducto
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename
from PIL import Image
import imghdr
import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta, date
import random

# Rutas de los modelos PKT
MODELOS_PATH = os.path.join(os.path.dirname(__file__), '..', 'models', 'pkt')
MODELO_STOCK_PATH = os.path.join(MODELOS_PATH, 'stock_optimo.pkl')

def obtener_productos():
    """
    Obtiene todos los productos de la base de datos
    """
    try:
        productos = producto.query.all()
        
        productos_lista = []
        for prod in productos:
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener los productos"
        }


def obtener_producto_por_id(producto_id):
    """
    Obtiene un producto específico por su ID
    """
    try:
        prod = producto.query.get(producto_id)
        
        if not prod:
            return {
                "success": False,
                "message": "Producto no encontrado"
            }
        
        foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
        
        if foto_producto and '.' not in foto_producto:
            foto_producto = f"{foto_producto}.jpg"
        
        producto_data = {
            "producto_id": prod.producto_id,
            "nombre": prod.nombre,
            "tipo": prod.tipo,
            "variedad": prod.variedad,
            "descripcion": prod.descripcion,
            "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
            "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
            "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
            "estado_producto": prod.estado_producto,
            "foto_producto": foto_producto
        }
        
        return {
            "success": True,
            "producto": producto_data
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener el producto"
        }


def obtener_productos_destacados(limit=8):
    """
    Obtiene productos destacados (los primeros 'limit' productos)
    """
    try:
        productos = producto.query.limit(limit).all()
        
        productos_lista = []
        for prod in productos:
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener productos destacados"
        }


def obtener_productos_filtrados(filtros=None):
    """
    Obtiene productos con filtros opcionales
    """
    try:
        query = producto.query
        
        if filtros:
            if 'tipo' in filtros and filtros['tipo']:
                query = query.filter(producto.tipo == filtros['tipo'])
            
            if 'variedad' in filtros and filtros['variedad']:
                query = query.filter(producto.variedad == filtros['variedad'])
            
            if 'estado_producto' in filtros and filtros['estado_producto']:
                query = query.filter(producto.estado_producto == filtros['estado_producto'])
            
            if 'nombre' in filtros and filtros['nombre']:
                query = query.filter(producto.nombre.ilike(f"%{filtros['nombre']}%"))
        
        productos = query.all()
        
        productos_lista = []
        for prod in productos:
            foto_producto = prod.foto_producto if prod.foto_producto else "producto-default.jpg"
            
            if foto_producto and '.' not in foto_producto:
                foto_producto = f"{foto_producto}.jpg"
            
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "descripcion": prod.descripcion,
                "temperatura_optima": float(prod.temperatura_optima) if prod.temperatura_optima else None,
                "humedad_optima": float(prod.humedad_optima) if prod.humedad_optima else None,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0,
                "estado_producto": prod.estado_producto,
                "foto_producto": foto_producto
            })
        
        return {
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista),
            "filtros_aplicados": filtros if filtros else {}
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error al obtener productos filtrados"
        }

def crear_producto(nombre, tipo, variedad, descripcion, temperatura_optima, humedad_optima, cant_productos_act, estado_producto, foto=None):
    """
    Crea un nuevo producto en el sistema
    """
    try:
        # Validar que tipo sea uno de los permitidos (exactamente como están en BD)
        if tipo not in ['Fruta', 'Verdura', 'Tubérculo']:
            return None, "El tipo de producto debe ser Fruta, Verdura o Tubérculo"
        
        # Validar que variedad sea uno de los permitidos (exactamente como están en BD)
        if variedad not in ['Orgánico', 'Convencional']:
            return None, "La variedad debe ser Orgánico o Convencional"
        
        nuevo_producto = producto(
            nombre=nombre,
            tipo=tipo,
            variedad=variedad,
            descripcion=descripcion,
            temperatura_optima=temperatura_optima,
            humedad_optima=humedad_optima,
            cant_productos_act=cant_productos_act,
            estado_producto=estado_producto,
            foto_producto=None
        )
        
        db.session.add(nuevo_producto)
        db.session.flush()
        
        producto_id = nuevo_producto.producto_id
        foto_filename = f"{producto_id}.jpg"
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        src_dir = os.path.dirname(current_dir)
        upload_folder = os.path.join(src_dir, 'static', 'images', 'producto')
        
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder, exist_ok=True)
        
        foto_path = os.path.join(upload_folder, foto_filename)
        
        if foto:
            guardar_foto_producto(foto, foto_path)
        else:
            default_foto_path = os.path.join(src_dir, 'static', 'images', 'producto', 'producto-default.jpg')
            
            if os.path.exists(default_foto_path):
                import shutil
                shutil.copy2(default_foto_path, foto_path)
            else:
                crear_foto_por_defecto_producto(nombre, foto_path)
        
        nuevo_producto.foto_producto = foto_filename
        db.session.commit()
        
        return nuevo_producto, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al crear el producto: {str(e)}"

def actualizar_producto(producto_id, nombre, tipo, variedad, descripcion, temperatura_optima, humedad_optima, cant_productos_act, estado_producto, foto=None):
    """
    Actualiza un producto existente
    """
    try:
        prod = producto.query.get(producto_id)
        
        if not prod:
            return None, "Producto no encontrado"
        
        # Validar que tipo sea uno de los permitidos (exactamente como están en BD)
        if tipo not in ['Fruta', 'Verdura', 'Tubérculo']:
            return None, "El tipo de producto debe ser Fruta, Verdura o Tubérculo"
        
        # Validar que variedad sea uno de los permitidos (exactamente como están en BD)
        if variedad not in ['Orgánico', 'Convencional']:
            return None, "La variedad debe ser Orgánico o Convencional"
        
        prod.nombre = nombre
        prod.tipo = tipo
        prod.variedad = variedad
        prod.descripcion = descripcion
        prod.temperatura_optima = temperatura_optima
        prod.humedad_optima = humedad_optima
        prod.cant_productos_act = cant_productos_act
        prod.estado_producto = estado_producto
        
        if foto:
            foto_filename = f"{producto_id}.jpg"
            
            current_dir = os.path.dirname(os.path.abspath(__file__))
            src_dir = os.path.dirname(current_dir)
            upload_folder = os.path.join(src_dir, 'static', 'images', 'producto')
            
            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder, exist_ok=True)
            
            foto_path = os.path.join(upload_folder, foto_filename)
            guardar_foto_producto(foto, foto_path)
            
            prod.foto_producto = foto_filename
        
        db.session.commit()
        
        return prod, None
        
    except Exception as e:
        db.session.rollback()
        return None, f"Error al actualizar el producto: {str(e)}"

def cambiar_estado_producto(producto_id, nuevo_estado):
    """
    Cambia el estado de un producto
    """
    try:
        prod = producto.query.get(producto_id)
        
        if not prod:
            return False, "Producto no encontrado"
        
        prod.estado_producto = nuevo_estado
        db.session.commit()
        
        return True, "Estado actualizado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al cambiar estado: {str(e)}"


def eliminar_producto(producto_id):
    """
    Elimina un producto del sistema
    """
    try:
        prod = producto.query.get(producto_id)
        
        if not prod:
            return False, "Producto no encontrado"
        
        # Eliminar archivo físico si existe
        if prod.foto_producto:
            try:
                current_dir = os.path.dirname(os.path.abspath(__file__))
                src_dir = os.path.dirname(current_dir)
                foto_path = os.path.join(src_dir, 'static', 'images', 'producto', prod.foto_producto)
                
                if os.path.exists(foto_path):
                    os.remove(foto_path)
            except Exception as e:
                print(f"Error al eliminar archivo físico: {e}")
        
        db.session.delete(prod)
        db.session.commit()
        
        return True, "Producto eliminado exitosamente"
        
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar producto: {str(e)}"


def get_image_format(image_bytes):
    """
    Detecta el formato de la imagen usando imghdr
    """
    image_format = imghdr.what(None, h=image_bytes)
    
    if image_format:
        return image_format
    
    signatures = {
        b'\xff\xd8\xff': 'jpeg',
        b'\x89PNG\r\n\x1a\n': 'png',
        b'GIF87a': 'gif',
        b'GIF89a': 'gif',
        b'RIFF': 'webp',
        b'BM': 'bmp',
        b'II*\x00': 'tiff',
        b'MM\x00*': 'tiff',
        b'<?xml': 'svg',
    }
    
    for signature, fmt in signatures.items():
        if image_bytes.startswith(signature):
            return fmt
    
    return None


def guardar_foto_producto(foto, foto_path):
    """
    Guarda una foto de producto, manejando tanto archivos como base64
    Siempre convierte a JPG
    """
    try:
        img = None
        
        if hasattr(foto, 'filename') and foto.filename:
            foto.stream.seek(0)
            header = foto.stream.read(100)
            foto.stream.seek(0)
            img = Image.open(foto.stream)
        
        elif isinstance(foto, str) and foto.startswith('data:image'):
            import base64
            from io import BytesIO
            header, encoded = foto.split(",", 1)
            binary_data = base64.b64decode(encoded)
            img = Image.open(BytesIO(binary_data))
        
        elif hasattr(foto, 'read'):
            position = foto.tell()
            header = foto.read(100)
            foto.seek(position)
            img = Image.open(foto)
        
        if img:
            procesar_y_guardar_imagen_producto(img, foto_path)
        else:
            crear_foto_por_defecto_producto('producto', foto_path)
            
    except Exception as e:
        print(f"Error al guardar foto: {e}")
        crear_foto_por_defecto_producto('producto', foto_path)


def procesar_y_guardar_imagen_producto(img, foto_path):
    """
    Procesa y guarda una imagen como JPG, manejando cualquier formato
    """
    try:
        if img.mode in ('RGBA', 'LA', 'P'):
            if img.mode == 'P':
                img = img.convert('RGBA')
            
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img, mask=img.split()[1])
                img = background
        
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        max_size = (800, 800)
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        img.save(foto_path, 'JPEG', quality=90, optimize=True, progressive=True)
        
    except Exception as e:
        print(f"Error al procesar imagen: {e}")
        raise


def crear_foto_por_defecto_producto(nombre, foto_path):
    """
    Crea una foto por defecto para el producto
    """
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        img = Image.new('RGB', (200, 200), color='#4682b4')
        d = ImageDraw.Draw(img)
        
        try:
            font_paths = [
                "arial.ttf",
                "Arial.ttf",
                "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                "C:/Windows/Fonts/arial.ttf"
            ]
            
            font = None
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, 60)
                    break
                except:
                    continue
            
            if font is None:
                font = ImageFont.load_default()
                
        except:
            font = ImageFont.load_default()
        
        inicial = nombre[0].upper() if nombre and len(nombre) > 0 else 'P'
        
        try:
            left, top, right, bottom = font.getbbox(inicial)
            text_width = right - left
            text_height = bottom - top
        except:
            text_width, text_height = d.textsize(inicial, font=font)
        
        position = ((200 - text_width) // 2, (200 - text_height) // 2)
        
        d.text(position, inicial, fill='white', font=font)
        
        img.save(foto_path, 'JPEG', quality=90)
        
    except Exception as img_error:
        print(f"No se pudo crear imagen por defecto: {img_error}")
        try:
            img = Image.new('RGB', (200, 200), color='#4682b4')
            img.save(foto_path, 'JPEG')
        except:
            pass

# ===== NUEVAS FUNCIONES PARA PREDICCIÓN DE STOCK =====

def cargar_modelo_stock():
    """Carga el modelo de stock óptimo desde el archivo PKT"""
    try:
        if os.path.exists(MODELO_STOCK_PATH):
            with open(MODELO_STOCK_PATH, 'rb') as f:
                modelo_data = pickle.load(f)
            
            return {
                'success': True,
                'modelo': modelo_data.get('modelo'),
                'features': modelo_data.get('features', []),
                'metricas': modelo_data.get('metricas', {}),
                'productos_analizados': modelo_data.get('productos_analizados', 0)
            }
        else:
            return {
                'success': False,
                'error': 'Modelo no encontrado. Primero debe entrenar el modelo de stock óptimo.'
            }
    except Exception as e:
        print(f"Error cargando modelo: {e}")
        return {
            'success': False,
            'error': f'Error al cargar modelo: {str(e)}'
        }

def predecir_stock_optimo(anio, mes):
    """
    Predice el stock óptimo para todos los productos usando el modelo entrenado
    """
    try:
        # Verificar si existe el modelo
        if not os.path.exists(MODELO_STOCK_PATH):
            print(f"Modelo no encontrado en: {MODELO_STOCK_PATH}")
            return predecir_stock_simplificado(anio, mes)
        
        # Cargar modelo
        modelo_info = cargar_modelo_stock()
        
        if not modelo_info['success'] or modelo_info.get('modelo') is None:
            print(f"Error cargando modelo: {modelo_info.get('error')}")
            return predecir_stock_simplificado(anio, mes)
        
        modelo = modelo_info['modelo']
        features_requeridos = modelo_info.get('features', [])
        
        print(f"Features requeridos por el modelo: {len(features_requeridos)}")
        
        # Obtener todos los productos de la base de datos
        productos_query = producto.query.all()
        
        if not productos_query:
            return {"error": "No hay productos registrados en la base de datos"}
        
        print(f"Generando predicciones para {len(productos_query)} productos")
        
        # Obtener estadísticas generales de demanda de la BD
        stats_query = db.session.query(
            distribucionalmacenproducto.producto_id,
            db.func.avg(distribucionalmacenproducto.demanda).label('demanda_prom'),
            db.func.stddev(distribucionalmacenproducto.demanda).label('demanda_std'),
            db.func.count(distribucionalmacenproducto.demanda).label('total_envios'),
            db.func.min(distribucionalmacenproducto.demanda).label('demanda_min'),
            db.func.max(distribucionalmacenproducto.demanda).label('demanda_max')
        ).filter(
            distribucionalmacenproducto.demanda.isnot(None),
            distribucionalmacenproducto.demanda > 0
        ).group_by(distribucionalmacenproducto.producto_id).all()
        
        stats_dict = {}
        for stat in stats_query:
            stats_dict[stat[0]] = {
                'promedio': float(stat[1]) if stat[1] else 0,
                'std': float(stat[2]) if stat[2] else 0,
                'total_envios': int(stat[3]) if stat[3] else 0,
                'min': float(stat[4]) if stat[4] else 0,
                'max': float(stat[5]) if stat[5] else 0
            }
        
        # Demanda promedio general
        demanda_general_prom = db.session.query(
            db.func.avg(distribucionalmacenproducto.demanda)
        ).filter(
            distribucionalmacenproducto.demanda.isnot(None),
            distribucionalmacenproducto.demanda > 0
        ).scalar()
        
        demanda_general_prom = float(demanda_general_prom) if demanda_general_prom else 100
        demanda_general_std = demanda_general_prom * 0.3
        
        predicciones = []
        
        # Fecha base para cálculos
        fecha_actual = datetime.now()
        fecha_base = datetime(anio, mes, 15)
        dias_desde_inicio = (fecha_base - datetime(2020, 1, 1)).days
        
        for prod in productos_query:
            try:
                producto_id = prod.producto_id
                stats_producto = stats_dict.get(producto_id, {})
                
                demanda_prom = stats_producto.get('promedio', demanda_general_prom)
                demanda_std = stats_producto.get('std', demanda_general_std)
                demanda_min = stats_producto.get('min', demanda_prom * 0.5)
                demanda_max = stats_producto.get('max', demanda_prom * 1.5)
                total_envios_historico = stats_producto.get('total_envios', 0)
                
                # Determinar si tiene historial
                tiene_historial = 'Sí' if producto_id in stats_dict else 'No'
                
                # Calcular features para el modelo
                dia = 15  # Día promedio del mes
                dia_semana = 3  # Miércoles (aproximación)
                trimestre = ((mes - 1) // 3) + 1
                semana_anio = (fecha_base.isocalendar()[1]) if hasattr(fecha_base, 'isocalendar') else mes * 4
                
                # Features trigonométricos
                mes_sin = np.sin(2 * np.pi * mes / 12)
                mes_cos = np.cos(2 * np.pi * mes / 12)
                dia_sin = np.sin(2 * np.pi * dia / 31)
                dia_cos = np.cos(2 * np.pi * dia / 31)
                dia_semana_sin = np.sin(2 * np.pi * dia_semana / 7)
                dia_semana_cos = np.cos(2 * np.pi * dia_semana / 7)
                trimestre_sin = np.sin(2 * np.pi * trimestre / 4)
                trimestre_cos = np.cos(2 * np.pi * trimestre / 4)
                semana_sin = np.sin(2 * np.pi * semana_anio / 52)
                semana_cos = np.cos(2 * np.pi * semana_anio / 52)
                
                # Indicadores temporales
                es_fin_mes = 1 if dia >= 25 else 0
                es_inicio_mes = 1 if dia <= 5 else 0
                es_temporada_alta = 1 if mes in [11, 12, 1] else 0
                
                # Features de demanda
                demanda_lag_1 = demanda_prom
                demanda_lag_7 = demanda_prom
                demanda_promedio_producto = demanda_prom
                demanda_std_producto = demanda_std
                demanda_promedio_mes_producto = demanda_prom
                demanda_min_hist = demanda_min
                demanda_max_hist = demanda_max
                demanda_rango = demanda_max - demanda_min
                
                # Rolling statistics
                rolling_mean_3 = demanda_prom
                rolling_std_3 = demanda_std
                rolling_mean_7 = demanda_prom
                rolling_std_7 = demanda_std
                rolling_mean_14 = demanda_prom
                rolling_std_14 = demanda_std
                
                # Otros features
                expanding_mean = demanda_prom
                demanda_diff_1 = 0
                demanda_diff_2 = 0
                volatilidad = demanda_std
                cv_producto = demanda_std / (demanda_prom + 0.001)
                ratio_lag1_mean = 1.0
                tendencia_7d = 0
                
                # Interacciones
                producto_x_mes = producto_id * mes
                mes_x_anio = mes * anio
                mes_x_dia = mes * dia
                producto_x_trimestre = producto_id * trimestre
                
                # Construir diccionario con TODOS los features requeridos
                features_dict = {
                    'producto_id': producto_id,
                    'mes': mes,
                    'anio': anio,
                    'dia': dia,
                    'dia_semana': dia_semana,
                    'mes_sin': mes_sin,
                    'mes_cos': mes_cos,
                    'dia_sin': dia_sin,
                    'dia_cos': dia_cos,
                    'dia_semana_sin': dia_semana_sin,
                    'dia_semana_cos': dia_semana_cos,
                    'dias_desde_inicio': dias_desde_inicio,
                    'demanda_lag_1': demanda_lag_1,
                    'demanda_lag_7': demanda_lag_7,
                    'demanda_promedio_producto': demanda_promedio_producto,
                    'demanda_std_producto': demanda_std_producto,
                    'demanda_promedio_mes_producto': demanda_promedio_mes_producto,
                    'producto_x_mes': producto_x_mes,
                    'mes_x_anio': mes_x_anio,
                    'rolling_mean_3': rolling_mean_3,
                    'rolling_std_3': rolling_std_3,
                    'rolling_mean_7': rolling_mean_7,
                    'rolling_std_7': rolling_std_7,
                    'rolling_mean_14': rolling_mean_14,
                    'rolling_std_14': rolling_std_14,
                    'expanding_mean': expanding_mean,
                    'demanda_diff_1': demanda_diff_1,
                    'demanda_diff_2': demanda_diff_2,
                    'trimestre': trimestre,
                    'trimestre_sin': trimestre_sin,
                    'trimestre_cos': trimestre_cos,
                    'semana_anio': semana_anio,
                    'semana_sin': semana_sin,
                    'semana_cos': semana_cos,
                    'es_fin_mes': es_fin_mes,
                    'es_inicio_mes': es_inicio_mes,
                    'es_temporada_alta': es_temporada_alta,
                    'volatilidad': volatilidad,
                    'cv_producto': cv_producto,
                    'ratio_lag1_mean': ratio_lag1_mean,
                    'demanda_min_hist': demanda_min_hist,
                    'demanda_max_hist': demanda_max_hist,
                    'demanda_rango': demanda_rango,
                    'tendencia_7d': tendencia_7d,
                    'mes_x_dia': mes_x_dia,
                    'producto_x_trimestre': producto_x_trimestre
                }
                
                # Crear DataFrame con el orden correcto de features
                import pandas as pd
                X_pred = pd.DataFrame([features_dict])
                
                # Asegurar que tenga todas las columnas en el orden correcto
                if features_requeridos:
                    # Reordenar columnas según lo que espera el modelo
                    X_pred = X_pred[features_requeridos]
                
                # Predecir con el modelo
                try:
                    demanda_predicha = modelo.predict(X_pred)[0]
                    demanda_predicha = max(1, float(demanda_predicha))
                except Exception as e:
                    print(f"Error en predicción con modelo para producto {producto_id}: {e}")
                    # Fallback a método simplificado
                    factor_estacional = 1.3 if mes in [11,12,1] else (0.8 if mes in [6,7,8] else 1.0)
                    variacion = np.random.normal(0, demanda_std * 0.2)
                    demanda_predicha = max(1, demanda_prom * factor_estacional + variacion)
                
                # Calcular número de envíos basado en historial
                if tiene_historial == 'Sí' and total_envios_historico > 0:
                    envios_por_mes = max(1, round(total_envios_historico / 12))
                else:
                    # Producto nuevo: estimación basada en demanda
                    envios_por_mes = max(1, min(10, round(demanda_predicha / 50)))
                
                predicciones.append({
                    'producto_id': producto_id,
                    'nombre_producto': prod.nombre,
                    'tipo_producto': prod.tipo,
                    'variedad_producto': prod.variedad,
                    'tiene_historial': tiene_historial,
                    'demanda_predicha': round(demanda_predicha, 2),
                    'total_envios': envios_por_mes,
                    'fecha_prediccion': f"{anio}-{mes:02d}"
                })
                
            except Exception as e:
                print(f"Error procesando producto {prod.producto_id}: {e}")
                continue
        
        print(f"Predicciones generadas: {len(predicciones)}")
        
        return {
            "predicciones": predicciones,
            "total": len(predicciones)
        }
        
    except Exception as e:
        print(f"Error en predecir_stock_optimo: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
    
def predecir_stock_simplificado(anio, mes):
    """
    Versión simplificada de predicción cuando no hay modelo disponible
    """
    try:
        print("Usando método simplificado de predicción")
        
        productos_query = producto.query.all()
        
        if not productos_query:
            return {"error": "No hay productos registrados"}
        
        predicciones = []
        
        # Obtener estadísticas de demanda
        stats_query = db.session.query(
            distribucionalmacenproducto.producto_id,
            db.func.avg(distribucionalmacenproducto.demanda).label('demanda_prom')
        ).filter(
            distribucionalmacenproducto.demanda.isnot(None),
            distribucionalmacenproducto.demanda > 0
        ).group_by(distribucionalmacenproducto.producto_id).all()
        
        stats_dict = {stat[0]: float(stat[1]) for stat in stats_query if stat[1]}
        
        # Demanda promedio general
        demanda_general = db.session.query(
            db.func.avg(distribucionalmacenproducto.demanda)
        ).filter(
            distribucionalmacenproducto.demanda.isnot(None),
            distribucionalmacenproducto.demanda > 0
        ).scalar()
        
        demanda_general = float(demanda_general) if demanda_general else 100
        
        for prod in productos_query:
            demanda_prom = stats_dict.get(prod.producto_id, demanda_general)
            
            # Factores estacionales
            if mes in [11, 12, 1]:
                demanda_prom *= 1.3
            elif mes in [6, 7, 8]:
                demanda_prom *= 0.8
            
            # Añadir variación aleatoria
            variacion = random.uniform(0.8, 1.2)
            demanda_predicha = max(1, demanda_prom * variacion)
            
            # Número de envíos
            if prod.producto_id in stats_dict:
                envios = random.randint(2, 10)
            else:
                envios = random.randint(1, 5)
            
            predicciones.append({
                'producto_id': prod.producto_id,
                'nombre_producto': prod.nombre,
                'tipo_producto': prod.tipo,
                'variedad_producto': prod.variedad,
                'tiene_historial': 'Sí' if prod.producto_id in stats_dict else 'No',
                'demanda_predicha': round(demanda_predicha, 2),
                'total_envios': envios,
                'fecha_prediccion': f"{anio}-{mes:02d}"
            })
        
        return {
            "predicciones": predicciones,
            "total": len(predicciones)
        }
        
    except Exception as e:
        print(f"Error en predicción simplificada: {e}")
        return {"error": str(e)}

def guardar_predicciones_db(anio, mes, predicciones):
    """
    Guarda las predicciones en la tabla distribucion_almacen_producto
    """
    try:
        guardados = 0
        errores = 0
        envios_guardados = []
        
        print(f"Guardando {len(predicciones)} predicciones para {anio}-{mes}")
        print(f"Tipo de anio: {type(anio)}, Tipo de mes: {type(mes)}")
        
        # Asegurar que anio y mes son enteros
        anio = int(anio)
        mes = int(mes)
        
        # Primero, eliminar predicciones anteriores para el mismo período
        try:
            eliminados = distribucionalmacenproducto.query.filter(
                distribucionalmacenproducto.anio == anio,
                distribucionalmacenproducto.mes == mes,
                distribucionalmacenproducto.estado_envio == 'PENDIENTE'
            ).delete(synchronize_session=False)
            db.session.commit()
            print(f"Eliminadas {eliminados} predicciones anteriores para {anio}-{mes}")
        except Exception as e:
            print(f"Error al eliminar predicciones anteriores: {e}")
            db.session.rollback()
        
        MINIMO_POR_ENVIO = 100  # Mínimo 100 kg por envío
        
        for i, pred in enumerate(predicciones, 1):
            try:
                # Obtener y convertir valores
                producto_id = pred.get('producto_id')
                demanda_total = pred.get('demanda_predicha')
                total_envios = pred.get('total_envios', 1)
                
                print(f"Procesando producto {i}: ID={producto_id}, Demanda={demanda_total}, Envíos={total_envios}")
                
                # Validar y convertir tipos
                if not producto_id:
                    print(f"Producto {i}: producto_id es None")
                    errores += 1
                    continue
                
                # Convertir a números
                try:
                    producto_id = int(producto_id)
                    demanda_total = float(demanda_total)
                    total_envios = int(total_envios)
                except (ValueError, TypeError) as e:
                    print(f"Producto {i}: Error de conversión - {e}")
                    errores += 1
                    continue
                
                if demanda_total <= 0:
                    print(f"Producto {i}: demanda_total es 0 o negativo")
                    errores += 1
                    continue
                
                # Calcular cuántos envíos podemos hacer respetando el mínimo
                max_envios_posibles = int(demanda_total / MINIMO_POR_ENVIO)
                
                if max_envios_posibles < 1:
                    # Si no alcanza para 1 envío con mínimo, crear 1 envío con toda la demanda
                    num_envios = 1
                    cantidades = [demanda_total]
                    print(f"Producto {producto_id}: Demanda insuficiente ({demanda_total}), creando 1 envío")
                else:
                    # Usar el menor entre los envíos solicitados y los posibles
                    num_envios = min(total_envios, max_envios_posibles)
                    
                    # Asignar mínimo a cada envío
                    cantidades = [MINIMO_POR_ENVIO] * num_envios
                    
                    # Distribuir el resto
                    resto = demanda_total - (num_envios * MINIMO_POR_ENVIO)
                    
                    if resto > 0:
                        # Distribuir el resto aleatoriamente
                        for _ in range(int(resto)):
                            idx = random.randint(0, num_envios - 1)
                            cantidades[idx] += 1
                
                # Redondear a 2 decimales
                cantidades = [round(c, 2) for c in cantidades]
                
                # Ajustar última por errores de redondeo
                suma = sum(cantidades)
                if abs(suma - demanda_total) > 0.01:
                    cantidades[-1] += round(demanda_total - suma, 2)
                    cantidades[-1] = round(cantidades[-1], 2)
                
                # Generar días únicos
                dias = random.sample(range(1, 29), min(num_envios, 28))
                dias.sort()
                
                envios_del_producto = []
                
                for j, dia in enumerate(dias[:num_envios]):
                    # Crear fecha completa
                    fecha_envio_completa = date(anio, mes, dia)
                    
                    # Crear nuevo registro - con los cambios solicitados
                    nueva_distribucion = distribucionalmacenproducto(
                        almacen_id=None,
                        producto_id=producto_id,
                        vehiculo_conductor_id=None,
                        dia=dia,
                        mes=mes,
                        anio=anio,
                        fecha_envio=fecha_envio_completa,  # Fecha completa
                        hora_envio=None,
                        hora_llegada=None,
                        estado_envio='PENDIENTE',  # Cambiado a PENDIENTE
                        demanda=cantidades[j],
                        gasto=None,
                        nro_envio=None  # NULL
                    )
                    
                    db.session.add(nueva_distribucion)
                    envios_del_producto.append({
                        'dia': dia,
                        'cantidad': cantidades[j],
                        'fecha': fecha_envio_completa.strftime('%Y-%m-%d')
                    })
                
                envios_guardados.append({
                    'producto_id': producto_id,
                    'envios': envios_del_producto,
                    'total_demanda': demanda_total,
                    'envios_solicitados': total_envios,
                    'envios_reales': num_envios
                })
                
                guardados += 1
                print(f"Producto {producto_id}: Guardados {num_envios} envíos")
                
            except Exception as e:
                print(f"Error guardando predicción {i}: {e}")
                import traceback
                traceback.print_exc()
                errores += 1
        
        db.session.commit()
        
        total_envios_guardados = sum(len(e['envios']) for e in envios_guardados)
        print(f"Guardados: {guardados}, Errores: {errores}")
        print(f"Total envíos guardados: {total_envios_guardados}")
        
        return {
            "success": True,
            "guardados": guardados,
            "errores": errores,
            "envios_guardados": envios_guardados,
            "total_envios": total_envios_guardados,
            "mensaje": f"Se guardaron {guardados} predicciones con {total_envios_guardados} envíos (estado: PENDIENTE)"
        }
        
    except Exception as e:
        db.session.rollback()
        print(f"Error en guardar_predicciones_db: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

def obtener_detalle_envios_producto(producto_id, anio, mes):
    """
    Obtiene el detalle de envíos de un producto para un año y mes específicos
    """
    try:
        print(f"Buscando envíos para producto {producto_id}, año {anio}, mes {mes}")
        
        # Asegurar tipos
        anio = int(anio) if anio else None
        mes = int(mes) if mes else None
        producto_id = int(producto_id) if producto_id else None
        
        # Consultar TODOS los envíos del producto para ese año y mes
        envios = distribucionalmacenproducto.query.filter(
            distribucionalmacenproducto.producto_id == producto_id,
            distribucionalmacenproducto.anio == anio,
            distribucionalmacenproducto.mes == mes,
            distribucionalmacenproducto.demanda.isnot(None),
            distribucionalmacenproducto.estado_envio == 'PENDIENTE'
        ).order_by(distribucionalmacenproducto.fecha_envio).all()
        
        print(f"Encontrados {len(envios)} envíos en BD")
        
        envios_lista = []
        for envio in envios:
            # Usar fecha_envio si existe
            if envio.fecha_envio:
                fecha = envio.fecha_envio.strftime('%Y-%m-%d')
            else:
                # Fallback si no hay fecha
                fecha = f"{anio}-{mes:02d}-{envio.dia:02d}" if envio.dia else f"{anio}-{mes:02d}-01"
            
            envios_lista.append({
                'fecha': fecha,
                'cantidad': float(envio.demanda) if envio.demanda else 0
            })
        
        return {
            "envios": envios_lista,
            "total": len(envios_lista)
        }
        
    except Exception as e:
        print(f"Error en obtener_detalle_envios_producto: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}