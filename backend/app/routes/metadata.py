import os
from flask import Blueprint, request, jsonify
from collections import OrderedDict

from app.metadata_schema import TAG_MAP
from app.services.exif_service import (
    read_metadata_for_files,
    build_exiftool_args,
    run_exiftool_command,
)
from app.services.keyword_service import keyword_service

metadata_bp = Blueprint("metadata_bp", __name__)


@metadata_bp.route("/metadata", methods=["POST"])
def get_metadata_batch():
    """
    Handles batch requests for image metadata.
    """
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "File list is required"}), 400

    image_paths = data["files"]
    if not isinstance(image_paths, list) or not image_paths:
        return jsonify([])

    metadata_list = read_metadata_for_files(image_paths)

    results = []
    processed_files = set()
    for metadata in metadata_list:
        source_file = metadata.get("SourceFile")
        if source_file:
            filename = os.path.basename(source_file)
            results.append({"filename": filename, "metadata": metadata})
            processed_files.add(filename)

    for path in image_paths:
        filename = os.path.basename(path)
        if filename not in processed_files:
            results.append(
                {"filename": filename, "metadata": {"error": "Failed to read metadata"}}
            )

    return jsonify(results)


@metadata_bp.route("/save_metadata", methods=["POST"])
def save_metadata():
    """
    Handles saving metadata changes to one or more files.
    """
    data = request.get_json()
    if not data or "files_to_update" not in data:
        return jsonify({"error": "Invalid request"}), 400

    files_to_update = data["files_to_update"]
    keywords_to_learn = data.get("keywords_to_learn", [])

    if keywords_to_learn:
        keyword_service.track_usage(keywords_to_learn)

    try:
        for file_update in files_to_update:
            args = build_exiftool_args(
                file_update["original_metadata"], file_update["new_metadata"]
            )
            if args:
                run_exiftool_command(args + [file_update["path"]])
        return jsonify({"message": "Metadata saved successfully"})
    except Exception as e:
        stderr = getattr(e, "stderr", "").strip()
        error_message = f"ExifTool failed: {stderr}"
        return (
            jsonify({"message": error_message, "details": str(e)}),
            500,
        )


@metadata_bp.route("/metadata-fields", methods=["GET"])
def get_metadata_fields():
    """Returns a list of all application-level metadata field names."""
    return jsonify(list(TAG_MAP.keys()))


@metadata_bp.route("/metadata-schema", methods=["GET"])
def get_metadata_schema():
    """
    Exposes the metadata schema to the frontend as an ORDERED list of groups,
    which in turn contain an ordered list of fields.
    """
    # Use an OrderedDict to maintain the order of groups as they appear in the schema
    groups = OrderedDict()

    for field_name, details in TAG_MAP.items():
        group_name = details.get("group", "Other")
        if group_name not in groups:
            groups[group_name] = []

        groups[group_name].append(
            {
                "key": field_name,
                "label": details.get("label", field_name),
            }
        )

    # Transform the ordered dictionary into the final list structure
    schema_as_list = [
        {"groupName": name, "fields": fields} for name, fields in groups.items()
    ]

    return jsonify(schema_as_list)
