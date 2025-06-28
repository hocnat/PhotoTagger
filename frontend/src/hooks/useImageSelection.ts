import { useState, useEffect, useRef } from "react";

export const useImageSelection = (images: string[]) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const lastSelectedIndex = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        setSelectedImages([...images]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images]);

  useEffect(() => {
    setSelectedImages([]);
  }, [images]);

  const handleImageClick = (
    e: React.MouseEvent,
    clickedImageName: string,
    clickedIndex: number
  ) => {
    e.stopPropagation();
    const isSelected = selectedImages.includes(clickedImageName);

    if (e.nativeEvent.shiftKey && lastSelectedIndex.current !== null) {
      const start = Math.min(lastSelectedIndex.current, clickedIndex);
      const end = Math.max(lastSelectedIndex.current, clickedIndex);
      const rangeSelection = images.slice(start, end + 1);
      const newSelection = new Set([...selectedImages, ...rangeSelection]);
      setSelectedImages(Array.from(newSelection));
    } else if (e.nativeEvent.ctrlKey || e.nativeEvent.metaKey) {
      setSelectedImages(
        isSelected
          ? selectedImages.filter((name) => name !== clickedImageName)
          : [...selectedImages, clickedImageName]
      );
      lastSelectedIndex.current = clickedIndex;
    } else {
      setSelectedImages(
        isSelected && selectedImages.length === 1 ? [] : [clickedImageName]
      );
      lastSelectedIndex.current = clickedIndex;
    }
  };

  const handleBackgroundClick = () => {
    setSelectedImages([]);
    lastSelectedIndex.current = null;
  };

  return {
    selectedImages,
    setSelectedImages,
    handleImageClick,
    handleBackgroundClick,
  };
};
