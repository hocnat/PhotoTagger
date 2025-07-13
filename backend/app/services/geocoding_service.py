import time
from typing import List, Dict, Any
from geopy.geocoders import Nominatim

from config import GEOPY_USER_AGENT


def enrich_coordinates(coordinates: List[Dict[str, float]]) -> List[Dict[str, Any]]:
    """
    Enriches a list of GPS coordinates with address details using reverse geocoding.

    Args:
        coordinates: A list of dicts, each with 'latitude' and 'longitude'.

    Returns:
        A list of enriched location dicts, with 'city', 'state', 'country' added.
    """
    geolocator = Nominatim(user_agent=GEOPY_USER_AGENT)
    enriched_locations = []

    for coord in coordinates:
        try:
            lat, lon = coord["latitude"], coord["longitude"]
            # Perform reverse geocoding
            location_details = geolocator.reverse(
                (lat, lon), exactly_one=True, language="en"
            )

            address = (
                location_details.raw.get("address", {}) if location_details else {}
            )

            # Extract address components with fallbacks for different administrative levels
            city = address.get("city") or address.get("town") or address.get("village")
            state = (
                address.get("state")
                or address.get("province")
                or address.get("state_district")
            )
            country = address.get("country")

            enriched_locations.append(
                {
                    "latitude": lat,
                    "longitude": lon,
                    "city": city or "",
                    "state": state or "",
                    "country": country or "",
                }
            )
        except Exception:
            # If geocoding fails, return the original coordinates with empty address fields
            enriched_locations.append(
                {
                    "latitude": coord["latitude"],
                    "longitude": coord["longitude"],
                    "city": "",
                    "state": "",
                    "country": "",
                }
            )
        finally:
            # IMPORTANT: Adhere to Nominatim's fair use policy (max 1 request/sec)
            time.sleep(1)

    return enriched_locations
