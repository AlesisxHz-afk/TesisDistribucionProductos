from ..models.models import db, distribucionalmacenproducto, producto, almacen, almacencapacidad
from sqlalchemy import text, bindparam
import hashlib
import os
import pandas as pd
import numpy as np
from datetime import datetime, time as dt_time
import traceback

def registrar_distribucion_productos_excel():
    try:
        # Ruta del archivo Excel
        excel_path = "src/static/uploads/distribucion_almacen_producto.xlsx"
        
        # Verificar si el archivo existe
        if not os.path.exists(excel_path):
            return {
                "success": False,
                "error": "Archivo no encontrado",
                "message": f"El archivo {excel_path} no existe"
            }
        
        # Leer el archivo Excel
        df = pd.read_excel(excel_path)
        
        # Verificar que el DataFrame no esté vacío
        if df.empty:
            return {
                "success": False,
                "error": "Archivo vacío",
                "message": "El archivo Excel está vacío"
            }
        
        print(f"Total de registros en Excel: {len(df)}")
        
        # Función para convertir fecha
        def convertir_fecha(fecha_val):
            if pd.isna(fecha_val):
                return None
            try:
                # Si es string con formato dd/mm/yyyy
                if isinstance(fecha_val, str):
                    # Limpiar espacios
                    fecha_val = fecha_val.strip()
                    # Convertir dd/mm/yyyy a datetime
                    try:
                        return datetime.strptime(fecha_val, '%d/%m/%Y').date()
                    except:
                        # Intentar otros formatos
                        try:
                            return datetime.strptime(fecha_val, '%Y-%m-%d').date()
                        except:
                            try:
                                return datetime.strptime(fecha_val, '%m/%d/%Y').date()
                            except:
                                return None
                # Si ya es datetime o Timestamp
                elif isinstance(fecha_val, (datetime, pd.Timestamp)):
                    return fecha_val.date()
                else:
                    return None
            except Exception as e:
                print(f"Error convirtiendo fecha {fecha_val}: {e}")
                return None
        
        # Función para convertir hora
        def convertir_hora(hora_val):
            if pd.isna(hora_val):
                return None
            try:
                # Si es string
                if isinstance(hora_val, str):
                    hora_val = hora_val.strip()
                    try:
                        return datetime.strptime(hora_val, '%H:%M:%S').time()
                    except:
                        try:
                            return datetime.strptime(hora_val, '%H:%M').time()
                        except:
                            return None
                # Si ya es time
                elif isinstance(hora_val, dt_time):
                    return hora_val
                # Si es datetime o timestamp
                elif isinstance(hora_val, (datetime, pd.Timestamp)):
                    return hora_val.time()
                else:
                    return None
            except Exception as e:
                print(f"Error convirtiendo hora {hora_val}: {e}")
                return None
        
        # Convertir columnas
        if 'fecha_envio' in df.columns:
            df['fecha_envio_conv'] = df['fecha_envio'].apply(convertir_fecha)
        else:
            df['fecha_envio_conv'] = None
        
        if 'hora_envio' in df.columns:
            df['hora_envio_conv'] = df['hora_envio'].apply(convertir_hora)
        else:
            df['hora_envio_conv'] = None
        
        if 'hora_llegada' in df.columns:
            df['hora_llegada_conv'] = df['hora_llegada'].apply(convertir_hora)
        else:
            df['hora_llegada_conv'] = None
        
        # Convertir otras columnas
        df['almacen_id'] = pd.to_numeric(df['almacen_id'], errors='coerce')
        df['producto_id'] = pd.to_numeric(df['producto_id'], errors='coerce')
        df['vehiculo_conductor_id'] = pd.to_numeric(df['vehiculo_conductor_id'], errors='coerce')
        df['dia'] = pd.to_numeric(df['dia'], errors='coerce')
        df['mes'] = pd.to_numeric(df['mes'], errors='coerce')
        df['anio'] = pd.to_numeric(df['anio'], errors='coerce')
        df['demanda'] = pd.to_numeric(df['demanda'], errors='coerce')
        df['gasto'] = pd.to_numeric(df['gasto'], errors='coerce')
        
        # Manejar nro_envio
        if 'nro_envio' in df.columns:
            df['nro_envio'] = df['nro_envio'].fillna('').astype(str)
        
        # Reemplazar NaN por None
        df = df.where(pd.notnull(df), None)
        
        # Insertar usando SQL directo para mejor control
        registros_insertados = 0
        errores = []
        
        # Obtener conexión de la base de datos
        connection = db.engine.connect()
        
        # Preparar consulta SQL
        sql = """
        INSERT INTO distribucion_almacen_producto 
        (asignacion_id, almacen_id, producto_id, vehiculo_conductor_id, dia, mes, anio, 
         fecha_envio, hora_envio, hora_llegada, estado_envio, demanda, gasto, nro_envio)
        VALUES 
        (:asignacion_id, :almacen_id, :producto_id, :vehiculo_conductor_id, :dia, :mes, :anio,
         :fecha_envio, :hora_envio, :hora_llegada, :estado_envio, :demanda, :gasto, :nro_envio)
        ON CONFLICT (asignacion_id) DO NOTHING
        """
        
        # Procesar en lotes
        batch_size = 100
        total_batches = (len(df) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(df))
            batch = df.iloc[start_idx:end_idx]
            
            try:
                # Preparar datos para el lote
                data_list = []
                for idx, row in batch.iterrows():
                    data = {
                        'asignacion_id': row.get('asignacion_id'),
                        'almacen_id': row.get('almacen_id'),
                        'producto_id': row.get('producto_id'),
                        'vehiculo_conductor_id': row.get('vehiculo_conductor_id'),
                        'dia': row.get('dia'),
                        'mes': row.get('mes'),
                        'anio': row.get('anio'),
                        'fecha_envio': row.get('fecha_envio_conv'),
                        'hora_envio': row.get('hora_envio_conv'),
                        'hora_llegada': row.get('hora_llegada_conv'),
                        'estado_envio': row.get('estado_envio'),
                        'demanda': row.get('demanda'),
                        'gasto': row.get('gasto'),
                        'nro_envio': row.get('nro_envio') if row.get('nro_envio') not in ['', 'nan', 'None', None] else None
                    }
                    data_list.append(data)
                
                # Ejecutar inserción del lote
                if data_list:
                    with connection.begin() as trans:
                        connection.execute(text(sql), data_list)
                    registros_insertados += len(data_list)
                    
                print(f"Procesado lote {batch_num + 1}/{total_batches}: {len(data_list)} registros")
                
            except Exception as e:
                errores.append(f"Lote {batch_num + 1}: {str(e)}")
                print(f"Error en lote {batch_num + 1}: {e}")
                # Continuar con el siguiente lote
                continue
        
        connection.close()
        
        # Preparar respuesta
        mensaje = f"Proceso completado. Se insertaron {registros_insertados} de {len(df)} registros."
        if errores:
            mensaje += f" Se encontraron {len(errores)} lotes con errores."
        
        return {
            "success": True,
            "message": mensaje,
            "registros_insertados": registros_insertados,
            "total_registros": len(df),
            "errores_en_lotes": len(errores),
            "errores_detalle": errores[:10]  # Mostrar solo primeros 10 errores
        }
        
    except Exception as e:
        print(f"Error general: {e}")
        print(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Error al registrar la distribucion productos"
        }