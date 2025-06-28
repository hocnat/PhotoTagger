import os
from io import BytesIO
from flask import Blueprint, request, jsonify, send_file
from app.services.exif_service import get_image_data as get_image_data_service

files_bp = Blueprint("files_bp", __name__)


@files_bp.route("/images")
def list_images():
    folder_path = request.args.get("folder")
    if not folder_path or not os.path.isdir(folder_path):
        return jsonify({"error": "Folder not found"}), 404
    try:
        # We include RAW file extensions so they appear in the frontend gallery.
        supported = (
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".tiff",
            ".cr2",
            ".nef",
            ".arw",
            ".dng",
        )
        return jsonify(
            [f for f in os.listdir(folder_path) if f.lower().endswith(supported)]
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/image_data")
def get_image_data():
    image_path = request.args.get("path")
    if not image_path:
        return jsonify({"error": "Image path parameter is required"}), 400

    try:
        # We delegate the complex logic of fetching image data to the exif_service.
        # This service can handle multiple file types, including extracting
        # previews from RAW files, keeping this route clean and focused.
        image_bytes, mime_type = get_image_data_service(image_path)

        if image_bytes and mime_type:
            return send_file(BytesIO(image_bytes), mimetype=mime_type)
        else:
            # This case handles when a file does not exist, is an unsupported
            # format, or a preview could not be extracted from a RAW file.
            return jsonify({"error": "Image not found or preview unavailable"}), 404

    except Exception as e:
        # A general catch-all for unexpected errors during file processing.
        return jsonify({"error": str(e)}), 500
