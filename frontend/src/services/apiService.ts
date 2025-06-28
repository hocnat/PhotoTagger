import {
  ApiError,
  ImageFile,
  RenameFileResult,
  SaveMetadataPayload,
} from "../types";

const API_BASE_URL = "http://localhost:5000/api";

/**
 * A generic response handler that checks for API errors, parses JSON,
 * and throws a structured error object if the request was not successful.
 *
 * It uses a generic type <T> which must be provided explicitly when calling it,
 * e.g., handleResponse<MyType>(response).
 *
 * @param response The raw Response object from a fetch call.
 * @returns A promise that resolves with the parsed JSON data of type T.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    // If the response is empty (e.g., HTTP 204 No Content),
    // return an empty object to prevent JSON parsing errors.
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  } else {
    // If the server returns an error, try to parse it as a structured ApiError.
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
