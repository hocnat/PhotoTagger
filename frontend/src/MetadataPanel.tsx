import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FormState, ImageFile, RawImageMetadata, Keyword } from "./types";
import ImageModal from "./ImageModal";
import MapModal from "./MapModal";
import CountryInput from "./CountryInput";

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
import VisibilityIcon from "@mui/icons-material/Visibility";

interface MetadataPanelProps {
  selectedImageNames: string[];
  folderPath: string;
  getImageUrl: (imageName: string) => string;
}

const useSelectionData = (selectedImageNames: string[], folderPath: string) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(() => {
    if (selectedImageNames.length === 0) {
      setImageFiles([]);
      return;
    }
    setIsLoading(true);
    const filesToFetch = selectedImageNames.map(
      (name) => `${folderPath}\\${name}`
    );

    fetch(`http://localhost:5000/api/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: filesToFetch }),
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch metadata"))
      )
      .then((data: ImageFile[]) => setImageFiles(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedImageNames, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { imageFiles, isLoading, refetch };
};

const useMetadataForm = (imageFiles: ImageFile[]) => {
  const [formState, setFormState] = useState<Partial<FormState>>({});
  const [originalFormState, setOriginalFormState] = useState<
    Partial<FormState>
  >({});

  useEffect(() => {
    if (imageFiles.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    const newFormState: Partial<FormState> = {};
    const simpleKeys: (keyof Omit<FormState, "Keywords">)[] = [
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

    simpleKeys.forEach((key) => {
      const firstValue = imageFiles[0]?.metadata[key];
      const allSame = imageFiles.every(
        (file) =>
          JSON.stringify(file.metadata[key]) === JSON.stringify(firstValue)
      );
      (newFormState as any)[key] = allSame ? firstValue : "(Mixed Values)";
    });

    const allKeywords = new Set<string>();
    imageFiles.forEach((file) => {
      (file.metadata.Keywords || []).forEach((kw) => allKeywords.add(kw));
    });

    const commonKeywords = new Set<string>(
      imageFiles[0]?.metadata.Keywords || []
    );
    for (let i = 1; i < imageFiles.length; i++) {
      const currentKeywords = new Set<string>(
        imageFiles[i].metadata.Keywords || []
      );
      commonKeywords.forEach((commonKw) => {
        if (!currentKeywords.has(commonKw)) {
          commonKeywords.delete(commonKw);
        }
      });
    }

    newFormState.Keywords = Array.from(allKeywords).map((name) => ({
      name,
      status: commonKeywords.has(name) ? "common" : "partial",
    }));

    setFormState(newFormState);
    setOriginalFormState(newFormState);
  }, [imageFiles]);

  const hasChanges = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(originalFormState),
    [formState, originalFormState]
  );

  return { formState, setFormState, hasChanges, originalFormState };
};

const MetadataPanel: React.FC<MetadataPanelProps> = ({
  selectedImageNames,
  folderPath,
  getImageUrl,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const {
    imageFiles,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionData(selectedImageNames, folderPath);
  const { formState, setFormState, hasChanges, originalFormState } =
    useMetadataForm(imageFiles);

  const handleFormChange = (fieldName: keyof FormState, newValue: any) => {
    setFormState((prevState) => ({ ...prevState, [fieldName]: newValue }));
  };

  const handleSave = () => {
    setIsSaving(true);

    const originalKeywords = (
      Array.isArray(originalFormState.Keywords)
        ? originalFormState.Keywords
        : []
    ).map((kw) => kw.name);
    const currentKeywords = (
      Array.isArray(formState.Keywords) ? formState.Keywords : []
    ).map((kw) => kw.name);

    const addedKeywords = new Set(
      currentKeywords.filter((kw) => !originalKeywords.includes(kw))
    );
    const removedKeywords = new Set(
      originalKeywords.filter((kw) => !currentKeywords.includes(kw))
    );

    const files_to_update = imageFiles.map((file) => {
      const existingKeywords = new Set(file.metadata.Keywords || []);

      removedKeywords.forEach((kw) => existingKeywords.delete(kw));
      addedKeywords.forEach((kw) => existingKeywords.add(kw));

      const finalKeywordsForFile = Array.from(existingKeywords);

      const metadata_for_file: Partial<RawImageMetadata> = {};

      metadata_for_file.Keywords = finalKeywordsForFile;

      Object.keys(formState).forEach((key) => {
        if (
          key !== "Keywords" &&
          formState[key as keyof FormState] !== "(Mixed Values)"
        ) {
          (metadata_for_file as any)[key] = formState[key as keyof FormState];
        }
      });

      return {
        path: `${folderPath}\\${file.filename}`,
        metadata: metadata_for_file,
      };
    });

    const payload = {
      files_to_update,
      keywords_to_learn: Array.from(addedKeywords),
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
    if (!dateStr || typeof dateStr !== "string" || dateStr === "(Mixed Values)")
      return null;
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

  const previewImageName =
    selectedImageNames.length === 1 ? selectedImageNames[0] : null;

  return (
    <Box
      sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}
    >
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

      {isPreviewOpen && previewImageName && (
        <ImageModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          imageUrl={getImageUrl(previewImageName)}
          imageName={previewImageName}
        />
      )}

      {isMetadataLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          component="form"
          sx={{ flexGrow: 1, overflowY: "auto", pr: 1, pl: 1, ml: -1 }}
        >
          {selectedImageNames.length === 1 && (
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setIsPreviewOpen(true)}
              fullWidth
              sx={{ mb: 2 }}
            >
              Show Large Preview
            </Button>
          )}

          <FormSection title="Content">
            <TextField
              label="Caption / Description"
              variant="outlined"
              size="small"
              fullWidth
              value={
                typeof formState.Caption === "string" &&
                formState.Caption !== "(Mixed Values)"
                  ? formState.Caption
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
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option.name
              }
              isOptionEqualToValue={(option, value) =>
                option.name === value.name
              }
              value={
                Array.isArray(formState.Keywords) ? formState.Keywords : []
              }
              onChange={(event, newValue) => {
                const newKeywords = newValue.map((item) =>
                  typeof item === "string"
                    ? { name: item, status: "common" }
                    : item
                );
                handleFormChange("Keywords", newKeywords);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant={option.status === "common" ? "filled" : "outlined"}
                    label={option.name}
                    size="small"
                    sx={
                      option.status === "partial"
                        ? { fontStyle: "italic", opacity: 0.7 }
                        : {}
                    }
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  size="small"
                  label="Keywords"
                  placeholder="Add or edit keywords..."
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
                views={["year", "month", "day", "hours", "minutes", "seconds"]}
                timeSteps={{ minutes: 1, seconds: 1 }}
                slotProps={{
                  textField: { size: "small", variant: "outlined" },
                }}
              />
              <TextField
                label="Time Zone"
                variant="outlined"
                size="small"
                value={
                  typeof formState["EXIF:OffsetTimeOriginal"] === "string" &&
                  formState["EXIF:OffsetTimeOriginal"] !== "(Mixed Values)"
                    ? formState["EXIF:OffsetTimeOriginal"]
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
                sx={{ width: 120, flexShrink: 0 }}
              />
            </Box>
          </FormSection>

          <FormSection title="Where">
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="GPS Latitude"
                variant="outlined"
                size="small"
                fullWidth
                value={
                  typeof formState.DecimalLatitude === "number"
                    ? formState.DecimalLatitude
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
                fullWidth
                value={
                  typeof formState.DecimalLongitude === "number"
                    ? formState.DecimalLongitude
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
              fullWidth
              value={
                typeof formState["XMP:Location"] === "string" &&
                formState["XMP:Location"] !== "(Mixed Values)"
                  ? formState["XMP:Location"]
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
              fullWidth
              value={
                typeof formState["XMP:City"] === "string" &&
                formState["XMP:City"] !== "(Mixed Values)"
                  ? formState["XMP:City"]
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
              fullWidth
              value={
                typeof formState["XMP:State"] === "string" &&
                formState["XMP:State"] !== "(Mixed Values)"
                  ? formState["XMP:State"]
                  : ""
              }
              placeholder={
                formState["XMP:State"] === "(Mixed Values)"
                  ? "(Mixed Values)"
                  : ""
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
                  formState["XMP:CountryCode"] === "(Mixed Values)"
                    ? "(Mixed)"
                    : ""
                }
                onChange={(e) =>
                  handleFormChange("XMP:CountryCode", e.target.value)
                }
                sx={{ width: 100, flexShrink: 0 }}
              />
            </Box>
          </FormSection>

          <FormSection title="Who">
            <TextField
              label="Author / By-line"
              variant="outlined"
              size="small"
              fullWidth
              value={
                typeof formState.Author === "string" &&
                formState.Author !== "(Mixed Values)"
                  ? formState.Author
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
