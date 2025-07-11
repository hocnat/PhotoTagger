export interface MetadataValue<T> {
  value: T;
  isConsolidated: boolean;
}

export interface UniqueValue<T> {
  status: "unique";
  value: T;
  isConsolidated: boolean;
}

export interface MixedValue {
  status: "mixed";
}

export type AggregatedValue<T> = UniqueValue<T> | MixedValue;

export interface FileUpdatePayload {
  path: string;
  original_metadata: { [key: string]: any };
  new_metadata: { [key: string]: string | string[] | number | undefined };
}

export interface SaveMetadataPayload {
  files_to_update: FileUpdatePayload[];
  keywords_to_learn: string[];
}

export interface RenameFileResult {
  original: string;
  new: string;
  status: string;
}

export interface RenamePreviewItem {
  original: string;
  new: string;
}

export interface ApiError {
  message: string;
  details?: any;
}

export interface LocationPresetData {
  Latitude?: string;
  Longitude?: string;
  Location?: string;
  City?: string;
  State?: string;
  Country?: string;
  CountryCode?: string;
}

export interface LocationPreset {
  id: string;
  name: string;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
  data: LocationPresetData;
}

export interface ExtensionRule {
  extension: string;
  casing: "lowercase" | "uppercase";
}
export interface AppSettings {
  appBehavior: {
    startupMode: "last" | "fixed";
    fixedPath: string;
    lastOpenedFolder: string | null;
  };
  renameSettings: {
    pattern: string;
    extensionRules: ExtensionRule[];
  };
  powerUser: {
    rawExtensions: string[];
    sorting: {
      recencyBonus: number;
      recencyDays: number;
    };
  };
}

export interface Keyword {
  name: string;
  status: "common" | "partial";
}

export interface RawImageMetadata {
  [key: string]: any;
  Title?: MetadataValue<string>;
  Keywords?: MetadataValue<string[]>;
  LatitudeCreated?: MetadataValue<string>;
  LongitudeCreated?: MetadataValue<string>;
  LocationCreated?: MetadataValue<string>;
  CityCreated?: MetadataValue<string>;
  StateCreated?: MetadataValue<string>;
  CountryCreated?: MetadataValue<string>;
  CountryCodeCreated?: MetadataValue<string>;
  LatitudeShown?: MetadataValue<string>;
  LongitudeShown?: MetadataValue<string>;
  LocationShown?: MetadataValue<string>;
  CityShown?: MetadataValue<string>;
  StateShown?: MetadataValue<string>;
  CountryShown?: MetadataValue<string>;
  CountryCodeShown?: MetadataValue<string>;
  DateTimeOriginal?: MetadataValue<string>;
  OffsetTimeOriginal?: MetadataValue<string>;
  Creator?: MetadataValue<string>;
  Copyright?: MetadataValue<string>;
}

export interface FormState {
  Title: AggregatedValue<string>;
  Keywords: AggregatedValue<Keyword[]>;
  LatitudeCreated?: AggregatedValue<string>;
  LongitudeCreated?: AggregatedValue<string>;
  LocationCreated?: AggregatedValue<string>;
  CityCreated?: AggregatedValue<string>;
  StateCreated?: AggregatedValue<string>;
  CountryCreated?: AggregatedValue<string>;
  CountryCodeCreated?: AggregatedValue<string>;
  LatitudeShown?: AggregatedValue<string>;
  LongitudeShown?: AggregatedValue<string>;
  LocationShown?: AggregatedValue<string>;
  CityShown?: AggregatedValue<string>;
  StateShown?: AggregatedValue<string>;
  CountryShown?: AggregatedValue<string>;
  CountryCodeShown?: AggregatedValue<string>;
  DateTimeOriginal?: AggregatedValue<string>;
  OffsetTimeOriginal?: AggregatedValue<string>;
  Creator: AggregatedValue<string>;
  Copyright: AggregatedValue<string>;
}

export interface ImageFile {
  filename: string;
  metadata: RawImageMetadata;
}

export interface SectionProps {
  formState: Partial<FormState>;
  handleFormChange: (fieldName: keyof FormState, newValue: any) => void;
}
