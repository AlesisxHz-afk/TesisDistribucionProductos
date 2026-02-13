from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import login_service

from ..models.models import *
import hashlib
import random
from ..services import login_service
import os
from werkzeug.utils import secure_filename
from datetime import datetime

main = Blueprint("login", __name__, url_prefix="/login")

@main.route("/procesar_login", methods=["POST"])
def procesar_login():
    username = request.form["username"]
    password = request.form["password"]
    
    if login_service.login(username, password):
        numale = random.randint(1, 1024)
        a = hashlib.new("sha256")
        a.update(bytes(str(numale), encoding="utf-8"))
        encnumale = a.hexdigest()

        resp = make_response(redirect("/main"))
        resp.set_cookie("token", encnumale)
        resp.set_cookie("usuario", username)

        user = usuario.query.filter_by(usuario=username).first()

        if user.tipo_usuario_id == 1:
            return jsonify({"error": "Usuario no tiene permitido entrar a la sesion"}), 401

        if user:
            # cookie con ID del tipo
            resp.set_cookie("tipo", str(user.tipo_usuario_id))

            # 👉 OBTENER NOMBRE DEL TIPO
            tipo = tipousuario.query.filter_by(
                tipo_usuario_id=user.tipo_usuario_id
            ).first()

            if tipo:
                resp.set_cookie("tipo_nombre", tipo.tipo_usuario)

            nombrecompleto = f"{user.ape_paterno} {user.ape_materno} {user.nombres}"
            resp.set_cookie("apellidosynombres", nombrecompleto)
            resp.set_cookie("usuario_id", str(user.usuario_id))

        login_service.actualizar_token(username, encnumale)
        return resp
    
    return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

@main.route("/cerrar_sesion", methods=["POST"])
def cerrar_sesion():
    username = request.cookies.get("usuario")
    
    if not username:
        return jsonify({"error": "No hay usuario en la sesión"}), 401
    else:
        resp = make_response(jsonify({"success": True, "message": "Sesión cerrada exitosamente"}))
        resp.delete_cookie("apellidosynombres")
        resp.delete_cookie("tipo")
        resp.delete_cookie("token")
        resp.delete_cookie("usuario")
        resp.delete_cookie("usuario_id")
        resp.delete_cookie("tipo_nombre")
        login_service.actualizar_token(username, '')
        return resp

@main.route("/")
def login():
    return render_template("login.html")