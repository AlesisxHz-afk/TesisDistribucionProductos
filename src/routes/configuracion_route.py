from flask import Blueprint, make_response, redirect, render_template, request, jsonify, send_file
from src.services import configuracion_service
from ..models.models import *
import hashlib
import os
from ..services import configuracion_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime

main = Blueprint("configuracion", __name__, url_prefix="/main/configuracion")

@main.route('/entrenar_modelo')
@require_role('ADMIN')
def entrenar_modelo():
    return render_template('entrenar_modelo.html')

@main.route('/entrenar_stock_optimo', methods=['POST'])
@require_role('ADMIN')
def entrenar_stock_optimo():
    """Entrenar modelo de stock óptimo"""
    try:
        resultado = configuracion_service.entrenar_modelo_stock_optimo()
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/entrenar_clasificacion_almacenes', methods=['POST'])
@require_role('ADMIN')
def entrenar_clasificacion_almacenes():
    """Entrenar modelo de clasificación de almacenes"""
    try:
        resultado = configuracion_service.entrenar_modelo_clasificacion_almacenes()
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/entrenar_planificacion_rutas', methods=['POST'])
@require_role('ADMIN')
def entrenar_planificacion_rutas():
    """Entrenar modelo de planificación de rutas"""
    try:
        resultado = configuracion_service.entrenar_modelo_planificacion_rutas()
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/obtener_metricas', methods=['GET'])
@require_role('ADMIN')
def obtener_metricas():
    """Obtener métricas de modelos entrenados"""
    try:
        resultado = configuracion_service.obtener_metricas_modelos()
        return jsonify(resultado)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/descargar_excel/<tipo_modelo>', methods=['GET'])
@require_role('ADMIN')
def descargar_excel(tipo_modelo):
    """Descargar archivo Excel generado por un modelo"""
    try:
        metricas = configuracion_service.obtener_metricas_modelos()
        
        ruta_excel = None
        for modelo in metricas.get('models', []):
            if tipo_modelo in modelo['nombre']:
                ruta_excel = modelo.get('ruta_excel')
                break
        
        if not ruta_excel or not os.path.exists(ruta_excel):
            excel_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'excel')
            if os.path.exists(excel_path):
                archivos_excel = [f for f in os.listdir(excel_path) if f.endswith('.xlsx') and tipo_modelo in f]
                if archivos_excel:
                    archivos_excel.sort(key=lambda x: os.path.getmtime(os.path.join(excel_path, x)), reverse=True)
                    ruta_excel = os.path.join(excel_path, archivos_excel[0])
        
        if ruta_excel and os.path.exists(ruta_excel):
            # Nombre más descriptivo para el archivo
            if tipo_modelo == 'stock_optimo':
                nombre_descarga = f"predicciones_stock_optimo_{datetime.now().strftime('%Y%m%d')}.xlsx"
            elif tipo_modelo == 'clasificacion_almacenes':
                nombre_descarga = f"clasificacion_almacenes_{datetime.now().strftime('%Y%m%d')}.xlsx"
            else:
                nombre_descarga = f"planificacion_rutas_{datetime.now().strftime('%Y%m%d')}.xlsx"
            
            return send_file(
                ruta_excel,
                as_attachment=True,
                download_name=nombre_descarga,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            return jsonify({"error": f"No se encontró archivo Excel para {tipo_modelo}"}), 404
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/listar_archivos_excel', methods=['GET'])
@require_role('ADMIN')
def listar_archivos_excel():
    """Listar todos los archivos Excel disponibles"""
    try:
        excel_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'excel')
        
        if not os.path.exists(excel_path):
            return jsonify({"archivos": []})
        
        archivos = []
        for archivo in os.listdir(excel_path):
            if archivo.endswith('.xlsx'):
                file_path = os.path.join(excel_path, archivo)
                archivos.append({
                    'nombre': archivo,
                    'tamano': os.path.getsize(file_path),
                    'fecha_modificacion': datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S'),
                    'ruta': file_path
                })
        
        archivos.sort(key=lambda x: x['fecha_modificacion'], reverse=True)
        
        return jsonify({"archivos": archivos})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@main.route('/vista_previa_excel/<nombre_archivo>', methods=['GET'])
@require_role('ADMIN')
def vista_previa_excel(nombre_archivo):
    """Obtener vista previa de un archivo Excel"""
    try:
        excel_path = os.path.join(os.path.dirname(__file__), '..', 'models', 'excel', nombre_archivo)
        
        if not os.path.exists(excel_path):
            return jsonify({"error": "Archivo no encontrado"}), 404
        
        import pandas as pd
        xls = pd.ExcelFile(excel_path)
        
        hojas = {}
        for sheet_name in xls.sheet_names[:5]:  # Solo las primeras 5 hojas
            df = pd.read_excel(xls, sheet_name=sheet_name, nrows=10)  # Solo primeras 10 filas
            hojas[sheet_name] = {
                'columnas': df.columns.tolist(),
                'datos': df.head(5).to_dict('records')  # Solo 5 filas para vista previa
            }
        
        return jsonify({
            'nombre_archivo': nombre_archivo,
            'hojas': hojas,
            'total_hojas': len(xls.sheet_names)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500