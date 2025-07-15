# This file serves as the single source of truth for the application's metadata schema.
# It defines which low-level EXIF/XMP tags correspond to the application's high-level
# metadata fields and how they should be handled.

TAG_MAP = {
    "Title": {
        "sources": {"XMP-dc:Title": {"write_mode": "always"}},
        "handler": "simple",
    },
    "Keywords": {
        "sources": {"XMP-dc:Subject": {"write_mode": "always"}},
        "handler": "list",
    },
    "LatitudeCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLatitude": {"write_mode": "always"},
            "XMP-exif:GPSLatitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedGPSLongitude": {"write_mode": "always"},
            "XMP-exif:GPSLongitude": {"write_mode": "if_exists"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateCreated": {
        "sources": {
            "XMP-iptcExt:LocationCreatedProvinceState": {"write_mode": "always"}
        },
        "handler": "simple",
    },
    "CountryCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeCreated": {
        "sources": {"XMP-iptcExt:LocationCreatedCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
    "LatitudeShown": {
        "sources": {
            "XMP-iptcExt:LocationShownGPSLatitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LongitudeShown": {
        "sources": {
            "XMP-iptcExt:LocationShownGPSLongitude": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "LocationShown": {
        "sources": {"XMP-iptcExt:LocationShownSublocation": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CityShown": {
        "sources": {"XMP-iptcExt:LocationShownCity": {"write_mode": "always"}},
        "handler": "simple",
    },
    "StateShown": {
        "sources": {"XMP-iptcExt:LocationShownProvinceState": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryShown": {
        "sources": {"XMP-iptcExt:LocationShownCountryName": {"write_mode": "always"}},
        "handler": "simple",
    },
    "CountryCodeShown": {
        "sources": {"XMP-iptcExt:LocationShownCountryCode": {"write_mode": "always"}},
        "handler": "simple",
    },
    "DateTimeOriginal": {
        "sources": {
            "XMP-dc:Date": {"write_mode": "always"},
            "ExifIFD:DateTimeOriginal": {"write_mode": "always"},
            "ExifIFD:CreateDate": {"write_mode": "always"},
        },
        "read_format": "#",
        "handler": "simple",
    },
    "OffsetTimeOriginal": {
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
        "sources": {
            "XMP-dc:Creator": {"write_mode": "always"},
            "IFD0:Artist": {"write_mode": "always"},
        },
        "handler": "simple",
    },
    "Copyright": {
        "sources": {
            "XMP-dc:Rights": {"write_mode": "always"},
            "IFD0:Copyright": {"write_mode": "always"},
        },
        "handler": "simple",
    },
}
