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
    """Loads favorites from JSON, creating a default structure if it doesn't exist."""
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


def run_exiftool_command(args_list):
    """Executes an ExifTool command using a secure temporary file for arguments."""
    arg_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", delete=False, encoding="utf-8", suffix=".txt"
        ) as f:
            f.write("\n".join(args_list))
            arg_file_path = f.name

        # The command now includes all image paths at the end of the argument file
        command = [EXIFTOOL_PATH, "-overwrite_original", "-@", arg_file_path]
        subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
    finally:
        if arg_file_path and os.path.exists(arg_file_path):
            os.remove(arg_file_path)


def build_exiftool_args(form_data):
    """Builds a list of ExifTool command-line arguments from form data."""
    args = []

    # Map our clean frontend fields to one or more real ExifTool tags
    field_map = {
        "Author": ["-XMP:Creator", "-IPTC:By-line", "-EXIF:Artist"],
        "Caption": [
            "-XMP:Description",
            "-IPTC:Caption-Abstract",
            "-EXIF:ImageDescription",
        ],
    }

    # Process consolidated fields that overwrite multiple tags
    for form_key, exif_tags in field_map.items():
        if form_key in form_data and form_data[form_key] != "(Mixed Values)":
            value = str(form_data[form_key]).strip()
            for tag in exif_tags:
                args.append(f"{tag}=")
            if value:
                for tag in exif_tags:
                    args.append(f"{tag}={value}")

    # Process Keywords (always a list in overwrite mode)
    if "Keywords" in form_data and isinstance(form_data.get("Keywords"), list):
        args.extend(["-XMP:Subject=", "-IPTC:Keywords="])
        for keyword in form_data["Keywords"]:
            clean_keyword = str(keyword).strip()
            if clean_keyword:
                args.extend(
                    [f"-XMP:Subject={clean_keyword}", f"-IPTC:Keywords={clean_keyword}"]
                )

    # Process simple, direct-mapped tags
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
            args.append(f"-{tag}=")
            if value:
                args.append(f"-{tag}={value}")

    # Process GPS coordinates
    if "DecimalLatitude" in form_data and "DecimalLongitude" in form_data:
        try:
            lat = float(form_data["DecimalLatitude"])
            lon = float(form_data["DecimalLongitude"])
            args.extend(
                [
                    f"-EXIF:GPSLatitude={abs(lat)}",
                    f"-EXIF:GPSLatitudeRef={'N' if lat >= 0 else 'S'}",
                    f"-EXIF:GPSLongitude={abs(lon)}",
                    f"-EXIF:GPSLongitudeRef={'E' if lon >= 0 else 'W'}",
                ]
            )
        except (ValueError, TypeError):
            pass

    return args


# --- API Routes ---


@app.route("/api/images")
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


@app.route("/api/image_data")
def get_image_data():
    image_path = request.args.get("path")
    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": "Image not found"}), 404
    try:
        directory, filename = os.path.split(image_path)
        return send_from_directory(directory, filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/metadata")
def get_metadata():
    image_path = request.args.get("path")
    if not image_path or not os.path.isfile(image_path):
        return jsonify({"error": "Image not found"}), 404
    try:
        command = [EXIFTOOL_PATH, "-json", "-G", "-charset", "UTF8", image_path]
        result = subprocess.run(command, capture_output=True, check=True)
        metadata = json.loads(result.stdout.decode("utf-8"))[0]

        keywords = metadata.get("XMP:Subject", metadata.get("IPTC:Keywords", []))
        metadata["Keywords"] = (
            [keywords] if not isinstance(keywords, list) else keywords
        )

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
    data = request.get_json()

    if not data or "files" not in data or "metadata" not in data:
        return jsonify({"error": "Invalid request"}), 400

    image_paths = data["files"]
    form_data = data["metadata"]
    is_additive = data.get("is_additive_keywords", False)
    keywords_to_add_only = data.get("add_keywords", [])

    # --- Learning Logic ---
    keywords_to_learn = (
        keywords_to_add_only if is_additive else form_data.get("Keywords", [])
    )
    if isinstance(keywords_to_learn, list) and keywords_to_learn:
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
        if is_additive:
            # In additive mode, we only add keywords and overwrite everything else.
            for i, image_path in enumerate(image_paths):
                # Step A: Read existing keywords for this file
                read_cmd = [
                    EXIFTOOL_PATH,
                    "-json",
                    "-G",
                    "-XMP:Subject",
                    "-charset",
                    "UTF8",
                    image_path,
                ]
                result = subprocess.run(read_cmd, capture_output=True, check=True)
                current_meta = json.loads(result.stdout.decode("utf-8"))[0]
                existing_keywords = current_meta.get("XMP:Subject", [])
                if not isinstance(existing_keywords, list):
                    existing_keywords = [existing_keywords]

                # Step B: Combine with new keywords
                final_keywords = list(
                    dict.fromkeys(existing_keywords + keywords_to_add_only)
                )

                # Step C: Build a complete metadata object for this file
                metadata_for_this_file = form_data.copy()
                metadata_for_this_file["Keywords"] = final_keywords

                # Step D: Build arguments and execute for this single file
                args = build_exiftool_args(metadata_for_this_file)
                if args:
                    run_exiftool_command(args + [image_path])
        else:
            # --- OVERWRITE MODE ---
            args = build_exiftool_args(form_data)
            if args:
                run_exiftool_command(args + image_paths)

        return jsonify({"message": "Metadata saved successfully"})

    except Exception as e:
        stderr = getattr(e, "stderr", b"").decode("utf-8", "ignore").strip()
        return (
            jsonify({"error": "ExifTool failed to save", "details": stderr or str(e)}),
            500,
        )


@app.route("/api/suggestions")
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


@app.route("/api/rename_files", methods=["POST"])
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
            name_base, ext_base = os.path.splitext(old_filename)
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
