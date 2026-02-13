from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import distribucion_almacen_producto_service

from ..models.models import *
from flask import *
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import *
import hashlib
import random
from ..services import distribucion_almacen_producto_service

import os
from werkzeug.utils import secure_filename

main = Blueprint("distribucion_almacen_producto", __name__, url_prefix="/distribucion_almacen_producto")

@main.route('/registrar_distribucion_excel', methods=['GET', 'POST'])
def registrar_distribucion_excel():
    try:
        # Llamar al servicio para procesar el Excel
        resultado = distribucion_almacen_producto_service.registrar_distribucion_productos_excel()
        
        # Retornar respuesta JSON
        if resultado.get("success"):
            return jsonify({
                "success": True,
                "message": "Registro completado exitosamente",
                "registros_insertados": resultado.get("registros_insertados", 0),
                "errores": resultado.get("errores", [])
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Error en el registro",
                "error": resultado.get("error", "Error desconocido"),
                "detalles": resultado.get("errores", [])
            }), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": "Error en el servidor",
            "error": str(e)
        }), 500