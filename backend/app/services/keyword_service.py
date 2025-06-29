import json
import os
from datetime import datetime, timezone

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


def learn_keywords(keywords_to_learn: list[str]):
    """
    Updates the keyword favorites database with a list of new keywords,
    incrementing their usage count and updating their last used timestamp.
    """
    if not keywords_to_learn:
        return

    keywords_data = load_keyword_favorites()
    keyword_map = keywords_data.get("keywords", {})

    for kw in keywords_to_learn:
        if isinstance(kw, str) and (clean_kw := kw.strip()):
            entry = keyword_map.get(clean_kw, {"usageCount": 0})
            entry["usageCount"] += 1
            entry["lastUsed"] = datetime.now(timezone.utc).isoformat()
            keyword_map[clean_kw] = entry

    keywords_data["keywords"] = keyword_map
    save_keyword_favorites(keywords_data)
