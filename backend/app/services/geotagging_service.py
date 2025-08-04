import time
from typing import List, Dict, Any
from geopy.geocoders import Nominatim
import gpxpy
from datetime import datetime, timezone, timedelta

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


def match_photos_to_gpx(gpx_content_str: str, photos: List[Dict[str, str]], threshold_seconds: int) -> Dict[str, Any]:
    """
    Matches photos to the closest point in a GPX track based on timestamps,
    but only if the time difference is within a defined threshold.
    """
    try:
        gpx = gpxpy.parse(gpx_content_str)
    except gpxpy.gpx.GPXXMLSyntaxException:
        return {"matches": [], "track": None}

    track_points = []
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                if point.time:
                    track_points.append(point)
    
    track_points.sort(key=lambda p: p.time)

    track_coordinates = [[p.longitude, p.latitude] for p in track_points]
    geojson_track = {
        "type": "LineString",
        "coordinates": track_coordinates
    } if track_coordinates else None

    if not track_points:
        return {"matches": [], "track": geojson_track}

    threshold = timedelta(seconds=threshold_seconds)
    matches = []

    for photo in photos:
        try:
            dt_str = photo.get('dateTime', '')
            naive_dt = datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")

            offset_str = photo.get('offsetTime', '')
            sign = -1 if offset_str.startswith('-') else 1
            h, m = map(int, offset_str.replace('+', '-').split('-')[-1].split(':'))
            
            photo_tz = timezone(timedelta(hours=h, minutes=m) * sign)
            aware_dt = naive_dt.replace(tzinfo=photo_tz)
            
        except (ValueError, TypeError, IndexError):
            matches.append({ "filename": photo.get('filename'), "coordinates": None })
            continue

        closest_point = min(track_points, key=lambda p: abs(p.time - aware_dt))
        time_difference = abs(closest_point.time - aware_dt)

        if time_difference <= threshold:
            matches.append({
                "filename": photo.get('filename'),
                "coordinates": {
                    "latitude": closest_point.latitude,
                    "longitude": closest_point.longitude
                }
            })
        else:
            matches.append({ "filename": photo.get('filename'), "coordinates": None })

    return {"matches": matches, "track": geojson_track}