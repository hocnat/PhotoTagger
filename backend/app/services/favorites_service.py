import json
import os


FAVORITES_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "favorites.json")


def load_favorites() -> dict:
    """Loads favorites from JSON, or creates a default structure."""
    if not os.path.exists(FAVORITES_PATH):
        return {"keywords": {}}
    try:
        with open(FAVORITES_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"keywords": {}}


def save_favorites(data: dict):
    """Saves the favorites data to the JSON file."""
    with open(FAVORITES_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
