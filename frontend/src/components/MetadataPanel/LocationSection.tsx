import React, { useState } from "react";
import {
  SectionProps,
  LocationPreset,
  LocationPresetData,
  MetadataValue,
} from "../../types";
import { useLocationPresets } from "../../hooks/useLocationPresets";
import FormSection from "./FormSection";
import CountryInput from "../CountryInput";
import MapModal from "../MapModal";
import ConsolidatedTextField from "./ConsolidatedTextField";
import { getFieldData } from "../../utils/metadataUtils";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";

interface LocationSectionProps extends SectionProps {
  onLocationSet: (latlng: { lat: number; lng: number }) => void;
  applyLocationPreset: (data: LocationPresetData) => void;
}

const parseGpsString = (
  gpsString?: string
): { lat: number; lng: number } | null => {
  if (!gpsString || typeof gpsString !== "string") return null;

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

const LocationSection: React.FC<LocationSectionProps> = ({
  formState,
  handleFormChange,
  onLocationSet,
  applyLocationPreset,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { presets, addPreset, trackUsage } = useLocationPresets();

  const handleOpenSaveDialog = () => {
    setPresetName("");
    setSaveDialogOpen(true);
  };

  const handleSavePreset = () => {
    const dataToSave: LocationPresetData = {};
    const locationKeys: (keyof LocationPresetData)[] = [
      "GPSPosition",
      "Location",
      "City",
      "State",
      "Country",
      "CountryCode",
    ];

    locationKeys.forEach((key) => {
      const field = formState[key];
      if (
        field &&
        typeof field === "object" &&
        "value" in field &&
        field.value
      ) {
        (dataToSave as any)[key] = field.value;
      }
    });

    if (Object.keys(dataToSave).length > 0) {
      addPreset(presetName, dataToSave).then(() => setSaveDialogOpen(false));
    } else {
      setSaveDialogOpen(false);
    }
  };

  const gpsPositionData = getFieldData(formState.GPSPosition, "");
  const cityData = getFieldData(formState.City, "");
  const countryData = getFieldData(formState.Country, "");
  const countryCodeData = getFieldData(formState.CountryCode, "");

  const locationFieldsPopulated =
    gpsPositionData.value.trim() !== "" ||
    cityData.value.trim() !== "" ||
    countryData.value.trim() !== "";

  const textFields: { key: keyof LocationPresetData; label: string }[] = [
    { key: "Location", label: "Location" },
    { key: "City", label: "City" },
    { key: "State", label: "State" },
  ];

  return (
    <FormSection title="Location">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Autocomplete
          fullWidth
          options={presets}
          getOptionLabel={(option) => option.name}
          onChange={(event, newValue) => {
            if (newValue) {
              applyLocationPreset(newValue.data);
              trackUsage(newValue.id);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} label="Apply Location Preset" size="small" />
          )}
        />
        <IconButton
          onClick={handleOpenSaveDialog}
          disabled={!locationFieldsPopulated}
          title="Save current location as a preset"
        >
          <BookmarkAddIcon />
        </IconButton>
      </Box>

      <ConsolidatedTextField
        fullWidth
        baseLabel="GPS Position"
        variant="outlined"
        size="small"
        isConsolidated={gpsPositionData.isConsolidated}
        value={
          formState.GPSPosition === "(Mixed Values)"
            ? ""
            : gpsPositionData.value
        }
        placeholder={
          formState.GPSPosition === "(Mixed Values)"
            ? "(Mixed Values)"
            : "e.g., 48.8583, 2.2945"
        }
        onChange={(e) => handleFormChange("GPSPosition", e.target.value)}
      />
      <Button
        variant="outlined"
        startIcon={<MapIcon />}
        onClick={() => setIsMapOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
      >
        Select on Map
      </Button>
      {textFields.map(({ key, label }) => {
        const fieldData = getFieldData(
          formState[key] as MetadataValue<string> | "(Mixed Values)",
          ""
        );
        return (
          <ConsolidatedTextField
            key={key}
            fullWidth
            baseLabel={label}
            variant="outlined"
            size="small"
            isConsolidated={fieldData.isConsolidated}
            value={formState[key] === "(Mixed Values)" ? "" : fieldData.value}
            placeholder={
              formState[key] === "(Mixed Values)" ? "(Mixed Values)" : ""
            }
            onChange={(e) => handleFormChange(key, e.target.value)}
          />
        );
      })}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={countryData.value}
          onCountryChange={(val) => handleFormChange("Country", val)}
          onCodeChange={(val) => handleFormChange("CountryCode", val)}
        />
        <ConsolidatedTextField
          baseLabel="Country Code"
          variant="outlined"
          size="small"
          isConsolidated={countryCodeData.isConsolidated}
          value={countryCodeData.value}
          placeholder={
            formState.CountryCode === "(Mixed Values)" ? "(Mixed)" : ""
          }
          onChange={(e) => handleFormChange("CountryCode", e.target.value)}
          sx={{ width: 100, flexShrink: 0 }}
        />
      </Box>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={onLocationSet}
        initialCoords={parseGpsString(gpsPositionData.value)}
      />
      <Dialog open={isSaveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Location Preset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter a name for this location preset.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Preset Name"
            type="text"
            fullWidth
            variant="standard"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePreset} disabled={!presetName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </FormSection>
  );
};

export default LocationSection;
