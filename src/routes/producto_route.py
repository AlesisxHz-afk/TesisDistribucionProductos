from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import producto_service

from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
import hashlib
import random
from ..services import producto_service
import os
from werkzeug.utils import secure_filename

main = Blueprint("producto", __name__, url_prefix="/producto")

ALLOWED_EXTENSIONS = {'jpg'}  # Solo se permite el formato JPG

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/gestionar_producto')
def mainproducto():
    return render_template('productos.html')

@main.route('/gestionar_cantidad')
def gestionar_cantidad():
    """Renderiza la página de gestión de cantidad de productos (stock global)"""
    return render_template('gestionar_cantidad.html')

@main.route('/predecir_stock')
def predecir_stock():
    return render_template('predecir_stock.html')

@main.route('/galeria')
def galeria():
    return render_template('galeria.html')

# ... (el resto de las rutas de producto_route.py se mantienen igual)
@main.route('/obtener_productos', methods=['GET'])
def obtener_productos_route():
    try:
        result = producto_service.obtener_productos()
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener productos"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_productos: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_destacados', methods=['GET'])
def obtener_productos_destacados_route():
    try:
        limit = request.args.get('limit', default=8, type=int)
        result = producto_service.obtener_productos_destacados(limit)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error al obtener productos destacados"
            }), 500
            
    except Exception as e:
        print(f"Error en obtener_destacados: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/obtener_producto_xid/<int:producto_id>', methods=['GET'])
def obtener_producto_por_id_route(producto_id):
    try:
        result = producto_service.obtener_producto_por_id(producto_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            if result.get('message') == "Producto no encontrado":
                return jsonify(result), 404
            else:
                return jsonify(result), 500
            
    except Exception as e:
        print(f"Error en obtener_producto_xid: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "error": str(e)
        }), 500

@main.route('/<int:producto_id>', methods=['GET'])
def obtener_producto_detalle_route(producto_id):
    try:
        result = producto_service.obtener_producto_por_id(producto_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500

@main.route('/registrar', methods=['POST'])
def registrar_producto():
    try:
        nombre = request.form.get("nombre")
        tipo = request.form.get("tipo")
        variedad = request.form.get("variedad")
        descripcion = request.form.get("descripcion")
        temperatura_optima = request.form.get("temperatura_optima")
        humedad_optima = request.form.get("humedad_optima")
        cant_productos_act = request.form.get("cant_productos_act")
        estado_producto = request.form.get("estado_producto")
        foto = request.files.get("foto") if 'foto' in request.files else None
        
        if not all([nombre, tipo, variedad, temperatura_optima, humedad_optima, cant_productos_act, estado_producto]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        try:
            temperatura_optima = float(temperatura_optima)
            humedad_optima = float(humedad_optima)
            cant_productos_act = float(cant_productos_act)
        except ValueError:
            return jsonify({"success": False, "error": "Los valores numéricos deben ser válidos"}), 400
        
        nuevo_producto, error = producto_service.crear_producto(
            nombre=nombre,
            tipo=tipo,
            variedad=variedad,
            descripcion=descripcion,
            temperatura_optima=temperatura_optima,
            humedad_optima=humedad_optima,
            cant_productos_act=cant_productos_act,
            estado_producto=estado_producto,
            foto=foto
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Producto registrado exitosamente",
            "producto_id": nuevo_producto.producto_id,
            "nombre": nombre
        }), 201
        
    except Exception as e:
        print(f"Error en registrar_producto: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Error en el registro: {str(e)}"}), 500

@main.route('/actualizar_producto/<int:id>', methods=['PUT'])
def actualizar_producto(id):
    try:
        data = request.get_json() if request.is_json else request.form
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        nombre = data.get("nombre")
        tipo = data.get("tipo")
        variedad = data.get("variedad")
        descripcion = data.get("descripcion")
        temperatura_optima = data.get("temperatura_optima")
        humedad_optima = data.get("humedad_optima")
        cant_productos_act = data.get("cant_productos_act")
        estado_producto = data.get("estado_producto")
        
        if not all([nombre, tipo, variedad, temperatura_optima, humedad_optima, cant_productos_act, estado_producto]):
            return jsonify({"success": False, "error": "Todos los campos obligatorios son requeridos"}), 400
        
        try:
            temperatura_optima = float(temperatura_optima)
            humedad_optima = float(humedad_optima)
            cant_productos_act = float(cant_productos_act)
        except ValueError:
            return jsonify({"success": False, "error": "Los valores numéricos deben ser válidos"}), 400
        
        foto = request.files.get("foto") if request.files and 'foto' in request.files else None
        
        producto_actualizado, error = producto_service.actualizar_producto(
            producto_id=id,
            nombre=nombre,
            tipo=tipo,
            variedad=variedad,
            descripcion=descripcion,
            temperatura_optima=temperatura_optima,
            humedad_optima=humedad_optima,
            cant_productos_act=cant_productos_act,
            estado_producto=estado_producto,
            foto=foto
        )
        
        if error:
            return jsonify({"success": False, "error": error}), 400
        
        return jsonify({
            "success": True,
            "mensaje": "Producto actualizado exitosamente"
        }), 200
        
    except Exception as e:
        print(f"Error en actualizar_producto: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_producto(id):
    try:
        data = request.get_json()
        if not data or 'estado' not in data:
            return jsonify({"success": False, "error": "No se recibió el nuevo estado"}), 400
        
        success, message = producto_service.cambiar_estado_producto(id, data['estado'])
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 400
        
    except Exception as e:
        print(f"Error en cambiar_estado_producto: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/eliminar_producto/<int:id>', methods=['DELETE'])
def eliminar_producto(id):
    try:
        success, message = producto_service.eliminar_producto(id)
        
        if success:
            return jsonify({
                "success": True,
                "mensaje": message
            }), 200
        else:
            return jsonify({"success": False, "error": message}), 404 if "no encontrado" in message else 400
        
    except Exception as e:
        print(f"Error en eliminar_producto: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/obtener_productos_activos_con_stock', methods=['GET'])
def obtener_productos_activos_con_stock():
    """Obtiene productos activos que tienen stock disponible"""
    try:
        productos_activos = producto.query.filter(
            producto.estado_producto == 'ACTIVO',
            producto.cant_productos_act > 0
        ).all()
        
        productos_lista = []
        for prod in productos_activos:
            productos_lista.append({
                "producto_id": prod.producto_id,
                "nombre": prod.nombre,
                "tipo": prod.tipo,
                "variedad": prod.variedad,
                "cant_productos_act": float(prod.cant_productos_act) if prod.cant_productos_act else 0
            })
        
        return jsonify({
            "success": True,
            "productos": productos_lista,
            "total": len(productos_lista)
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_productos_activos_con_stock: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500

# ===== NUEVAS RUTAS PARA PREDICCIÓN DE STOCK =====

@main.route('/predecir_stock_api', methods=['GET'])
def predecir_stock_api():
    """API para predecir stock usando el modelo entrenado"""
    try:
        anio = request.args.get('anio', type=int)
        mes = request.args.get('mes', type=int)
        
        if not anio or not mes:
            return jsonify({"success": False, "error": "Año y mes son requeridos"}), 400
        
        resultado = producto_service.predecir_stock_optimo(anio, mes)
        
        if "error" in resultado:
            return jsonify({"success": False, "error": resultado["error"]}), 400
        
        return jsonify({
            "success": True,
            "predicciones": resultado.get("predicciones", []),
            "total": len(resultado.get("predicciones", []))
        }), 200
        
    except Exception as e:
        print(f"Error en predecir_stock_api: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

@main.route('/guardar_predicciones', methods=['POST'])
def guardar_predicciones():
    """Guarda las predicciones en la tabla distribucion_almacen_producto"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"success": False, "error": "No se recibieron datos"}), 400
        
        anio = data.get('anio')
        mes = data.get('mes')
        predicciones = data.get('predicciones', [])
        
        print(f"Recibido: anio={anio} (tipo: {type(anio)}), mes={mes} (tipo: {type(mes)})")
        print(f"Total predicciones: {len(predicciones)}")
        
        if not anio or not mes:
            return jsonify({"success": False, "error": "Año y mes son requeridos"}), 400
        
        if not predicciones:
            return jsonify({"success": False, "error": "No hay predicciones para guardar"}), 400
        
        resultado = producto_service.guardar_predicciones_db(anio, mes, predicciones)
        
        if "error" in resultado:
            return jsonify({"success": False, "error": resultado["error"]}), 400
        
        return jsonify({
            "success": True,
            "mensaje": resultado.get("mensaje", "Predicciones guardadas exitosamente"),
            "guardados": resultado.get("guardados", 0),
            "total_envios": resultado.get("total_envios", 0)
        }), 200
        
    except Exception as e:
        print(f"Error en guardar_predicciones: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
    
@main.route('/obtener_detalle_envios/<int:producto_id>', methods=['GET'])
def obtener_detalle_envios(producto_id):
    """Obtiene el detalle de envíos de un producto para un año y mes específicos"""
    try:
        anio = request.args.get('anio', type=int)
        mes = request.args.get('mes', type=int)
        
        if not anio or not mes:
            return jsonify({"success": False, "error": "Año y mes son requeridos"}), 400
        
        resultado = producto_service.obtener_detalle_envios_producto(producto_id, anio, mes)
        
        if "error" in resultado:
            return jsonify({"success": False, "error": resultado["error"]}), 400
        
        return jsonify({
            "success": True,
            "envios": resultado.get("envios", [])
        }), 200
        
    except Exception as e:
        print(f"Error en obtener_detalle_envios: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500