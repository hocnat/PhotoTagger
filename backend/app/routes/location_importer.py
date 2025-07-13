from flask import Blueprint, request, jsonify
from ..services import location_importer_service

location_importer_bp = Blueprint("location_importer_bp", __name__)


@location_importer_bp.route("/location-importer/fetch-from-url", methods=["POST"])
def fetch_from_url():
    """
    API endpoint to fetch placemarks from a Google MyMaps URL.
    Expects a JSON payload with a "url" key.
    """
    data = request.get_json()
    if not data or "url" not in data:
        return jsonify({"error": "URL is required"}), 400

    url = data["url"]
    try:
        placemarks = location_importer_service.fetch_placemarks_from_url(url)
        return jsonify(placemarks)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Catch broader exceptions from requests or parsing for a generic server error
        return jsonify({"error": f"Failed to process map data: {e}"}), 500


@location_importer_bp.route("/location-importer/enrich-locations", methods=["POST"])
def enrich_locations():
    """
    API endpoint to enrich a list of locations with geocoded data.
    Expects a JSON payload with a "locations" key containing a list of objects.
    """
    data = request.get_json()
    if not data or "locations" not in data:
        return jsonify({"error": "A list of locations is required"}), 400

    locations = data["locations"]
    try:
        enriched_data = location_importer_service.enrich_location_data(locations)
        return jsonify(enriched_data)
    except Exception as e:
        return jsonify({"error": f"Failed to enrich location data: {e}"}), 500


@location_importer_bp.route("/location-importer/save-presets", methods=["POST"])
def save_presets():
    """
    API endpoint to save imported presets, handling conflicts.
    Expects a payload with "presets" and optional "resolutions".
    """
    data = request.get_json()
    if not data or "presets" not in data:
        return jsonify({"error": "A list of presets is required"}), 400

    presets_to_import = data.get("presets")
    resolutions = data.get("resolutions")  # Can be None

    try:
        result = location_importer_service.save_imported_presets(
            presets_to_import, resolutions
        )

        if not result["success"]:
            return jsonify({"conflicts": result["conflicts"]}), 409

        return jsonify({"message": "Presets saved successfully"}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to save presets: {e}"}), 500
