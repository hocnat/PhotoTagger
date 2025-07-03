// --- API Payloads and Responses ---

export interface FileUpdatePayload {
  path: string;
  metadata: Partial<RawImageMetadata>;
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

// --- Location Preset Types ---

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

// --- App Settings Types ---
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

// --- Form and State Structures ---

export interface Keyword {
  name: string;
  status: "common" | "partial";
}

export interface RawImageMetadata {
  [key: string]: any;
  Title?: string;
  Keywords?: string[];
  GPSPosition?: string;
  Location?: string;
  City?: string;
  State?: string;
  Country?: string;
  CountryCode?: string;
  CreateDate?: string;
  OffsetTimeOriginal?: string;
  CalculatedOffsetTimeOriginal?: string;
  Creator?: string;
}

export interface FormState {
  Title: string | "(Mixed Values)";
  Keywords: Keyword[];
  GPSPosition?: string | "(Mixed Values)";
  Location?: string | "(Mixed Values)";
  City?: string | "(Mixed Values)";
  State?: string | "(Mixed Values)";
  Country?: string | "(Mixed Values)";
  CountryCode?: string | "(Mixed Values)";
  CreateDate?: string | "(Mixed Values)";
  OffsetTimeOriginal?: string | "(Mixed Values)";
  Creator: string | "(Mixed Values)";
}

export interface ImageFile {
  filename: string;
  metadata: RawImageMetadata;
}

// --- Component Prop Interfaces ---

export interface SectionProps {
  formState: Partial<FormState>;
  handleFormChange: (fieldName: keyof FormState, newValue: any) => void;
}
