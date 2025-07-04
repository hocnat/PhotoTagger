import { useState, useEffect, useMemo } from "react";
import { FormState, ImageFile, Keyword, MetadataValue } from "../types";

const defaultEmptyValues: { [K in keyof FormState]?: any } = {
  Title: { value: "", isConsolidated: true },
  Creator: { value: "", isConsolidated: true },
  Copyright: { value: "", isConsolidated: true },
  Keywords: { value: [], isConsolidated: true },
};

export const useAggregatedMetadata = (imageFiles: ImageFile[]) => {
  const [formState, setFormState] = useState<Partial<FormState>>({});
  const [originalFormState, setOriginalFormState] = useState<
    Partial<FormState>
  >({});

  useEffect(() => {
    if (imageFiles.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    const newFormState: Partial<FormState> = {};
    const simpleKeys: (keyof Omit<FormState, "Keywords">)[] = [
      "Title",
      "GPSPosition",
      "Location",
      "City",
      "State",
      "Country",
      "CountryCode",
      "DateTimeOriginal",
      "OffsetTimeOriginal",
      "Creator",
      "Copyright",
    ];

    simpleKeys.forEach((key) => {
      const firstField =
        imageFiles[0]?.metadata[key] || defaultEmptyValues[key];
      let isConsolidated = firstField?.isConsolidated ?? true;
      let allSameValue = true;

      for (let i = 1; i < imageFiles.length; i++) {
        const currentField =
          imageFiles[i]?.metadata[key] || defaultEmptyValues[key];
        if (
          JSON.stringify(currentField?.value) !==
          JSON.stringify(firstField?.value)
        ) {
          allSameValue = false;
        }
        if (!currentField?.isConsolidated) {
          isConsolidated = false;
        }
      }
      if (allSameValue) {
        newFormState[key] = { value: firstField?.value ?? "", isConsolidated };
      } else {
        newFormState[key] = "(Mixed Values)";
      }
    });

    const allKeywords = new Map<
      string,
      { count: number; consolidated: boolean }
    >();
    imageFiles.forEach((file) => {
      const field = file.metadata.Keywords;
      const keywords = field?.value || [];
      const isConsolidated = field?.isConsolidated ?? true;
      keywords.forEach((kw) => {
        const existing = allKeywords.get(kw);
        if (existing) {
          existing.count++;
          existing.consolidated = existing.consolidated && isConsolidated;
        } else {
          allKeywords.set(kw, { count: 1, consolidated: isConsolidated });
        }
      });
    });
    const keywordValue: Keyword[] = Array.from(allKeywords.entries()).map(
      ([name, { count }]) => ({
        name,
        status: count === imageFiles.length ? "common" : "partial",
      })
    );
    const allKwConsolidated = Array.from(allKeywords.values()).every(
      (v) => v.consolidated
    );
    newFormState.Keywords = {
      value: keywordValue,
      isConsolidated:
        allKwConsolidated &&
        (imageFiles[0]?.metadata.Keywords?.isConsolidated ?? true),
    };

    setFormState(newFormState);
    setOriginalFormState(newFormState);
  }, [imageFiles]);

  const hasChanges = useMemo(() => {
    if (Object.keys(formState).length === 0) return false;
    const valuesChanged =
      JSON.stringify(formState) !== JSON.stringify(originalFormState);
    const needsConsolidation = Object.values(formState).some(
      (field) =>
        field !== "(Mixed Values)" &&
        field &&
        typeof field === "object" &&
        "isConsolidated" in field &&
        !field.isConsolidated
    );
    return valuesChanged || needsConsolidation;
  }, [formState, originalFormState]);

  return { formState, setFormState, hasChanges, originalFormState };
};
