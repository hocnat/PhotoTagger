import { useState, useCallback } from "react";

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

      fetch(
        `http://localhost:5000/api/images?folder=${encodeURIComponent(
          currentFolder
        )}`
      )
        .then((response) =>
          response.ok
            ? response.json()
            : response.json().then((err) => Promise.reject(err))
        )
        .then((data: string[]) => {
          setImageData({ folder: currentFolder, files: data });
          if (onDone) {
            onDone(data);
          }
        })
        .catch((err) => {
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
