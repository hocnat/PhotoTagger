import os
import subprocess
import json
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from app.services.exif_service import (
    EXIFTOOL_PATH,
    dms_to_dd,
    build_exiftool_args,
    run_exiftool_command,
)
from app.services.favorites_service import (
    load_favorites,
    save_favorites,
)

metadata_bp = Blueprint("metadata_bp", __name__)


@metadata_bp.route("/metadata", methods=["POST"])
def get_metadata_batch():
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "File list is required"}), 400

    image_paths = data["files"]
    results = []

    for image_path in image_paths:
        filename = os.path.basename(image_path)
        if not os.path.isfile(image_path):
            results.append(
                {"filename": filename, "metadata": {"error": "File not found"}}
            )
            continue
        try:
            command = [EXIFTOOL_PATH, "-json", "-G", "-charset", "UTF8", image_path]
            result = subprocess.run(command, capture_output=True, check=True)
            metadata = json.loads(result.stdout.decode("utf-8"))[0]

            keywords = metadata.get("XMP:Subject", metadata.get("IPTC:Keywords", []))
            metadata["Keywords"] = (
                [keywords] if not isinstance(keywords, list) else keywords
            )
            metadata["Author"] = metadata.get(
                "XMP:Creator",
                metadata.get("IPTC:By-line", metadata.get("EXIF:Artist", "")),
            )
            metadata["Caption"] = metadata.get(
                "XMP:Description",
                metadata.get(
                    "IPTC:Caption-Abstract", metadata.get("EXIF:ImageDescription", "")
                ),
            )

            if "EXIF:GPSLatitude" in metadata and "EXIF:GPSLatitudeRef" in metadata:
                metadata["DecimalLatitude"] = dms_to_dd(
                    metadata["EXIF:GPSLatitude"], metadata["EXIF:GPSLatitudeRef"]
                )
            if "EXIF:GPSLongitude" in metadata and "EXIF:GPSLongitudeRef" in metadata:
                metadata["DecimalLongitude"] = dms_to_dd(
                    metadata["EXIF:GPSLongitude"], metadata["EXIF:GPSLongitudeRef"]
                )

            results.append({"filename": filename, "metadata": metadata})
        except Exception:
            results.append(
                {"filename": filename, "metadata": {"error": "Failed to read metadata"}}
            )

    return jsonify(results)


@metadata_bp.route("/save_metadata", methods=["POST"])
def save_metadata():
    data = request.get_json()
    if not data or "files_to_update" not in data:
        return jsonify({"error": "Invalid request"}), 400

    files_to_update = data["files_to_update"]
    keywords_to_learn = data.get("keywords_to_learn", [])

    if keywords_to_learn:
        favorites = load_favorites()
        keyword_favs = favorites.get("keywords", {})
        for kw in keywords_to_learn:
            if isinstance(kw, str) and (clean_kw := kw.strip()):
                entry = keyword_favs.get(clean_kw, {"usageCount": 0})
                entry["usageCount"] += 1
                entry["lastUsed"] = datetime.now(timezone.utc).isoformat()
                keyword_favs[clean_kw] = entry
        favorites["keywords"] = keyword_favs
        save_favorites(favorites)

    try:
        for file_update in files_to_update:
            args = build_exiftool_args(file_update["metadata"])
            if args:
                run_exiftool_command(args + [file_update["path"]])
        return jsonify({"message": "Metadata saved successfully"})
    except Exception as e:
        stderr = getattr(e, "stderr", b"").decode("utf-8", "ignore").strip()
        return (
            jsonify({"error": "ExifTool failed to save", "details": stderr or str(e)}),
            500,
        )


@metadata_bp.route("/suggestions")
def get_suggestions():
    query = request.args.get("q", "").lower()
    favorites = load_favorites()
    keywords = favorites.get("keywords", {})
    if not query:
        suggestions = sorted(
            keywords, key=lambda k: keywords[k].get("lastUsed", ""), reverse=True
        )
        return jsonify(suggestions[:10])
    return jsonify([k for k in keywords if k.lower().startswith(query)])
