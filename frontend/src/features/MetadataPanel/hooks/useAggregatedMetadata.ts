import { useState, useEffect, useMemo } from "react";
import {
  FormState,
  ImageFile,
  ChipData,
  MetadataValue,
  RawImageMetadata,
  AggregatedValue,
  ContentData,
  CreatorData,
  DateTimeData,
  LocationData,
} from "types";

function aggregateSimpleField<T>(
  imageFiles: ImageFile[],
  key: keyof RawImageMetadata,
  defaultValue: T
): AggregatedValue<T> {
  const allValues = imageFiles.map(
    (file) => file.metadata[key] as MetadataValue<T> | undefined
  );
  const existingFields = allValues.filter(
    (field): field is MetadataValue<T> => field !== undefined
  );

  if (existingFields.length > 0 && existingFields.length < imageFiles.length) {
    return { status: "mixed" };
  }
  if (existingFields.length === 0) {
    return { status: "unique", value: defaultValue, isConsolidated: true };
  }

  const firstValueStr = JSON.stringify(existingFields[0].value);
  const allSameValue = existingFields.every(
    (field) => JSON.stringify(field.value) === firstValueStr
  );

  if (allSameValue) {
    const allConsolidated = existingFields.every(
      (field) => field.isConsolidated ?? true
    );
    return {
      status: "unique",
      value: existingFields[0].value ?? defaultValue,
      isConsolidated: allConsolidated,
    };
  } else {
    return { status: "mixed" };
  }
}

function aggregateKeywords(
  imageFiles: ImageFile[]
): AggregatedValue<ChipData[]> {
  const allKeywords = new Map<string, { count: number }>();
  imageFiles.forEach((file) => {
    const keywords = file.metadata.Keywords?.value || [];
    new Set(keywords).forEach((kw) => {
      allKeywords.set(kw, { count: (allKeywords.get(kw)?.count || 0) + 1 });
    });
  });

  const keywordValue: ChipData[] = Array.from(allKeywords.entries()).map(
    ([name, { count }]) => ({
      name,
      status: count === imageFiles.length ? "common" : "partial",
    })
  );

  const allFilesHaveConsolidatedKeywords = imageFiles.every(
    (file) => file.metadata.Keywords?.isConsolidated ?? true
  );

  return {
    status: "unique",
    value: keywordValue,
    isConsolidated: allFilesHaveConsolidatedKeywords,
  };
}

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

    const contentData: ContentData = {
      Title: aggregateSimpleField(imageFiles, "Title", ""),
      Keywords: aggregateKeywords(imageFiles),
    };

    const dateTimeData: DateTimeData = {
      DateTimeOriginal: aggregateSimpleField(
        imageFiles,
        "DateTimeOriginal",
        ""
      ),
      OffsetTimeOriginal: aggregateSimpleField(
        imageFiles,
        "OffsetTimeOriginal",
        ""
      ),
    };

    const creatorData: CreatorData = {
      Creator: aggregateSimpleField(imageFiles, "Creator", ""),
      Copyright: aggregateSimpleField(imageFiles, "Copyright", ""),
    };

    const locationCreatedData: LocationData = {
      Latitude: aggregateSimpleField(imageFiles, "LatitudeCreated", ""),
      Longitude: aggregateSimpleField(imageFiles, "LongitudeCreated", ""),
      Location: aggregateSimpleField(imageFiles, "LocationCreated", ""),
      City: aggregateSimpleField(imageFiles, "CityCreated", ""),
      State: aggregateSimpleField(imageFiles, "StateCreated", ""),
      Country: aggregateSimpleField(imageFiles, "CountryCreated", ""),
      CountryCode: aggregateSimpleField(imageFiles, "CountryCodeCreated", ""),
    };

    const locationShownData: LocationData = {
      Latitude: aggregateSimpleField(imageFiles, "LatitudeShown", ""),
      Longitude: aggregateSimpleField(imageFiles, "LongitudeShown", ""),
      Location: aggregateSimpleField(imageFiles, "LocationShown", ""),
      City: aggregateSimpleField(imageFiles, "CityShown", ""),
      State: aggregateSimpleField(imageFiles, "StateShown", ""),
      Country: aggregateSimpleField(imageFiles, "CountryShown", ""),
      CountryCode: aggregateSimpleField(imageFiles, "CountryCodeShown", ""),
    };

    const newAggregatedState: FormState = {
      Content: contentData,
      DateTime: dateTimeData,
      Creator: creatorData,
      LocationCreated: locationCreatedData,
      LocationShown: locationShownData,
    };

    setFormState(newAggregatedState);
    setOriginalFormState(newAggregatedState);
  }, [imageFiles]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(originalFormState);
  }, [formState, originalFormState]);

  return { formState, setFormState, hasChanges, originalFormState };
};
