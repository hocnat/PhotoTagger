from flask import Blueprint, request, jsonify
from app.services.location_service import (
    load_location_presets,
    add_location_preset,
)

locations_bp = Blueprint("locations_bp", __name__)


@locations_bp.route("/locations", methods=["GET"])
def get_locations():
    """Returns the list of all saved location presets."""
    presets = load_location_presets()
    sorted_presets = sorted(presets, key=lambda p: p.get("name", "").lower())
    return jsonify(sorted_presets)


@locations_bp.route("/locations", methods=["POST"])
def save_location():
    """Saves a new location preset."""
    data = request.get_json()
    if not data or "name" not in data or "data" not in data:
        return jsonify({"error": "Preset name and data are required"}), 400

    try:
        new_preset = add_location_preset(data["name"], data["data"])
        return jsonify(new_preset), 201
    except Exception as e:
        return (
            jsonify({"error": "Failed to save location preset", "details": str(e)}),
            500,
        )
