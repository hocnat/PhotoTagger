import os
import subprocess
import tempfile
import json
from io import BytesIO
from datetime import datetime
from PIL import Image
import mimetypes
from config import EXIFTOOL_PATH, EXIFTOOL_CONFIG_PATH
from app.services.settings_service import get_setting

TAG_MAP = {
    "Title": {"tag": "-Title", "handler": "simple"},
    "Keywords": {"tag": "-Keywords", "handler": "list"},
    "GPSPosition": {"tag": "-GPSPosition", "read_format": "#", "handler": "simple"},
    "Location": {"tag": "-Location", "handler": "simple"},
    "City": {"tag": "-City", "handler": "simple"},
    "State": {"tag": "-State", "handler": "simple"},
    "Country": {"tag": "-Country", "handler": "simple"},
    "CountryCode": {"tag": "-CountryCode", "handler": "simple"},
    "CreateDate": {"tag": "-CreateDate", "read_format": "#", "handler": "simple"},
    "OffsetTimeOriginal": {
        "tag": "-OffsetTimeOriginal",
        "read_format": "#",
        "handler": "simple",
    },
    "GPSDateTime": {"tag": "-GPSDateTime", "read_format": "#", "handler": "readonly"},
    "TimeZone": {"tag": "-TimeZone", "read_format": "#", "handler": "readonly"},
    "Creator": {"tag": "-Creator", "handler": "simple"},
    "Copyright": {"tag": "-Copyright", "handler": "simple"},
}


def calculate_offset_from_gps(
    create_date_str: str, gps_date_time_str: str
) -> str | None:
    """Calculates the timezone offset from local and UTC time strings."""
    try:
        local_time = datetime.strptime(create_date_str, "%Y:%m:%d %H:%M:%S")
        if gps_date_time_str.endswith("Z"):
            iso_utc_str = gps_date_time_str.replace(":", "-", 2).replace("Z", "+00:00")
            utc_time = datetime.fromisoformat(iso_utc_str)
        else:
            return None

        time_difference = local_time - utc_time.replace(tzinfo=None)
        total_seconds = time_difference.total_seconds()

        minutes, _ = divmod(total_seconds, 60)
        hours, minutes = divmod(minutes, 60)

        return f"{int(hours):+03d}:{int(abs(minutes)):02d}"
    except (ValueError, TypeError):
        return None


def calculate_offset_from_makernotes(tz_minutes_val: int | str) -> str | None:
    """Calculates the timezone offset from the camera's internal TimeZone setting."""
    try:
        total_minutes = int(tz_minutes_val)
        hours, minutes = divmod(total_minutes, 60)
        return f"{int(hours):+03d}:{int(abs(minutes)):02d}"
    except (ValueError, TypeError):
        return None


def read_metadata_for_files(file_paths: list[str]) -> list[dict]:
    """
    Reads metadata and intelligently calculates missing timezone offsets
    using a multi-tiered fallback system.
    """
    if not file_paths:
        return []

    try:
        tags_to_read = [
            details["tag"] + details.get("read_format", "")
            for details in TAG_MAP.values()
        ]
        command = [EXIFTOOL_PATH, "-config", EXIFTOOL_CONFIG_PATH, "-j", "-n"]
        command.extend(tags_to_read)
        command.extend(file_paths)

        result = subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
        data = json.loads(result.stdout)

        reverse_tag_map = {
            v["tag"].replace("-", "").replace("#", ""): k for k, v in TAG_MAP.items()
        }

        processed_data = []
        for item in data:
            normalized_item = {}
            for exif_key, value in item.items():
                app_key = reverse_tag_map.get(exif_key)
                if app_key:
                    normalized_item[app_key] = value

            if "Keywords" in normalized_item and not isinstance(
                normalized_item["Keywords"], list
            ):
                normalized_item["Keywords"] = [normalized_item["Keywords"]]

            if "GPSPosition" in normalized_item and isinstance(
                normalized_item["GPSPosition"], str
            ):
                normalized_item["GPSPosition"] = normalized_item["GPSPosition"].replace(
                    " ", ", ", 1
                )

            if not normalized_item.get("OffsetTimeOriginal"):
                offset = None
                if "CreateDate" in normalized_item and "GPSDateTime" in normalized_item:
                    offset = calculate_offset_from_gps(
                        normalized_item["CreateDate"], normalized_item["GPSDateTime"]
                    )
                elif "TimeZone" in normalized_item:
                    offset = calculate_offset_from_makernotes(
                        normalized_item["TimeZone"]
                    )

                if offset:
                    normalized_item["CalculatedOffsetTimeOriginal"] = offset

            for app_key, details in TAG_MAP.items():
                if details.get("handler") == "readonly":
                    normalized_item.pop(app_key, None)

            if "SourceFile" in item:
                normalized_item["SourceFile"] = item["SourceFile"]
            processed_data.append(normalized_item)

        return processed_data
    except (subprocess.CalledProcessError, json.JSONDecodeError, FileNotFoundError):
        return []


def run_exiftool_command(args_list: list[str]):
    """Executes an ExifTool command using a secure temporary file for arguments."""
    arg_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", delete=False, encoding="utf-8", suffix=".txt"
        ) as f:
            f.write("\n".join(args_list))
            arg_file_path = f.name

        command = [
            EXIFTOOL_PATH,
            "-config",
            EXIFTOOL_CONFIG_PATH,
            "-overwrite_original",
            "-@",
            arg_file_path,
        ]
        subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
    finally:
        if arg_file_path and os.path.exists(arg_file_path):
            os.remove(arg_file_path)


def build_exiftool_args(form_data: dict) -> list[str]:
    """
    Builds a list of ExifTool arguments from a dictionary of metadata using a
    declarative, handler-based approach.
    """
    args = []

    for app_key, value in form_data.items():
        details = TAG_MAP.get(app_key)
        if not details:
            continue

        handler = details.get("handler")

        if handler == "simple":
            tag = details["tag"]
            args.append(f"{tag}={str(value).strip()}")

        elif handler == "list":
            if isinstance(value, list):
                tag = details["tag"]
                args.append(f"{tag}=")
                for item in value:
                    item_str = str(item).strip()
                    if item_str:
                        args.append(f"{tag}+={item_str}")

    return args


def get_image_data(file_path: str) -> tuple[bytes | None, str | None]:
    """
    Extracts and correctly orients image data for any supported file type.
    """
    if not os.path.isfile(file_path):
        return None, None

    _, extension = os.path.splitext(file_path.lower())
    raw_extensions = get_setting("powerUser.rawExtensions", [])
    image_bytes = None
    mime_type = None

    try:
        if extension in raw_extensions:
            preview_command = [
                EXIFTOOL_PATH,
                "-config",
                EXIFTOOL_CONFIG_PATH,
                "-PreviewImage",
                "-b",
                file_path,
            ]
            result = subprocess.run(preview_command, capture_output=True, check=True)
            image_bytes = result.stdout
            mime_type = "image/jpeg"
        else:
            with open(file_path, "rb") as f:
                image_bytes = f.read()
            mime_type, _ = mimetypes.guess_type(file_path)

        if not image_bytes:
            return None, None

        orientation_command = [
            EXIFTOOL_PATH,
            "-config",
            EXIFTOOL_CONFIG_PATH,
            "-j",
            "-n",
            "-Orientation",
            file_path,
        ]
        orientation_result = subprocess.run(
            orientation_command, capture_output=True, check=True, text=True
        )
        orientation_data = json.loads(orientation_result.stdout)
        orientation = orientation_data[0].get("Orientation", 1)

        if orientation == 1:
            return image_bytes, mime_type

        image = Image.open(BytesIO(image_bytes))
        orientation_map = {
            3: Image.Transpose.ROTATE_180,
            6: Image.Transpose.ROTATE_270,
            8: Image.Transpose.ROTATE_90,
        }
        if orientation in orientation_map:
            image = image.transpose(orientation_map[orientation])

        byte_buffer = BytesIO()
        image.save(byte_buffer, format="JPEG")
        return byte_buffer.getvalue(), "image/jpeg"

    except Exception:
        return None, None
