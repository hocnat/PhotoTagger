import { useState, useEffect, useCallback } from "react";
import { ImageFile, ApiError } from "types";
import * as apiService from "api/apiService";
import { useImageSelectionContext } from "context/ImageSelectionContext";
import { useImageLoaderContext } from "context/ImageLoaderContext";

/**
 * A dedicated data-fetching hook responsible for loading the full metadata
 * for the currently selected images. It is self-sufficient and pulls its
 * dependencies (selected images, folder path) from contexts.
 *
 * @returns An object containing the loaded `imageFiles`, the `isLoading`
 *          state, any `error` message, and a `refetch` function.
 */
export const useSelectionDataLoader = () => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedImages } = useImageSelectionContext();
  const { imageData } = useImageLoaderContext();
  const folderPath = imageData.folder;

  /**
   * A memoized function that performs the API call to fetch metadata.
   * It constructs the full paths and handles the asynchronous operation's
   * loading, success, and error states.
   */
  const refetch = useCallback(() => {
    if (selectedImages.length === 0 || !folderPath) {
      setImageFiles([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    const filesToFetch = selectedImages.map((name) => `${folderPath}\\${name}`);

    apiService
      .getMetadataForFiles(filesToFetch)
      .then(setImageFiles)
      .catch((err: ApiError) => {
        const errorMessage = err.message || "An unknown error occurred";
        console.error(`Failed to load metadata for selection: ${errorMessage}`);
        setError(errorMessage);
        setImageFiles([]);
      })
      .finally(() => setIsLoading(false));
  }, [selectedImages, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { imageFiles, isLoading, error, refetch };
};
