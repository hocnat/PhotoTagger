import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import { LatLng } from "leaflet";

import { LocationPreset, LocationPresetData } from "types";
import CountryInput from "components/CountryInput";
import MapModal from "components/MapModal";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { AppIcons } from "config/AppIcons";

const EMPTY_LOCATION_PRESET_DATA: LocationPresetData = {
  Latitude: "",
  Longitude: "",
  Location: "",
  City: "",
  State: "",
  Country: "",
  CountryCode: "",
};

const parseGpsString = (
  gpsString?: string
): { lat: number; lng: number } | null => {
  if (!gpsString) return null;
  const parts = gpsString.split(",").map((s) => s.trim());
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lng: lon };
    }
  }
  return null;
};

interface PresetFormProps {
  initialPreset: LocationPreset | null;
  onCancel: () => void;
  onSave: (name: string, data: LocationPresetData) => Promise<void>;
}

const PresetForm: React.FC<PresetFormProps> = ({
  initialPreset,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState("");
  const [formData, setFormData] = useState<LocationPresetData>(
    EMPTY_LOCATION_PRESET_DATA
  );
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (initialPreset) {
      setName(initialPreset.name);
      setFormData({ ...EMPTY_LOCATION_PRESET_DATA, ...initialPreset.data });
    } else {
      setName("");
      setFormData(EMPTY_LOCATION_PRESET_DATA);
    }
  }, [initialPreset]);

  const handleFieldChange = (
    field: keyof LocationPresetData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (countryName: string, countryCode: string) => {
    setFormData((prev) => ({
      ...prev,
      Country: countryName,
      CountryCode: countryCode,
    }));
  };

  const handleLocationSet = async (latlng: LatLng) => {
    setIsMapOpen(false);
    const newLocationData = { ...EMPTY_LOCATION_PRESET_DATA };
    newLocationData.Latitude = String(latlng.lat);
    newLocationData.Longitude = String(latlng.lng);

    try {
      const [enriched] = await apiService.enrichCoordinates([
        { latitude: latlng.lat, longitude: latlng.lng },
      ]);

      if (enriched) {
        newLocationData.City = enriched.city;
        newLocationData.State = enriched.state;
        newLocationData.Country = enriched.country;
        newLocationData.CountryCode = enriched.countryCode;
      }
    } catch (error) {
      showNotification("Could not fetch location details.", "warning");
    } finally {
      setFormData(newLocationData);
    }
  };

  const handleSaveClick = () => {
    onSave(name, formData);
  };

  const gpsDisplayValue = useMemo(() => {
    if (formData.Latitude || formData.Longitude) {
      return `${formData.Latitude || ""}, ${formData.Longitude || ""}`;
    }
    return "";
  }, [formData]);

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {initialPreset ? "Edit Location Preset" : "Add Location Preset"}
      </Typography>
      <Box component="form" noValidate autoComplete="off">
        <Stack spacing={2}>
          <TextField
            required
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<AppIcons.MAP />}
            onClick={() => setIsMapOpen(true)}
            fullWidth
          >
            Select on Map
          </Button>
          <TextField
            fullWidth
            label="GPS Position"
            value={gpsDisplayValue}
            placeholder="e.g., 48.8583, 2.2945"
            onChange={(e) => {
              const coords = parseGpsString(e.target.value);
              handleFieldChange(
                "Latitude",
                coords ? String(coords.lat) : e.target.value.split(",")[0] || ""
              );
              handleFieldChange(
                "Longitude",
                coords ? String(coords.lng) : e.target.value.split(",")[1] || ""
              );
            }}
          />
          <TextField
            label="Location"
            value={formData.Location || ""}
            onChange={(e) => handleFieldChange("Location", e.target.value)}
          />
          <TextField
            label="City"
            value={formData.City || ""}
            onChange={(e) => handleFieldChange("City", e.target.value)}
          />
          <TextField
            label="State"
            value={formData.State || ""}
            onChange={(e) => handleFieldChange("State", e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <CountryInput
              label="Country"
              value={formData.Country || ""}
              onChange={handleCountryChange}
            />
            <TextField
              label="Country Code"
              value={formData.CountryCode || ""}
              onChange={(e) => handleFieldChange("CountryCode", e.target.value)}
              sx={{ width: 100, flexShrink: 0 }}
            />
          </Box>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            sx={{ pt: 1 }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveClick}
              disabled={!name.trim()}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={handleLocationSet}
        initialCoords={parseGpsString(gpsDisplayValue)}
      />
    </Paper>
  );
};

export default PresetForm;
