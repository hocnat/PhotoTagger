import { useState, useCallback, useEffect } from "react";
import * as apiService from "api/apiService";
import { useSettingsContext } from "context/SettingsContext";
import { ApiError, ImageFile } from "types";

interface ImageData {
  folder: string;
  files: ImageFile[];
}

/**
 * A hook to manage the loading of images from a folder. It orchestrates fetching
 * the list of filenames and then their full metadata, combining them into the
 * application's core ImageData state.
 */
export const useImageLoader = () => {
  const [imageData, setImageData] = useState<ImageData>({
    folder: "",
    files: [],
  });
  const [folderInput, setFolderInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { settings } = useSettingsContext();

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
   * Fetches the list of image files and their full metadata from the backend.
   * This function encapsulates the entire async operation and returns the fetched
   * data to allow for chaining operations like running health checks.
   */
  const loadImages = useCallback(
    async (
      currentFolder: string,
      onDone?: () => void
    ): Promise<ImageFile[] | null> => {
      setIsLoading(true);
      setError("");
      try {
        // Step 1: Get the list of filenames from the API.
        const filenames = await apiService.getImages(currentFolder);
        if (filenames.length === 0) {
          setImageData({ folder: currentFolder, files: [] });
          if (onDone) onDone();
          return [];
        }

        // Step 2: Construct full paths and fetch the rich ImageFile objects.
        const fullPaths = filenames.map((name) => `${currentFolder}\\${name}`);
        const filesWithMetadata = await apiService.getMetadataForFiles(
          fullPaths
        );

        setImageData({ folder: currentFolder, files: filesWithMetadata });

        if (onDone) onDone();

        if (settings?.appBehavior.startupMode === "last") {
          await apiService.updateLastOpenedFolder(currentFolder);
        }

        return filesWithMetadata;
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "An error occurred while fetching images.");
        setImageData({ folder: "", files: [] });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [settings]
  );

  /**
   * Refreshes the metadata for a specific set of files and updates the main state.
   * This is more efficient than reloading the entire folder after a save operation.
   */
  const refreshImageData = useCallback(async (filePaths: string[]) => {
    if (filePaths.length === 0) return;

    try {
      const refreshedFiles = await apiService.getMetadataForFiles(filePaths);
      const refreshedFilesMap = new Map(
        refreshedFiles.map((file) => [file.filename, file])
      );

      setImageData((prevData) => ({
        ...prevData,
        files: prevData.files.map(
          (file) => refreshedFilesMap.get(file.filename) || file
        ),
      }));
    } catch (error) {
      console.error("Failed to refresh image data:", error);
    }
  }, []);

  const forceReload = useCallback(() => {
    if (imageData.folder) {
      loadImages(imageData.folder);
    }
  }, [imageData.folder, loadImages]);

  return {
    imageData,
    folderInput,
    setFolderInput,
    isLoading,
    error,
    loadImages,
    refreshImageData,
    forceReload,
  };
};
