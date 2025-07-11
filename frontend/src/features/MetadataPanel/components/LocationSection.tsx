import { useState, useMemo } from "react";
import { SectionProps, LocationPresetData, FormState } from "types";
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

import { useLocationPresets } from "../hooks/useLocationPresets";
import FormSection from "./FormSection";
import CountryInput from "./CountryInput";
import MapModal from "./MapModal";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";

interface LocationFieldNamesMap {
  latitude: keyof FormState;
  longitude: keyof FormState;
  location: keyof FormState;
  city: keyof FormState;
  state: keyof FormState;
  country: keyof FormState;
  countryCode: keyof FormState;
}

interface LocationSectionProps {
  title: string;
  fieldNames: LocationFieldNamesMap;
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
  fieldNames,
}) => {
  const {
    formState,
    handleFormChange,
    handleLocationSet,
    applyLocationPreset,
    isFieldDirty,
  } = useMetadata();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { presets, addPreset, trackUsage } = useLocationPresets();

  const latitudeField = formState[fieldNames.latitude];
  const longitudeField = formState[fieldNames.longitude];
  const cityField = formState[fieldNames.city];
  const countryField = formState[fieldNames.country];
  const countryCodeField = formState[fieldNames.countryCode];

  const gpsDisplayValue = useMemo(() => {
    if (
      latitudeField?.status === "mixed" ||
      longitudeField?.status === "mixed"
    ) {
      return getPlaceholder(latitudeField);
    }
    if (
      latitudeField?.status === "unique" &&
      longitudeField?.status === "unique" &&
      latitudeField.value &&
      longitudeField.value
    ) {
      return `${latitudeField.value}, ${longitudeField.value}`;
    }
    return "";
  }, [latitudeField, longitudeField]);

  const handleGpsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const coords = parseGpsString(value);
    if (coords) {
      handleFormChange(fieldNames.latitude, String(coords.lat));
      handleFormChange(fieldNames.longitude, String(coords.lng));
    } else {
      const parts = value.split(",");
      handleFormChange(fieldNames.latitude, parts[0] || "");
      handleFormChange(fieldNames.longitude, parts[1] || "");
    }
  };

  const handleOpenSaveDialog = () => {
    setPresetName("");
    setSaveDialogOpen(true);
  };

  const handleSavePreset = () => {
    const dataToSave: LocationPresetData = {};

    const addToPreset = (
      genericKey: keyof LocationPresetData,
      formKey: keyof FormState
    ) => {
      const field = formState[formKey];
      if (field?.status === "unique" && field.value) {
        (dataToSave as any)[genericKey] = field.value;
      }
    };

    addToPreset("Latitude", fieldNames.latitude);
    addToPreset("Longitude", fieldNames.longitude);
    addToPreset("Location", fieldNames.location);
    addToPreset("City", fieldNames.city);
    addToPreset("State", fieldNames.state);
    addToPreset("Country", fieldNames.country);
    addToPreset("CountryCode", fieldNames.countryCode);

    if (Object.keys(dataToSave).length > 0) {
      addPreset(presetName, dataToSave).then(() => setSaveDialogOpen(false));
    } else {
      setSaveDialogOpen(false);
    }
  };

  const hasGps =
    latitudeField?.status === "unique" &&
    longitudeField?.status === "unique" &&
    String(latitudeField.value || "").trim() !== "" &&
    String(longitudeField.value || "").trim() !== "";
  const hasCity =
    cityField?.status === "unique" &&
    String(cityField.value || "").trim() !== "";
  const hasCountry =
    countryField?.status === "unique" &&
    String(countryField.value || "").trim() !== "";
  const locationFieldsPopulated = hasGps || hasCity || hasCountry;

  const textFields: {
    key: keyof Omit<
      LocationFieldNamesMap,
      "latitude" | "longitude" | "country" | "countryCode"
    >;
    label: string;
  }[] = [
    { key: "location", label: "Location" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
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
              applyLocationPreset(newValue.data, fieldNames);
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
        value={gpsDisplayValue === "(Mixed Values)" ? "" : gpsDisplayValue}
        placeholder={
          gpsDisplayValue === "(Mixed Values)"
            ? gpsDisplayValue
            : "e.g., 48.8583, 2.2945"
        }
        onChange={handleGpsInputChange}
        sx={getDirtyFieldSx(
          isFieldDirty(fieldNames.latitude) ||
            isFieldDirty(fieldNames.longitude)
        )}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  (latitudeField?.status === "unique" &&
                    !latitudeField.isConsolidated) ||
                  (longitudeField?.status === "unique" &&
                    !longitudeField.isConsolidated)
                }
              />
            ),
          },
        }}
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
        const formKey = fieldNames[key];
        const field = formState[formKey];
        return (
          <TextField
            key={formKey}
            fullWidth
            label={label}
            variant="outlined"
            size="small"
            value={getDisplayValue(field as any)}
            placeholder={getPlaceholder(field)}
            onChange={(e) => handleFormChange(formKey, e.target.value)}
            sx={getDirtyFieldSx(isFieldDirty(formKey))}
            slotProps={{
              input: {
                endAdornment: (
                  <ConsolidationAdornment
                    show={field?.status === "unique" && !field.isConsolidated}
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
          countryValue={getDisplayValue(countryField as any)}
          isConsolidated={
            countryField?.status === "unique"
              ? countryField.isConsolidated
              : true
          }
          onCountryChange={(val) => handleFormChange(fieldNames.country, val)}
          onCodeChange={(val) => handleFormChange(fieldNames.countryCode, val)}
          isDirty={
            isFieldDirty(fieldNames.country) ||
            isFieldDirty(fieldNames.countryCode)
          }
        />
        <TextField
          label="Country Code"
          variant="outlined"
          size="small"
          value={getDisplayValue(countryCodeField as any)}
          placeholder={getPlaceholder(countryCodeField) || "(Mixed)"}
          onChange={(e) =>
            handleFormChange(fieldNames.countryCode, e.target.value)
          }
          sx={{
            width: 100,
            flexShrink: 0,
            ...getDirtyFieldSx(isFieldDirty(fieldNames.countryCode)),
          }}
          slotProps={{
            input: {
              endAdornment: (
                <ConsolidationAdornment
                  show={
                    countryCodeField?.status === "unique" &&
                    !countryCodeField.isConsolidated
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
        onLocationSet={(latlng) =>
          handleLocationSet(fieldNames.latitude, fieldNames.longitude, latlng)
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
