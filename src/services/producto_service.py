from ..models.models import db, producto
from sqlalchemy import text
import hashlib
import os
from werkzeug.utils import secure_filename
from PIL import Image
import imghdr

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