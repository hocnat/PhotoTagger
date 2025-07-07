export interface MetadataValue<T> {
  value: T;
  isConsolidated: boolean;
}

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
  GPSPosition?: string;
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
  GPSPosition?: MetadataValue<string>;
  Location?: MetadataValue<string>;
  City?: MetadataValue<string>;
  State?: MetadataValue<string>;
  Country?: MetadataValue<string>;
  CountryCode?: MetadataValue<string>;
  DateTimeOriginal?: MetadataValue<string>;
  OffsetTimeOriginal?: MetadataValue<string>;
  Creator?: MetadataValue<string>;
  Copyright?: MetadataValue<string>;
}

export type FormStateField<T> = MetadataValue<T> | "(Mixed Values)";

export interface FormState {
  Title: FormStateField<string>;
  Keywords: FormStateField<Keyword[]>;
  GPSPosition?: FormStateField<string>;
  Location?: FormStateField<string>;
  City?: FormStateField<string>;
  State?: FormStateField<string>;
  Country?: FormStateField<string>;
  CountryCode?: FormStateField<string>;
  DateTimeOriginal?: FormStateField<string>;
  OffsetTimeOriginal?: FormStateField<string>;
  Creator: FormStateField<string>;
  Copyright: FormStateField<string>;
}

export interface ImageFile {
  filename: string;
  metadata: RawImageMetadata;
}

export interface SectionProps {
  formState: Partial<FormState>;
  handleFormChange: (fieldName: keyof FormState, newValue: any) => void;
}
