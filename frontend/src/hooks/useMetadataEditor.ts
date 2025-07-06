import { useState, useEffect, useCallback } from "react";
import {
  FormState,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
  MetadataValue,
  FileUpdatePayload,
} from "../types";
import { useSelectionDataLoader } from "./useSelectionDataLoader";
import { useAggregatedMetadata } from "./useAggregatedMetadata";
import { useNotification } from "./useNotification";
import * as apiService from "../services/apiService";

function getValueFromState<T>(
  field: MetadataValue<T> | "(Mixed Values)" | undefined
): T | undefined {
  if (field && typeof field === "object" && "value" in field) {
    return field.value;
  }
  return undefined;
}

interface UseMetadataEditorProps {
  selectedImageNames: string[];
  folderPath: string;
  setIsDirty: (isDirty: boolean) => void;
}

export const useMetadataEditor = ({
  selectedImageNames,
  folderPath,
  setIsDirty,
}: UseMetadataEditorProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const { showNotification } = useNotification();

  const {
    imageFiles,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionDataLoader(selectedImageNames, folderPath);
  const { formState, setFormState, hasChanges, originalFormState } =
    useAggregatedMetadata(imageFiles);

  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  const handleFormChange = useCallback(
    (fieldName: keyof FormState, newValue: any) => {
      setFormState((prevState) => {
        const existingField = prevState[fieldName];
        const isConsolidated =
          existingField &&
          typeof existingField === "object" &&
          "isConsolidated" in existingField
            ? existingField.isConsolidated
            : true;
        return {
          ...prevState,
          [fieldName]: { value: newValue, isConsolidated },
        };
      });
    },
    [setFormState]
  );

  const applyLocationPreset = useCallback(
    (data: LocationPresetData) => {
      let newFormState = { ...formState };
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          const fieldName = key as keyof FormState;
          const existingField = newFormState[fieldName];
          const isConsolidated =
            existingField &&
            typeof existingField === "object" &&
            "isConsolidated" in existingField
              ? existingField.isConsolidated
              : true;
          newFormState[fieldName] = { value, isConsolidated };
        }
      }
      setFormState(newFormState);
    },
    [formState, setFormState]
  );

  const handleLocationSet = (latlng: { lat: number; lng: number }) => {
    handleFormChange("GPSPosition", `${latlng.lat}, ${latlng.lng}`);
  };

  const handleSave = () => {
    setIsSaving(true);

    // 1. Calculate the keyword delta from the UI changes.
    const originalUiKeywords = new Set(
      getValueFromState(originalFormState.Keywords)?.map((kw) => kw.name) || []
    );
    const currentUiKeywords = new Set(
      getValueFromState(formState.Keywords)?.map((kw) => kw.name) || []
    );
    const addedKeywords = [...currentUiKeywords].filter(
      (kw) => !originalUiKeywords.has(kw)
    );
    const removedKeywords = new Set(
      [...originalUiKeywords].filter((kw) => !currentUiKeywords.has(kw))
    );

    const files_to_update = imageFiles
      .map((file) => {
        const new_metadata: { [key: string]: any } = {};

        // 2. Handle simple fields by checking for changes.
        Object.entries(formState).forEach(([keyStr, currentField]) => {
          const key = keyStr as keyof FormState;
          if (key === "Keywords") return;

          const originalField = originalFormState[key];
          if (JSON.stringify(currentField) !== JSON.stringify(originalField)) {
            if (currentField && currentField !== "(Mixed Values)") {
              new_metadata[key] = currentField.value;
            }
          }
        });

        // 3. Handle keywords with special additive/subtractive logic for each file.
        const originalFileKeywords = new Set(
          file.metadata.Keywords?.value || []
        );

        addedKeywords.forEach((kw) => originalFileKeywords.add(kw));
        removedKeywords.forEach((kw) => originalFileKeywords.delete(kw));

        const finalKeywordsForFile = Array.from(originalFileKeywords);

        // Determine if this specific file's keywords have changed.
        const originalFormKeywordsForFile = new Set(
          getValueFromState(originalFormState.Keywords)?.map((k) => k.name)
        );
        const keywordsHaveChanged = !(
          [...originalFileKeywords].every((k) =>
            originalFormKeywordsForFile.has(k)
          ) &&
          originalFileKeywords.size === originalFormKeywordsForFile.size &&
          addedKeywords.length === 0 &&
          removedKeywords.size === 0
        );

        if (keywordsHaveChanged) {
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
        refetch();
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
    const dateStr = getValueFromState(formState.DateTimeOriginal);
    if (!dateStr) return null;
    const parsableDateStr =
      dateStr.substring(0, 10).replace(/:/g, "-") + "T" + dateStr.substring(11);
    const date = new Date(parsableDateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  return {
    isMetadataLoading,
    isSaving,
    formState,
    hasChanges,
    keywordSuggestions,
    handleFormChange,
    handleLocationSet,
    handleSave,
    handleKeywordInputChange,
    getDateTimeObject,
    applyLocationPreset,
  };
};
