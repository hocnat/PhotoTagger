import os
import subprocess
import tempfile
import json
from io import BytesIO
from datetime import datetime
from PIL import Image
import mimetypes
from config import EXIFTOOL_PATH
from app.services.settings_service import get_setting

TAG_MAP = {
    "Title": {
        "sources": {"XMP-dc:Title": {"write_mode": "always"}},
        "handler": "simple",
    },
    "Keywords": {
        "sources": {"XMP-dc:Subject": {"write_mode": "always"}},
        "handler": "list",
    },
    "LatitudeCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLatitude": {"write_mode": "always"},
            "XMP-exif:GPSLatitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLongitude": {"write_mode": "always"},
            "XMP-exif:GPSLongitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedProvinceState": {"write_mode": "always"}
        },
        "handler": "simple",
    },
    "CountryCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
    "LatitudeShown": {
        "sources": {
            "XMP-iptcExt:LocationShownGPSLatitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeShown": {
        "sources": {
            "XMP-iptcExt:LocationShownGPSLongitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationShown": {
        "sources": {"XMP-iptcExt:LocationShownSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityShown": {
        "sources": {"XMP-iptcExt:LocationShownCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateShown": {
        "sources": {"XMP-iptcExt:LocationShownProvinceState": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryShown": {
        "sources": {"XMP-iptcExt:LocationShownCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeShown": {
        "sources": {"XMP-iptcExt:LocationShownCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
    "DateTimeOriginal": {
        "sources": {
            "XMP-dc:Date": {"write_mode": "always"},
            "ExifIFD:DateTimeOriginal": {"write_mode": "always"},
            "ExifIFD:CreateDate": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "OffsetTimeOriginal": {
        "sources": {
            "ExifIFD:OffsetTimeOriginal": {"write_mode": "always"},
            "Canon:TimeZone": {
                "write_mode": "if_exists",
                "value_handler": "minutes_hhmm",
            },
        },
        "read_format": "#",
        "handler": "simple",
    },
    "Creator": {
        "sources": {
            "XMP-dc:Creator": {"write_mode": "always"},
            "IFD0:Artist": {"write_mode": "always"},
        },
        "handler": "simple",
    },
    "Copyright": {
        "sources": {
            "XMP-dc:Rights": {"write_mode": "always"},
            "IFD0:Copyright": {"write_mode": "always"},
        },
        "handler": "simple",
    },
}


def _read_minutes_to_hhmm(value: int | str) -> str:
    try:
        total_minutes = int(value)
        hours, minutes = divmod(total_minutes, 60)
        return f"{int(hours):+03d}:{int(abs(minutes)):02d}"
    except (ValueError, TypeError):
        return ""


def _write_hhmm_to_minutes(value: str) -> int | None:
    try:
        if ":" in str(value):
            h, m = map(int, str(value).split(":"))
            return (h * 60) + (m if h >= 0 else -m)
        return int(value)
    except (ValueError, TypeError):
        return None


VALUE_HANDLERS = {
    "minutes_hhmm": {"read": _read_minutes_to_hhmm, "write": _write_hhmm_to_minutes}
}


def process_metadata_field(exif_data: dict, sources_details: dict) -> dict:
    present_values, primary_value = {}, None
    source_tags = list(sources_details.keys())
    for tag in source_tags:
        if tag in exif_data:
            value = exif_data[tag]
            present_values[tag] = value
            if primary_value is None:
                primary_value = value
    if not present_values:
        return {"value": None, "isConsolidated": True}
    if not primary_value:
        return {"value": primary_value, "isConsolidated": True}
    mandatory_sources = [
        tag
        for tag, details in sources_details.items()
        if details.get("write_mode") == "always"
    ]
    all_mandatory_are_present = all(tag in present_values for tag in mandatory_sources)
    all_values_are_same = len(set(str(v) for v in present_values.values())) == 1
    return {
        "value": primary_value,
        "isConsolidated": all_mandatory_are_present and all_values_are_same,
    }


def read_metadata_for_files(file_paths: list[str]) -> list[dict]:
    if not file_paths:
        return []
    try:
        all_source_tags = [
            tag
            for details in TAG_MAP.values()
            for tag in details.get("sources", {}).keys()
        ]
        command = [EXIFTOOL_PATH, "-j", "-G1", "-n", "-a"]
        command.extend(list(set([f"-{tag}" for tag in all_source_tags])))
        command.extend(file_paths)
        result = subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
        raw_data_list = json.loads(result.stdout)
        processed_data = []
        for raw_item in raw_data_list:
            final_item = {"original": raw_item}
            transformed_raw_item = raw_item.copy()
            for details in TAG_MAP.values():
                for source_tag, source_details in details.get("sources", {}).items():
                    handler_name = source_details.get("value_handler")
                    if handler_name and source_tag in transformed_raw_item:
                        read_func = VALUE_HANDLERS.get(handler_name, {}).get("read")
                        if read_func:
                            transformed_raw_item[source_tag] = read_func(
                                transformed_raw_item[source_tag]
                            )
            for app_key, details in TAG_MAP.items():
                sources = details.get("sources")
                if sources:
                    final_item[app_key] = process_metadata_field(
                        transformed_raw_item, sources
                    )
            offset_field = final_item.get("OffsetTimeOriginal")
            if offset_field and not offset_field.get("value"):
                canon_tz_tag, handler_details = next(
                    (
                        (tag, d)
                        for tag, d in TAG_MAP["OffsetTimeOriginal"]["sources"].items()
                        if d.get("write_mode") == "if_exists"
                    ),
                    (None, None),
                )
                if canon_tz_tag and canon_tz_tag in raw_item and handler_details:
                    handler_name = handler_details.get("value_handler")
                    if handler_name:
                        read_func = VALUE_HANDLERS.get(handler_name, {}).get("read")
                        if read_func:
                            offset = read_func(raw_item[canon_tz_tag])
                            if offset:
                                offset_field["value"] = offset
                                offset_field["isConsolidated"] = False
            keywords_field = final_item.get("Keywords")
            if keywords_field and isinstance(keywords_field.get("value"), str):
                keywords_field["value"] = [keywords_field["value"]]
            elif keywords_field and keywords_field.get("value") is None:
                keywords_field["value"] = []
            if "SourceFile" in raw_item:
                final_item["SourceFile"] = raw_item["SourceFile"]
            processed_data.append(final_item)
        return processed_data
    except (subprocess.CalledProcessError, json.JSONDecodeError, FileNotFoundError):
        return []


def build_exiftool_args(original_metadata: dict, new_metadata: dict) -> list[str]:
    """
    Builds arguments using a declarative, handler-based approach.
    """
    args = []
    for app_key, new_value in new_metadata.items():
        details = TAG_MAP.get(app_key)
        if not details:
            continue
        handler = details.get("handler", "simple")
        sources = details.get("sources", {})

        for source_tag, source_details in sources.items():
            write_mode = source_details.get("write_mode", "always")
            if (write_mode == "always") or (
                write_mode == "if_exists" and source_tag in original_metadata
            ):
                value_to_write = new_value
                handler_name = source_details.get("value_handler")
                if handler_name:
                    write_func = VALUE_HANDLERS.get(handler_name, {}).get("write")
                    if write_func:
                        converted_value = write_func(new_value)
                        if converted_value is not None:
                            value_to_write = converted_value

                if handler == "list":
                    if isinstance(value_to_write, list):
                        args.append(f"-{source_tag}=")
                        for item in value_to_write:
                            item_str = str(item).strip()
                            if item_str:
                                args.append(f"-{source_tag}={item_str}")
                else:
                    args.append(f"-{source_tag}={str(value_to_write).strip()}")
    return args


def run_exiftool_command(args_list: list[str]):
    """Executes an ExifTool command using a secure temporary file for arguments."""
    arg_file_path = None
    try:
        with tempfile.NamedTemporaryFile(
            "w", delete=False, encoding="utf-8", suffix=".txt"
        ) as f:
            f.write("\n".join(args_list))
            arg_file_path = f.name
        command = [EXIFTOOL_PATH, "-overwrite_original", "-m", "-@", arg_file_path]
        subprocess.run(
            command, capture_output=True, check=True, text=True, encoding="utf-8"
        )
    finally:
        if arg_file_path and os.path.exists(arg_file_path):
            os.remove(arg_file_path)


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
            preview_command = [EXIFTOOL_PATH, "-PreviewImage", "-b", file_path]
            result = subprocess.run(preview_command, capture_output=True, check=True)
            image_bytes = result.stdout
            mime_type = "image/jpeg"
        else:
            with open(file_path, "rb") as f:
                image_bytes = f.read()
            mime_type, _ = mimetypes.guess_type(file_path)

        if not image_bytes:
            return None, None
        orientation_command = [EXIFTOOL_PATH, "-j", "-n", "-Orientation", file_path]
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
