import { useState, useCallback, useEffect } from "react";

import * as apiService from "api/apiService";
import { useSettings } from "features/SettingsDialog/hooks/useSettings";
import { ApiError } from "types";

interface ImageData {
  folder: string;
  files: string[];
}

/**
 * A hook to manage the loading of images from a folder, handling user input,
 * API communication, and loading/error states. It also interacts with user
 * settings to determine the initial folder to display.
 */
export const useImageLoader = () => {
  // `imageData` holds the currently loaded folder path and its list of image files.
  const [imageData, setImageData] = useState<ImageData>({
    folder: "",
    files: [],
  });
  // `folderInput` is the mutable state for the folder path text field in the UI.
  const [folderInput, setFolderInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { settings } = useSettings();

  // This effect synchronizes the `folderInput` state with the user's saved
  // settings. It runs whenever the settings are loaded or changed, ensuring
  // the input field reflects the desired startup behavior (e.g., last opened folder).
  useEffect(() => {
    if (settings) {
      const { appBehavior } = settings;
      if (appBehavior.startupMode === "last" && appBehavior.lastOpenedFolder) {
        setFolderInput(appBehavior.lastOpenedFolder);
      } else if (appBehavior.startupMode === "fixed" && appBehavior.fixedPath) {
        setFolderInput(appBehavior.fixedPath);
      }
    }
  }, [settings]);

  /**
   * Fetches the list of image files from the backend for a given folder path.
   * This function encapsulates the entire async operation, including setting
   * loading states, handling errors, and updating the application state upon success.
   * It also updates the "last opened folder" setting if configured to do so.
   */
  const loadImages = useCallback(
    async (currentFolder: string, onDone?: (data: string[]) => void) => {
      setIsLoading(true);
      setError("");
      try {
        const data = await apiService.getImages(currentFolder);
        setImageData({ folder: currentFolder, files: data });
        // The optional onDone callback allows the calling component to perform
        // an action, like resetting dirty state, after a successful load.
        if (onDone) onDone(data);

        if (settings?.appBehavior.startupMode === "last") {
          // This is a "fire-and-forget" call to persist the folder path for the next session.
          await apiService.updateLastOpenedFolder(currentFolder);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "An error occurred while fetching images.");
        // On error, reset to a clean state to prevent operating on stale data.
        setImageData({ folder: "", files: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [settings] // Depends on settings to know whether to update the last opened folder.
  );

  return {
    imageData,
    folderInput,
    setFolderInput,
    isLoading,
    error,
    loadImages,
  };
};
