import { useState, useEffect, useRef } from "react";

export const useImageSelection = (images: string[]) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const lastSelectedIndex = useRef<number | null>(null);

  useEffect(() => {
    setSelectedImages([]);
    lastSelectedIndex.current = null;
  }, [images]);

  const handleSelectImage = (
    event: React.MouseEvent,
    clickedImageName: string,
    clickedIndex: number
  ) => {
    event.stopPropagation();
    const isSelected = selectedImages.includes(clickedImageName);

    if (event.nativeEvent.shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, clickedIndex);
      const end = Math.max(lastSelectedIndex.current, clickedIndex);
      const rangeSelection = images.slice(start, end + 1);
      const newSelection = new Set([...selectedImages, ...rangeSelection]);
      setSelectedImages(Array.from(newSelection));
    } else if (event.nativeEvent.ctrlKey || event.nativeEvent.metaKey) {
      setSelectedImages(
        isSelected
          ? selectedImages.filter((name) => name !== clickedImageName)
          : [...selectedImages, clickedImageName]
      );
      lastSelectedIndex.current = clickedIndex;
    } else {
      setSelectedImages([clickedImageName]);
      lastSelectedIndex.current = clickedIndex;
    }
  };

  const selectSingleImage = (imageName: string) => {
    setSelectedImages([imageName]);
    lastSelectedIndex.current = images.indexOf(imageName);
  };

  const clearSelection = () => {
    setSelectedImages([]);
    lastSelectedIndex.current = null;
  };

  return {
    selectedImages,
    setSelectedImages,
    handleSelectImage,
    selectSingleImage,
    clearSelection,
  };
};
