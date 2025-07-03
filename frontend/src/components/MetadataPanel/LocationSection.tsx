import React, { useState } from "react";
import { SectionProps, LocationPreset, LocationPresetData } from "../../types";
import { useLocationPresets } from "../../hooks/useLocationPresets";
import FormSection from "./FormSection";
import CountryInput from "../CountryInput";
import MapModal from "../MapModal";
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
      const value = formState[key];
      if (typeof value === "string" && value !== "(Mixed Values)") {
        dataToSave[key] = value;
      }
    });

    if (Object.keys(dataToSave).length > 0) {
      addPreset(presetName, dataToSave).then(() => setSaveDialogOpen(false));
    } else {
      setSaveDialogOpen(false);
    }
  };

  const locationFieldsPopulated =
    (typeof formState.GPSPosition === "string" &&
      formState.GPSPosition.trim() !== "" &&
      formState.GPSPosition !== "(Mixed Values)") ||
    (typeof formState.City === "string" &&
      formState.City !== "(Mixed Values)") ||
    (typeof formState.Country === "string" &&
      formState.Country !== "(Mixed Values)");

  return (
    <FormSection title="Location">
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Autocomplete
          fullWidth
          options={presets}
          getOptionLabel={(option) => option.name}
          onChange={(event, newValue: LocationPreset | null) => {
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

      <TextField
        fullWidth
        label="GPS Position"
        variant="outlined"
        size="small"
        value={
          typeof formState.GPSPosition === "string" &&
          formState.GPSPosition !== "(Mixed Values)"
            ? formState.GPSPosition
            : ""
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
      <TextField
        fullWidth
        label="Location"
        variant="outlined"
        size="small"
        value={
          typeof formState.Location === "string" &&
          formState.Location !== "(Mixed Values)"
            ? formState.Location
            : ""
        }
        placeholder={
          formState.Location === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Location", e.target.value)}
      />
      <TextField
        fullWidth
        label="City"
        variant="outlined"
        size="small"
        value={
          typeof formState.City === "string" &&
          formState.City !== "(Mixed Values)"
            ? formState.City
            : ""
        }
        placeholder={
          formState.City === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("City", e.target.value)}
      />
      <TextField
        fullWidth
        label="State"
        variant="outlined"
        size="small"
        value={
          typeof formState.State === "string" &&
          formState.State !== "(Mixed Values)"
            ? formState.State
            : ""
        }
        placeholder={
          formState.State === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("State", e.target.value)}
      />
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={
            typeof formState.Country === "string" &&
            formState.Country !== "(Mixed Values)"
              ? formState.Country
              : ""
          }
          onCountryChange={(val) => handleFormChange("Country", val)}
          onCodeChange={(val) => handleFormChange("CountryCode", val)}
        />
        <TextField
          label="Country Code"
          variant="outlined"
          size="small"
          value={
            typeof formState.CountryCode === "string" &&
            formState.CountryCode !== "(Mixed Values)"
              ? formState.CountryCode
              : ""
          }
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
        initialCoords={parseGpsString(formState.GPSPosition)}
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
