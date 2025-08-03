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


@geocoding_bp.route("/geocoding/match-gpx", methods=["POST"])
def match_gpx():
    """
    Receives GPX file content and a list of image timestamps,
    returns matched GPS coordinates for each image and a GeoJSON of the track.
    """
    data = request.get_json()
    if not data or "gpxContent" not in data or "files" not in data:
        return jsonify({"message": "Missing gpxContent or files in request"}), 400

    gpx_content = data['gpxContent']
    files = data['files']
    
    try:
        result = geocoding_service.match_photos_to_gpx(gpx_content, files)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Failed to process GPX data"}), 500