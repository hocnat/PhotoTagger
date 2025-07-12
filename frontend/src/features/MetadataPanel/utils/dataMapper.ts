import {
  ImageFile,
  RawImageMetadata,
  MetadataValue,
  AggregatedValue,
  ChipData,
  FormState,
} from "types";

/**
 * Aggregates a simple, single-value string field from multiple files using a type-safe accessor function.
 * This is a generic helper that determines if a field's value is consistent across all selected images.
 * @param imageFiles The list of all selected image files.
 * @param accessor A function that retrieves the specific metadata field (e.g., `f.metadata.Title`).
 * @returns An `AggregatedValue` object, either `{status: 'unique', ...}` or `{status: 'mixed'}`.
 */
function aggregateSimpleField(
  imageFiles: ImageFile[],
  accessor: (file: ImageFile) => MetadataValue<string> | undefined
): AggregatedValue<string> {
  const allValues = imageFiles.map(accessor);
  const existingFields = allValues.filter(
    (field): field is MetadataValue<string> => field !== undefined
  );

  // If some but not all files have the field, it's considered mixed.
  if (existingFields.length > 0 && existingFields.length < imageFiles.length) {
    return { status: "mixed" };
  }
  // If no files have the field, it's a unique (but empty) value.
  if (existingFields.length === 0) {
    return { status: "unique", value: "", isConsolidated: true };
  }

  // To compare values that might be objects or arrays, we stringify them for a reliable check.
  const firstValueStr = JSON.stringify(existingFields[0].value);
  const allSameValue = existingFields.every(
    (field) => JSON.stringify(field.value) === firstValueStr
  );

  if (allSameValue) {
    // If all values are the same, we also check if they are all internally consolidated.
    const allConsolidated = existingFields.every(
      (field) => field.isConsolidated ?? true
    );
    return {
      status: "unique",
      value: existingFields[0].value ?? "",
      isConsolidated: allConsolidated,
    };
  } else {
    return { status: "mixed" };
  }
}

/**
 * A specialized aggregator for keywords. It calculates the union of all keywords
 * from the selected files and determines if each keyword is 'common' (in all files)
 * or 'partial' (in some files).
 * @param imageFiles The list of all selected image files.
 * @returns An `AggregatedValue` containing the list of `ChipData` objects.
 */
function aggregateKeywords(
  imageFiles: ImageFile[]
): AggregatedValue<ChipData[]> {
  const allKeywords = new Map<string, { count: number }>();
  imageFiles.forEach((file) => {
    const keywords = file.metadata.Keywords?.value || [];
    // Using a Set ensures we only count each keyword once per file.
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

  // The keyword list itself is always presented as a 'unique' value to the user,
  // as they interact with a single, combined list in the UI.
  return {
    status: "unique",
    value: keywordValue,
    isConsolidated: allFilesHaveConsolidatedKeywords,
  };
}

/**
 * Defines the shape of a mapping configuration object, which creates a type-safe
 * link between the flat backend data and the hierarchical frontend state.
 */
export interface FieldMapping {
  // The path to the field in the hierarchical FormState, e.g., ['Content', 'Title'].
  formPath: [keyof FormState, keyof any];
  // A type-safe function to get the corresponding flat data from RawImageMetadata.
  rawAccessor: (raw: RawImageMetadata) => MetadataValue<any> | undefined;
  // The specific aggregator function to use for this field.
  aggregator: (imageFiles: ImageFile[]) => AggregatedValue<any>;
}

/**
 * The single source of truth for mapping the application's data structure.
 * It declaratively defines how to transform data from the flat `RawImageMetadata`
 * structure to the hierarchical `FormState` used by the UI.
 * This object drives both the data aggregation and the save process, ensuring symmetry.
 */
export const FORM_STATE_MAP: Record<
  keyof Omit<RawImageMetadata, "[key: string]: any">,
  FieldMapping
> = {
  Title: {
    formPath: ["Content", "Title"],
    rawAccessor: (raw: RawImageMetadata) => raw.Title,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.Title),
  },
  Keywords: {
    formPath: ["Content", "Keywords"],
    rawAccessor: (raw: RawImageMetadata) => raw.Keywords,
    aggregator: (files: ImageFile[]) => aggregateKeywords(files),
  },
  DateTimeOriginal: {
    formPath: ["DateTime", "DateTimeOriginal"],
    rawAccessor: (raw: RawImageMetadata) => raw.DateTimeOriginal,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.DateTimeOriginal),
  },
  OffsetTimeOriginal: {
    formPath: ["DateTime", "OffsetTimeOriginal"],
    rawAccessor: (raw: RawImageMetadata) => raw.OffsetTimeOriginal,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.OffsetTimeOriginal),
  },
  Creator: {
    formPath: ["Creator", "Creator"],
    rawAccessor: (raw: RawImageMetadata) => raw.Creator,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.Creator),
  },
  Copyright: {
    formPath: ["Creator", "Copyright"],
    rawAccessor: (raw: RawImageMetadata) => raw.Copyright,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.Copyright),
  },
  LatitudeCreated: {
    formPath: ["LocationCreated", "Latitude"],
    rawAccessor: (raw: RawImageMetadata) => raw.LatitudeCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LatitudeCreated),
  },
  LongitudeCreated: {
    formPath: ["LocationCreated", "Longitude"],
    rawAccessor: (raw: RawImageMetadata) => raw.LongitudeCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LongitudeCreated),
  },
  LocationCreated: {
    formPath: ["LocationCreated", "Location"],
    rawAccessor: (raw: RawImageMetadata) => raw.LocationCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LocationCreated),
  },
  CityCreated: {
    formPath: ["LocationCreated", "City"],
    rawAccessor: (raw: RawImageMetadata) => raw.CityCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CityCreated),
  },
  StateCreated: {
    formPath: ["LocationCreated", "State"],
    rawAccessor: (raw: RawImageMetadata) => raw.StateCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.StateCreated),
  },
  CountryCreated: {
    formPath: ["LocationCreated", "Country"],
    rawAccessor: (raw: RawImageMetadata) => raw.CountryCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CountryCreated),
  },
  CountryCodeCreated: {
    formPath: ["LocationCreated", "CountryCode"],
    rawAccessor: (raw: RawImageMetadata) => raw.CountryCodeCreated,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CountryCodeCreated),
  },
  LatitudeShown: {
    formPath: ["LocationShown", "Latitude"],
    rawAccessor: (raw: RawImageMetadata) => raw.LatitudeShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LatitudeShown),
  },
  LongitudeShown: {
    formPath: ["LocationShown", "Longitude"],
    rawAccessor: (raw: RawImageMetadata) => raw.LongitudeShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LongitudeShown),
  },
  LocationShown: {
    formPath: ["LocationShown", "Location"],
    rawAccessor: (raw: RawImageMetadata) => raw.LocationShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.LocationShown),
  },
  CityShown: {
    formPath: ["LocationShown", "City"],
    rawAccessor: (raw: RawImageMetadata) => raw.CityShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CityShown),
  },
  StateShown: {
    formPath: ["LocationShown", "State"],
    rawAccessor: (raw: RawImageMetadata) => raw.StateShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.StateShown),
  },
  CountryShown: {
    formPath: ["LocationShown", "Country"],
    rawAccessor: (raw: RawImageMetadata) => raw.CountryShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CountryShown),
  },
  CountryCodeShown: {
    formPath: ["LocationShown", "CountryCode"],
    rawAccessor: (raw: RawImageMetadata) => raw.CountryCodeShown,
    aggregator: (files: ImageFile[]) =>
      aggregateSimpleField(files, (f) => f.metadata.CountryCodeShown),
  },
};
