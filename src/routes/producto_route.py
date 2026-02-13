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

# Función para verificar la extensión del archivo
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main.route('/')
def mainproducto():
    return render_template('producto.html')

@main.route('/galeria')
def galeria():
    return render_template('galeria.html')

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
    """Ruta alternativa para obtener detalles de producto"""
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