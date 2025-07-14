import time
from typing import List, Dict, Any
from geopy.geocoders import Nominatim
import pycountry

from config import GEOPY_USER_AGENT


def enrich_coordinates(coordinates: List[Dict[str, float]]) -> List[Dict[str, Any]]:
    """
    Enriches a list of GPS coordinates with address details using reverse geocoding.
    It normalizes country data to standardized, official names and codes.

    Args:
        coordinates: A list of dicts, each with 'latitude' and 'longitude'.

    Returns:
        A list of enriched location dicts, with 'city', 'state', 'country', and 'countryCode'.
    """
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

            # Extract basic info
            city = address.get("city") or address.get("town") or address.get("village")
            state = (
                address.get("state")
                or address.get("province")
                or address.get("state_district")
            )

            # --- Country Normalization Logic ---
            country_name = ""
            country_code = ""
            # Nominatim provides the ISO 3166-1 alpha-2 code.
            nominatim_code = address.get("country_code")
            if nominatim_code:
                try:
                    # Look up the country by its code using pycountry.
                    country_info = pycountry.countries.get(
                        alpha_2=nominatim_code.upper()
                    )
                    if country_info:
                        # Use the official name for consistency.
                        country_name = getattr(
                            country_info, "official_name", country_info.name
                        )
                        country_code = country_info.alpha_2
                except (KeyError, AttributeError):
                    # Fallback to the name from Nominatim if lookup fails.
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
