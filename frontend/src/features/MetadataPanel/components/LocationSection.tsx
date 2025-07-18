import { useState, useMemo } from "react";
import { LocationPresetData } from "types";
import {
  Box,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  Stack,
} from "@mui/material";
import { LatLng } from "leaflet";

import { useLocationPresetsContext } from "context/LocationPresetsContext";
import FormSection from "./FormSection";
import CountryInput from "components/CountryInput";
import MapModal from "components/MapModal";
import { PromptDialog } from "components/PromptDialog";
import ConsolidationAdornment from "./ConsolidationAdornment";
import ConsolidationIndicator from "./ConsolidationIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";
import { AppIcons } from "config/AppIcons";

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
  const { presets, addPreset, trackUsage } = useLocationPresetsContext();

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

  const handleSavePreset = (presetName: string) => {
    const dataToSave: LocationPresetData = {};
    for (const [key, field] of Object.entries(locationData)) {
      if (field.status === "unique") {
        (dataToSave as any)[key] = field.value || "";
      }
    }

    if (Object.values(dataToSave).some((val) => val !== "")) {
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
          onClick={() => setSaveDialogOpen(true)}
          disabled={!locationFieldsPopulated}
          title="Save current location as a preset"
        >
          <AppIcons.BOOKMARK />
        </IconButton>
      </Box>

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
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            flexGrow: 1,
            ...getDirtyFieldSx(
              isFieldDirty(dataBlockName, "Country") ||
                isFieldDirty(dataBlockName, "CountryCode")
            ),
          }}
        >
          <CountryInput
            label="Country"
            value={getDisplayValue(Country)}
            onChange={(country, code) => {
              handleFieldChange(dataBlockName, "Country", country);
              handleFieldChange(dataBlockName, "CountryCode", code);
            }}
          />
          {Country.status === "unique" && !Country.isConsolidated && (
            <ConsolidationIndicator />
          )}
        </Stack>
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
      <PromptDialog
        isOpen={isSaveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSavePreset}
        title="Save Location Preset"
        message="Enter a name for this location preset."
        label="Preset Name"
      />
    </FormSection>
  );
};

export default LocationSection;
