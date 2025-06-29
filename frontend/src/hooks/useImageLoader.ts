import { useState, useCallback, useEffect } from "react";
import * as apiService from "../services/apiService";
import { useSettings } from "../context/SettingsContext";
import { ApiError } from "../types";

interface ImageData {
  folder: string;
  files: string[];
}

export const useImageLoader = () => {
  const [imageData, setImageData] = useState<ImageData>({
    folder: "",
    files: [],
  });
  const [folderInput, setFolderInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { settings, updateLastOpenedFolder } = useSettings();

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

  const loadImages = useCallback(
    async (currentFolder: string, onDone?: (data: string[]) => void) => {
      setIsLoading(true);
      setError("");
      try {
        const data = await apiService.getImages(currentFolder);
        setImageData({ folder: currentFolder, files: data });
        if (onDone) onDone(data);

        if (settings?.appBehavior.startupMode === "last") {
          await updateLastOpenedFolder(currentFolder);
        }
      } catch (err) {
        const apiErr = err as ApiError;
        setError(apiErr.message || "An error occurred while fetching images.");
        setImageData({ folder: "", files: [] });
      } finally {
        setIsLoading(false);
      }
    },
    [settings, updateLastOpenedFolder]
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
