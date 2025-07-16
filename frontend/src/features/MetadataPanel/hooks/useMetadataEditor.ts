import { useState, useEffect, useCallback, useMemo } from "react";
import { LatLng } from "leaflet";
import {
  FormState,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
  FileUpdatePayload,
  ChipData,
  LocationData,
  KeywordSuggestion,
} from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { useSelectionDataLoader } from "./useSelectionDataLoader";
import { useAggregatedMetadata } from "./useAggregatedMetadata";
import { useUnsavedChangesContext } from "context/UnsavedChangesContext";

interface UseMetadataEditorProps {
  folderPath: string;
  onSaveSuccess: (updatedFilePaths: string[]) => void;
}

/**
 * The primary business logic hook for the metadata editing panel.
 * It orchestrates data loading, state aggregation, user input, and saving operations.
 * This hook acts as the "ViewModel" for the entire metadata feature, providing all
 * necessary state and actions to its consumers via the MetadataEditorContext.
 */
export const useMetadataEditor = ({
  folderPath,
  onSaveSuccess,
}: UseMetadataEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<
    KeywordSuggestion[]
  >([]);
  const { showNotification } = useNotification();
  const { setIsDirty } = useUnsavedChangesContext();

  // Step 1: Load the raw metadata for the current selection.
  const {
    imageFiles,
    isLoading: isMetadataLoading,
    error: selectionError,
  } = useSelectionDataLoader();
  // Step 2: Aggregate the raw data into a hierarchical form state for the UI.
  const { formState, setFormState, hasChanges, originalFormState } =
    useAggregatedMetadata(imageFiles);

  // This effect reports critical data-loading errors using the global notification system.
  useEffect(() => {
    if (selectionError) {
      showNotification(`Failed to load metadata: ${selectionError}`, "error");
    }
  }, [selectionError, showNotification]);

  // This effect synchronizes the local `hasChanges` state with the global
  // `isDirty` state from the UnsavedChangesContext.
  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  // A memoized calculation to determine if there is anything to save.
  // A save is needed if the form has user-initiated changes OR if any
  // field is not consolidated across its underlying EXIF/XMP tags.
  const needsConsolidation = useMemo(() => {
    if (!formState) return false;
    for (const block of Object.values(formState)) {
      if (!block) continue;
      for (const field of Object.values(block)) {
        if (field.status === "unique" && !field.isConsolidated) {
          return true;
        }
      }
    }
    return false;
  }, [formState]);

  const isSaveable = hasChanges || needsConsolidation;

  /**
   * Checks if a specific field has been modified from its original state.
   */
  const isFieldDirty = useCallback(
    <T extends keyof FormState>(
      blockName: T,
      fieldName: keyof FormState[T]
    ): boolean => {
      const currentBlock = formState[blockName];
      const originalBlock = originalFormState[blockName];
      if (!currentBlock || !originalBlock) return false;
      const currentField = (currentBlock as any)[fieldName];
      const originalField = (originalBlock as any)[fieldName];
      return JSON.stringify(currentField) !== JSON.stringify(originalField);
    },
    [formState, originalFormState]
  );

  /**
   * A generic handler to update a single field within a block of the form state.
   * This is the primary updater function called by UI components.
   */
  const handleFieldChange = useCallback(
    <T extends keyof FormState>(
      blockName: T,
      fieldName: keyof FormState[T],
      newValue: any
    ) => {
      setFormState((prevState) => {
        const block = prevState[blockName];
        if (!block) return prevState;
        const field = (block as any)[fieldName];
        if (field === undefined) return prevState;
        // When a user edits a field, it becomes a 'unique' value. We preserve its
        // consolidation status if it was already unique.
        const newField = {
          status: "unique" as const,
          value: newValue,
          isConsolidated:
            field.status === "unique" ? field.isConsolidated : true,
        };
        return {
          ...prevState,
          [blockName]: { ...block, [fieldName]: newField },
        };
      });
    },
    [setFormState]
  );

  /**
   * Applies all fields from a location preset to the specified location block.
   */
  const applyLocationPreset = useCallback(
    (
      data: LocationPresetData,
      blockName: "LocationCreated" | "LocationShown"
    ) => {
      let newBlockState = { ...formState[blockName] } as LocationData;
      for (const [key, value] of Object.entries(data)) {
        const formKey = key as keyof LocationData;
        if (formKey in newBlockState && value !== undefined) {
          (newBlockState[formKey] as any) = {
            status: "unique",
            value,
            isConsolidated: true, // Applying a preset makes fields consolidated by definition.
          };
        }
      }
      setFormState((prevState) => ({
        ...prevState,
        [blockName]: newBlockState,
      }));
    },
    [formState, setFormState]
  );

  /**
   * Updates the latitude and longitude, then fetches address details and
   * performs a full overwrite of the location data block.
   */
  const handleLocationSet = async (
    blockName: "LocationCreated" | "LocationShown",
    latlng: LatLng
  ) => {
    // 1. Define the new location data object, clearing all fields except lat/lon.
    // This ensures old values are wiped.
    const newLocationData: LocationPresetData = {
      Latitude: String(latlng.lat),
      Longitude: String(latlng.lng),
      Location: "",
      City: "",
      State: "",
      Country: "",
      CountryCode: "",
    };

    try {
      // 2. Call the geocoding service to get new address details.
      const enrichedData = await apiService.enrichCoordinates([
        { latitude: latlng.lat, longitude: latlng.lng },
      ]);
      const locationInfo = enrichedData[0];

      // 3. If successful, populate the new data object.
      if (locationInfo) {
        newLocationData.City = locationInfo.city;
        newLocationData.State = locationInfo.state;
        newLocationData.Country = locationInfo.country;
        newLocationData.CountryCode = locationInfo.countryCode;
      }
    } catch (error) {
      showNotification(
        "Could not fetch location details. Please fill them manually.",
        "warning"
      );
      console.error("Reverse geocoding failed:", error);
    }

    // 4. Apply the complete new data block using the same logic as applyLocationPreset.
    let newBlockState = { ...formState[blockName] } as LocationData;
    for (const [key, value] of Object.entries(newLocationData)) {
      const formKey = key as keyof LocationData;
      if (formKey in newBlockState) {
        // Check if the key is valid for LocationData
        (newBlockState[formKey] as any) = {
          status: "unique",
          value: value || "",
          isConsolidated: true,
        };
      }
    }
    setFormState((prevState) => ({
      ...prevState,
      [blockName]: newBlockState,
    }));
  };

  const handleSave = async () => {
    if (!isSaveable || !formState || !originalFormState) {
      showNotification("No changes to save.", "info");
      return;
    }
    setIsSaving(true);

    // --- Keyword Diff Calculation ---
    const originalKeywords: ChipData[] =
      originalFormState.Content?.Keywords.status === "unique"
        ? originalFormState.Content.Keywords.value
        : [];
    const currentKeywords: ChipData[] =
      formState.Content?.Keywords.status === "unique"
        ? formState.Content.Keywords.value
        : [];
    const originalUiKeywords = new Set(originalKeywords.map((kw) => kw.name));
    const currentUiKeywords = new Set(currentKeywords.map((kw) => kw.name));
    const addedKeywords = [...currentUiKeywords].filter(
      (kw) => !originalUiKeywords.has(kw)
    );
    const removedKeywords = new Set(
      [...originalUiKeywords].filter((kw) => !currentUiKeywords.has(kw))
    );

    // --- Payload Construction ---
    const files_to_update = imageFiles
      .map((file) => {
        const new_metadata: { [key: string]: any } = {};

        // This explicit block flattens the hierarchical form state back into the
        // flat structure required by the backend API.
        if (isFieldDirty("Content", "Title")) {
          const field = formState.Content?.Title;
          if (field?.status === "unique") new_metadata.Title = field.value;
        }
        if (isFieldDirty("Creator", "Creator")) {
          const field = formState.Creator?.Creator;
          if (field?.status === "unique") new_metadata.Creator = field.value;
        }
        if (isFieldDirty("Creator", "Copyright")) {
          const field = formState.Creator?.Copyright;
          if (field?.status === "unique") new_metadata.Copyright = field.value;
        }
        if (isFieldDirty("DateTime", "DateTimeOriginal")) {
          const field = formState.DateTime?.DateTimeOriginal;
          if (field?.status === "unique")
            new_metadata.DateTimeOriginal = field.value;
        }
        if (isFieldDirty("DateTime", "OffsetTimeOriginal")) {
          const field = formState.DateTime?.OffsetTimeOriginal;
          if (field?.status === "unique")
            new_metadata.OffsetTimeOriginal = field.value;
        }
        if (isFieldDirty("LocationCreated", "Latitude")) {
          const field = formState.LocationCreated?.Latitude;
          if (field?.status === "unique")
            new_metadata.LatitudeCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "Longitude")) {
          const field = formState.LocationCreated?.Longitude;
          if (field?.status === "unique")
            new_metadata.LongitudeCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "Location")) {
          const field = formState.LocationCreated?.Location;
          if (field?.status === "unique")
            new_metadata.LocationCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "City")) {
          const field = formState.LocationCreated?.City;
          if (field?.status === "unique")
            new_metadata.CityCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "State")) {
          const field = formState.LocationCreated?.State;
          if (field?.status === "unique")
            new_metadata.StateCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "Country")) {
          const field = formState.LocationCreated?.Country;
          if (field?.status === "unique")
            new_metadata.CountryCreated = field.value;
        }
        if (isFieldDirty("LocationCreated", "CountryCode")) {
          const field = formState.LocationCreated?.CountryCode;
          if (field?.status === "unique")
            new_metadata.CountryCodeCreated = field.value;
        }
        if (isFieldDirty("LocationShown", "Latitude")) {
          const field = formState.LocationShown?.Latitude;
          if (field?.status === "unique")
            new_metadata.LatitudeShown = field.value;
        }
        if (isFieldDirty("LocationShown", "Longitude")) {
          const field = formState.LocationShown?.Longitude;
          if (field?.status === "unique")
            new_metadata.LongitudeShown = field.value;
        }
        if (isFieldDirty("LocationShown", "Location")) {
          const field = formState.LocationShown?.Location;
          if (field?.status === "unique")
            new_metadata.LocationShown = field.value;
        }
        if (isFieldDirty("LocationShown", "City")) {
          const field = formState.LocationShown?.City;
          if (field?.status === "unique") new_metadata.CityShown = field.value;
        }
        if (isFieldDirty("LocationShown", "State")) {
          const field = formState.LocationShown?.State;
          if (field?.status === "unique") new_metadata.StateShown = field.value;
        }
        if (isFieldDirty("LocationShown", "Country")) {
          const field = formState.LocationShown?.Country;
          if (field?.status === "unique")
            new_metadata.CountryShown = field.value;
        }
        if (isFieldDirty("LocationShown", "CountryCode")) {
          const field = formState.LocationShown?.CountryCode;
          if (field?.status === "unique")
            new_metadata.CountryCodeShown = field.value;
        }

        // Keywords are handled with special additive/subtractive logic.
        const originalFileKeywords = new Set(
          file.metadata.Keywords?.value || []
        );
        const keywordsHaveChanged =
          addedKeywords.length > 0 || removedKeywords.size > 0;
        if (keywordsHaveChanged) {
          const finalKeywords = new Set(originalFileKeywords);
          addedKeywords.forEach((kw) => finalKeywords.add(kw));
          removedKeywords.forEach((kw) => finalKeywords.delete(kw));
          new_metadata["Keywords"] = Array.from(finalKeywords);
        }
        if (Object.keys(new_metadata).length > 0) {
          return {
            path: `${folderPath}\\${file.filename}`,
            original_metadata: file.metadata,
            new_metadata,
          };
        }
        return null;
      })
      .filter(Boolean) as FileUpdatePayload[];

    if (files_to_update.length === 0) {
      setIsSaving(false);
      showNotification("No changes to save.", "info");
      return;
    }

    const payload: SaveMetadataPayload = {
      files_to_update,
      keywords_to_learn: addedKeywords,
    };

    try {
      await apiService.saveMetadata(payload);
      showNotification("Metadata saved successfully.", "success");

      setIsDirty(false);

      const updatedPaths = files_to_update.map((f) => f.path);
      onSaveSuccess(updatedPaths);
    } catch (err) {
      const apiErr = err as ApiError;
      showNotification(
        `Error saving metadata: ${apiErr.message || "Unknown error"}`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Fetches keyword suggestions from the backend based on user input.
   */
  const handleKeywordInputChange = (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    if (newInputValue.trim()) {
      apiService
        .getKeywordSuggestions(newInputValue)
        .then(setKeywordSuggestions)
        .catch((err) => console.error("Suggestion fetch error:", err));
    } else {
      setKeywordSuggestions([]);
    }
  };

  /**
   * A helper to convert the date string from the form state into a Date
   * object suitable for the DateTimePicker component.
   */
  const getDateTimeObject = (): Date | null => {
    const field = formState.DateTime?.DateTimeOriginal;
    if (field?.status !== "unique" || !field.value) return null;
    const dateStr = field.value;
    const parsableDateStr =
      dateStr.substring(0, 10).replace(/:/g, "-") + "T" + dateStr.substring(11);
    const date = new Date(parsableDateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  return {
    isMetadataLoading,
    isSaving,
    formState,
    isSaveable,
    hasChanges,
    keywordSuggestions,
    handleFieldChange,
    handleLocationSet,
    handleSave,
    handleKeywordInputChange,
    getDateTimeObject,
    applyLocationPreset,
    isFieldDirty,
  };
};
