import {
  ApiError,
  ImageFile,
  RenameFileResult,
  SaveMetadataPayload,
  RenamePreviewItem,
} from "../types";

const API_BASE_URL = "http://localhost:5000/api";

/**
 * A generic response handler that checks for API errors, parses JSON,
 * and throws a structured error object if the request was not successful.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  } else {
    const errorData: ApiError = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred." }));
    throw errorData;
  }
}

export const getImages = (folderPath: string): Promise<string[]> => {
  return fetch(
    `${API_BASE_URL}/images?folder=${encodeURIComponent(folderPath)}`
  ).then((response) => handleResponse<string[]>(response));
};

export const getMetadataForSelection = (
  filePaths: string[]
): Promise<ImageFile[]> => {
  return fetch(`${API_BASE_URL}/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<ImageFile[]>(response));
};

export const getSuggestions = (query: string): Promise<string[]> => {
  return fetch(
    `${API_BASE_URL}/suggestions?q=${encodeURIComponent(query)}`
  ).then((response) => handleResponse<string[]>(response));
};

export const saveMetadata = (
  payload: SaveMetadataPayload
): Promise<{ message: string }> => {
  return fetch(`${API_BASE_URL}/save_metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((response) => handleResponse<{ message: string }>(response));
};

export const renameFiles = (
  filePaths: string[]
): Promise<RenameFileResult[]> => {
  return fetch(`${API_BASE_URL}/rename_files`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<RenameFileResult[]>(response));
};

export const getRenamePreview = (
  filePaths: string[]
): Promise<RenamePreviewItem[]> => {
  return fetch(`${API_BASE_URL}/preview_rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: filePaths }),
  }).then((response) => handleResponse<RenamePreviewItem[]>(response));
};
