import { useState, useCallback } from "react";
import * as apiService from "../services/apiService";
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

  const loadImages = useCallback(
    (currentFolder: string, onDone?: (data: string[]) => void) => {
      setIsLoading(true);
      setError("");

      apiService
        .getImages(currentFolder)
        .then((data) => {
          setImageData({ folder: currentFolder, files: data });
          if (onDone) {
            onDone(data);
          }
        })
        .catch((err: ApiError) => {
          setError(err.message || "An error occurred while fetching images.");
          setImageData({ folder: "", files: [] });
        })
        .finally(() => setIsLoading(false));
    },
    []
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
