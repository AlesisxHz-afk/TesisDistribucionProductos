from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import vehiculo_service
from ..models.models import *
import hashlib
import os
from ..services import vehiculo_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime

main = Blueprint("vehiculo", __name__, url_prefix="/main/vehiculo")

@main.route("/obtener_vehiculos", methods=["GET"])
def obtener_vehiculos():
    """Obtiene los """
    return 1
