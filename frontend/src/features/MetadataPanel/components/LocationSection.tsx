import { useState, useMemo } from "react";
import { LocationPresetData } from "types";
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
import { LatLng } from "leaflet";

import { useLocationPresets } from "../hooks/useLocationPresets";
import FormSection from "./FormSection";
import CountryInput from "./CountryInput";
import MapModal from "./MapModal";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";

interface LocationSectionProps {
  title: string;
  dataBlockName: "LocationCreated" | "LocationShown";
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
  title,
  dataBlockName,
}) => {
  const {
    formState,
    handleFieldChange,
    handleLocationSet,
    applyLocationPreset,
    isFieldDirty,
  } = useMetadata();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { presets, addPreset, trackUsage } = useLocationPresets();

  const locationData = formState[dataBlockName];

  const gpsDisplayValue = useMemo(() => {
    if (!locationData) return "";

    const { Latitude, Longitude } = locationData;

    if (Latitude.status === "mixed" || Longitude.status === "mixed") {
      return getPlaceholder(Latitude);
    }
    if (
      Latitude.status === "unique" &&
      Longitude.status === "unique" &&
      (Latitude.value || Longitude.value)
    ) {
      return `${Latitude.value || ""}, ${Longitude.value || ""}`;
    }
    return "";
  }, [locationData]);

  if (!locationData) return null;

  const { Latitude, Longitude, Location, City, State, Country, CountryCode } =
    locationData;

  const handleGpsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const coords = parseGpsString(value);
    if (coords) {
      // When GPS is set manually, we only update the coordinates
      handleFieldChange(dataBlockName, "Latitude", String(coords.lat));
      handleFieldChange(dataBlockName, "Longitude", String(coords.lng));
    } else {
      const parts = value.split(",");
      handleFieldChange(dataBlockName, "Latitude", parts[0] || "");
      handleFieldChange(dataBlockName, "Longitude", parts[1] || "");
    }
  };

  const handleOpenSaveDialog = () => {
    setPresetName("");
    setSaveDialogOpen(true);
  };

  const handleSavePreset = () => {
    const dataToSave: LocationPresetData = {};

    for (const [key, field] of Object.entries(locationData)) {
      if (field.status === "unique" && field.value) {
        (dataToSave as any)[key] = field.value;
      }
    }

    if (Object.keys(dataToSave).length > 0) {
      addPreset(presetName, dataToSave).then(() => setSaveDialogOpen(false));
    } else {
      setSaveDialogOpen(false);
    }
  };

  const hasGps =
    Latitude.status === "unique" &&
    Longitude.status === "unique" &&
    String(Latitude.value || "").trim() !== "" &&
    String(Longitude.value || "").trim() !== "";
  const hasLocation =
    Location.status === "unique" && String(Location.value || "").trim() !== "";
  const hasCity =
    City.status === "unique" && String(City.value || "").trim() !== "";
  const hasState =
    State.status === "unique" && String(State.value || "").trim() !== "";
  const hasCountry =
    Country.status === "unique" && String(Country.value || "").trim() !== "";
  const locationFieldsPopulated =
    hasGps || hasLocation || hasCity || hasState || hasCountry;

  const textFields: { key: keyof typeof locationData; label: string }[] = [
    { key: "Location", label: "Location" },
    { key: "City", label: "City" },
    { key: "State", label: "State" },
  ];

  return (
    <FormSection title={title}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Autocomplete
          fullWidth
          options={presets}
          getOptionLabel={(option) => option.name}
          onChange={(event, newValue) => {
            if (newValue) {
              applyLocationPreset(newValue.data, dataBlockName);
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

      <Button
        variant="outlined"
        startIcon={<MapIcon />}
        onClick={() => setIsMapOpen(true)}
        fullWidth
      >
        Select on Map
      </Button>

      <TextField
        fullWidth
        label="GPS Position"
        variant="outlined"
        size="small"
        value={gpsDisplayValue === "(Mixed Values)" ? "" : gpsDisplayValue}
        placeholder={
          gpsDisplayValue === "(Mixed Values)"
            ? gpsDisplayValue
            : "e.g., 48.8583, 2.2945"
        }
        onChange={handleGpsInputChange}
        sx={getDirtyFieldSx(
          isFieldDirty(dataBlockName, "Latitude") ||
            isFieldDirty(dataBlockName, "Longitude")
        )}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  (Latitude.status === "unique" && !Latitude.isConsolidated) ||
                  (Longitude.status === "unique" && !Longitude.isConsolidated)
                }
              />
            ),
          },
        }}
      />

      {textFields.map(({ key, label }) => {
        const field = locationData[key];
        return (
          <TextField
            key={key}
            fullWidth
            label={label}
            variant="outlined"
            size="small"
            value={getDisplayValue(field)}
            placeholder={getPlaceholder(field)}
            onChange={(e) =>
              handleFieldChange(dataBlockName, key, e.target.value)
            }
            sx={getDirtyFieldSx(isFieldDirty(dataBlockName, key))}
            slotProps={{
              input: {
                endAdornment: (
                  <ConsolidationAdornment
                    show={field.status === "unique" && !field.isConsolidated}
                  />
                ),
              },
            }}
          />
        );
      })}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={getDisplayValue(Country)}
          isConsolidated={
            Country.status === "unique" ? Country.isConsolidated : true
          }
          onCountryChange={(val) =>
            handleFieldChange(dataBlockName, "Country", val)
          }
          onCodeChange={(val) =>
            handleFieldChange(dataBlockName, "CountryCode", val)
          }
          isDirty={
            isFieldDirty(dataBlockName, "Country") ||
            isFieldDirty(dataBlockName, "CountryCode")
          }
        />
        <TextField
          label="Country Code"
          variant="outlined"
          size="small"
          value={getDisplayValue(CountryCode)}
          placeholder={getPlaceholder(CountryCode) || "(Mixed)"}
          onChange={(e) =>
            handleFieldChange(dataBlockName, "CountryCode", e.target.value)
          }
          sx={{
            width: 100,
            flexShrink: 0,
            ...getDirtyFieldSx(isFieldDirty(dataBlockName, "CountryCode")),
          }}
          slotProps={{
            input: {
              endAdornment: (
                <ConsolidationAdornment
                  show={
                    CountryCode.status === "unique" &&
                    !CountryCode.isConsolidated
                  }
                />
              ),
            },
          }}
        />
      </Box>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={(latlng: LatLng) =>
          handleLocationSet(dataBlockName, latlng)
        }
        initialCoords={parseGpsString(
          gpsDisplayValue !== "(Mixed Values)" ? gpsDisplayValue : undefined
        )}
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
