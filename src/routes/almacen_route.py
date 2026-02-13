from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import almacen_service
from ..models.models import *
import hashlib
import os
from ..services import almacen_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime

main = Blueprint("almacen", __name__, url_prefix="/main/almacen")

@main.route("/obtener_almacenes", methods=["GET"])
def obtener_almacenes():
    """Obtiene los """
    return 1
