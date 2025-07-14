import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  Switch,
  Grid,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";
import * as apiService from "api/apiService";
import {
  Placemark,
  LocationPresetData,
  ApiError,
  EnrichedCoordinate,
} from "types";
import { useNotification } from "hooks/useNotification";
import { useSettings } from "features/SettingsDialog/hooks/useSettings";

type ImportStep =
  | "url"
  | "fetching"
  | "select"
  | "enriching"
  | "review"
  | "conflict"
  | "saving";

// The state for the review step is a combination of the original name and the editable preset data
interface ReviewItem {
  name: string;
  data: LocationPresetData;
}

interface Conflict {
  name: string;
  resolution: "skip" | "overwrite";
}

interface LocationImporterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const LocationImporterDialog: React.FC<LocationImporterDialogProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<ImportStep>("url");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [placemarks, setPlacemarks] = useState<Placemark[]>([]);
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [reviewData, setReviewData] = useState<ReviewItem[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const { showNotification } = useNotification();
  const { settings } = useSettings();

  const getCountryCode = (countryName: string): string => {
    if (!countryName || !settings?.countryMappings) return "";
    const matchedCountry = settings.countryMappings.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    return matchedCountry ? matchedCountry.code : "";
  };

  const resetState = () => {
    setStep("url");
    setUrl("");
    setError(null);
    setPlacemarks([]);
    setSelection({});
    setReviewData([]);
    setConflicts([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setError(null);
    setStep("fetching");
    try {
      const fetchedPlacemarks = await apiService.fetchLocationsFromUrl(url);
      if (fetchedPlacemarks.length === 0) {
        setError("No importable locations were found in the provided map.");
        setStep("url");
        return;
      }
      setPlacemarks(fetchedPlacemarks);
      const initialSelection = fetchedPlacemarks.reduce(
        (acc, p) => ({ ...acc, [p.name]: true }),
        {} as Record<string, boolean>
      );
      setSelection(initialSelection);
      setStep("select");
    } catch (err: any) {
      setError((err as ApiError)?.message || "An unexpected error occurred.");
      setStep("url");
    }
  };

  const handleEnrich = async () => {
    setError(null);
    setStep("enriching");
    const selectedPlacemarks = placemarks.filter((p) => selection[p.name]);
    try {
      const enrichedCoords: EnrichedCoordinate[] =
        await apiService.enrichCoordinates(selectedPlacemarks);

      const placemarkNameMap = new Map(
        selectedPlacemarks.map((p) => [`${p.latitude},${p.longitude}`, p.name])
      );

      const dataForReview: ReviewItem[] = enrichedCoords.map((location) => {
        const name =
          placemarkNameMap.get(`${location.latitude},${location.longitude}`) ||
          "Unknown";
        return {
          name: name,
          data: {
            Latitude: String(location.latitude),
            Longitude: String(location.longitude),
            Location: name,
            City: location.city,
            State: location.state,
            Country: location.country,
            CountryCode: location.countryCode,
          },
        };
      });
      setReviewData(dataForReview);
      setStep("review");
    } catch (err: any) {
      setError((err as ApiError)?.message || "Failed to enrich location data.");
      setStep("select");
    }
  };

  const handleSave = async () => {
    setError(null);
    const existingPresets = await apiService.getLocationPresets();
    const existingNames = new Set(existingPresets.map((p) => p.name));

    const newConflicts = reviewData
      .filter((item) => existingNames.has(item.name))
      .map((item) => ({ name: item.name, resolution: "skip" as const }));

    if (newConflicts.length > 0) {
      setConflicts(newConflicts);
      setStep("conflict");
    } else {
      await performSave(reviewData);
    }
  };

  const handleConfirmConflicts = async () => {
    const toSave: ReviewItem[] = [];
    const toSkip = new Set(
      conflicts.filter((c) => c.resolution === "skip").map((c) => c.name)
    );

    reviewData.forEach((item) => {
      if (!toSkip.has(item.name)) {
        toSave.push(item);
      }
    });

    await performSave(toSave);
  };

  const performSave = async (itemsToSave: ReviewItem[]) => {
    setStep("saving");
    try {
      for (const item of itemsToSave) {
        await apiService.saveLocationPreset(item.name, item.data);
      }
      showNotification(
        `${itemsToSave.length} location preset(s) saved successfully!`,
        "success"
      );
      onImportSuccess();
    } catch (err: any) {
      setError(
        (err as ApiError)?.message || "An error occurred while saving presets."
      );
      setStep("review");
    }
  };

  const handleEditReviewData = (
    index: number,
    field: keyof LocationPresetData,
    value: string
  ) => {
    setReviewData((currentData) =>
      currentData.map((item, i) => {
        if (i === index) {
          const updatedData = { ...item.data, [field]: value };
          if (field === "Country") {
            updatedData.CountryCode = getCountryCode(value);
          }
          return { ...item, data: updatedData };
        }
        return item;
      })
    );
  };

  const handleResolutionChange = (
    name: string,
    resolution: "skip" | "overwrite"
  ) => {
    setConflicts((prev) =>
      prev.map((c) => (c.name === name ? { ...c, resolution } : c))
    );
  };

  const renderUrlStep = () => (
    <>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Paste a shareable link to a Google MyMaps project.
      </Typography>
      <TextField
        autoFocus
        margin="dense"
        id="url"
        label="Google MyMaps URL"
        type="url"
        fullWidth
        variant="outlined"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={step === "fetching"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) {
            e.stopPropagation();
            handleFetch();
          }
        }}
      />
    </>
  );
  const renderSelectStep = () => (
    <>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Found {placemarks.length} locations. Select the ones you wish to import.
      </Typography>
      <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
        <Button
          onClick={() =>
            setSelection(
              placemarks.reduce((acc, p) => ({ ...acc, [p.name]: true }), {})
            )
          }
          size="small"
        >
          Select All
        </Button>
        <Button onClick={() => setSelection({})} size="small">
          Deselect All
        </Button>
      </Box>
      <List
        dense
        sx={{
          width: "100%",
          maxHeight: 400,
          overflow: "auto",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {placemarks.map((p) => (
          <ListItem
            key={p.name}
            secondaryAction={
              <Switch
                edge="end"
                onChange={() =>
                  setSelection((prev) => ({ ...prev, [p.name]: !prev[p.name] }))
                }
                checked={selection[p.name] || false}
              />
            }
            disablePadding
          >
            <Box sx={{ pl: 2, flexGrow: 1 }}>
              <ListItemText primary={p.name} />
            </Box>
          </ListItem>
        ))}
      </List>
    </>
  );
  const renderEnrichingStep = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "200px",
      }}
    >
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Fetching location details...</Typography>
      <Typography variant="caption" color="text.secondary">
        To respect fair use policies, we are processing one location per second.
      </Typography>
    </Box>
  );

  const renderReviewStep = () => (
    <>
      <Typography>
        Review and edit the location details before saving.
      </Typography>
      <Box sx={{ maxHeight: 400, overflowY: "auto", my: 2 }}>
        {reviewData.map((item, index) => (
          <Box
            key={index}
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1,
              mb: 1,
            }}
          >
            <Typography variant="h6">{item.name}</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Location"
                  value={item.data.Location || ""}
                  onChange={(e) =>
                    handleEditReviewData(index, "Location", e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="City"
                  value={item.data.City || ""}
                  onChange={(e) =>
                    handleEditReviewData(index, "City", e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="State"
                  value={item.data.State || ""}
                  onChange={(e) =>
                    handleEditReviewData(index, "State", e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Country"
                  value={item.data.Country || ""}
                  onChange={(e) =>
                    handleEditReviewData(index, "Country", e.target.value)
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Country Code"
                  value={item.data.CountryCode || ""}
                  onChange={(e) =>
                    handleEditReviewData(index, "CountryCode", e.target.value)
                  }
                />
              </Grid>
            </Grid>
          </Box>
        ))}
      </Box>
    </>
  );

  const renderConflictStep = () => (
    <>
      <Typography color="error">
        The following location presets already exist.
      </Typography>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Choose whether to overwrite the existing preset or skip importing the
        new one.
      </Typography>
      <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
        {conflicts.map((conflict) => (
          <Box
            key={conflict.name}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 1,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography>{conflict.name}</Typography>
            <RadioGroup
              row
              value={conflict.resolution}
              onChange={(e) =>
                handleResolutionChange(
                  conflict.name,
                  e.target.value as "skip" | "overwrite"
                )
              }
            >
              <FormControlLabel value="skip" control={<Radio />} label="Skip" />
              <FormControlLabel
                value="overwrite"
                control={<Radio />}
                label="Overwrite"
              />
            </RadioGroup>
          </Box>
        ))}
      </Box>
    </>
  );

  const renderContent = () => {
    switch (step) {
      case "url":
      case "fetching":
        return renderUrlStep();
      case "select":
        return renderSelectStep();
      case "enriching":
        return renderEnrichingStep();
      case "review":
        return renderReviewStep();
      case "conflict":
        return renderConflictStep();
      case "saving":
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Saving...</Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const renderActions = () => {
    const selectedCount = Object.values(selection).filter(Boolean).length;
    switch (step) {
      case "url":
        return (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleFetch}
              variant="contained"
              disabled={!url.trim()}
            >
              Fetch Places
            </Button>
          </>
        );
      case "fetching":
        return (
          <Button disabled variant="contained">
            <CircularProgress size={24} sx={{ mr: 1 }} />
            Fetching...
          </Button>
        );
      case "select":
        return (
          <>
            <Button onClick={() => setStep("url")}>Back</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              disabled={selectedCount === 0}
              onClick={handleEnrich}
            >
              Get Location Details ({selectedCount})
            </Button>
          </>
        );
      case "review":
        return (
          <>
            <Button onClick={() => setStep("select")}>Back</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" onClick={handleSave}>
              Save Presets
            </Button>
          </>
        );
      case "conflict":
        return (
          <>
            <Button onClick={() => setStep("review")}>Back</Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button variant="contained" onClick={handleConfirmConflicts}>
              Confirm & Save
            </Button>
          </>
        );
      default:
        return <Button onClick={handleClose}>Close</Button>;
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableRestoreFocus
    >
      <DialogTitle>Import Location Presets from Google MyMaps</DialogTitle>
      <DialogContent sx={{ minHeight: "200px" }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {renderContent()}
      </DialogContent>
      <DialogActions sx={{ p: "16px 24px" }}>{renderActions()}</DialogActions>
    </Dialog>
  );
};
