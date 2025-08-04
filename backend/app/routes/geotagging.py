from flask import Blueprint, request, jsonify
from ..services import geotagging_service

geotagging_bp = Blueprint("geotagging_bp", __name__)


@geotagging_bp.route("/geotagging/enrich-coordinates", methods=["POST"])
def enrich_coords():
    """
    API endpoint to enrich a list of GPS coordinates with address details.
    """
    data = request.get_json()
    if not data or "coordinates" not in data:
        return jsonify({"error": "A list of coordinates is required"}), 400

    coordinates = data["coordinates"]
    try:
        enriched_data = geotagging_service.enrich_coordinates(coordinates)
        return jsonify(enriched_data)
    except Exception as e:
        return jsonify({"error": f"Failed to enrich coordinate data: {e}"}), 500


@geotagging_bp.route("/geotagging/match-gpx", methods=["POST"])
def match_gpx():
    """
    Receives GPX file content, a list of image timestamps, and the time threshold,
    returns matched GPS coordinates for each image and a GeoJSON of the track.
    """
    data = request.get_json()
    if not data or "gpxContent" not in data or "files" not in data or "gpxTimeThreshold" not in data:
        return jsonify({"message": "Missing gpxContent, files, or gpxTimeThreshold in request"}), 400

    gpx_content = data['gpxContent']
    files = data['files']
    threshold = data['gpxTimeThreshold']
    
    try:
        result = geotagging_service.match_photos_to_gpx(gpx_content, files, threshold)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": "Failed to process GPX data"}), 500