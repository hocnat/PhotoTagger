from flask import Blueprint, request, jsonify
from app.services.health_check_service import health_check_service

health_check_bp = Blueprint("health_check_bp", __name__)


@health_check_bp.route("/health-check", methods=["POST"])
def run_health_check():
    """
    Runs a health check on a list of files based on provided rules.
    """
    data = request.get_json()
    if not data or "files" not in data or "rules" not in data:
        return jsonify({"error": "Missing 'files' or 'rules' in request body"}), 400

    files = data["files"]
    rules = data["rules"]

    reports = health_check_service.run_check(files, rules)
    return jsonify(reports)
