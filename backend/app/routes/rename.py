import os
from flask import Blueprint, request, jsonify
from app.services.settings_service import get_setting
from app.services.rename_service import generate_filename_from_pattern

rename_bp = Blueprint("rename_bp", __name__)


def _get_new_filename_with_collision_check(old_path: str):
    """
    Internal helper to generate a new filename and handle potential collisions.
    """
    pattern = get_setting("renameSettings.pattern")
    new_filename_base, error = generate_filename_from_pattern(old_path, pattern)

    if error:
        return None, None, error

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
        new_path = os.path.join(directory, f"{new_filename_base}_{counter}{extension}")
        counter += 1

    new_filename = os.path.basename(new_path)
    if new_path.lower() == old_path.lower():
        return new_path, new_filename, "Skipped"
    return new_path, new_filename, "Success"


@rename_bp.route("/preview_rename", methods=["POST"])
def preview_rename():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request"}), 400
    image_paths = data["files"]
    preview_results = []
    for old_path in image_paths:
        _, old_filename = os.path.split(old_path)
        _, new_filename, status = _get_new_filename_with_collision_check(old_path)
        if status == "Success" or status == "Skipped":
            preview_results.append({"original": old_filename, "new": new_filename})
        else:
            preview_results.append({"original": old_filename, "new": f"({status})"})
    return jsonify(preview_results)


@rename_bp.route("/rename_files", methods=["POST"])
def rename_files():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request"}), 400
    image_paths = data["files"]
    rename_results = []
    for old_path in image_paths:
        _, old_filename = os.path.split(old_path)
        new_path, new_filename, status = _get_new_filename_with_collision_check(
            old_path
        )
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
