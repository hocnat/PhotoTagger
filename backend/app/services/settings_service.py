import json
from config import SETTINGS_PATH

DEFAULT_SETTINGS = {
    "appBehavior": {
        "startupMode": "last",  # Options: 'last', 'fixed'
        "fixedPath": "",  # Used if startupMode is 'fixed'
        "lastOpenedFolder": None,
    },
    "renameSettings": {
        "pattern": "${DateTimeOriginal:%Y%m%d_%H%M%S}_${Description}",
        "extensionRules": [
            {"extension": ".jpg", "casing": "lowercase"},
            {"extension": ".jpeg", "casing": "lowercase"},
            {"extension": ".png", "casing": "lowercase"},
            {"extension": ".gif", "casing": "lowercase"},
            {"extension": ".tiff", "casing": "lowercase"},
            {"extension": ".cr2", "casing": "uppercase"},
            {"extension": ".nef", "casing": "uppercase"},
            {"extension": ".arw", "casing": "uppercase"},
            {"extension": ".dng", "casing": "uppercase"},
        ],
    },
    "powerUser": {
        "rawExtensions": [".cr2", ".nef", ".arw", ".dng"],
        "sorting": {
            "recencyBonus": 100,
            "recencyDays": 7,
        },
    },
}


def load_settings() -> dict:
    """Loads settings, creating or repairing the file with defaults if necessary."""
    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
            settings = json.load(f)
            # Recursively ensure all default keys exist
            _ensure_default_keys(settings, DEFAULT_SETTINGS)
            return settings
    except (FileNotFoundError, json.JSONDecodeError):
        save_settings(DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS


def save_settings(data: dict):
    """Saves the settings data to the settings.json file."""
    with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_setting(key, default=None):
    """Utility function to get a single nested setting value."""
    settings = load_settings()
    keys = key.split(".")
    value = settings
    for k in keys:
        if isinstance(value, dict):
            value = value.get(k)
        else:
            return default
    return value if value is not None else default


def _ensure_default_keys(settings, defaults):
    """Recursively add missing default keys to the settings object."""
    for key, value in defaults.items():
        if key not in settings:
            settings[key] = value
        elif isinstance(value, dict):
            _ensure_default_keys(settings[key], value)
