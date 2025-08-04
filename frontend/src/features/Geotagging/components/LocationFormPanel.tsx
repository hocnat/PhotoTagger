import { useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
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
    protectedImageFormData,
    isSelectionProtected,
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

  const displayData = isSelectionProtected ? protectedImageFormData : formData;

  return (
    <Stack spacing={2} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6">Location Details</Typography>

      {isSelectionProtected && (
        <Alert severity="info">
          This image has existing GPS data and is protected. Data shown is from
          the file's metadata.
        </Alert>
      )}

      <TextField
        fullWidth
        label={labels.LocationCreated || ""}
        value={displayData?.Location || ""}
        onChange={(e) => handleFormFieldChange("Location", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
      />
      <TextField
        fullWidth
        label={labels.CityCreated || ""}
        value={displayData?.City || ""}
        onChange={(e) => handleFormFieldChange("City", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
      />
      <TextField
        fullWidth
        label={labels.StateCreated || ""}
        value={displayData?.State || ""}
        onChange={(e) => handleFormFieldChange("State", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
      />
      <CountryInput
        label={labels.CountryCreated || ""}
        value={displayData?.Country || ""}
        onChange={(country, code) => {
          handleFormFieldChange("Country", country);
          handleFormFieldChange("CountryCode", code);
        }}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
      />
      <TextField
        fullWidth
        label={labels.CountryCodeCreated || ""}
        value={displayData?.CountryCode || ""}
        onChange={(e) => handleFormFieldChange("CountryCode", e.target.value)}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
      />

      <Box sx={{ flexGrow: 1 }} />

      <Button
        variant="outlined"
        startIcon={<AppIcons.ADD />}
        onClick={handleApplyToSelection}
        disabled={isFormBusy || !isAnythingSelected || isSelectionProtected}
        fullWidth
      >
        Apply to Selection
      </Button>
    </Stack>
  );
};
