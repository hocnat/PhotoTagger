from flask import Blueprint, request, jsonify
from ..services import location_service

locations_bp = Blueprint("locations_bp", __name__)


@locations_bp.route("/locations", methods=["GET"])
def get_locations():
    presets = location_service.load_location_presets()
    return jsonify(presets)


@locations_bp.route("/locations", methods=["POST"])
def add_location():
    data = request.get_json()
    if not data or "name" not in data or "data" not in data:
        return jsonify({"error": "Name and data are required"}), 400
    try:
        new_preset = location_service.add_location_preset(data["name"], data["data"])
        return jsonify(new_preset), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409  # Conflict


@locations_bp.route("/locations/<string:preset_id>/track_usage", methods=["PUT"])
def track_usage(preset_id):
    updated_preset = location_service.update_location_preset_usage(preset_id)
    if updated_preset:
        return jsonify(updated_preset)
    return jsonify({"error": "Preset not found"}), 404


@locations_bp.route("/locations/<string:preset_id>", methods=["PUT"])
def update_location(preset_id):
    data = request.get_json()
    if not data or "name" not in data or "data" not in data:
        return jsonify({"error": "Name and data are required"}), 400

    try:
        updated = location_service.update_preset(preset_id, data["name"], data["data"])
        if updated:
            return jsonify(updated)
        return jsonify({"error": "Preset not found"}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 409  # Conflict


@locations_bp.route("/locations/<string:preset_id>", methods=["DELETE"])
def delete_location(preset_id):
    if location_service.delete_preset(preset_id):
        return "", 204  # No Content
    return jsonify({"error": "Preset not found"}), 404
