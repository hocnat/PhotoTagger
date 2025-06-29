import {
  ApiError,
  AppSettings,
  ImageFile,
  RenameFileResult,
  SaveMetadataPayload,
  RenamePreviewItem,
  LocationPreset,
  LocationPresetData,
} from "../types";

const API_BASE_URL = "http://localhost:5000/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return {} as T;
    return response.json();
  } else {
    const errorData: ApiError = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred." }));
    throw errorData;
  }
}

export const getImages = (folderPath: string): Promise<string[]> =>
  fetch(`${API_BASE_URL}/images?folder=${encodeURIComponent(folderPath)}`).then(
    (response) => handleResponse<string[]>(response)
  );

export const getMetadataForSelection = (
  filePaths: string[]
): Promise<ImageFile[]> =>
  fetch(`${API_BASE_URL}/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<ImageFile[]>(response));

export const getKeywordSuggestions = (query: string): Promise<string[]> =>
  fetch(
    `${API_BASE_URL}/keyword_suggestions?q=${encodeURIComponent(query)}`
  ).then((response) => handleResponse<string[]>(response));

export const saveMetadata = (
  payload: SaveMetadataPayload
): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/save_metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((response) => handleResponse<{ message: string }>(response));

export const renameFiles = (filePaths: string[]): Promise<RenameFileResult[]> =>
  fetch(`${API_BASE_URL}/rename_files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<RenameFileResult[]>(response));

export const getRenamePreview = (
  filePaths: string[]
): Promise<RenamePreviewItem[]> =>
  fetch(`${API_BASE_URL}/preview_rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<RenamePreviewItem[]>(response));

export const getLocationPresets = (): Promise<LocationPreset[]> =>
  fetch(`${API_BASE_URL}/locations`).then((response) =>
    handleResponse<LocationPreset[]>(response)
  );

export const saveLocationPreset = (
  name: string,
  data: LocationPresetData
): Promise<LocationPreset> =>
  fetch(`${API_BASE_URL}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  }).then((response) => handleResponse<LocationPreset>(response));

export const trackLocationPresetUsage = (
  presetId: string
): Promise<LocationPreset> =>
  fetch(`${API_BASE_URL}/locations/${presetId}/track_usage`, {
    method: "PUT",
  }).then((response) => handleResponse<LocationPreset>(response));

export const getSettings = (): Promise<AppSettings> => {
  return fetch(`${API_BASE_URL}/settings`).then((response) =>
    handleResponse<AppSettings>(response)
  );
};

export const updateSettings = (settings: AppSettings): Promise<AppSettings> => {
  return fetch(`${API_BASE_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  }).then((response) => handleResponse<AppSettings>(response));
};

export const updateLastOpenedFolder = (
  path: string
): Promise<{ message: string }> => {
  return fetch(`${API_BASE_URL}/settings/last-opened-folder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  }).then((response) => handleResponse<{ message: string }>(response));
};
