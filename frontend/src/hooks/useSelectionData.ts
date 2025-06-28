import { useState, useEffect, useCallback } from "react";
import { ImageFile } from "../types";

export const useSelectionData = (
  selectedImageNames: string[],
  folderPath: string
) => {
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refetch = useCallback(() => {
    if (selectedImageNames.length === 0) {
      setImageFiles([]);
      return;
    }
    setIsLoading(true);
    const filesToFetch = selectedImageNames.map(
      (name) => `${folderPath}\\${name}`
    );

    fetch(`http://localhost:5000/api/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: filesToFetch }),
    })
      .then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch metadata"))
      )
      .then((data: ImageFile[]) => setImageFiles(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedImageNames, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { imageFiles, isLoading, refetch };
};
