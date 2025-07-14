import time
from typing import List, Dict, Any
from geopy.geocoders import Nominatim

from config import GEOPY_USER_AGENT
from app.services.settings_service import load_settings


def enrich_coordinates(coordinates: List[Dict[str, float]]) -> List[Dict[str, Any]]:
    """
    Enriches a list of GPS coordinates with address details using reverse geocoding.
    It uses the user-configured country mappings for standardization.
    """
    settings = load_settings()
    country_mappings = settings.get("countryMappings", [])
    # Create a lookup map from uppercase code to the user's defined name
    code_to_name_map = {m["code"].upper(): m["name"] for m in country_mappings}

    geolocator = Nominatim(user_agent=GEOPY_USER_AGENT)
    enriched_locations = []

    for coord in coordinates:
        try:
            lat, lon = coord["latitude"], coord["longitude"]
            location_details = geolocator.reverse(
                (lat, lon), exactly_one=True, language="en"
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

            country_name = ""
            country_code = ""
            nominatim_code = address.get("country_code", "").upper()

            if nominatim_code in code_to_name_map:
                country_code = nominatim_code
                country_name = code_to_name_map[country_code]
            else:
                # Fallback if the code from Nominatim isn't in our settings
                country_name = address.get("country", "")

            enriched_locations.append(
                {
                    "latitude": lat,
                    "longitude": lon,
                    "city": city or "",
                    "state": state or "",
                    "country": country_name,
                    "countryCode": country_code,
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
                    "countryCode": "",
                }
            )
        finally:
            # IMPORTANT: Adhere to Nominatim's fair use policy (max 1 request/sec)
            time.sleep(1)

    return enriched_locations
