from flask import Blueprint, request, jsonify
from app.services.location_service import (
    load_location_presets,
    add_location_preset,
    update_location_preset_usage,
)
from app.services.sorting_service import smart_sort

locations_bp = Blueprint("locations_bp", __name__)


@locations_bp.route("/locations", methods=["GET"])
def get_locations():
    """Returns the list of all saved location presets, intelligently sorted."""
    query = request.args.get("q", "").lower()
    presets = load_location_presets()

    # Convert the list of presets into the dictionary format our sorter expects.
    # The 'name' becomes the key.
    presets_map = {preset["name"]: preset for preset in presets}

    sorted_preset_names = smart_sort(presets_map, query)

    # Reconstruct the sorted list of full preset objects.
    sorted_presets = [presets_map[name] for name in sorted_preset_names]

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


@locations_bp.route("/locations/<string:preset_id>/track_usage", methods=["PUT"])
def track_location_usage(preset_id):
    """Updates the useCount and lastUsed timestamp for a given preset."""
    try:
        updated_preset = update_location_preset_usage(preset_id)
        if updated_preset:
            return jsonify(updated_preset)
        return jsonify({"error": "Preset not found"}), 404
    except Exception as e:
        return (
            jsonify({"error": "Failed to track preset usage", "details": str(e)}),
            500,
        )
