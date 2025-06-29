import os
import re
import subprocess
import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from config import EXIFTOOL_PATH
from app.services.settings_service import get_setting

tools_bp = Blueprint("tools_bp", __name__)


def _generate_new_filename(old_path: str) -> tuple[str | None, str | None, str]:
    if not os.path.isfile(old_path):
        return None, None, "Error: Not a file"

    pattern = get_setting("renameSettings.pattern")
    if not pattern:
        return None, None, "Error: No rename pattern configured in settings"

    try:
        # 1. Parse the pattern to find all tags and optional format specifiers.
        # This regex captures 'TagName' and optional ':FormatString'
        placeholders = re.findall(r"\$\{(.*?)(?::(.*?))?\}", pattern)
        if not placeholders:
            return None, None, "Error: Pattern contains no valid metadata tags"

        # Extract unique tag names to fetch from ExifTool.
        requested_tags = list(set([p[0] for p in placeholders]))

        # 2. Dynamically build the ExifTool command.
        command = [EXIFTOOL_PATH, "-json", "-s"]
        for tag in requested_tags:
            command.append(f"-{tag}")
        command.append(old_path)

        result = subprocess.run(command, capture_output=True, check=True)
        metadata = json.loads(result.stdout.decode("utf-8"))[0]

        # 3. Validate that all requested tags were found in the file.
        for tag in requested_tags:
            if tag not in metadata:
                return None, None, f"Error: File is missing tag '{tag}'"

        # 4. Iteratively substitute placeholders.
        new_filename_base = pattern
        for tag_name, format_str in placeholders:
            placeholder = (
                f"${{{tag_name}:{format_str}}}" if format_str else f"${{{tag_name}}}"
            )
            raw_value = str(metadata.get(tag_name, ""))

            replacement_value = raw_value
            if format_str:
                try:
                    # Attempt to parse as a standard EXIF date/time.
                    dt_obj = datetime.strptime(raw_value, "%Y:%m:%d %H:%M:%S")
                    replacement_value = dt_obj.strftime(format_str)
                except ValueError:
                    # If it's not a date or fails to format, use the raw value.
                    # This prevents errors if a user tries to format a non-date tag.
                    replacement_value = raw_value

            new_filename_base = new_filename_base.replace(
                placeholder, replacement_value
            )

        # 5. Sanitize the final string.
        new_filename_base = re.sub(r'[\\/*?:"<>|]', "", new_filename_base).replace(
            " ", "_"
        )

        # --- Casing and Collision Handling ---
        extension_rules = {
            rule["extension"]: rule["casing"]
            for rule in get_setting("renameSettings.extensionRules", [])
        }
        directory, old_filename = os.path.split(old_path)
        _, ext_base = os.path.splitext(old_filename)

        casing = extension_rules.get(ext_base.lower(), "lowercase")
        extension = ext_base.upper() if casing == "uppercase" else ext_base.lower()

        new_path = os.path.join(directory, f"{new_filename_base}{extension}")
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
    except subprocess.CalledProcessError:
        return None, None, "Error: Invalid tag in pattern"
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
        _, old_filename = os.path.split(old_path)
        _, new_filename, status = _generate_new_filename(old_path)
        if status == "Success" or status == "Skipped":
            preview_results.append({"original": old_filename, "new": new_filename})
        else:
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
        _, old_filename = os.path.split(old_path)
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
