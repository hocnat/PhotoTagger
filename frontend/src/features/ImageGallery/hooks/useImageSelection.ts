import { useState, useEffect, useRef } from "react";
import { ImageFile } from "types";

/**
 * A hook to manage the complex logic of selecting items in a grid.
 * It encapsulates state for the current selection and handles user
 * interactions for single clicks, Ctrl/Cmd-clicks for toggling, and
 * Shift-clicks for range selection.
 * @param images - The full, ordered list of all ImageFile objects currently in the grid.
 * This is used to calculate ranges for Shift-click selections.
 */
export const useImageSelection = (images: ImageFile[]) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const lastSelectedIndex = useRef<number | null>(null);

  // This effect correctly clears the selection when the folder changes.
  useEffect(() => {
    setSelectedImages([]);
    lastSelectedIndex.current = null;
  }, [images]);

  /**
   * The core handler for click events on an image card. It interprets modifier
   * keys (Shift, Ctrl/Cmd) to perform the correct selection action.
   */
  const handleSelectImage = (
    event: React.MouseEvent,
    clickedImageName: string,
    clickedIndex: number
  ) => {
    event.stopPropagation();
    const isSelected = selectedImages.includes(clickedImageName);

    if (event.nativeEvent.shiftKey && lastSelectedIndex.current !== null) {
      // Logic for Shift-click range selection.
      const start = Math.min(lastSelectedIndex.current, clickedIndex);
      const end = Math.max(lastSelectedIndex.current, clickedIndex);
      const rangeSelection = images
        .slice(start, end + 1)
        .map((image) => image.filename);
      const newSelection = new Set([...selectedImages, ...rangeSelection]);
      setSelectedImages(Array.from(newSelection));
    } else if (event.nativeEvent.ctrlKey || event.nativeEvent.metaKey) {
      // Logic for Ctrl/Cmd-click to toggle a single item's selection status.
      setSelectedImages(
        isSelected
          ? selectedImages.filter((name) => name !== clickedImageName)
          : [...selectedImages, clickedImageName]
      );
      lastSelectedIndex.current = clickedIndex;
    } else {
      // Logic for a standard click, which selects only the clicked item.
      setSelectedImages([clickedImageName]);
      lastSelectedIndex.current = clickedIndex;
    }
  };

  /**
   * A discrete action to select a single image, clearing any previous selection.
   */
  const selectSingleImage = (imageName: string) => {
    setSelectedImages([imageName]);
    lastSelectedIndex.current = images.findIndex(
      (image) => image.filename === imageName
    );
  };

  /**
   * Clears the entire selection.
   */
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
