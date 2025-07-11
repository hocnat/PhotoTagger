import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FormState,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
  FileUpdatePayload,
  LocationFieldKeys,
} from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { useSelectionDataLoader } from "./useSelectionDataLoader";
import { useAggregatedMetadata } from "./useAggregatedMetadata";
import { useUnsavedChangesContext } from "context/UnsavedChangesContext";
import { useImageSelectionContext } from "context/ImageSelectionContext";

interface LocationFieldNamesMap {
  latitude: LocationFieldKeys;
  longitude: LocationFieldKeys;
  location: LocationFieldKeys;
  city: LocationFieldKeys;
  state: LocationFieldKeys;
  country: LocationFieldKeys;
  countryCode: LocationFieldKeys;
}

interface UseMetadataEditorProps {
  folderPath: string;
  onSaveSuccess: () => void;
}

export const useMetadataEditor = ({
  folderPath,
  onSaveSuccess,
}: UseMetadataEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const { showNotification } = useNotification();
  const { setIsDirty } = useUnsavedChangesContext();
  const { selectedImages } = useImageSelectionContext();

  const {
    imageFiles,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionDataLoader(selectedImages, folderPath);
  const { formState, setFormState, hasChanges, originalFormState } =
    useAggregatedMetadata(imageFiles);

  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  const needsConsolidation = useMemo(() => {
    return Object.values(formState).some(
      (field) => field && field.status === "unique" && !field.isConsolidated
    );
  }, [formState]);

  const isSaveable = hasChanges || needsConsolidation;

  const isFieldDirty = useCallback(
    (fieldName: keyof FormState): boolean => {
      const currentValue = formState[fieldName];
      const originalValue = originalFormState[fieldName];
      return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
    },
    [formState, originalFormState]
  );

  const handleFormChange = useCallback(
    (fieldName: keyof FormState, newValue: any) => {
      setFormState((prevState) => {
        const existingField = prevState[fieldName];
        const isConsolidated =
          existingField && existingField.status === "unique"
            ? existingField.isConsolidated
            : true;
        return {
          ...prevState,
          [fieldName]: {
            status: "unique",
            value: newValue,
            isConsolidated,
          },
        };
      });
    },
    [setFormState]
  );

  const applyLocationPreset = useCallback(
    (data: LocationPresetData, targetFields: LocationFieldNamesMap) => {
      let newFormState = { ...formState };

      const keyMap: { [key in keyof LocationPresetData]?: keyof FormState } = {
        Latitude: targetFields.latitude,
        Longitude: targetFields.longitude,
        Location: targetFields.location,
        City: targetFields.city,
        State: targetFields.state,
        Country: targetFields.country,
        CountryCode: targetFields.countryCode,
      };

      for (const [presetKey, value] of Object.entries(data)) {
        const formKey = keyMap[presetKey as keyof LocationPresetData];
        if (formKey && value !== undefined) {
          const existingField = newFormState[formKey];
          const isConsolidated =
            existingField && existingField.status === "unique"
              ? existingField.isConsolidated
              : true;
          newFormState[formKey] = {
            status: "unique",
            value,
            isConsolidated,
          };
        }
      }
      setFormState(newFormState);
    },
    [formState, setFormState]
  );

  const handleLocationSet = (
    latFieldName: keyof FormState,
    lonFieldName: keyof FormState,
    latlng: { lat: number; lng: number }
  ) => {
    handleFormChange(latFieldName, String(latlng.lat));
    handleFormChange(lonFieldName, String(latlng.lng));
  };

  const handleSave = () => {
    if (!isSaveable) {
      showNotification("No changes to save.", "info");
      return;
    }
    setIsSaving(true);

    const originalKeywords =
      originalFormState.Keywords?.status === "unique"
        ? originalFormState.Keywords.value
        : [];
    const currentKeywords =
      formState.Keywords?.status === "unique" ? formState.Keywords.value : [];

    const originalUiKeywords = new Set(originalKeywords.map((kw) => kw.name));
    const currentUiKeywords = new Set(currentKeywords.map((kw) => kw.name));

    const addedKeywords = [...currentUiKeywords].filter(
      (kw) => !originalUiKeywords.has(kw)
    );
    const removedKeywords = new Set(
      [...originalUiKeywords].filter((kw) => !currentUiKeywords.has(kw))
    );

    const files_to_update = imageFiles
      .map((file) => {
        const new_metadata: { [key: string]: any } = {};

        Object.entries(formState).forEach(([keyStr, currentField]) => {
          const key = keyStr as keyof FormState;
          if (key === "Keywords" || !currentField) return;

          const originalField = originalFormState[key];
          const hasValueChanged =
            JSON.stringify(currentField) !== JSON.stringify(originalField);
          const fieldNeedsConsolidation =
            currentField.status === "unique" && !currentField.isConsolidated;

          if (hasValueChanged || fieldNeedsConsolidation) {
            if (currentField.status === "unique") {
              new_metadata[key] = currentField.value;
            }
          }
        });

        const originalFileKeywords = new Set(
          file.metadata.Keywords?.value || []
        );
        const originalFileKeywordsForComparison = new Set(originalFileKeywords);

        addedKeywords.forEach((kw) => originalFileKeywords.add(kw));
        removedKeywords.forEach((kw) => originalFileKeywords.delete(kw));

        const finalKeywordsForFile = Array.from(originalFileKeywords);

        const keywordsHaveChanged =
          finalKeywordsForFile.length !==
            originalFileKeywordsForComparison.size ||
          !finalKeywordsForFile.every((k) =>
            originalFileKeywordsForComparison.has(k)
          );

        const keywordsNeedConsolidation =
          formState.Keywords?.status === "unique" &&
          !formState.Keywords.isConsolidated;

        if (keywordsHaveChanged || keywordsNeedConsolidation) {
          new_metadata["Keywords"] = finalKeywordsForFile;
        }

        if (Object.keys(new_metadata).length > 0) {
          return {
            path: `${folderPath}\\${file.filename}`,
            original_metadata: file.metadata.original,
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

    apiService
      .saveMetadata(payload)
      .then(() => {
        showNotification("Metadata saved successfully.", "success");
        setIsDirty(false);
        refetch();
        onSaveSuccess();
      })
      .catch((err: ApiError) => {
        showNotification(
          `Error saving metadata: ${err.message || "Unknown error"}`,
          "error"
        );
      })
      .finally(() => setIsSaving(false));
  };

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

  const getDateTimeObject = (): Date | null => {
    const field = formState.DateTimeOriginal;
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
    handleFormChange,
    handleLocationSet,
    handleSave,
    handleKeywordInputChange,
    getDateTimeObject,
    applyLocationPreset,
    isFieldDirty,
  };
};
