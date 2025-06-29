import os
import re
import subprocess
import tempfile
import json
from io import BytesIO
from PIL import Image
from config import EXIFTOOL_PATH
from app.services.settings_service import get_setting


def dms_to_dd(dms: str, ref: str) -> float | None:
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


def run_exiftool_command(args_list: list[str]):
    """Executes an ExifTool command using a secure temporary file for arguments."""
    arg_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", delete=False, encoding="utf-8", suffix=".txt"
        ) as f:
            f.write("\n".join(args_list))
            arg_file_path = f.name

        command = [EXIFTOOL_PATH, "-overwrite_original", "-@", arg_file_path]
        subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
    finally:
        if arg_file_path and os.path.exists(arg_file_path):
            os.remove(arg_file_path)


def build_exiftool_args(form_data: dict) -> list[str]:
    args = []
    field_map = {
        "Author": ["-XMP:Creator", "-IPTC:By-line", "-EXIF:Artist"],
        "Caption": [
            "-XMP:Description",
            "-IPTC:Caption-Abstract",
            "-EXIF:ImageDescription",
        ],
    }

    for form_key, exif_tags in field_map.items():
        if form_key in form_data:
            value = str(form_data[form_key]).strip()
            for tag in exif_tags:
                args.append(f"{tag}=")
            if value:
                for tag in exif_tags:
                    args.append(f"{tag}={value}")

    if "Keywords" in form_data and isinstance(form_data.get("Keywords"), list):
        args.extend(["-XMP:Subject=", "-IPTC:Keywords="])
        for keyword in form_data["Keywords"]:
            if str(keyword).strip():
                args.extend([f"-XMP:Subject={keyword}", f"-IPTC:Keywords={keyword}"])

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
        if tag in form_data:
            value = str(form_data[tag]).strip()
            args.append(f"-{tag}=")
            if value:
                args.append(f"-{tag}={value}")

    if "DecimalLatitude" in form_data and "DecimalLongitude" in form_data:
        try:
            lat, lon = float(form_data["DecimalLatitude"]), float(
                form_data["DecimalLongitude"]
            )
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


def get_image_data(file_path: str) -> tuple[bytes | None, str | None]:
    """
    Extracts binary image data, handling RAW previews and rotation transparently.
    Returns a tuple of (image_bytes, mime_type), or (None, None) on failure.
    """
    if not os.path.isfile(file_path):
        return None, None

    _, extension = os.path.splitext(file_path.lower())

    mime_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".tiff": "image/tiff",
    }

    if extension in mime_types:
        try:
            with open(file_path, "rb") as f:
                return f.read(), mime_types[extension]
        except IOError:
            return None, None

    raw_extensions = get_setting("powerUser.rawExtensions", [])
    if extension in raw_extensions:
        try:
            # First, extract the preview image bytes.
            preview_command = [EXIFTOOL_PATH, "-PreviewImage", "-b", file_path]
            preview_result = subprocess.run(
                preview_command, capture_output=True, check=True
            )
            if not preview_result.stdout:
                return None, None

            # Next, get the orientation tag from the file.
            # Using -n gets the numerical value, -j gets JSON for easy parsing.
            orientation_command = [EXIFTOOL_PATH, "-Orientation", "-n", "-j", file_path]
            orientation_result = subprocess.run(
                orientation_command, capture_output=True, check=True, text=True
            )
            orientation_data = json.loads(orientation_result.stdout)
            orientation = orientation_data[0].get("Orientation", 1)

            # If orientation is 1 (Normal), no rotation is needed.
            # This is an important optimization to avoid unnecessary processing.
            if orientation == 1:
                return preview_result.stdout, "image/jpeg"

            image = Image.open(BytesIO(preview_result.stdout))

            # Apply the correct rotation based on the EXIF orientation value.
            orientation_map = {
                3: Image.Transpose.ROTATE_180,
                6: Image.Transpose.ROTATE_270,  # Rotated 90 deg CW
                8: Image.Transpose.ROTATE_90,  # Rotated 270 deg CW
            }

            if orientation in orientation_map:
                image = image.transpose(orientation_map[orientation])

            # Save the rotated image to a byte buffer to send in the response.
            byte_buffer = BytesIO()
            image.save(byte_buffer, format="JPEG")
            return byte_buffer.getvalue(), "image/jpeg"

        except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
            return None, None

    return None, None
