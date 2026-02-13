from flask import Blueprint, make_response, redirect, render_template, request, jsonify
from src.services import conductor_service
from ..models.models import *
import hashlib
import os
from ..services import conductor_service
from werkzeug.utils import secure_filename
from auth import require_role
from datetime import datetime

main = Blueprint("conductor", __name__, url_prefix="/main/conductor")

@main.route("/obtener_conductores", methods=["GET"])
def obtener_conductores():
    """Obtiene los """
    return 1
