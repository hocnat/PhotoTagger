import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FormState,
  SaveMetadataPayload,
  ApiError,
  LocationPresetData,
  FileUpdatePayload,
  ChipData,
  RawImageMetadata,
  LocationData,
} from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { useSelectionDataLoader } from "./useSelectionDataLoader";
import { useAggregatedMetadata } from "./useAggregatedMetadata";
import { useUnsavedChangesContext } from "context/UnsavedChangesContext";
import { useImageSelectionContext } from "context/ImageSelectionContext";

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

  const isFieldDirty = useCallback(
    (blockName: keyof FormState, fieldName: keyof any): boolean => {
      const currentBlock = formState[blockName];
      const originalBlock = originalFormState[blockName];
      if (!currentBlock || !originalBlock) return false;
      const currentField = (currentBlock as any)[fieldName];
      const originalField = (originalBlock as any)[fieldName];
      return JSON.stringify(currentField) !== JSON.stringify(originalField);
    },
    [formState, originalFormState]
  );

  const handleFieldChange = <T extends keyof FormState>(
    blockName: T,
    fieldName: keyof FormState[T],
    newValue: any
  ) => {
    setFormState((prevState) => {
      const block = prevState[blockName];
      if (!block) return prevState;
      const field = (block as any)[fieldName];
      if (field === undefined) return prevState;
      const newField = {
        status: "unique" as const,
        value: newValue,
        isConsolidated: field.status === "unique" ? field.isConsolidated : true,
      };
      return {
        ...prevState,
        [blockName]: { ...block, [fieldName]: newField },
      };
    });
  };

  const applyLocationPreset = useCallback(
    (
      data: LocationPresetData,
      blockName: "LocationCreated" | "LocationShown"
    ) => {
      let newBlockState = { ...formState[blockName] } as LocationData;
      const keyMap: { [key in keyof LocationPresetData]?: keyof LocationData } =
        {
          Latitude: "Latitude",
          Longitude: "Longitude",
          Location: "Location",
          City: "City",
          State: "State",
          Country: "Country",
          CountryCode: "CountryCode",
        };

      for (const [presetKey, value] of Object.entries(data)) {
        const formKey = keyMap[presetKey as keyof LocationPresetData];
        if (formKey && value !== undefined) {
          (newBlockState[formKey] as any) = {
            status: "unique",
            value,
            isConsolidated: true,
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

  const handleLocationSet = (
    blockName: "LocationCreated" | "LocationShown",
    latlng: { lat: number; lng: number }
  ) => {
    handleFieldChange(blockName, "Latitude", String(latlng.lat));
    handleFieldChange(blockName, "Longitude", String(latlng.lng));
  };

  const handleSave = () => {
    if (!isSaveable || !formState || !originalFormState) {
      showNotification("No changes to save.", "info");
      return;
    }
    setIsSaving(true);

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

    const files_to_update = imageFiles
      .map((file) => {
        const new_metadata: { [key: string]: any } = {};

        const addDirtyFieldToPayload = (
          blockName: keyof FormState,
          fieldName: keyof any,
          targetKey: keyof RawImageMetadata
        ) => {
          if (isFieldDirty(blockName, fieldName)) {
            const field = (formState as any)?.[blockName]?.[fieldName];
            if (field?.status === "unique") {
              new_metadata[targetKey] = field.value;
            }
          }
        };

        addDirtyFieldToPayload("Content", "Title", "Title");
        addDirtyFieldToPayload("Creator", "Creator", "Creator");
        addDirtyFieldToPayload("Creator", "Copyright", "Copyright");
        addDirtyFieldToPayload(
          "DateTime",
          "DateTimeOriginal",
          "DateTimeOriginal"
        );
        addDirtyFieldToPayload(
          "DateTime",
          "OffsetTimeOriginal",
          "OffsetTimeOriginal"
        );

        addDirtyFieldToPayload(
          "LocationCreated",
          "Latitude",
          "LatitudeCreated"
        );
        addDirtyFieldToPayload(
          "LocationCreated",
          "Longitude",
          "LongitudeCreated"
        );
        addDirtyFieldToPayload(
          "LocationCreated",
          "Location",
          "LocationCreated"
        );
        addDirtyFieldToPayload("LocationCreated", "City", "CityCreated");
        addDirtyFieldToPayload("LocationCreated", "State", "StateCreated");
        addDirtyFieldToPayload("LocationCreated", "Country", "CountryCreated");
        addDirtyFieldToPayload(
          "LocationCreated",
          "CountryCode",
          "CountryCodeCreated"
        );

        addDirtyFieldToPayload("LocationShown", "Latitude", "LatitudeShown");
        addDirtyFieldToPayload("LocationShown", "Longitude", "LongitudeShown");
        addDirtyFieldToPayload("LocationShown", "Location", "LocationShown");
        addDirtyFieldToPayload("LocationShown", "City", "CityShown");
        addDirtyFieldToPayload("LocationShown", "State", "StateShown");
        addDirtyFieldToPayload("LocationShown", "Country", "CountryShown");
        addDirtyFieldToPayload(
          "LocationShown",
          "CountryCode",
          "CountryCodeShown"
        );

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
