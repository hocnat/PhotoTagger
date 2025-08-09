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
    if (!imageFiles || imageFiles.length === 0) return false;
    for (const file of imageFiles) {
      for (const key in file.metadata) {
        if (file.metadata[key]?.isConsolidated === false) {
          return true;
        }
      }
    }
    return false;
  }, [imageFiles]);

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
      const newBlockState = Object.entries(data).reduce((acc, [key, value]) => {
        const formKey = key as keyof LocationData;
        acc[formKey] = {
          status: "unique",
          value: value || "",
          isConsolidated: true,
        };
        return acc;
      }, {} as LocationData);

      setFormState((prevState) => ({
        ...prevState,
        [blockName]: newBlockState,
      }));
    },
    [setFormState]
  );

  /**
   * Updates the latitude and longitude, then fetches address details and
   * performs a full overwrite of the location data block.
   */
  const handleLocationSet = async (
    blockName: "LocationCreated" | "LocationShown",
    latlng: LatLng
  ) => {
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
      const [enriched] = await apiService.enrichCoordinates([
        { latitude: latlng.lat, longitude: latlng.lng },
      ]);

      if (enriched) {
        newLocationData.City = enriched.city;
        newLocationData.State = enriched.state;
        newLocationData.Country = enriched.country;
        newLocationData.CountryCode = enriched.countryCode;
      }
    } catch (error) {
      showNotification("Could not fetch location details.", "warning");
      console.error("Reverse geocoding failed:", error);
    }

    applyLocationPreset(newLocationData, blockName);
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

        // For each field, we check if it was user-edited OR if the specific
        // file's field was not consolidated.

        const titleField = formState.Content?.Title;
        if (
          isFieldDirty("Content", "Title") ||
          file.metadata.Title?.isConsolidated === false
        ) {
          new_metadata.Title =
            titleField?.status === "unique"
              ? titleField.value
              : file.metadata.Title?.value;
        }

        const creatorField = formState.Creator?.Creator;
        if (
          isFieldDirty("Creator", "Creator") ||
          file.metadata.Creator?.isConsolidated === false
        ) {
          new_metadata.Creator =
            creatorField?.status === "unique"
              ? creatorField.value
              : file.metadata.Creator?.value;
        }

        const copyrightField = formState.Creator?.Copyright;
        if (
          isFieldDirty("Creator", "Copyright") ||
          file.metadata.Copyright?.isConsolidated === false
        ) {
          new_metadata.Copyright =
            copyrightField?.status === "unique"
              ? copyrightField.value
              : file.metadata.Copyright?.value;
        }

        const dateTimeOriginalField = formState.DateTime?.DateTimeOriginal;
        if (
          isFieldDirty("DateTime", "DateTimeOriginal") ||
          file.metadata.DateTimeOriginal?.isConsolidated === false
        ) {
          new_metadata.DateTimeOriginal =
            dateTimeOriginalField?.status === "unique"
              ? dateTimeOriginalField.value
              : file.metadata.DateTimeOriginal?.value;
        }

        const offsetTimeOriginalField = formState.DateTime?.OffsetTimeOriginal;
        if (
          isFieldDirty("DateTime", "OffsetTimeOriginal") ||
          file.metadata.OffsetTimeOriginal?.isConsolidated === false
        ) {
          new_metadata.OffsetTimeOriginal =
            offsetTimeOriginalField?.status === "unique"
              ? offsetTimeOriginalField.value
              : file.metadata.OffsetTimeOriginal?.value;
        }

        const latCreatedField = formState.LocationCreated?.Latitude;
        if (
          isFieldDirty("LocationCreated", "Latitude") ||
          file.metadata.LatitudeCreated?.isConsolidated === false
        ) {
          new_metadata.LatitudeCreated =
            latCreatedField?.status === "unique"
              ? latCreatedField.value
              : file.metadata.LatitudeCreated?.value;
        }
        const lonCreatedField = formState.LocationCreated?.Longitude;
        if (
          isFieldDirty("LocationCreated", "Longitude") ||
          file.metadata.LongitudeCreated?.isConsolidated === false
        ) {
          new_metadata.LongitudeCreated =
            lonCreatedField?.status === "unique"
              ? lonCreatedField.value
              : file.metadata.LongitudeCreated?.value;
        }
        const locCreatedField = formState.LocationCreated?.Location;
        if (
          isFieldDirty("LocationCreated", "Location") ||
          file.metadata.LocationCreated?.isConsolidated === false
        ) {
          new_metadata.LocationCreated =
            locCreatedField?.status === "unique"
              ? locCreatedField.value
              : file.metadata.LocationCreated?.value;
        }
        const cityCreatedField = formState.LocationCreated?.City;
        if (
          isFieldDirty("LocationCreated", "City") ||
          file.metadata.CityCreated?.isConsolidated === false
        ) {
          new_metadata.CityCreated =
            cityCreatedField?.status === "unique"
              ? cityCreatedField.value
              : file.metadata.CityCreated?.value;
        }
        const stateCreatedField = formState.LocationCreated?.State;
        if (
          isFieldDirty("LocationCreated", "State") ||
          file.metadata.StateCreated?.isConsolidated === false
        ) {
          new_metadata.StateCreated =
            stateCreatedField?.status === "unique"
              ? stateCreatedField.value
              : file.metadata.StateCreated?.value;
        }
        const countryCreatedField = formState.LocationCreated?.Country;
        if (
          isFieldDirty("LocationCreated", "Country") ||
          file.metadata.CountryCreated?.isConsolidated === false
        ) {
          new_metadata.CountryCreated =
            countryCreatedField?.status === "unique"
              ? countryCreatedField.value
              : file.metadata.CountryCreated?.value;
        }
        const countryCodeCreatedField = formState.LocationCreated?.CountryCode;
        if (
          isFieldDirty("LocationCreated", "CountryCode") ||
          file.metadata.CountryCodeCreated?.isConsolidated === false
        ) {
          new_metadata.CountryCodeCreated =
            countryCodeCreatedField?.status === "unique"
              ? countryCodeCreatedField.value
              : file.metadata.CountryCodeCreated?.value;
        }

        const latShownField = formState.LocationShown?.Latitude;
        if (
          isFieldDirty("LocationShown", "Latitude") ||
          file.metadata.LatitudeShown?.isConsolidated === false
        ) {
          new_metadata.LatitudeShown =
            latShownField?.status === "unique"
              ? latShownField.value
              : file.metadata.LatitudeShown?.value;
        }
        const lonShownField = formState.LocationShown?.Longitude;
        if (
          isFieldDirty("LocationShown", "Longitude") ||
          file.metadata.LongitudeShown?.isConsolidated === false
        ) {
          new_metadata.LongitudeShown =
            lonShownField?.status === "unique"
              ? lonShownField.value
              : file.metadata.LongitudeShown?.value;
        }
        const locShownField = formState.LocationShown?.Location;
        if (
          isFieldDirty("LocationShown", "Location") ||
          file.metadata.LocationShown?.isConsolidated === false
        ) {
          new_metadata.LocationShown =
            locShownField?.status === "unique"
              ? locShownField.value
              : file.metadata.LocationShown?.value;
        }
        const cityShownField = formState.LocationShown?.City;
        if (
          isFieldDirty("LocationShown", "City") ||
          file.metadata.CityShown?.isConsolidated === false
        ) {
          new_metadata.CityShown =
            cityShownField?.status === "unique"
              ? cityShownField.value
              : file.metadata.CityShown?.value;
        }
        const stateShownField = formState.LocationShown?.State;
        if (
          isFieldDirty("LocationShown", "State") ||
          file.metadata.StateShown?.isConsolidated === false
        ) {
          new_metadata.StateShown =
            stateShownField?.status === "unique"
              ? stateShownField.value
              : file.metadata.StateShown?.value;
        }
        const countryShownField = formState.LocationShown?.Country;
        if (
          isFieldDirty("LocationShown", "Country") ||
          file.metadata.CountryShown?.isConsolidated === false
        ) {
          new_metadata.CountryShown =
            countryShownField?.status === "unique"
              ? countryShownField.value
              : file.metadata.CountryShown?.value;
        }
        const countryCodeShownField = formState.LocationShown?.CountryCode;
        if (
          isFieldDirty("LocationShown", "CountryCode") ||
          file.metadata.CountryCodeShown?.isConsolidated === false
        ) {
          new_metadata.CountryCodeShown =
            countryCodeShownField?.status === "unique"
              ? countryCodeShownField.value
              : file.metadata.CountryCodeShown?.value;
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
