import { useState, useEffect, useRef } from "react";

/**
 * A hook to manage the complex logic of selecting items in a grid.
 * It encapsulates state for the current selection and handles user
 * interactions for single clicks, Ctrl/Cmd-clicks for toggling, and
 * Shift-clicks for range selection.
 * @param images - The full, ordered list of all image filenames currently in the grid.
 * This is used to calculate ranges for Shift-click selections.
 */
export const useImageSelection = (images: string[]) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  // We use a ref for lastSelectedIndex because its value is needed within
  // the click handler but changing it should not trigger a re-render by itself.
  const lastSelectedIndex = useRef<number | null>(null);

  // This effect ensures that the selection is cleared whenever a new set of
  // images is loaded into the grid (e.g., when the user changes folders).
  useEffect(() => {
    setSelectedImages([]);
    lastSelectedIndex.current = null;
  }, [images]);

  /**
   * The core handler for click events on an image card. It interprets modifier
   * keys (Shift, Ctrl/Cmd) to perform the correct selection action.
   * @param event - The React mouse event to check for modifier keys.
   * @param clickedImageName - The filename of the image that was clicked.
   * @param clickedIndex - The index of the clicked image within the `images` array.
   */
  const handleSelectImage = (
    event: React.MouseEvent,
    clickedImageName: string,
    clickedIndex: number
  ) => {
    // Prevent the click from bubbling up to the grid background, which would
    // clear the selection we are about to make.
    event.stopPropagation();
    const isSelected = selectedImages.includes(clickedImageName);

    if (event.nativeEvent.shiftKey && lastSelectedIndex.current !== null) {
      // Logic for Shift-click range selection.
      const start = Math.min(lastSelectedIndex.current, clickedIndex);
      const end = Math.max(lastSelectedIndex.current, clickedIndex);
      const rangeSelection = images.slice(start, end + 1);
      // Using a Set prevents duplicates if the user's shift-click overlaps
      // with an existing selection.
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
   * This is used for non-standard selection events, like a double-click to edit.
   */
  const selectSingleImage = (imageName: string) => {
    setSelectedImages([imageName]);
    lastSelectedIndex.current = images.indexOf(imageName);
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
