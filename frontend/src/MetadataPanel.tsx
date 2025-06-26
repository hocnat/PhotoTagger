import React, { useState, useEffect, useMemo, useCallback } from "react";
import { ImageMetadata } from "./types";
import MapModal from "./MapModal";
import CountryInput from "./CountryInput";

// MUI Imports
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Autocomplete,
  Chip,
  Paper,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import MapIcon from "@mui/icons-material/Map";
import SaveIcon from "@mui/icons-material/Save";

interface MetadataPanelProps {
  selectedImageNames: string[];
  folderPath: string;
  getImageUrl: (imageName: string) => string;
}

// --- Custom Hooks ---
const useSelectionMetadata = (
  selectedImageNames: string[],
  folderPath: string
) => {
  const [allMetadata, setAllMetadata] = useState<ImageMetadata[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(() => {
    if (selectedImageNames.length === 0) {
      setAllMetadata([]);
      return;
    }
    setIsLoading(true);
    const promises = selectedImageNames.map((name) => {
      const fullPath = `${folderPath}\\${name}`;
      return fetch(
        `http://localhost:5000/api/metadata?path=${encodeURIComponent(
          fullPath
        )}`
      ).then((res) =>
        res.ok ? res.json() : Promise.reject(new Error("Failed to fetch"))
      );
    });
    Promise.all(promises)
      .then(setAllMetadata)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedImageNames, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { allMetadata, isLoading, refetch };
};

const useMetadataForm = (allMetadata: ImageMetadata[]) => {
  const [formState, setFormState] = useState<Partial<ImageMetadata>>({});
  const [originalFormState, setOriginalFormState] = useState<
    Partial<ImageMetadata>
  >({});

  useEffect(() => {
    if (allMetadata.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    const newFormState: Partial<ImageMetadata> = {};
    const keys: (keyof ImageMetadata)[] = [
      "Keywords",
      "Caption",
      "Author",
      "EXIF:DateTimeOriginal",
      "EXIF:OffsetTimeOriginal",
      "DecimalLatitude",
      "DecimalLongitude",
      "XMP:Location",
      "XMP:City",
      "XMP:State",
      "XMP:Country",
      "XMP:CountryCode",
    ];
    keys.forEach((key) => {
      const firstValue = allMetadata[0]?.[key];
      const allSame = allMetadata.every(
        (meta) => JSON.stringify(meta[key]) === JSON.stringify(firstValue)
      );
      if (allSame) {
        newFormState[key] =
          key === "Keywords" && !Array.isArray(firstValue)
            ? firstValue
              ? [firstValue]
              : []
            : firstValue;
      } else {
        newFormState[key] = "(Mixed Values)" as any;
      }
    });

    setFormState(newFormState);
    setOriginalFormState(newFormState);
  }, [allMetadata]);

  const hasChanges = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(originalFormState),
    [formState, originalFormState]
  );
  return { formState, setFormState, hasChanges };
};

// --- Main Typed Component ---
const MetadataPanel: React.FC<MetadataPanelProps> = ({
  selectedImageNames,
  folderPath,
  getImageUrl,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const {
    allMetadata,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionMetadata(selectedImageNames, folderPath);
  const { formState, setFormState, hasChanges } = useMetadataForm(allMetadata);

  const handleFormChange = (fieldName: keyof ImageMetadata, newValue: any) => {
    setFormState((prevState) => ({ ...prevState, [fieldName]: newValue }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const payload = {
      files: selectedImageNames.map((name) => `${folderPath}\\${name}`),
      metadata: formState,
    };
    fetch("http://localhost:5000/api/save_metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        res.ok ? res.json() : res.json().then((err) => Promise.reject(err))
      )
      .then((data) => {
        console.log("Save successful:", data.message);
        refetch();
      })
      .catch((err) =>
        alert(`Error saving metadata: ${err.details || "Unknown error"}`)
      )
      .finally(() => setIsSaving(false));
  };

  const handleLocationSet = (latlng: { lat: number; lng: number }) => {
    setFormState((prev) => ({
      ...prev,
      DecimalLatitude: latlng.lat,
      DecimalLongitude: latlng.lng,
    }));
  };

  const getDateTimeObject = (): Date | null => {
    const dateStr = formState["EXIF:DateTimeOriginal"];
    if (
      !dateStr ||
      typeof dateStr !== "string" ||
      dateStr === "(Mixed Values)"
    ) {
      return null;
    }
    // Convert to "YYYY-MM-DDTHH:MM:SS"
    const parsableDateStr =
      dateStr.substring(0, 10).replace(/:/g, "-") + "T" + dateStr.substring(11);

    const date = new Date(parsableDateStr);

    return isNaN(date.getTime()) ? null : date;
  };

  if (selectedImageNames.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select an image to view its metadata.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Paper elevation={3} sx={{ mb: 2, overflow: "hidden" }}>
        <ImagePreview
          imageUrl={getImageUrl(
            selectedImageNames[selectedImageNames.length - 1]
          )}
        />
      </Paper>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6">Metadata</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedImageNames.length} item(s) selected
        </Typography>
      </Box>

      {isMetadataLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box component="form" sx={{ flexGrow: 1, overflowY: "auto", pr: 1 }}>
          <FormSection title="Content">
            <TextField
              label="Caption / Description"
              variant="outlined"
              size="small"
              value={
                formState.Caption !== "(Mixed Values)"
                  ? formState.Caption ?? ""
                  : ""
              }
              placeholder={
                formState.Caption === "(Mixed Values)" ? "(Mixed Values)" : ""
              }
              onChange={(e) => handleFormChange("Caption", e.target.value)}
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={
                Array.isArray(formState.Keywords) ? formState.Keywords : []
              }
              onChange={(e, val) => handleFormChange("Keywords", val)}
              renderTags={(val, props) =>
                val.map((opt, i) => (
                  <Chip
                    variant="outlined"
                    label={opt}
                    {...props({ index: i })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Keywords"
                  variant="outlined"
                  size="small"
                  placeholder={
                    formState.Keywords === "(Mixed Values)"
                      ? "Overwrite mixed values..."
                      : "Add..."
                  }
                />
              )}
            />
          </FormSection>

          <FormSection title="When">
            <Box sx={{ display: "flex", gap: 2 }}>
              <DateTimePicker
                label="Date Taken"
                value={getDateTimeObject()}
                onChange={(date) =>
                  handleFormChange(
                    "EXIF:DateTimeOriginal",
                    date
                      ? `${date.getFullYear()}:${(date.getMonth() + 1)
                          .toString()
                          .padStart(2, "0")}:${date
                          .getDate()
                          .toString()
                          .padStart(2, "0")} ${date
                          .getHours()
                          .toString()
                          .padStart(2, "0")}:${date
                          .getMinutes()
                          .toString()
                          .padStart(2, "0")}:${date
                          .getSeconds()
                          .toString()
                          .padStart(2, "0")}`
                      : ""
                  )
                }
                ampm={false}
                format="yyyy-MM-dd HH:mm:ss"
                slotProps={{
                  textField: {
                    size: "small",
                    variant: "outlined",
                    fullWidth: true,
                  },
                }}
                sx={{ width: "100%" }}
              />
              <TextField
                label="Time Zone"
                variant="outlined"
                size="small"
                value={
                  formState["EXIF:OffsetTimeOriginal"] !== "(Mixed Values)"
                    ? formState["EXIF:OffsetTimeOriginal"] ?? ""
                    : ""
                }
                placeholder={
                  formState["EXIF:OffsetTimeOriginal"] === "(Mixed Values)"
                    ? "Mixed"
                    : "+01:00"
                }
                onChange={(e) =>
                  handleFormChange("EXIF:OffsetTimeOriginal", e.target.value)
                }
                sx={{ width: 120 }}
              />
            </Box>
          </FormSection>

          <FormSection title="Where">
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="GPS Latitude"
                variant="outlined"
                size="small"
                value={
                  formState.DecimalLatitude !== "(Mixed Values)"
                    ? formState.DecimalLatitude ?? ""
                    : ""
                }
                placeholder={
                  formState.DecimalLatitude === "(Mixed Values)"
                    ? "(Mixed Values)"
                    : ""
                }
                onChange={(e) =>
                  handleFormChange("DecimalLatitude", e.target.value)
                }
              />
              <TextField
                label="GPS Longitude"
                variant="outlined"
                size="small"
                value={
                  formState.DecimalLongitude !== "(Mixed Values)"
                    ? formState.DecimalLongitude ?? ""
                    : ""
                }
                placeholder={
                  formState.DecimalLongitude === "(Mixed Values)"
                    ? "(Mixed Values)"
                    : ""
                }
                onChange={(e) =>
                  handleFormChange("DecimalLongitude", e.target.value)
                }
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
              label="Sublocation"
              variant="outlined"
              size="small"
              value={
                formState["XMP:Location"] !== "(Mixed Values)"
                  ? formState["XMP:Location"] ?? ""
                  : ""
              }
              placeholder={
                formState["XMP:Location"] === "(Mixed Values)"
                  ? "(Mixed Values)"
                  : ""
              }
              onChange={(e) => handleFormChange("XMP:Location", e.target.value)}
            />
            <TextField
              label="City"
              variant="outlined"
              size="small"
              value={
                formState["XMP:City"] !== "(Mixed Values)"
                  ? formState["XMP:City"] ?? ""
                  : ""
              }
              placeholder={
                formState["XMP:City"] === "(Mixed Values)"
                  ? "(Mixed Values)"
                  : ""
              }
              onChange={(e) => handleFormChange("XMP:City", e.target.value)}
            />
            <TextField
              label="State/Province"
              variant="outlined"
              size="small"
              value={
                formState["XMP:State"] !== "(Mixed Values)"
                  ? formState["XMP:State"] ?? ""
                  : ""
              }
              placeholder={
                formState["XMP:State"] === "(Mixed Values)"
                  ? "(Mixed Values)"
                  : ""
              }
              onChange={(e) => handleFormChange("XMP:State", e.target.value)}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <CountryInput
                label="Country"
                countryValue={
                  formState["XMP:Country"] !== "(Mixed Values)"
                    ? formState["XMP:Country"] ?? ""
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
                  formState["XMP:CountryCode"] !== "(Mixed Values)"
                    ? formState["XMP:CountryCode"] ?? ""
                    : ""
                }
                placeholder={
                  formState["XMP:CountryCode"] === "(Mixed Values)"
                    ? "(Mixed)"
                    : ""
                }
                onChange={(e) =>
                  handleFormChange("XMP:CountryCode", e.target.value)
                }
                sx={{ width: 100 }}
              />
            </Box>
          </FormSection>

          <FormSection title="Who">
            <TextField
              label="Author / By-line"
              variant="outlined"
              size="small"
              value={
                formState.Author !== "(Mixed Values)"
                  ? formState.Author ?? ""
                  : ""
              }
              placeholder={
                formState.Author === "(Mixed Values)" ? "(Mixed Values)" : ""
              }
              onChange={(e) => handleFormChange("Author", e.target.value)}
            />
          </FormSection>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            startIcon={
              isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ mt: 2 }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      )}
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={handleLocationSet}
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
    </Box>
  );
};

// --- Helper Components ---
const ImagePreview: React.FC<{ imageUrl: string | null }> = ({ imageUrl }) => {
  if (!imageUrl)
    return <Box className="image-preview-placeholder">No image selected</Box>;
  return (
    <Box
      component="img"
      src={imageUrl}
      sx={{ width: "100%", height: 200, objectFit: "contain" }}
    />
  );
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <>
    <Divider sx={{ my: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
    </Divider>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {children}
    </Box>
  </>
);

export default MetadataPanel;
