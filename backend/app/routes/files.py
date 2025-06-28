import os
from flask import Blueprint, request, jsonify, send_from_directory

files_bp = Blueprint("files_bp", __name__)


@files_bp.route("/images")
def list_images():
    folder_path = request.args.get("folder")
    if not folder_path or not os.path.isdir(folder_path):
        return jsonify({"error": "Folder not found"}), 404
    try:
        supported = (".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff", ".cr2")
        return jsonify(
            [f for f in os.listdir(folder_path) if f.lower().endswith(supported)]
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@files_bp.route("/image_data")
def get_image_data():
    image_path = request.args.get("path")
    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": "Image not found"}), 404
    try:
        directory, filename = os.path.split(image_path)
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
