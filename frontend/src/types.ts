// The structure of a Keyword object used in the form state.
export interface Keyword {
  name: string;
  status: "common" | "partial";
}

// The primary data structure for a single image's metadata from the backend.
// Note: Keywords from the backend will be a simple string array.
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

// The structure of our main form state in the UI.
// Keywords are represented as an array of Keyword objects.
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

// The structure for an image file, combining its name and its metadata.
export interface ImageFile {
  filename: string;
  metadata: RawImageMetadata;
}

// The structure for our notification state.
export interface NotificationState {
  message: string;
  type: "success" | "error" | "";
}
