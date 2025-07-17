import { useState, useEffect, useMemo } from "react";
import { Box, Button, TextField, Paper, Typography } from "@mui/material";
import { LatLng } from "leaflet";

import { LocationPreset, LocationPresetData } from "types";
import CountryInput from "components/CountryInput";
import MapModal from "components/MapModal";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { AppIcons } from "config/AppIcons";

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
  const [formData, setFormData] = useState<LocationPresetData>({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { showNotification } = useNotification();

  useEffect(() => {
    if (initialPreset) {
      setName(initialPreset.name);
      setFormData(initialPreset.data);
    } else {
      setName("");
      setFormData({});
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
    const newLocationData: LocationPresetData = {
      Latitude: String(latlng.lat),
      Longitude: String(latlng.lng),
      Location: "",
      City: "",
      State: "",
      Country: "",
      CountryCode: "",
    };
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {initialPreset ? "Edit Preset" : "Add New Preset"}
      </Typography>
      <Box
        component="form"
        noValidate
        autoComplete="off"
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          required
          label="Preset Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          size="small"
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
          size="small"
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
          size="small"
          value={formData.Location || ""}
          onChange={(e) => handleFieldChange("Location", e.target.value)}
        />
        <TextField
          label="City"
          size="small"
          value={formData.City || ""}
          onChange={(e) => handleFieldChange("City", e.target.value)}
        />
        <TextField
          label="State"
          size="small"
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
            size="small"
            value={formData.CountryCode || ""}
            onChange={(e) => handleFieldChange("CountryCode", e.target.value)}
            sx={{ width: 100, flexShrink: 0 }}
          />
        </Box>
        <Box
          sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
        >
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveClick}
            disabled={!name.trim()}
          >
            Save
          </Button>
        </Box>
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
