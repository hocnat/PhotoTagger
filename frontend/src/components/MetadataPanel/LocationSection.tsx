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
    const dataToSave: LocationPresetData = {
      DecimalLatitude:
        typeof formState.DecimalLatitude === "number"
          ? formState.DecimalLatitude
          : undefined,
      DecimalLongitude:
        typeof formState.DecimalLongitude === "number"
          ? formState.DecimalLongitude
          : undefined,
      "XMP:Location":
        typeof formState["XMP:Location"] === "string" &&
        formState["XMP:Location"] !== "(Mixed Values)"
          ? formState["XMP:Location"]
          : undefined,
      "XMP:City":
        typeof formState["XMP:City"] === "string" &&
        formState["XMP:City"] !== "(Mixed Values)"
          ? formState["XMP:City"]
          : undefined,
      "XMP:State":
        typeof formState["XMP:State"] === "string" &&
        formState["XMP:State"] !== "(Mixed Values)"
          ? formState["XMP:State"]
          : undefined,
      "XMP:Country":
        typeof formState["XMP:Country"] === "string" &&
        formState["XMP:Country"] !== "(Mixed Values)"
          ? formState["XMP:Country"]
          : undefined,
      "XMP:CountryCode":
        typeof formState["XMP:CountryCode"] === "string" &&
        formState["XMP:CountryCode"] !== "(Mixed Values)"
          ? formState["XMP:CountryCode"]
          : undefined,
    };
    addPreset(presetName, dataToSave).then(() => setSaveDialogOpen(false));
  };

  const locationFieldsPopulated =
    typeof formState.DecimalLatitude === "number" ||
    (typeof formState["XMP:City"] === "string" &&
      formState["XMP:City"] !== "(Mixed Values)") ||
    (typeof formState["XMP:Country"] === "string" &&
      formState["XMP:Country"] !== "(Mixed Values)");

  return (
    <FormSection title="Where">
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

      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          label="GPS Latitude"
          variant="outlined"
          size="small"
          value={
            typeof formState.DecimalLatitude === "number"
              ? formState.DecimalLatitude
              : ""
          }
          placeholder={
            typeof formState.DecimalLatitude !== "number"
              ? "(Mixed Values)"
              : ""
          }
          onChange={(e) => handleFormChange("DecimalLatitude", e.target.value)}
        />
        <TextField
          fullWidth
          label="GPS Longitude"
          variant="outlined"
          size="small"
          value={
            typeof formState.DecimalLongitude === "number"
              ? formState.DecimalLongitude
              : ""
          }
          placeholder={
            typeof formState.DecimalLongitude !== "number"
              ? "(Mixed Values)"
              : ""
          }
          onChange={(e) => handleFormChange("DecimalLongitude", e.target.value)}
        />
      </Box>
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
        label="Sublocation"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:Location"] === "string" &&
          formState["XMP:Location"] !== "(Mixed Values)"
            ? formState["XMP:Location"]
            : ""
        }
        placeholder={
          formState["XMP:Location"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:Location", e.target.value)}
      />
      <TextField
        fullWidth
        label="City"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:City"] === "string" &&
          formState["XMP:City"] !== "(Mixed Values)"
            ? formState["XMP:City"]
            : ""
        }
        placeholder={
          formState["XMP:City"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:City", e.target.value)}
      />
      <TextField
        fullWidth
        label="State/Province"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:State"] === "string" &&
          formState["XMP:State"] !== "(Mixed Values)"
            ? formState["XMP:State"]
            : ""
        }
        placeholder={
          formState["XMP:State"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:State", e.target.value)}
      />
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={
            typeof formState["XMP:Country"] === "string" &&
            formState["XMP:Country"] !== "(Mixed Values)"
              ? formState["XMP:Country"]
              : ""
          }
          onCountryChange={(val) => handleFormChange("XMP:Country", val)}
          onCodeChange={(val) => handleFormChange("XMP:CountryCode", val)}
        />
        <TextField
          label="Code"
          variant="outlined"
          size="small"
          value={
            typeof formState["XMP:CountryCode"] === "string" &&
            formState["XMP:CountryCode"] !== "(Mixed Values)"
              ? formState["XMP:CountryCode"]
              : ""
          }
          placeholder={
            formState["XMP:CountryCode"] === "(Mixed Values)" ? "(Mixed)" : ""
          }
          onChange={(e) => handleFormChange("XMP:CountryCode", e.target.value)}
          sx={{ width: 100, flexShrink: 0 }}
        />
      </Box>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={onLocationSet}
        initialCoords={
          typeof formState.DecimalLatitude === "number" &&
          typeof formState.DecimalLongitude === "number"
            ? {
                lat: formState.DecimalLatitude,
                lng: formState.DecimalLongitude,
              }
            : null
        }
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
