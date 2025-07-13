from flask import Blueprint, request, jsonify
from ..services import geocoding_service

geocoding_bp = Blueprint("geocoding_bp", __name__)


@geocoding_bp.route("/geocoding/enrich-coordinates", methods=["POST"])
def enrich_coords():
    """
    API endpoint to enrich a list of GPS coordinates with address details.
    Expects a JSON payload with a "coordinates" key containing a list of objects,
    each with "latitude" and "longitude".
    """
    data = request.get_json()
    if not data or "coordinates" not in data:
        return jsonify({"error": "A list of coordinates is required"}), 400

    coordinates = data["coordinates"]
    try:
        enriched_data = geocoding_service.enrich_coordinates(coordinates)
        return jsonify(enriched_data)
    except Exception as e:
        return jsonify({"error": f"Failed to enrich coordinate data: {e}"}), 500
