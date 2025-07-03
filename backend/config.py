import os

# The absolute path to the backend directory.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Path to the ExifTool executable.
# The application assumes 'exiftool' is available in the system's PATH.
EXIFTOOL_PATH = "exiftool"

# Path to our custom ExifTool configuration file.
EXIFTOOL_CONFIG_PATH = os.path.join(BASE_DIR, "exiftool.config")

# Paths to our data files.
KEYWORDS_PATH = os.path.join(BASE_DIR, "keywords.json")
LOCATIONS_PATH = os.path.join(BASE_DIR, "locations.json")
SETTINGS_PATH = os.path.join(BASE_DIR, "settings.json")
