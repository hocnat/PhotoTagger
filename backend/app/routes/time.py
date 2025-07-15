from flask import Blueprint, request, jsonify
from app.services.time_service import time_shift_service

time_bp = Blueprint("time_bp", __name__)


@time_bp.route("/time/preview-shift", methods=["POST"])
def preview_time_shift():
    """
    Previews the result of a time shift operation on a set of files.
    """
    data = request.get_json()
    if not data or "files" not in data or "shift" not in data:
        return jsonify({"error": "Missing 'files' or 'shift' in request body"}), 400

    previews = time_shift_service.get_shift_preview(data["files"], data["shift"])
    return jsonify(previews)


@time_bp.route("/time/apply-shift", methods=["POST"])
def apply_time_shift():
    """
    Applies a time shift operation to the metadata of a set of files.
    """
    data = request.get_json()
    if not data or "files" not in data or "shift" not in data:
        return jsonify({"error": "Missing 'files' or 'shift' in request body"}), 400

    success = time_shift_service.apply_shift(data["files"], data["shift"])
    if success:
        return jsonify({"message": "Time shift applied successfully."})
    else:
        return jsonify({"error": "Failed to apply time shift."}), 500
