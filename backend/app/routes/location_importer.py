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
