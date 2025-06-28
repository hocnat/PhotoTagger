import os
import re
import subprocess
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.services.exif_service import EXIFTOOL_PATH

tools_bp = Blueprint("tools_bp", __name__)


@tools_bp.route("/rename_files", methods=["POST"])
def rename_files():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request"}), 400

    image_paths = data["files"]
    rename_results = []

    for old_path in image_paths:
        if not os.path.isfile(old_path):
            rename_results.append({"original": old_path, "status": "Error: Not a file"})
            continue
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
                rename_results.append(
                    {"original": old_path, "status": "Error: No DateTimeOriginal"}
                )
                continue

            try:
                dt_obj = datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
                ts_str = dt_obj.strftime("%Y%m%d_%H%M%S")
            except ValueError:
                ts_str = dt_str.split(" ")[0].replace(":", "")

            safe_caption = re.sub(r'[\\/*?:"<>|]', "", caption).replace(" ", "_")
            directory, old_filename = os.path.split(old_path)
            _, ext_base = os.path.splitext(old_filename)
            extension = (
                ext_base.upper() if ext_base.lower() == ".cr2" else ext_base.lower()
            )

            new_filename_base = f"{ts_str}_{safe_caption}"
            new_path = os.path.join(directory, f"{new_filename_base}{extension}")

            counter = 1
            while os.path.exists(new_path) and new_path.lower() != old_path.lower():
                new_path = os.path.join(
                    directory, f"{new_filename_base}_{counter}{extension}"
                )
                counter += 1

            if new_path.lower() != old_path.lower():
                os.rename(old_path, new_path)
                rename_results.append(
                    {
                        "original": old_filename,
                        "new": os.path.basename(new_path),
                        "status": "Renamed",
                    }
                )
            else:
                rename_results.append(
                    {"original": old_filename, "new": old_filename, "status": "Skipped"}
                )
        except Exception as e:
            rename_results.append({"original": old_path, "status": f"Error: {e}"})

    return jsonify(rename_results)
