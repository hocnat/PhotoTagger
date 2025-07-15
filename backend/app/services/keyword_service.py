import os
import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from config import KEYWORDS_PATH


class KeywordService:
    def __init__(self, filepath=KEYWORDS_PATH):
        self.filepath = filepath
        self.keywords = self._load_keywords()

    def _load_keywords(self) -> List[Dict[str, Any]]:
        # If the file doesn't exist, create it with an empty list and return.
        if not os.path.exists(self.filepath):
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump([], f)
            return []

        try:
            with open(self.filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                # We expect the data to be a list. If not, the file is considered
                # invalid, and we return an empty list to prevent errors.
                if isinstance(data, list):
                    return data
                return []
        except (json.JSONDecodeError, UnicodeDecodeError):
            # Handles cases where the file is empty or malformed.
            return []

    def _save_keywords(self):
        # Sort keywords by name for consistency in the JSON file
        self.keywords.sort(key=lambda x: x.get("name", "").lower())
        try:
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self.keywords, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Error saving keywords file: {e}")

    def get_all(self) -> List[Dict[str, Any]]:
        return self.keywords

    def find_by_id(self, keyword_id: str) -> Optional[Dict[str, Any]]:
        return next((k for k in self.keywords if k["id"] == keyword_id), None)

    def find_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Finds a keyword object by its primary name or one of its synonyms."""
        for keyword in self.keywords:
            if keyword["name"].lower() == name.lower():
                return keyword
            synonyms = [s.lower() for s in keyword.get("data", {}).get("synonyms", [])]
            if name.lower() in synonyms:
                return keyword
        return None

    def add(self, name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        new_keyword = {
            "id": str(uuid.uuid4()),
            "name": name,
            "useCount": 0,
            "lastUsed": None,
            "createdAt": now,
            "data": {
                "parent": data.get("parent"),
                "synonyms": data.get("synonyms", []),
            },
        }
        self.keywords.append(new_keyword)
        self._save_keywords()
        return new_keyword

    def update(
        self, keyword_id: str, updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        keyword = self.find_by_id(keyword_id)
        if not keyword:
            return None

        if "name" in updates:
            keyword["name"] = updates["name"]

        if "data" in updates and isinstance(updates["data"], dict):
            if "parent" in updates["data"]:
                keyword["data"]["parent"] = updates["data"]["parent"]
            if "synonyms" in updates["data"]:
                keyword["data"]["synonyms"] = updates["data"]["synonyms"]

        self._save_keywords()
        return keyword

    def delete(self, keyword_id: str) -> bool:
        keyword = self.find_by_id(keyword_id)
        if not keyword:
            return False

        # Set parent to null for any children of the deleted keyword
        for k in self.keywords:
            if k.get("data", {}).get("parent") == keyword_id:
                k["data"]["parent"] = None

        self.keywords = [k for k in self.keywords if k["id"] != keyword_id]
        self._save_keywords()
        return True

    def track_usage(self, keyword_names: List[str]):
        """
        Updates usage stats for given keywords. If a keyword doesn't exist, it's created.
        This replaces the old 'learn_keywords' functionality.
        """
        if not keyword_names:
            return

        now_iso = datetime.now(timezone.utc).isoformat()

        for name in keyword_names:
            if not isinstance(name, str) or not (clean_name := name.strip()):
                continue

            entry = self.find_by_name(clean_name)
            if entry:
                entry["useCount"] = entry.get("useCount", 0) + 1
                entry["lastUsed"] = now_iso
            else:
                # Keyword not found, create a new one (preserving old behavior)
                self.add(name=clean_name, data={"parent": None, "synonyms": []})
                # We need to re-find it to update usage, add() already saved.
                new_entry = self.find_by_name(clean_name)
                if new_entry:
                    new_entry["useCount"] = 1
                    new_entry["lastUsed"] = now_iso

        self._save_keywords()


keyword_service = KeywordService()
