import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as apiService from "api/apiService";
import {
  ImageFile,
  GpxMatchResult,
  LocationPresetData,
  SaveMetadataPayload,
  FileUpdatePayload,
} from "types";
import { useNotification } from "hooks/useNotification";
import { useSettingsContext } from "context/SettingsContext";

interface UseGeotaggerProps {
  gpxContent: string;
  images: ImageFile[];
  folderPath: string;
  onSaveSuccess: (updatedFilePaths: string[]) => void;
  onClose: () => void;
}

const EMPTY_FORM_DATA: LocationPresetData = {
  Location: "",
  City: "",
  State: "",
  Country: "",
  CountryCode: "",
};

/**
 * Manages the business logic for the geotagging feature. It fetches the
 * GPS matches, handles the form state, stages changes, and saves the data.
 */
export const useGeotagger = ({
  gpxContent,
  images,
  folderPath,
  onSaveSuccess,
  onClose,
}: UseGeotaggerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<GpxMatchResult | null>(null);

  const [selectedFilenames, setSelectedFilenames] = useState<Set<string>>(
    new Set()
  );
  const [isFormBusy, setIsFormBusy] = useState(false);
  const [formData, setFormData] = useState<LocationPresetData>(EMPTY_FORM_DATA);
  const [stagedChanges, setStagedChanges] = useState<
    Map<string, LocationPresetData>
  >(new Map());
  const lastSelectedFilenameRef = useRef<string | null>(null);

  const { showNotification } = useNotification();
  const { settings } = useSettingsContext();
  const orderedFilenames = useMemo(
    () => images.map((img) => img.filename),
    [images]
  );
  const isAnythingSelected = selectedFilenames.size > 0;
  const hasChanges = stagedChanges.size > 0;

  const unmatchableFilenames = useMemo(() => {
    const filenames = new Set<string>();
    images.forEach((image) => {
      if (
        !image.metadata.DateTimeOriginal?.value ||
        !image.metadata.OffsetTimeOriginal?.value
      ) {
        filenames.add(image.filename);
      }
    });
    return filenames;
  }, [images]);

  useEffect(() => {
    if (!settings) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);

      const filesToMatch = images
        .filter((image) => !unmatchableFilenames.has(image.filename))
        .map((img) => ({
          filename: img.filename,
          dateTime: img.metadata.DateTimeOriginal!.value,
          offsetTime: img.metadata.OffsetTimeOriginal!.value,
        }));

      if (unmatchableFilenames.size > 0) {
        showNotification(
          `${unmatchableFilenames.size} image(s) could not be processed due to missing date or timezone metadata.`,
          "warning"
        );
      }

      if (filesToMatch.length === 0) {
        setError(
          "No images with complete date and timezone information were selected."
        );
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiService.matchGpxTrack({
          gpxContent,
          files: filesToMatch,
          gpxTimeThreshold: settings.geotaggingSettings.gpxTimeThreshold,
        });
        setMatchResult(result);
      } catch (err: any) {
        const errorMessage =
          err.message ||
          "An unknown error occurred while matching the GPX track.";
        setError(errorMessage);
        showNotification(errorMessage, "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMatches();
  }, [gpxContent, images, showNotification, unmatchableFilenames, settings]);

  useEffect(() => {
    let isCancelled = false;
    const fetchGeocoding = async (match: any) => {
      setIsFormBusy(true);
      try {
        const [enriched] = await apiService.enrichCoordinates([
          match.coordinates!,
        ]);
        if (!isCancelled && enriched) {
          setFormData({
            Location: "",
            City: enriched.city,
            State: enriched.state,
            Country: enriched.country,
            CountryCode: enriched.countryCode,
          });
        }
      } catch (err) {
        if (!isCancelled) {
          showNotification("Reverse geocoding failed.", "warning");
          setFormData(EMPTY_FORM_DATA);
        }
      } finally {
        if (!isCancelled) {
          setIsFormBusy(false);
        }
      }
    };

    if (!isAnythingSelected) {
      setFormData(EMPTY_FORM_DATA);
    } else {
      const firstSelected = orderedFilenames.find((f) =>
        selectedFilenames.has(f)
      );
      if (firstSelected) {
        const match = matchResult?.matches.find(
          (m) => m.filename === firstSelected
        );
        if (match?.coordinates) {
          fetchGeocoding(match);
        } else {
          setFormData(EMPTY_FORM_DATA);
        }
      }
    }
    return () => {
      isCancelled = true;
    };
  }, [
    selectedFilenames,
    matchResult,
    orderedFilenames,
    showNotification,
    isAnythingSelected,
  ]);

  const handleSelectionChange = useCallback(
    (event: React.MouseEvent, filename: string) => {
      const { shiftKey, ctrlKey, metaKey } = event;
      const selectSingle = () => setSelectedFilenames(new Set([filename]));
      const toggleSelection = () => {
        setSelectedFilenames((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(filename)) newSet.delete(filename);
          else newSet.add(filename);
          return newSet;
        });
      };
      const rangeSelect = () => {
        const lastSelected = lastSelectedFilenameRef.current;
        if (!lastSelected) {
          selectSingle();
          return;
        }
        const startIndex = orderedFilenames.indexOf(lastSelected);
        const endIndex = orderedFilenames.indexOf(filename);
        if (startIndex === -1 || endIndex === -1) return;
        const start = Math.min(startIndex, endIndex);
        const end = Math.max(startIndex, endIndex);
        const inRangeFilenames = orderedFilenames.slice(start, end + 1);
        setSelectedFilenames(
          (prev) => new Set([...Array.from(prev), ...inRangeFilenames])
        );
      };
      if (shiftKey) rangeSelect();
      else if (ctrlKey || metaKey) toggleSelection();
      else selectSingle();
      lastSelectedFilenameRef.current = filename;
    },
    [orderedFilenames]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }
      event.preventDefault();

      let lastSelectedIndex = lastSelectedFilenameRef.current
        ? orderedFilenames.indexOf(lastSelectedFilenameRef.current)
        : -1;

      if (lastSelectedIndex === -1 && orderedFilenames.length > 0) {
        lastSelectedIndex = 0;
      }

      let nextIndex = lastSelectedIndex;
      if (event.key === "ArrowUp") {
        nextIndex = Math.max(0, lastSelectedIndex - 1);
      } else if (event.key === "ArrowDown") {
        nextIndex = Math.min(
          orderedFilenames.length - 1,
          lastSelectedIndex + 1
        );
      }

      const newSelectedFilename = orderedFilenames[nextIndex];
      if (newSelectedFilename) {
        setSelectedFilenames(new Set([newSelectedFilename]));
        lastSelectedFilenameRef.current = newSelectedFilename;

        // Ensure the newly selected item is scrolled into view
        const element = document.getElementById(
          `geotag-item-${newSelectedFilename}`
        );
        element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    },
    [orderedFilenames]
  );

  const handleFormFieldChange = useCallback(
    (field: keyof LocationPresetData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleApplyToSelection = useCallback(() => {
    const newChanges = new Map(stagedChanges);
    const dataToApply = { ...formData };
    selectedFilenames.forEach((filename) => {
      newChanges.set(filename, dataToApply);
    });
    setStagedChanges(newChanges);
    showNotification(
      `Applied location to ${selectedFilenames.size} item(s).`,
      "success"
    );
  }, [formData, selectedFilenames, stagedChanges, showNotification]);

  const handleSave = async () => {
    if (!hasChanges) {
      showNotification("No changes to save.", "info");
      return;
    }
    setIsSaving(true);
    const files_to_update: FileUpdatePayload[] = [];
    const imageMap = new Map(images.map((img) => [img.filename, img]));
    for (const [filename, newLocationData] of stagedChanges.entries()) {
      const imageFile = imageMap.get(filename);
      const gpsMatch = matchResult?.matches.find(
        (m) => m.filename === filename
      );
      if (!imageFile) continue;
      const new_metadata: { [key: string]: any } = {
        LocationCreated: newLocationData.Location,
        CityCreated: newLocationData.City,
        StateCreated: newLocationData.State,
        CountryCreated: newLocationData.Country,
        CountryCodeCreated: newLocationData.CountryCode,
      };
      if (gpsMatch?.coordinates) {
        new_metadata.LatitudeCreated = String(gpsMatch.coordinates.latitude);
        new_metadata.LongitudeCreated = String(gpsMatch.coordinates.longitude);
      }
      files_to_update.push({
        path: `${folderPath}\\${filename}`,
        original_metadata: imageFile.metadata,
        new_metadata,
      });
    }
    if (files_to_update.length === 0) {
      setIsSaving(false);
      showNotification("No valid changes to save.", "info");
      return;
    }
    const payload: SaveMetadataPayload = {
      files_to_update,
      keywords_to_learn: [],
    };
    try {
      await apiService.saveMetadata(payload);
      showNotification("Geotagging data saved successfully.", "success");
      const updatedPaths = files_to_update.map((f) => f.path);
      onSaveSuccess(updatedPaths);
      onClose();
    } catch (err) {
      const apiErr = err as any;
      showNotification(
        `Error saving metadata: ${apiErr.message || "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    error,
    matchResult,
    hasChanges,
    contextValue: {
      selectedFilenames,
      handleSelectionChange,
      handleKeyDown,
      isAnythingSelected,
      allMatches: matchResult?.matches || [],
      unmatchableFilenames,
      isFormBusy,
      formData,
      handleFormFieldChange,
      handleApplyToSelection,
    },
    handleSave,
  };
};
