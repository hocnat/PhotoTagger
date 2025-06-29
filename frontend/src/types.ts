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
  DecimalLatitude?: number;
  DecimalLongitude?: number;
  "XMP:Location"?: string;
  "XMP:City"?: string;
  "XMP:State"?: string;
  "XMP:Country"?: string;
  "XMP:CountryCode"?: string;
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
  Keywords: string[];
  Caption: string;
  Author: string;
  "EXIF:DateTimeOriginal"?: string;
  "EXIF:OffsetTimeOriginal"?: string;
  DecimalLatitude?: number;
  DecimalLongitude?: number;
  "XMP:Location"?: string;
  "XMP:City"?: string;
  "XMP:State"?: string;
  "XMP:Country"?: string;
  "XMP:CountryCode"?: string;
}

export interface FormState {
  Keywords: Keyword[];
  Caption: string | "(Mixed Values)";
  Author: string | "(Mixed Values)";
  "EXIF:DateTimeOriginal"?: string | "(Mixed Values)";
  "EXIF:OffsetTimeOriginal"?: string | "(Mixed Values)";
  DecimalLatitude?: number | "(Mixed Values)";
  DecimalLongitude?: number | "(Mixed Values)";
  "XMP:Location"?: string | "(Mixed Values)";
  "XMP:City"?: string | "(Mixed Values)";
  "XMP:State"?: string | "(Mixed Values)";
  "XMP:Country"?: string | "(Mixed Values)";
  "XMP:CountryCode"?: string | "(Mixed Values)";
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
