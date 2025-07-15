import os
import re
import subprocess
import json
from datetime import datetime
from config import EXIFTOOL_PATH


def generate_filename_from_pattern(
    file_path: str, pattern: str
) -> tuple[str | None, str | None]:
    """
    Generates a new filename base from metadata based on a pattern.
    Returns (new_base_name, error_message).
    """
    if not os.path.isfile(file_path):
        return None, "Error: Not a file"

    if not pattern:
        return None, "Error: No rename pattern configured"

    try:
        placeholders = re.findall(r"\$\{(.*?)(?::(.*?))?\}", pattern)
        if not placeholders:
            return None, "Error: Pattern contains no valid metadata tags"

        requested_tags = list(set([p[0] for p in placeholders]))

        command = [EXIFTOOL_PATH, "-json", "-s"]
        for tag in requested_tags:
            command.append(f"-{tag}")
        command.append(file_path)

        result = subprocess.run(command, capture_output=True, check=True)
        metadata = json.loads(result.stdout.decode("utf-8"))[0]

        for tag in requested_tags:
            if tag not in metadata:
                return None, f"Error: File is missing tag '{tag}'"

        new_filename_base = pattern
        for tag_name, format_str in placeholders:
            placeholder = (
                f"${{{tag_name}:{format_str}}}" if format_str else f"${{{tag_name}}}"
            )
            raw_value = str(metadata.get(tag_name, ""))
            replacement_value = raw_value
            if format_str and tag_name == "DateTimeOriginal":
                try:
                    dt_obj = datetime.strptime(raw_value, "%Y:%m:%d %H:%M:%S")
                    replacement_value = dt_obj.strftime(format_str)
                except ValueError:
                    replacement_value = raw_value

            new_filename_base = new_filename_base.replace(
                placeholder, replacement_value
            )

        sanitized_base = re.sub(r'[\\/*?:"<>|]', "", new_filename_base).replace(
            " ", "_"
        )
        return sanitized_base, None
    except subprocess.CalledProcessError:
        return None, "Error: Invalid tag in pattern"
    except Exception as e:
        return None, f"Error: {e}"
