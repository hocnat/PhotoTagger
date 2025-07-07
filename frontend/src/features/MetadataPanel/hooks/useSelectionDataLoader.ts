import { useState, useEffect, useCallback } from "react";
import { ImageFile } from "types";
import * as apiService from "api/apiService";

export const useSelectionDataLoader = (
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

    apiService
      .getMetadataForSelection(filesToFetch)
      .then(setImageFiles)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedImageNames, folderPath]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { imageFiles, isLoading, refetch };
};
