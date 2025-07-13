import re
from typing import List, Dict, Any
import requests
import zipfile
import io
from lxml import etree


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
