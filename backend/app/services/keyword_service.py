import json
import os

KEYWORDS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "keywords.json")


def load_keyword_favorites() -> dict:
    """Loads keyword favorite data from JSON, or creates a default structure."""
    if not os.path.exists(KEYWORDS_PATH):
        return {"keywords": {}}
    try:
        with open(KEYWORDS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        return {"keywords": {}}


def save_keyword_favorites(data: dict):
    """Saves the keyword favorite data to the JSON file."""
    with open(KEYWORDS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
