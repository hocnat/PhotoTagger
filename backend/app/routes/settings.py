from flask import Blueprint, request, jsonify
from app.services.settings_service import load_settings, save_settings

settings_bp = Blueprint("settings_bp", __name__)


@settings_bp.route("/settings", methods=["GET"])
def get_settings():
    """Returns all user-configurable settings."""
    return jsonify(load_settings())


@settings_bp.route("/settings", methods=["PUT"])
def update_settings():
    """Receives and saves the updated settings object."""
    updated_settings = request.get_json()
    if not updated_settings:
        return jsonify({"error": "Invalid request body"}), 400
    try:
        current_settings = load_settings()
        current_settings.update(updated_settings)
        save_settings(current_settings)
        return jsonify(current_settings)
    except Exception as e:
        return jsonify({"error": "Failed to save settings", "details": str(e)}), 500


@settings_bp.route("/settings/last-opened-folder", methods=["PUT"])
def update_last_opened_folder():
    """Specifically updates the last opened folder path."""
    data = request.get_json()
    if not data or "path" not in data:
        return jsonify({"error": "Path is required"}), 400

    try:
        settings = load_settings()
        settings["appBehavior"]["lastOpenedFolder"] = data["path"]
        save_settings(settings)
        return jsonify({"message": "Last opened folder updated successfully."})
    except Exception as e:
        return (
            jsonify(
                {"error": "Failed to update last opened folder", "details": str(e)}
            ),
            500,
        )
