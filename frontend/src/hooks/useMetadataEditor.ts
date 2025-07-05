import { useState, useEffect, useCallback } from "react";
import {
  FormState,
  Keyword,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
  MetadataValue,
  ImageFile,
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
            : false;
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
      const newFormState: Partial<FormState> = { ...formState };
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          (newFormState as any)[key] = { value, isConsolidated: false };
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
    const new_metadata: { [key: string]: any } = {};
    Object.entries(formState).forEach(([key, field]) => {
      if (field && field !== "(Mixed Values)") {
        new_metadata[key] =
          key === "Keywords"
            ? (field.value as Keyword[]).map((kw) => kw.name)
            : field.value;
      }
    });

    const payload: SaveMetadataPayload = {
      files_to_update: imageFiles.map((file: ImageFile) => ({
        path: `${folderPath}\\${file.filename}`,
        original_metadata: file.metadata.original,
        new_metadata: new_metadata,
      })),
      keywords_to_learn: [],
    };

    const currentKeywords =
      getValueFromState(formState.Keywords)?.map((kw) => kw.name) || [];
    const originalKeywords =
      getValueFromState(originalFormState.Keywords)?.map((kw) => kw.name) || [];
    payload.keywords_to_learn = currentKeywords.filter(
      (kw) => !originalKeywords.includes(kw)
    );

    if (payload.files_to_update.length === 0) {
      setIsSaving(false);
      return;
    }

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
