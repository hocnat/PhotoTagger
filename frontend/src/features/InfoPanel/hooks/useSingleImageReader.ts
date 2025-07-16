import { useState, useEffect } from "react";
import { RawImageMetadata } from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";

/**
 * A hook to fetch and manage the metadata for a single selected image.
 * It is designed to be efficient, only performing an API call when the
 * info panel is open and a single image path is provided.
 *
 * @param folderPath The path to the current image folder.
 * @param selectedImage The filename of the single selected image, or null.
 * @param isPanelOpen A boolean indicating if the Info Panel is currently open.
 * @returns The loading state, error state, and the fetched metadata.
 */
export const useSingleImageReader = (
  folderPath: string,
  selectedImage: string | null,
  isPanelOpen: boolean
) => {
  const [metadata, setMetadata] = useState<RawImageMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    // This effect runs whenever the selection or panel visibility changes.
    // It will only fetch data if the panel is open AND there is exactly one image selected.
    if (isPanelOpen && selectedImage && folderPath) {
      const fullPath = `${folderPath}\\${selectedImage}`;
      setIsLoading(true);
      setError(null);

      apiService
        .getMetadataForFiles([fullPath])
        .then((response) => {
          if (response && response.length > 0) {
            setMetadata(response[0].metadata);
          } else {
            // Handle cases where the API returns an empty array for a valid path
            throw new Error(
              "Metadata could not be loaded for the selected image."
            );
          }
        })
        .catch((err) => {
          const errorMessage = `Failed to fetch metadata: ${err.message}`;
          setError(errorMessage);
          showNotification(errorMessage, "error");
          setMetadata(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // If the panel is closed or the selection is invalid, clear the state.
      setMetadata(null);
      setError(null);
      setIsLoading(false);
    }
  }, [selectedImage, isPanelOpen, folderPath, showNotification]);

  return { metadata, isLoading, error };
};
