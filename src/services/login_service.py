from flask import request
import hashlib
from ..models.models import db, usuario

def validar_token():
    token = request.cookies.get('token')
    username = request.cookies.get('usuario')
    user = usuario.query.filter_by(usuario=username).first()

    return user and token == user.token

def login(username, password):
    user = usuario.query.filter_by(usuario=username).first()
    h = hashlib.new("sha256")
    h.update(bytes(password, encoding="utf-8"))
    encpass = h.hexdigest()
    return (user and user.password_user == encpass)

def actualizar_token(username, token):
    user = usuario.query.filter_by(usuario=username).first()

    if user:
        user.token = token
        db.session.commit()
    else:
        pass

def validar_sesion(username, password):
    h = hashlib.new("sha256")
    h.update(bytes(password, encoding="utf-8"))
    encpass = h.hexdigest()

    user = usuario.query.filter_by(usuario=username, password_user=encpass).first()
    return user