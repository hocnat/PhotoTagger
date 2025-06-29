import json
import os
import uuid
from datetime import datetime, timezone

LOCATIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "locations.json")


def load_location_presets() -> list[dict]:
    """Loads location presets from JSON, or returns an empty list."""
    if not os.path.exists(LOCATIONS_PATH):
        return []
    try:
        with open(LOCATIONS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_location_presets(data: list[dict]):
    """Saves the location presets data to the JSON file."""
    with open(LOCATIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def add_location_preset(name: str, preset_data: dict) -> dict:
    """Adds a new location preset and saves it to the file."""
    presets = load_location_presets()

    now = datetime.now(timezone.utc).isoformat()

    new_preset = {
        "id": str(uuid.uuid4()),
        "name": name,
        "useCount": 0,
        "lastUsed": None,
        "createdAt": now,
        "data": preset_data,
    }

    presets.append(new_preset)
    save_location_presets(presets)
    return new_preset


def update_location_preset_usage(preset_id: str) -> dict | None:
    """
    Finds a preset by its ID, increments its usage count, updates its
    last used timestamp, and saves the updated list.
    """
    presets = load_location_presets()
    preset_to_update = None

    for preset in presets:
        if preset.get("id") == preset_id:
            preset_to_update = preset
            break

    if not preset_to_update:
        return None

    preset_to_update["useCount"] = preset_to_update.get("useCount", 0) + 1
    preset_to_update["lastUsed"] = datetime.now(timezone.utc).isoformat()

    save_location_presets(presets)

    return preset_to_update
