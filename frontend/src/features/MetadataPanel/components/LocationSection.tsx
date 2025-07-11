import { useState, useMemo } from "react";
import {
  SectionProps,
  LocationPresetData,
  MetadataValue,
  FormState,
  LocationFieldKeys,
} from "types";
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

import FormSection from "./FormSection";
import CountryInput from "./CountryInput";
import MapModal from "./MapModal";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { useLocationPresets } from "../hooks/useLocationPresets";
import { getFieldData } from "../utils/metadataUtils";
import { getDirtyFieldSx } from "../utils/styleUtils";

interface LocationFieldNamesMap {
  latitude: LocationFieldKeys;
  longitude: LocationFieldKeys;
  location: LocationFieldKeys;
  city: LocationFieldKeys;
  state: LocationFieldKeys;
  country: LocationFieldKeys;
  countryCode: LocationFieldKeys;
}

interface LocationSectionProps extends SectionProps {
  title: string;
  fieldNames: LocationFieldNamesMap;
  onLocationSet: (
    latFieldName: keyof FormState,
    lonFieldName: keyof FormState,
    latlng: { lat: number; lng: number }
  ) => void;
  applyLocationPreset: (
    data: LocationPresetData,
    targetFields: LocationFieldNamesMap
  ) => void;
  isFieldDirty: (fieldName: keyof FormState) => boolean;
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
  title,
  fieldNames,
  onLocationSet,
  applyLocationPreset,
  isFieldDirty,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSaveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { presets, addPreset, trackUsage } = useLocationPresets();

  const latitudeData = getFieldData(formState[fieldNames.latitude], "");
  const longitudeData = getFieldData(formState[fieldNames.longitude], "");
  const cityData = getFieldData(formState[fieldNames.city], "");
  const countryData = getFieldData(formState[fieldNames.country], "");
  const countryCodeData = getFieldData(formState[fieldNames.countryCode], "");

  const gpsDisplayValue = useMemo(() => {
    if (
      formState[fieldNames.latitude] === "(Mixed Values)" ||
      formState[fieldNames.longitude] === "(Mixed Values)"
    ) {
      return "(Mixed Values)";
    }
    if (latitudeData.value && longitudeData.value) {
      return `${latitudeData.value}, ${longitudeData.value}`;
    }
    return "";
  }, [formState, fieldNames, latitudeData, longitudeData]);

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
      if (
        field &&
        typeof field === "object" &&
        "value" in field &&
        field.value
      ) {
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

  const locationFieldsPopulated =
    (String(latitudeData.value || "").trim() !== "" &&
      String(longitudeData.value || "").trim() !== "") ||
    String(cityData.value || "").trim() !== "" ||
    String(countryData.value || "").trim() !== "";

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
            ? "(Mixed Values)"
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
                  !latitudeData.isConsolidated || !longitudeData.isConsolidated
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
        const fieldData = getFieldData(
          formState[formKey] as MetadataValue<string> | "(Mixed Values)",
          ""
        );
        return (
          <TextField
            key={formKey}
            fullWidth
            label={label}
            variant="outlined"
            size="small"
            value={
              formState[formKey] === "(Mixed Values)"
                ? ""
                : fieldData.value || ""
            }
            placeholder={
              formState[formKey] === "(Mixed Values)" ? "(Mixed Values)" : ""
            }
            onChange={(e) => handleFormChange(formKey, e.target.value)}
            sx={getDirtyFieldSx(isFieldDirty(formKey))}
            slotProps={{
              input: {
                endAdornment: (
                  <ConsolidationAdornment show={!fieldData.isConsolidated} />
                ),
              },
            }}
          />
        );
      })}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={countryData.value || ""}
          isConsolidated={countryData.isConsolidated}
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
          value={countryCodeData.value || ""}
          placeholder={
            formState[fieldNames.countryCode] === "(Mixed Values)"
              ? "(Mixed)"
              : ""
          }
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
                  show={!countryCodeData.isConsolidated}
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
          onLocationSet(fieldNames.latitude, fieldNames.longitude, latlng)
        }
        initialCoords={parseGpsString(gpsDisplayValue)}
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
