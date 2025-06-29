import { useState, useEffect, useCallback } from "react";
import {
  FormState,
  RawImageMetadata,
  Keyword,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
} from "../types";
import { useSelectionDataLoader } from "./useSelectionDataLoader";
import { useAggregatedMetadata } from "./useAggregatedMetadata";
import { useNotification } from "./useNotification";
import * as apiService from "../services/apiService";

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
      setFormState((prevState) => ({ ...prevState, [fieldName]: newValue }));
    },
    [setFormState]
  );

  const applyLocationPreset = useCallback(
    (data: LocationPresetData) => {
      setFormState((prevState) => ({ ...prevState, ...data }));
    },
    [setFormState]
  );

  const handleLocationSet = (latlng: { lat: number; lng: number }) => {
    setFormState((prev) => ({
      ...prev,
      DecimalLatitude: latlng.lat,
      DecimalLongitude: latlng.lng,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const originalKeywords = (
      Array.isArray(originalFormState.Keywords)
        ? originalFormState.Keywords
        : []
    ).map((kw: Keyword) => kw.name);
    const currentKeywords = (
      Array.isArray(formState.Keywords) ? formState.Keywords : []
    ).map((kw: Keyword) => kw.name);
    const addedKeywords = currentKeywords.filter(
      (kw) => !originalKeywords.includes(kw)
    );
    const removedKeywords = new Set(
      originalKeywords.filter((kw) => !currentKeywords.includes(kw))
    );

    const files_to_update = imageFiles.map((file) => {
      const existingKeywords = new Set(file.metadata.Keywords || []);
      removedKeywords.forEach((kw) => existingKeywords.delete(kw));
      addedKeywords.forEach((kw) => existingKeywords.add(kw));
      const finalKeywordsForFile = Array.from(existingKeywords);
      const metadata_for_file: Partial<RawImageMetadata> = {
        Keywords: finalKeywordsForFile,
      };
      Object.keys(formState).forEach((keyStr) => {
        const key = keyStr as keyof FormState;
        if (key !== "Keywords" && formState[key] !== "(Mixed Values)") {
          (metadata_for_file as any)[key] = formState[key];
        }
      });
      return {
        path: `${folderPath}\\${file.filename}`,
        metadata: metadata_for_file,
      };
    });

    const payload: SaveMetadataPayload = {
      files_to_update: files_to_update.filter(
        (f) => Object.keys(f.metadata).length > 0
      ),
      keywords_to_learn: addedKeywords,
    };
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
    const dateStr = formState["EXIF:DateTimeOriginal"];
    if (!dateStr || typeof dateStr !== "string" || dateStr === "(Mixed Values)")
      return null;
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
