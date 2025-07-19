# This file serves as the single source of truth for the application's metadata schema.
# It defines which low-level EXIF/XMP tags correspond to the application's high-level
# metadata fields and how they should be handled.

TAG_MAP = {
    "Title": {
        "label": "Title",
        "group": "Content",
        "sources": {"XMP-dc:Title": {"write_mode": "always"}},
        "handler": "simple",
    },
    "Keywords": {
        "label": "Keywords",
        "group": "Content",
        "sources": {"XMP-dc:Subject": {"write_mode": "always"}},
        "handler": "list",
    },
    "DateTimeOriginal": {
        "label": "Date Time Original",
        "group": "Date & Time",
        "sources": {
            "XMP-dc:Date": {"write_mode": "always"},
            "ExifIFD:DateTimeOriginal": {"write_mode": "always"},
            "ExifIFD:CreateDate": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "OffsetTimeOriginal": {
        "label": "Offset Time Original",
        "group": "Date & Time",
        "sources": {
            "ExifIFD:OffsetTimeOriginal": {"write_mode": "always"},
            "Canon:TimeZone": {
                "write_mode": "if_exists",
                "value_handler": "minutes_hhmm",
            },
        },
        "read_format": "#",
        "handler": "simple",
    },
    "Creator": {
        "label": "Creator",
        "group": "Creator",
        "sources": {
            "XMP-dc:Creator": {"write_mode": "always"},
            "IFD0:Artist": {"write_mode": "always"},
        },
        "handler": "simple",
    },
    "Copyright": {
        "label": "Copyright",
        "group": "Creator",
        "sources": {
            "XMP-dc:Rights": {"write_mode": "always"},
            "IFD0:Copyright": {"write_mode": "always"},
        },
        "handler": "simple",
    },
    "LatitudeCreated": {
        "label": "Latitude",
        "group": "Location Created",
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLatitude": {"write_mode": "always"},
            "XMP-exif:GPSLatitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeCreated": {
        "label": "Longitude",
        "group": "Location Created",
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLongitude": {"write_mode": "always"},
            "XMP-exif:GPSLongitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationCreated": {
        "label": "Location",
        "group": "Location Created",
        "sources": {"XMP-iptcExt:LocationCreatedSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityCreated": {
        "label": "City",
        "group": "Location Created",
        "sources": {"XMP-iptcExt:LocationCreatedCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateCreated": {
        "label": "State",
        "group": "Location Created",
        "sources": {
            "XMP-iptcExt:LocationCreatedProvinceState": {"write_mode": "always"}
        },
        "handler": "simple",
    },
    "CountryCreated": {
        "label": "Country",
        "group": "Location Created",
        "sources": {"XMP-iptcExt:LocationCreatedCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeCreated": {
        "label": "Country Code",
        "group": "Location Created",
        "sources": {"XMP-iptcExt:LocationCreatedCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
    "LatitudeShown": {
        "label": "Latitude",
        "group": "Location Shown",
        "sources": {
            "XMP-iptcExt:LocationShownGPSLatitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeShown": {
        "label": "Longitude",
        "group": "Location Shown",
        "sources": {
            "XMP-iptcExt:LocationShownGPSLongitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationShown": {
        "label": "Location",
        "group": "Location Shown",
        "sources": {"XMP-iptcExt:LocationShownSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityShown": {
        "label": "City",
        "group": "Location Shown",
        "sources": {"XMP-iptcExt:LocationShownCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateShown": {
        "label": "State",
        "group": "Location Shown",
        "sources": {"XMP-iptcExt:LocationShownProvinceState": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryShown": {
        "label": "Country",
        "group": "Location Shown",
        "sources": {"XMP-iptcExt:LocationShownCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeShown": {
        "label": "Country Code",
        "group": "Location Shown",
        "sources": {"XMP-iptcExt:LocationShownCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
}
