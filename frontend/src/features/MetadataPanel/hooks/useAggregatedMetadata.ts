import { useState, useEffect, useMemo } from "react";
import {
  FormState,
  ImageFile,
  Keyword,
  MetadataValue,
  RawImageMetadata,
  UniqueValue,
} from "types";

const defaultEmptyValues: { [K in keyof FormState]?: UniqueValue<any> } = {
  Title: { status: "unique", value: "", isConsolidated: true },
  Creator: { status: "unique", value: "", isConsolidated: true },
  Copyright: { status: "unique", value: "", isConsolidated: true },
  Keywords: { status: "unique", value: [], isConsolidated: true },
  LatitudeCreated: { status: "unique", value: "", isConsolidated: true },
  LongitudeCreated: { status: "unique", value: "", isConsolidated: true },
  LocationCreated: { status: "unique", value: "", isConsolidated: true },
  CityCreated: { status: "unique", value: "", isConsolidated: true },
  StateCreated: { status: "unique", value: "", isConsolidated: true },
  CountryCreated: { status: "unique", value: "", isConsolidated: true },
  CountryCodeCreated: { status: "unique", value: "", isConsolidated: true },
  LatitudeShown: { status: "unique", value: "", isConsolidated: true },
  LongitudeShown: { status: "unique", value: "", isConsolidated: true },
  LocationShown: { status: "unique", value: "", isConsolidated: true },
  CityShown: { status: "unique", value: "", isConsolidated: true },
  StateShown: { status: "unique", value: "", isConsolidated: true },
  CountryShown: { status: "unique", value: "", isConsolidated: true },
  CountryCodeShown: { status: "unique", value: "", isConsolidated: true },
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

    let newAggregatedState: Partial<FormState> = {};

    if (imageFiles.length === 1) {
      const file = imageFiles[0];
      const { Keywords, original, ...restOfMetadata } = file.metadata;

      for (const key in restOfMetadata) {
        const field = restOfMetadata[
          key as keyof typeof restOfMetadata
        ] as MetadataValue<any>;
        if (field) {
          (newAggregatedState as any)[key] = {
            status: "unique",
            value: field.value ?? "",
            isConsolidated: field.isConsolidated ?? true,
          };
        }
      }

      if (Keywords && Keywords.value) {
        newAggregatedState.Keywords = {
          status: "unique",
          value: Keywords.value.map((kw) => ({ name: kw, status: "common" })),
          isConsolidated: Keywords.isConsolidated,
        };
      } else {
        newAggregatedState.Keywords = {
          status: "unique",
          value: [],
          isConsolidated: true,
        };
      }

      for (const key in defaultEmptyValues) {
        if (!newAggregatedState[key as keyof FormState]) {
          newAggregatedState[key as keyof FormState] =
            defaultEmptyValues[key as keyof FormState];
        }
      }
    } else {
      const allPossibleKeys = new Set<keyof Omit<FormState, "Keywords">>();
      imageFiles.forEach((file) => {
        Object.keys(file.metadata).forEach((key) => {
          if (key !== "Keywords" && key !== "original") {
            allPossibleKeys.add(key as keyof Omit<FormState, "Keywords">);
          }
        });
      });
      Object.keys(defaultEmptyValues).forEach((key) => {
        if (key !== "Keywords") {
          allPossibleKeys.add(key as keyof Omit<FormState, "Keywords">);
        }
      });

      allPossibleKeys.forEach((key) => {
        const existingFields = imageFiles
          .map((file) => file.metadata[key as keyof RawImageMetadata])
          .filter((field): field is MetadataValue<any> => field !== undefined);

        if (
          existingFields.length > 0 &&
          existingFields.length < imageFiles.length
        ) {
          newAggregatedState[key] = { status: "mixed" };
          return;
        }

        if (existingFields.length === 0) {
          if (defaultEmptyValues[key]) {
            newAggregatedState[key] = defaultEmptyValues[key];
          }
          return;
        }

        const firstValueStr = JSON.stringify(existingFields[0].value);
        const allSameValue = existingFields.every(
          (field) => JSON.stringify(field.value) === firstValueStr
        );

        if (allSameValue) {
          const allConsolidated = existingFields.every(
            (field) => field.isConsolidated ?? true
          );
          newAggregatedState[key] = {
            status: "unique",
            value: existingFields[0].value ?? "",
            isConsolidated: allConsolidated,
          };
        } else {
          newAggregatedState[key] = { status: "mixed" };
        }
      });

      const allKeywords = new Map<string, { count: number }>();
      imageFiles.forEach((file) => {
        const keywords = file.metadata.Keywords?.value || [];
        new Set(keywords).forEach((kw) => {
          allKeywords.set(kw, { count: (allKeywords.get(kw)?.count || 0) + 1 });
        });
      });

      const keywordValue: Keyword[] = Array.from(allKeywords.entries()).map(
        ([name, { count }]) => ({
          name,
          status: count === imageFiles.length ? "common" : "partial",
        })
      );
      const allFilesHaveConsolidatedKeywords = imageFiles.every(
        (file) => file.metadata.Keywords?.isConsolidated ?? true
      );

      newAggregatedState.Keywords = {
        status: "unique",
        value: keywordValue,
        isConsolidated: allFilesHaveConsolidatedKeywords,
      };
    }

    setFormState(newAggregatedState);
    setOriginalFormState(newAggregatedState);
  }, [imageFiles]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(originalFormState);
  }, [formState, originalFormState]);

  return { formState, setFormState, hasChanges, originalFormState };
};
