import os
import subprocess
import json
import re
import tempfile
from datetime import datetime, timezone
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# --- App Setup ---
app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# --- Constants ---
EXIFTOOL_PATH = "exiftool"
FAVORITES_PATH = os.path.join(os.path.dirname(__file__), "favorites.json")


# --- Helper Functions ---
def dms_to_dd(dms, ref):
    """Converts a DMS-formatted string to a Decimal Degrees float."""
    try:
        parts = re.findall(r"(\d+\.?\d*)", str(dms))
        degrees = float(parts[0]) if len(parts) > 0 else 0
        minutes = float(parts[1]) if len(parts) > 1 else 0
        seconds = float(parts[2]) if len(parts) > 2 else 0
        dd = degrees + minutes / 60.0 + seconds / 3600.0
        if ref in ["S", "W"]:
            dd *= -1
        return dd
    except (ValueError, IndexError):
        return None


def load_favorites():
    """Loads favorites from JSON, or creates a default structure."""
    if not os.path.exists(FAVORITES_PATH):
        return {"keywords": {}}
    try:
        with open(FAVORITES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"keywords": {}}


def save_favorites(data):
    """Saves the favorites data to the JSON file."""
    with open(FAVORITES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# --- API Routes ---


@app.route("/api/images")
def list_images():
    """Returns a list of image filenames from a given folder path."""
    folder_path = request.args.get("folder")
    if not folder_path or not os.path.isdir(folder_path):
        return jsonify({"error": "Folder not found or not specified"}), 404
    try:
        supported_extensions = (
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".tiff",
            ".cr2",
        )
        image_files = [
            f
            for f in os.listdir(folder_path)
            if f.lower().endswith(supported_extensions)
        ]
        return jsonify(image_files)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/image_data")
def get_image_data():
    """Serves the raw binary data for a single image file."""
    image_path = request.args.get("path")
    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": "Image not found at path"}), 404
    try:
        directory, filename = os.path.split(image_path)
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/metadata")
def get_metadata():
    """Reads all metadata, consolidating key fields for the frontend."""
    image_path = request.args.get("path")
    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": "Image not found at path"}), 404
    try:
        command = [EXIFTOOL_PATH, "-json", "-G", "-charset", "UTF8", image_path]
        result = subprocess.run(command, capture_output=True, check=True)
        metadata = json.loads(result.stdout.decode("utf-8"))[0]

        metadata["Keywords"] = metadata.get(
            "XMP:Subject", metadata.get("IPTC:Keywords", [])
        )
        if not isinstance(metadata["Keywords"], list):
            metadata["Keywords"] = [metadata["Keywords"]]

        metadata["Author"] = metadata.get(
            "XMP:Creator", metadata.get("IPTC:By-line", metadata.get("EXIF:Artist", ""))
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

        return jsonify(metadata)
    except Exception as e:
        stderr = getattr(e, "stderr", b"").decode("utf-8", errors="ignore")
        return (
            jsonify({"error": "Failed to read metadata", "details": stderr or str(e)}),
            500,
        )


@app.route("/api/save_metadata", methods=["POST"])
def save_metadata():
    """Saves metadata to files and updates the favorites list."""
    data = request.get_json()
    if not data or "files" not in data or "metadata" not in data:
        return jsonify({"error": "Invalid request data"}), 400

    image_paths = data["files"]
    form_data = data["metadata"]

    # --- Update keyword usage history (learning) ---
    if "Keywords" in form_data and isinstance(form_data.get("Keywords"), list):
        favorites = load_favorites()
        keyword_favs = favorites.get("keywords", {})
        for keyword in form_data["Keywords"]:
            if isinstance(keyword, str) and (clean_keyword := keyword.strip()):
                entry = keyword_favs.get(clean_keyword, {"usageCount": 0})
                entry["usageCount"] += 1
                entry["lastUsed"] = datetime.now(timezone.utc).isoformat()
                keyword_favs[clean_keyword] = entry
        favorites["keywords"] = keyword_favs
        save_favorites(favorites)

    # --- Prepare arguments for ExifTool ---
    args_for_file = []

    # Define mappings from our clean frontend fields to one or more real ExifTool tags
    tag_map = {
        "Author": ["-XMP:Creator", "-IPTC:By-line", "-EXIF:Artist"],
        "Caption": [
            "-XMP:Description",
            "-IPTC:Caption-Abstract",
            "-EXIF:ImageDescription",
        ],
        "Keywords": ["-XMP:Subject", "-IPTC:Keywords"],
    }

    for form_key, exif_tags in tag_map.items():
        if form_key in form_data and form_data[form_key] != "(Mixed Values)":
            value = form_data[form_key]
            for tag in exif_tags:
                args_for_file.append(f"{tag}=")  # Clear existing tag
            if value:
                if isinstance(value, list):
                    for item in value:
                        if str(item).strip():
                            for tag in exif_tags:
                                args_for_file.append(f"{tag}={str(item).strip()}")
                else:
                    for tag in exif_tags:
                        args_for_file.append(f"{tag}={str(value).strip()}")

    # Handle simple, direct-mapped tags
    simple_tags = [
        "EXIF:DateTimeOriginal",
        "EXIF:OffsetTimeOriginal",
        "XMP:Country",
        "XMP:State",
        "XMP:City",
        "XMP:Location",
        "XMP:CountryCode",
    ]
    for tag in simple_tags:
        if tag in form_data and form_data[tag] != "(Mixed Values)":
            value = str(form_data[tag]).strip()
            args_for_file.append(f"-{tag}=")
            if value:
                args_for_file.append(f"-{tag}={value}")

    # Handle special GPS logic
    if "DecimalLatitude" in form_data and "DecimalLongitude" in form_data:
        try:
            lat, lon = float(form_data["DecimalLatitude"]), float(
                form_data["DecimalLongitude"]
            )
            args_for_file.extend(
                [
                    f"-EXIF:GPSLatitude={abs(lat)}",
                    f"-EXIF:GPSLatitudeRef={'N' if lat >= 0 else 'S'}",
                    f"-EXIF:GPSLongitude={abs(lon)}",
                    f"-EXIF:GPSLongitudeRef={'E' if lon >= 0 else 'W'}",
                ]
            )
        except (ValueError, TypeError):
            pass

    if not args_for_file:
        return jsonify({"message": "No changes to save"})

    # --- Use a temporary file to pass arguments securely ---
    arg_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", delete=False, encoding="utf-8", suffix=".txt"
        ) as f:
            f.write("\n".join(args_for_file))
            arg_file_path = f.name

        command = [
            EXIFTOOL_PATH,
            "-overwrite_original",
            "-@",
            arg_file_path,
        ] + image_paths
        subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
        return jsonify({"message": "Metadata saved successfully"})
    except Exception as e:
        stderr = getattr(e, "stderr", "").strip()
        return (
            jsonify({"error": "ExifTool failed to save", "details": stderr or str(e)}),
            500,
        )
    finally:
        if arg_file_path and os.path.exists(arg_file_path):
            os.remove(arg_file_path)


@app.route("/api/suggestions")
def get_suggestions():
    """Provides keyword suggestions for the frontend's autocomplete field."""
    query = request.args.get("q", "").lower()
    favorites = load_favorites()
    keywords = favorites.get("keywords", {})
    if not query:
        suggestions = sorted(
            keywords, key=lambda k: keywords[k].get("lastUsed", ""), reverse=True
        )
        return jsonify(suggestions[:10])
    suggestions = [k for k in keywords if k.lower().startswith(query)]
    return jsonify(suggestions)


@app.route("/api/rename_files", methods=["POST"])
def rename_files():
    """Renames files based on their metadata (YYYYMMDD_HHmmSS_Caption.ext)."""
    data = request.get_json()
    if not data or "files" not in data:
        return jsonify({"error": "Invalid request data"}), 400

    image_paths = data["files"]
    rename_results = []

    for old_path in image_paths:
        if not os.path.isfile(old_path):
            rename_results.append(
                {"original": old_path, "new": old_path, "status": "Error: Not a file"}
            )
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

            datetime_original_str = metadata.get("DateTimeOriginal")
            caption = metadata.get("Description", "untitled")

            if not datetime_original_str:
                rename_results.append(
                    {
                        "original": old_path,
                        "new": old_path,
                        "status": "Error: No DateTimeOriginal found",
                    }
                )
                continue

            try:
                dt_object = datetime.strptime(
                    datetime_original_str, "%Y:%m:%d %H:%M:%S"
                )
                timestamp_str = dt_object.strftime("%Y%m%d_%H%M%S")
            except ValueError:
                timestamp_str = datetime_original_str.split(" ")[0].replace(":", "")

            safe_caption = re.sub(r'[\\/*?:"<>|]', "", caption).replace(" ", "_")

            directory, old_filename = os.path.split(old_path)
            original_ext = os.path.splitext(old_filename)[1]
            extension = (
                original_ext.upper()
                if original_ext.lower() == ".cr2"
                else original_ext.lower()
            )

            new_filename_base = f"{timestamp_str}_{safe_caption}"
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
                    {
                        "original": old_filename,
                        "new": old_filename,
                        "status": "Skipped (already named correctly)",
                    }
                )
        except Exception as e:
            rename_results.append(
                {"original": old_path, "new": old_path, "status": f"Error: {e}"}
            )

    return jsonify(rename_results)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
