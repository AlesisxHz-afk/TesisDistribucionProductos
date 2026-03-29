from flask import request, current_app
from ..models.models import db, usuario, tipousuario, conductor
import hashlib
import os
from werkzeug.utils import secure_filename
import base64
from io import BytesIO
from PIL import Image
import imghdr

def obtener_credenciales():
    """Obtiene las credenciales del usuario actual desde las cookies"""
    username = request.cookies.get('usuario')
    tipo_id = request.cookies.get('tipo')

    # Buscar el usuario y el tipo de usuario en la base de datos
    user = usuario.query.filter_by(usuario=username).first()
    cargo = tipousuario.query.filter_by(tipo_usuario_id=tipo_id).first()

    # Verificar que tanto el usuario como el cargo existen
    if user and cargo:
        return {"username": username, "role": cargo.tipo_usuario}
    return None

def obtener_usuarios_service():
    """Obtiene todos los usuarios con su información de tipo de usuario"""
    usuarios = db.session.query(usuario, tipousuario).join(
        tipousuario, usuario.tipo_usuario_id == tipousuario.tipo_usuario_id
    ).all()

    usuarios_data = []
    for u, tipo in usuarios:
        usuario_info = {
            'usuario_id': u.usuario_id,
            'usuario': u.usuario,
            'nombres': u.nombres,
            'ape_paterno': u.ape_paterno,
            'ape_materno': u.ape_materno,
            'foto_usuario': u.foto_usuario,
            'tipo_usuario_id': u.tipo_usuario_id,
            'tipo_usuario': tipo.tipo_usuario,
            'estado_usuario': u.estado_usuario
        }
        usuarios_data.append(usuario_info)

    return usuarios_data

def crear_usuario(username, password, nombres, paterno, materno, foto=None, tipo_usuario_id=1):
    """Crea un nuevo usuario en el sistema"""
    # Verificar si el usuario ya existe
    if verificar_usuario_existente(username):
        return None, "El nombre de usuario ya está registrado"
    
    # Encriptar la contraseña
    h = hashlib.new("sha256")
    h.update(bytes(password, encoding="utf-8"))
    encpass = h.hexdigest()
    
    # Verificar si el tipo_usuario existe
    tipo_existe = tipousuario.query.filter_by(tipo_usuario_id=tipo_usuario_id).first()
    if not tipo_existe:
        # Si no existe, usar el primer tipo disponible
        primer_tipo = tipousuario.query.first()
        if primer_tipo:
            tipo_usuario_id = primer_tipo.tipo_usuario_id
        else:
            return None, "No se encontraron tipos de usuario en la base de datos"
    
    # Crear usuario sin foto primero para obtener el ID
    nuevo_usuario = usuario(
        usuario=username,
        password_user=encpass,
        token='',
        nombres=nombres,
        ape_paterno=paterno,
        ape_materno=materno,
        estado_usuario=True,
        foto_usuario=None,
        tipo_usuario_id=tipo_usuario_id
    )
    
    try:
        db.session.add(nuevo_usuario)
        db.session.flush()  # Para obtener el ID sin commit
        usuario_id = nuevo_usuario.usuario_id
        
        print(f"📝 Usuario creado temporalmente con ID: {usuario_id}")
        
        # **SIEMPRE usar .jpg como extensión**
        foto_filename = f"{usuario_id}.jpg"
        
        # Obtener el directorio actual del archivo (src/services)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Subir un nivel a src/
        src_dir = os.path.dirname(current_dir)
        # Ahora construir la ruta a static/images/usuario
        upload_folder = os.path.join(src_dir, 'static', 'images', 'usuario')
        
        print(f"📁 Carpeta destino: {upload_folder}")
        
        # Verificar si la carpeta existe
        if not os.path.exists(upload_folder):
            print(f"⚠️  Creando carpeta: {upload_folder}")
            os.makedirs(upload_folder, exist_ok=True)
        
        foto_path = os.path.join(upload_folder, foto_filename)
        print(f"📁 Ruta completa del archivo: {foto_path}")
        
        # Verificar si hay foto proporcionada
        if foto and hasattr(foto, 'filename') and foto.filename:
            # Hay foto, guardarla
            guardar_foto_usuario(foto, foto_path)
        elif foto and isinstance(foto, str) and foto.startswith('data:image'):
            # Es base64, guardarlo
            guardar_foto_usuario(foto, foto_path)
        else:
            # No hay foto, usar la foto por defecto
            default_foto_path = os.path.join(src_dir, 'static', 'images', 'usuario', 'userdefault.jpg')
            
            if os.path.exists(default_foto_path):
                import shutil
                shutil.copy2(default_foto_path, foto_path)
                print(f"✅ Foto por defecto copiada a: {foto_path}")
            else:
                print(f"⚠️  No se encontró userdefault.jpg")
                # Crear una imagen por defecto
                crear_foto_por_defecto(username, foto_path)
        
        # Actualizar el usuario con el nombre de la foto
        nuevo_usuario.foto_usuario = foto_filename
        
        # NO HACER COMMIT AQUÍ - Dejar que la función llamadora haga commit
        # Esto es importante para que la función llamadora pueda vincular el conductor
        print(f"✅ Usuario creado con ID: {usuario_id}, Foto: {nuevo_usuario.foto_usuario}")
        print(f"⚠️  Usuario NO COMMIT - esperando confirmación externa")
        
        return nuevo_usuario, None
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error detallado al crear usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        return None, f"Error al crear el usuario: {str(e)}"

def get_image_format(image_bytes):
    """Detecta el formato de la imagen usando imghdr"""
    # Primero intentar con imghdr
    image_format = imghdr.what(None, h=image_bytes)
    
    if image_format:
        return image_format
    
    # Si imghdr no lo detecta, probar con firmas conocidas
    signatures = {
        b'\xff\xd8\xff': 'jpeg',
        b'\x89PNG\r\n\x1a\n': 'png',
        b'GIF87a': 'gif',
        b'GIF89a': 'gif',
        b'RIFF': 'webp',  # WebP empieza con RIFF
        b'BM': 'bmp',
        b'II*\x00': 'tiff',  # Little endian TIFF
        b'MM\x00*': 'tiff',  # Big endian TIFF
        b'<?xml': 'svg',  # SVG es XML
        b'\x00\x00\x00 ftypavif': 'avif',  # AVIF signature
    }
    
    for signature, fmt in signatures.items():
        if image_bytes.startswith(signature):
            return fmt
    
    return None

def guardar_foto_usuario(foto, foto_path):
    """Guarda una foto de usuario, manejando tanto archivos como base64"""
    try:
        img = None
        
        # Si es un objeto de archivo
        if hasattr(foto, 'filename') and foto.filename:
            # Leer los primeros bytes para detectar el formato
            foto.stream.seek(0)
            header = foto.stream.read(100)
            foto.stream.seek(0)
            
            # Detectar formato de imagen
            detected_format = get_image_format(header)
            print(f"📸 Formato detectado: {detected_format}")
            
            # Abrir la imagen con PIL
            img = Image.open(foto.stream)
        
        # Si es base64 (desde cámara)
        elif isinstance(foto, str) and foto.startswith('data:image'):
            # Extraer datos base64
            header, encoded = foto.split(",", 1)
            binary_data = base64.b64decode(encoded)
            
            # Detectar formato
            detected_format = get_image_format(binary_data)
            print(f"📸 Formato detectado desde base64: {detected_format}")
            
            # Crear imagen desde bytes
            img = Image.open(BytesIO(binary_data))
        
        # Si es un objeto Blob
        elif hasattr(foto, 'read'):
            # Leer los primeros bytes para detectar el formato
            position = foto.tell()
            header = foto.read(100)
            foto.seek(position)
            
            detected_format = get_image_format(header)
            print(f"📸 Formato detectado desde blob: {detected_format}")
            
            # Abrir la imagen
            img = Image.open(foto)
        
        if img:
            procesar_y_guardar_imagen(img, foto_path)
        else:
            print("⚠️  No se pudo abrir la imagen")
            crear_foto_por_defecto('user', foto_path)
            
    except Exception as e:
        print(f"❌ Error al guardar foto: {e}")
        import traceback
        traceback.print_exc()
        # Crear imagen por defecto en caso de error
        crear_foto_por_defecto('user', foto_path)

def procesar_y_guardar_imagen(img, foto_path):
    """Procesa y guarda una imagen como JPG, manejando cualquier formato"""
    try:
        print(f"🖼️  Formato original de PIL: {img.format}, Modo: {img.mode}, Tamaño: {img.size}")
        
        # Convertir a RGB si es necesario
        if img.mode in ('RGBA', 'LA', 'P'):
            # Crear un fondo blanco para imágenes con transparencia
            if img.mode == 'P':
                # Convertir paleta a RGBA primero
                img = img.convert('RGBA')
            
            if img.mode in ('RGBA', 'LA'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                # Pegar la imagen encima
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])  # Usar canal alfa como máscara
                else:
                    background.paste(img, mask=img.split()[1])
                img = background
        
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Redimensionar si es muy grande (máximo 800x800)
        max_size = (800, 800)
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            print(f"📏 Imagen redimensionada a: {img.size}")
        
        # Guardar como JPG con calidad
        img.save(foto_path, 'JPEG', quality=90, optimize=True, progressive=True)
        print(f"✅ Foto convertida y guardada como JPG en: {foto_path}")
        
    except Exception as e:
        print(f"❌ Error al procesar imagen: {e}")
        raise

def crear_foto_por_defecto(username, foto_path):
    """Crea una foto por defecto para el usuario"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Crear imagen verde
        img = Image.new('RGB', (200, 200), color='#4caf50')
        d = ImageDraw.Draw(img)
        
        # Intentar usar una fuente
        try:
            # Buscar fuentes comunes
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
            # Font por defecto
            font = ImageFont.load_default()
        
        # Dibujar la primera letra del nombre
        inicial = username[0].upper() if username and len(username) > 0 else 'U'
        
        # Calcular posición centrada
        try:
            # Método moderno
            from PIL import ImageFont
            left, top, right, bottom = font.getbbox(inicial)
            text_width = right - left
            text_height = bottom - top
        except:
            # Método antiguo
            text_width, text_height = d.textsize(inicial, font=font)
        
        position = ((200 - text_width) // 2, (200 - text_height) // 2)
        
        d.text(position, inicial, fill='white', font=font)
        
        # Guardar la imagen como JPG
        img.save(foto_path, 'JPEG', quality=90)
        print(f"✅ Imagen por defecto creada como JPG en: {foto_path}")
    except Exception as img_error:
        print(f"⚠️  No se pudo crear imagen por defecto: {img_error}")
        # Crear una imagen sólida como último recurso
        try:
            img = Image.new('RGB', (200, 200), color='#4caf50')
            img.save(foto_path, 'JPEG')
        except:
            pass

def vincular_conductor_usuario(dni, usuario_id):
    """Vincula un conductor existente con un usuario"""
    conductor_data = conductor.query.filter_by(dni=dni).first()
    if conductor_data:
        # Verificar si ya tiene usuario asignado
        if conductor_data.usuario_id:
            usuario_asignado = usuario.query.get(conductor_data.usuario_id)
            if usuario_asignado:
                return False, f"El conductor ya tiene asignada la cuenta: {usuario_asignado.usuario}"
            else:
                return False, "El conductor ya tiene un usuario asignado (ID inválido)"
        
        conductor_data.usuario_id = usuario_id
        try:
            db.session.commit()
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, f"Error al vincular conductor: {str(e)}"
    return False, "Conductor no encontrado"

def verificar_usuario_existente(username):
    """Verifica si un nombre de usuario ya existe"""
    return usuario.query.filter_by(usuario=username).first() is not None

def verificar_conductor_disponible(dni):
    """Verifica si un conductor puede registrarse"""
    conductor_data = conductor.query.filter_by(dni=dni).first()
    
    if not conductor_data:
        return False, "Conductor no encontrado en la base de datos"
    
    if conductor_data.estado and conductor_data.estado != "ACTIVO":
        return False, f"El conductor está {conductor_data.estado}"
    
    if conductor_data.usuario_id:
        return False, "El conductor ya tiene una cuenta de usuario asignada"
    
    return True, None

def obtener_detalles_usuario(username):
    """Obtiene los detalles de un usuario"""
    return usuario.query.filter_by(usuario=username).first()

def obtener_detalles_conductor(dni):
    """Obtiene los detalles de un conductor"""
    return conductor.query.filter_by(dni=dni).first()

def actualizar_perfil_completo(usuario_id, nombres, paterno, materno, current_password=None, new_password=None, foto=None):
    """Actualiza el perfil completo del usuario (datos personales, contraseña y foto)"""
    
    usuario_data = usuario.query.get(usuario_id)
    if not usuario_data:
        return False, "Usuario no encontrado", None

    # Verificar contraseña actual si se quiere cambiar la contraseña
    if current_password and new_password:
        h = hashlib.new("sha256")
        h.update(bytes(current_password, encoding="utf-8"))
        encpass = h.hexdigest()
        
        if usuario_data.password_user != encpass:
            return False, "La contraseña actual es incorrecta", None
        
        # Actualizar contraseña
        h_new = hashlib.new("sha256")
        h_new.update(bytes(new_password, encoding="utf-8"))
        new_encpass = h_new.hexdigest()
        usuario_data.password_user = new_encpass

    # Actualizar datos personales
    usuario_data.nombres = nombres
    usuario_data.ape_paterno = paterno
    usuario_data.ape_materno = materno

    # Actualizar foto si se envía
    if foto:
        try:
            # Usar siempre .jpg como extensión
            foto_filename = f"{usuario_id}.jpg"
            current_dir = os.path.dirname(os.path.abspath(__file__))
            src_dir = os.path.dirname(current_dir)
            upload_folder = os.path.join(src_dir, 'static', 'images', 'usuario')

            if not os.path.exists(upload_folder):
                os.makedirs(upload_folder, exist_ok=True)

            foto_path = os.path.join(upload_folder, foto_filename)
            
            # Guardar la foto (acepta cualquier formato y lo convierte a JPG)
            guardar_foto_usuario(foto, foto_path)
            
            usuario_data.foto_usuario = foto_filename
        except Exception as e:
            return False, f"Error al guardar la foto: {str(e)}", None

    try:
        db.session.commit()
        
        # Preparar datos de respuesta
        usuario_actualizado = {
            "usuario_id": usuario_data.usuario_id,
            "usuario": usuario_data.usuario,
            "nombres": nombres,
            "ape_paterno": paterno,
            "ape_materno": materno,
            "nombre_completo": f"{paterno} {materno} {nombres}",
            "foto_usuario": usuario_data.foto_usuario
        }
        
        return True, "Perfil actualizado exitosamente", usuario_actualizado
    except Exception as e:
        db.session.rollback()
        return False, f"Error al actualizar usuario: {str(e)}", None

def eliminar_foto_usuario(usuario_id):
    """Elimina la foto de perfil de un usuario"""
    usuario_data = usuario.query.get(usuario_id)
    if not usuario_data:
        return False, "Usuario no encontrado"
    
    # Eliminar archivo físico si existe
    if usuario_data.foto_usuario:
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            src_dir = os.path.dirname(current_dir)
            foto_path = os.path.join(src_dir, 'static', 'images', 'usuario', usuario_data.foto_usuario)
            
            if os.path.exists(foto_path):
                os.remove(foto_path)
                print(f"✅ Foto eliminada: {foto_path}")
        except Exception as e:
            print(f"⚠️  Error al eliminar archivo físico: {e}")
    
    # Actualizar base de datos
    usuario_data.foto_usuario = None
    
    try:
        db.session.commit()
        return True, "Foto eliminada correctamente"
    except Exception as e:
        db.session.rollback()
        return False, f"Error al eliminar foto: {str(e)}"