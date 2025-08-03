import { useMemo } from "react";
import { Box, Button, TextField, Typography, Stack } from "@mui/material";
import CountryInput from "components/CountryInput";
import { useGeotaggingContext } from "../context/GeotaggingContext";
import { AppIcons } from "config/AppIcons";
import { useSchemaContext } from "context/SchemaContext";

/**
 * A form panel for editing location details within the geotagging workflow.
 */
export const LocationFormPanel: React.FC = () => {
  const {
    isFormBusy,
    formData,
    handleFormFieldChange,
    handleApplyToSelection,
    isAnythingSelected,
  } = useGeotaggingContext();
  const { schema } = useSchemaContext();

  const labels = useMemo(() => {
    if (!schema) return {};
    return schema
      .flatMap((g) => g.fields)
      .reduce((acc, field) => {
        acc[field.key] = field.label;
        return acc;
      }, {} as Record<string, string>);
  }, [schema]);

  return (
    <Stack spacing={2} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6">Location Details</Typography>

      <TextField
        fullWidth
        label={labels.LocationCreated || ""}
        value={formData.Location || ""}
        onChange={(e) => handleFormFieldChange("Location", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected}
      />
      <TextField
        fullWidth
        label={labels.CityCreated || ""}
        value={formData.City || ""}
        onChange={(e) => handleFormFieldChange("City", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected}
      />
      <TextField
        fullWidth
        label={labels.StateCreated || ""}
        value={formData.State || ""}
        onChange={(e) => handleFormFieldChange("State", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected}
      />
      <CountryInput
        label={labels.CountryCreated || ""}
        value={formData.Country || ""}
        onChange={(country, code) => {
          handleFormFieldChange("Country", country);
          handleFormFieldChange("CountryCode", code);
        }}
        disabled={isFormBusy || !isAnythingSelected}
      />
      <TextField
        fullWidth
        label={labels.CountryCodeCreated || ""}
        value={formData.CountryCode || ""}
        onChange={(e) => handleFormFieldChange("CountryCode", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected}
      />

      <Box sx={{ flexGrow: 1 }} />

      <Button
        variant="outlined"
        startIcon={<AppIcons.ADD />}
        onClick={handleApplyToSelection}
        disabled={isFormBusy || !isAnythingSelected}
        fullWidth
      >
        Apply to Selection
      </Button>
    </Stack>
  );
};
