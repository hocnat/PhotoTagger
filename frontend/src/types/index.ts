// ====================================================================================
// Core Aggregated Data Structures
// These types define the hierarchical shape of metadata after being processed for the UI.
// They are used to manage the form state during editing.
// ====================================================================================

/**
 * The root of the hierarchical form state, combining all data blocks.
 */
export interface FormState {
  Content: ContentData;
  DateTime: DateTimeData;
  Creator: CreatorData;
  LocationCreated: LocationData;
  LocationShown: LocationData;
}

export interface ContentData {
  Title: AggregatedValue<string>;
  Keywords: AggregatedValue<ChipData[]>;
}

export interface DateTimeData {
  DateTimeOriginal: AggregatedValue<string>;
  OffsetTimeOriginal: AggregatedValue<string>;
}

export interface CreatorData {
  Creator: AggregatedValue<string>;
  Copyright: AggregatedValue<string>;
}

export interface LocationData {
  Latitude: AggregatedValue<string>;
  Longitude: AggregatedValue<string>;
  Location: AggregatedValue<string>;
  City: AggregatedValue<string>;
  State: AggregatedValue<string>;
  Country: AggregatedValue<string>;
  CountryCode: AggregatedValue<string>;
}

/**
 * A discriminated union to represent a value aggregated from multiple images.
 * This is the primary data structure for the form state.
 */
export type AggregatedValue<T> = UniqueValue<T> | MixedValue;

/**
 * Represents a field where all selected images have the same unique value.
 */
export interface UniqueValue<T> {
  status: "unique";
  value: T;
  isConsolidated: boolean;
}

/**
 * Represents a field where selected images have different values.
 */
export interface MixedValue {
  status: "mixed";
}

/**
 * Represents the data structure for a single, selectable chip in an autocomplete field.
 */
export interface ChipData {
  name: string;
  status: "common" | "partial";
}

// ====================================================================================
// Raw Backend Data & API Payloads
// These types define the "flat" data structures received from the backend
// and the contracts for communication with the API.
// ====================================================================================

/**
 * The complete metadata object for a single image file as returned by the backend.
 */
export interface ImageFile {
  filename: string;
  metadata: RawImageMetadata;
}

/**
 * The shape of the `metadata` property within an `ImageFile`. This represents the
 * "flat" structure of all possible metadata fields read from a file.
 */
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

/**
 * The raw, unprocessed metadata value for a single tag from ExifTool.
 * This is the building block for RawImageMetadata.
 */
export interface MetadataValue<T> {
  value: T;
  isConsolidated: boolean;
}

/**
 * The root payload for the "save metadata" API endpoint.
 */
export interface SaveMetadataPayload {
  files_to_update: FileUpdatePayload[];
  keywords_to_learn: string[];
}

/**
 * The payload sent to the backend to update a single file's metadata.
 */
export interface FileUpdatePayload {
  path: string;
  original_metadata: { [key: string]: any };
  new_metadata: { [key: string]: string | string[] | number | undefined };
}

/**
 * The data structure for a single file's result after a rename operation.
 */
export interface RenameFileResult {
  original: string;
  new: string;
  status: string;
}

/**
 * A generic structure for API error responses.
 */
export interface ApiError {
  message: string;
  details?: any;
}

// ====================================================================================
// UI-Specific Data Structures
// These types are used by specific UI components, like dialogs.
// ====================================================================================

/**
 * The data structure for a single item in the file rename preview dialog.
 */
export interface RenamePreviewItem {
  original: string;
  new: string;
}

// ====================================================================================
// Geotagging, Location Importer & User Presets
// ====================================================================================

/**
 * A generic representation of a GPS coordinate pair.
 */
export interface GpsCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * The response from the geocoding enrichment API.
 */
export interface EnrichedCoordinate extends GpsCoordinate {
  city: string;
  state: string;
  country: string;
  countryCode: string;
}

/**
 * The payload for matching image files to a GPX track.
 */
export interface GpxMatchRequest {
  gpxContent: string;
  files: {
    filename: string;
    dateTime: string;
    offsetTime: string;
  }[];
}

/**
 * The result from matching images to a GPX track, including the track itself.
 */
export interface GpxMatchResult {
  matches: ImageGpsMatch[];
  track: GeoJSON.LineString | null;
}

/**
 * The result of matching a single image to a GPX track.
 */
export interface ImageGpsMatch {
  filename: string;
  coordinates: GpsCoordinate | null;
}

/**
 * Basic location data extracted from a KML file.
 */
export interface Placemark {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * The data structure for a single saved location preset.
 */
export interface LocationPreset {
  id: string;
  name: string;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
  data: LocationPresetData;
}

/**
 * The generic data contained within a location preset. This is the single source
 * of truth for the structure of location data fields in the application.
 */
export interface LocationPresetData {
  Latitude?: string;
  Longitude?: string;
  Location?: string;
  City?: string;
  State?: string;
  Country?: string;
  CountryCode?: string;
}

// ====================================================================================
// Keyword Management
// ====================================================================================

/**
 * The data structure for a single managed keyword.
 */
export interface Keyword {
  id: string;
  name: string;
  useCount: number;
  lastUsed: string | null;
  createdAt: string;
  data: KeywordData;
}

/**
 * The hierarchical and relational data for a managed keyword.
 */
export interface KeywordData {
  parent: string | null;
  synonyms: string[];
}

/**
 * The payload used when creating or updating a keyword via the API.
 */
export type KeywordPayload = Pick<Keyword, "name" | "data">;

/**
 * The rich suggestion object returned by the API for keyword autocomplete.
 */
export interface KeywordSuggestion {
  primaryName: string;
  matchedTerm: string;
  parentName: string | null;
  synonyms: string[];
  allTermsToAdd: string[];
}

// ====================================================================================
// Health Check
// ====================================================================================

/**
 * The status of a single health check (e.g., for consolidation).
 */
export interface HealthStatus {
  status: "ok" | "error";
  message: string;
}

/**
 * The complete health check report for a single image file.
 */
export interface HealthReport {
  filename: string;
  checks: {
    consolidation: HealthStatus;
    requiredFields: HealthStatus;
    filename: HealthStatus;
  };
}

// ====================================================================================
// Time Shift
// ====================================================================================

/**
 * The data structure for a time shift operation payload.
 */
export interface TimeShiftData {
  direction: "add" | "subtract";
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * The data structure for a single item in the time shift preview dialog.
 */
export interface TimeShiftPreviewItem {
  filename: string;
  original: string;
  new: string;
}

// ====================================================================================
// Application Settings
// These types define the shape of the main, user-configurable application settings.
// ====================================================================================

/**
 * The complete, user-configurable application settings object.
 */
export interface AppSettings {
  appBehavior: {
    startupMode: "last" | "fixed";
    fixedPath: string;
    lastOpenedFolder: string | null;
    requiredFields: string[];
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
  countryMappings: CountryMapping[];
}

/**
 * A rule for how to handle file extensions during renaming.
 */
export interface ExtensionRule {
  extension: string;
  casing: "lowercase" | "uppercase";
}

/**
 * A single entry for the user-configurable country mappings.
 */
export interface CountryMapping {
  code: string;
  name: string;
}

// ====================================================================================
// Schema
// ====================================================================================

/**
 * The structure of a single field's schema information.
 */
export interface MetadataSchemaField {
  key: string;
  label: string;
}

/**
 * The structure for a group of fields in the schema.
 */
export interface MetadataSchemaGroup {
  groupName: string;
  fields: MetadataSchemaField[];
}

/**
 * The complete metadata schema, as an ordered array of groups.
 */
export type MetadataSchema = MetadataSchemaGroup[];
