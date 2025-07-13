import re
import time
import uuid
from datetime import datetime, timezone
import requests
from typing import List, Dict, Any
from geopy.geocoders import Nominatim
import zipfile
import io
from lxml import etree

from config import GEOPY_USER_AGENT
from . import location_service


def _extract_map_id(url: str) -> str | None:
    """Extracts the Google MyMaps Map ID from various URL formats."""
    patterns = [r"mid=([a-zA-Z0-9_-]+)", r"/d/([a-zA-Z0-_]+)/"]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _build_kml_url(map_id: str) -> str:
    """Constructs the KML export URL from a map ID."""
    return f"https://www.google.com/maps/d/kml?mid={map_id}&forcekml=1"


def fetch_placemarks_from_url(url: str) -> List[Dict[str, Any]]:
    """
    Fetches a Google MyMaps URL, downloads the KML/KMZ, and extracts placemark data,
    skipping any folders that represent driving directions.
    """
    map_id = _extract_map_id(url)
    if not map_id:
        raise ValueError("Invalid Google MyMaps URL or map ID not found.")

    kml_url = _build_kml_url(map_id)
    response = requests.get(kml_url, timeout=10)
    response.raise_for_status()
    content = response.content

    kml_string = content
    if content.startswith(b"PK\x03\x04"):
        try:
            with zipfile.ZipFile(io.BytesIO(content), "r") as kmz:
                kml_filename = next(
                    (name for name in kmz.namelist() if name.endswith(".kml")), None
                )
                if not kml_filename:
                    raise ValueError(
                        "KML file not found in the downloaded KMZ archive."
                    )
                kml_string = kmz.read(kml_filename)
        except zipfile.BadZipFile:
            raise ValueError("Invalid KMZ file format.")

    placemarks_data = []

    try:
        nsmap = {"kml": "http://www.opengis.net/kml/2.2"}
        root = etree.fromstring(kml_string)

        all_folder_nodes = root.xpath(
            "/kml:kml/kml:Document/kml:Folder", namespaces=nsmap
        )

        for folder_node in all_folder_nodes:
            # Check if this folder contains any Placemark with a LineString.
            # If so, it's a directions layer and should be skipped.
            if folder_node.find(".//kml:LineString", namespaces=nsmap) is not None:
                continue

            # Find all Placemarks within this valid folder.
            placemark_nodes = folder_node.xpath(".//kml:Placemark", namespaces=nsmap)

            for placemark_node in placemark_nodes:
                # Since we've already filtered out directions folders, we assume any
                # remaining placemark is a location we want, provided it has coordinates.
                name = placemark_node.findtext(
                    "kml:name", default="(no name)", namespaces=nsmap
                ).strip()
                # Find coordinates anywhere within the Placemark
                coord_node = placemark_node.find(".//kml:coordinates", namespaces=nsmap)

                if coord_node is not None and coord_node.text:
                    try:
                        coords = coord_node.text.strip().split(",")
                        # Ensure we have at least latitude and longitude
                        if len(coords) >= 2:
                            placemarks_data.append(
                                {
                                    "name": name,
                                    "latitude": float(coords[1]),
                                    "longitude": float(coords[0]),
                                }
                            )
                    except (ValueError, IndexError):
                        # Skip this placemark if coordinates are malformed
                        continue
    except Exception as e:
        raise IOError(f"Failed to parse KML data: {e}")

    return placemarks_data


def enrich_location_data(locations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enriches a list of locations with address details using reverse geocoding."""
    geolocator = Nominatim(user_agent=GEOPY_USER_AGENT)
    enriched_locations = []
    for location in locations:
        try:
            coordinates = (location["latitude"], location["longitude"])
            location_details = geolocator.reverse(
                coordinates, exactly_one=True, language="en"
            )
            address = (
                location_details.raw.get("address", {}) if location_details else {}
            )
            city = address.get("city") or address.get("town") or address.get("village")
            state = (
                address.get("state")
                or address.get("province")
                or address.get("state_district")
            )
            country = address.get("country")
            enriched_locations.append(
                {
                    **location,
                    "city": city or "",
                    "state": state or "",
                    "country": country or "",
                }
            )
        except Exception:
            enriched_locations.append(
                {**location, "city": "", "state": "", "country": ""}
            )
        finally:
            time.sleep(1)
    return enriched_locations


def save_imported_presets(
    presets_to_import: List[Dict[str, Any]], resolutions: Dict[str, str] | None = None
) -> Dict[str, Any]:
    """Saves imported presets, handling conflicts with existing presets."""
    if resolutions is None:
        resolutions = {}
    existing_presets = location_service.load_location_presets()
    existing_presets_by_name = {p["name"]: p for p in existing_presets}
    unresolved_conflicts = [
        p["name"]
        for p in presets_to_import
        if p["name"] in existing_presets_by_name and p["name"] not in resolutions
    ]
    if unresolved_conflicts:
        return {"success": False, "conflicts": unresolved_conflicts}
    final_presets = list(existing_presets)
    presets_to_import_by_name = {p["name"]: p for p in presets_to_import}
    for preset in final_presets:
        name = preset["name"]
        if name in presets_to_import_by_name and resolutions.get(name) == "overwrite":
            preset_data = presets_to_import_by_name[name]
            preset["data"] = {
                "latitude": preset_data.get("latitude"),
                "longitude": preset_data.get("longitude"),
                "city": preset_data.get("city"),
                "state": preset_data.get("state"),
                "country": preset_data.get("country"),
            }
    for name, preset_data in presets_to_import_by_name.items():
        if name not in existing_presets_by_name:
            now = datetime.now(timezone.utc).isoformat()
            new_preset = {
                "id": str(uuid.uuid4()),
                "name": name,
                "useCount": 0,
                "lastUsed": None,
                "createdAt": now,
                "data": {
                    "latitude": preset_data.get("latitude"),
                    "longitude": preset_data.get("longitude"),
                    "city": preset_data.get("city"),
                    "state": preset_data.get("state"),
                    "country": preset_data.get("country"),
                },
            }
            final_presets.append(new_preset)
    location_service.save_location_presets(final_presets)
    return {"success": True, "conflicts": []}
