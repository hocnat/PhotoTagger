import os
import re
import subprocess
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.services.exif_service import EXIFTOOL_PATH

tools_bp = Blueprint("tools_bp", __name__)


def _generate_new_filename(old_path: str) -> tuple[str | None, str | None, str]:
    """
    Generates a new filename based on metadata.

    Returns a tuple of (new_path, new_filename, status_message).
    If a new name cannot be generated, new_path and new_filename will be None.
    """
    if not os.path.isfile(old_path):
        return None, None, "Error: Not a file"
    try:
        command = [
            EXIFTOOL_PATH,
            "-json",
            "-DateTimeOriginal",
            "-Description",
            old_path,
        ]
        result = subprocess.run(command, capture_output=True, check=True)
        metadata = json.loads(result.stdout.decode("utf-8"))[0]

        dt_str = metadata.get("DateTimeOriginal")
        caption = metadata.get("Description", "untitled")
        if not dt_str:
            return None, None, "Error: No DateTimeOriginal"

        try:
            dt_obj = datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
            ts_str = dt_obj.strftime("%Y%m%d_%H%M%S")
        except ValueError:
            # Fallback for non-standard date formats
            ts_str = dt_str.split(" ")[0].replace(":", "")

        safe_caption = re.sub(r'[\\/*?:"<>|]', "", caption).replace(" ", "_")
        directory, old_filename = os.path.split(old_path)
        _, ext_base = os.path.splitext(old_filename)
        # Preserve case for RAW files, lowercase for others
        extension = ext_base.upper() if ext_base.lower() == ".cr2" else ext_base.lower()

        new_filename_base = f"{ts_str}_{safe_caption}"
        new_path = os.path.join(directory, f"{new_filename_base}{extension}")

        # Handle potential filename collisions
        counter = 1
        while os.path.exists(new_path) and new_path.lower() != old_path.lower():
            new_path = os.path.join(
                directory, f"{new_filename_base}_{counter}{extension}"
            )
            counter += 1

        new_filename = os.path.basename(new_path)

        if new_path.lower() == old_path.lower():
            return new_path, new_filename, "Skipped"

        return new_path, new_filename, "Success"

    except Exception as e:
        return None, None, f"Error: {e}"


@tools_bp.route("/preview_rename", methods=["POST"])
def preview_rename():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request"}), 400

    image_paths = data["files"]
    preview_results = []

    for old_path in image_paths:
        directory, old_filename = os.path.split(old_path)
        new_path, new_filename, status = _generate_new_filename(old_path)

        if status == "Success" or status == "Skipped":
            preview_results.append({"original": old_filename, "new": new_filename})
        else:
            # In case of an error, show the original name as the new name
            preview_results.append({"original": old_filename, "new": f"({status})"})

    return jsonify(preview_results)


@tools_bp.route("/rename_files", methods=["POST"])
def rename_files():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request"}), 400

    image_paths = data["files"]
    rename_results = []

    for old_path in image_paths:
        directory, old_filename = os.path.split(old_path)
        new_path, new_filename, status = _generate_new_filename(old_path)

        if status == "Success":
            os.rename(old_path, new_path)
            rename_results.append(
                {"original": old_filename, "new": new_filename, "status": "Renamed"}
            )
        else:
            rename_results.append(
                {"original": old_filename, "new": new_filename, "status": status}
            )

    return jsonify(rename_results)
