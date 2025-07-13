import os

# The absolute path to the backend directory.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the ExifTool executable.
# The application assumes 'exiftool' is available in the system's PATH.
EXIFTOOL_PATH = "exiftool"

# Paths to our data files.
KEYWORDS_PATH = os.path.join(BASE_DIR, "keywords.json")
LOCATIONS_PATH = os.path.join(BASE_DIR, "locations.json")
SETTINGS_PATH = os.path.join(BASE_DIR, "settings.json")

# User agent for making requests to external services like Nominatim (geopy).
# This is required by their fair use policy.
GEOPY_USER_AGENT = "PhotoTagger/1.0"
