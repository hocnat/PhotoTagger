// A special type to represent a field that could have mixed values in the UI
type Mixable<T> = T | '(Mixed Values)';

// This interface describes the structure of the metadata object
// we receive from the backend after it has been processed.
export interface ImageMetadata {
  // We use [key: string]: any because ExifTool returns many dynamic keys.
  // This is a flexible way to handle it.
  [key: string]: any;

  // We can still define the keys we know and care about for type safety.
  Keywords: Mixable<string[]>;
  Caption: Mixable<string>;
  Author: Mixable<string>;
  
  "EXIF:DateTimeOriginal"?: Mixable<string>;
  "EXIF:OffsetTimeOriginal"?: Mixable<string>;

  DecimalLatitude?: Mixable<number>;
  DecimalLongitude?: Mixable<number>;

  "XMP:Location"?: Mixable<string>;
  "XMP:City"?: Mixable<string>;
  "XMP:State"?: Mixable<string>;
  "XMP:Country"?: Mixable<string>;
  "XMP:CountryCode"?: Mixable<string>;
}

// This interface describes the structure for our notification state.
export interface NotificationState {
  message: string;
  type: 'success' | 'error' | '';
}