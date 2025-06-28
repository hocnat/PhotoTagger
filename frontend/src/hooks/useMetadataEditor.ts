import { useState, useEffect } from "react";
import { FormState, RawImageMetadata, Keyword } from "../types";
import { useSelectionData } from "./useSelectionDataLoader";
import { useMetadataForm } from "./useAggregatedMetadata";

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

  const {
    imageFiles,
    isLoading: isMetadataLoading,
    refetch,
  } = useSelectionData(selectedImageNames, folderPath);

  const { formState, setFormState, hasChanges, originalFormState } =
    useMetadataForm(imageFiles);

  useEffect(() => {
    setIsDirty(hasChanges);
  }, [hasChanges, setIsDirty]);

  const handleFormChange = (fieldName: keyof FormState, newValue: any) => {
    setFormState((prevState) => ({ ...prevState, [fieldName]: newValue }));
  };

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

    const payload = {
      files_to_update: files_to_update.filter(
        (f) => Object.keys(f.metadata).length > 0
      ),
      keywords_to_learn: addedKeywords,
    };

    if (payload.files_to_update.length === 0) {
      setIsSaving(false);
      return;
    }

    fetch("http://localhost:5000/api/save_metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        res.ok ? res.json() : res.json().then((err) => Promise.reject(err))
      )
      .then(() => refetch()) // On success, refetch data to reset form state
      .catch((err) =>
        alert(`Error saving metadata: ${err.details || "Unknown error"}`)
      )
      .finally(() => setIsSaving(false));
  };

  const handleKeywordInputChange = (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    if (newInputValue.trim()) {
      fetch(
        `http://localhost:5000/api/suggestions?q=${encodeURIComponent(
          newInputValue
        )}`
      )
        .then((res) => res.json())
        .then((data: string[]) => setKeywordSuggestions(data))
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
  };
};
