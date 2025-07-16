import React, { useEffect } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { useImageLoaderContext } from "context/ImageLoaderContext";
import { useImageSelectionContext } from "context/ImageSelectionContext";
import { useUnsavedChangesContext } from "context/UnsavedChangesContext";
import { HealthReport } from "types";
import { useImageFiltering } from "./hooks/useImageFiltering";
import FilterPanel from "./components/FilterPanel";
import ImageGrid from "./components/ImageGrid";

interface ImageGalleryProps {
  healthReportsMap: Record<string, HealthReport["checks"]>;
  onPanelOpen: () => void;
  onImageDoubleClick: (imageName: string) => void;
}

const getGridColumnCount = (): number => {
  const gridElement = document.querySelector(".image-grid");
  if (!gridElement) return 4;
  const cards = gridElement.querySelectorAll(".image-card");
  if (cards.length <= 1) return 1;
  const firstCardTop = cards[0].getBoundingClientRect().top;
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].getBoundingClientRect().top !== firstCardTop) return i;
  }
  return cards.length;
};

const ImageGallery: React.FC<ImageGalleryProps> = ({
  healthReportsMap,
  onPanelOpen,
  onImageDoubleClick,
}) => {
  const { imageData, isLoading, error } = useImageLoaderContext();
  const {
    selectedImages,
    setSelectedImages,
    handleSelectImage,
    clearSelection,
  } = useImageSelectionContext();
  const { promptAction, isConfirmationOpen } = useUnsavedChangesContext();

  const { filterState, setFilterState, filteredImages } = useImageFiltering(
    imageData.files,
    healthReportsMap
  );

  const handleBackgroundClickWithPrompt = () => {
    promptAction(clearSelection);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        promptAction(() =>
          setSelectedImages(filteredImages.map((img) => img.filename))
        );
        return;
      }

      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (
        e.key === "Enter" &&
        selectedImages.length > 0 &&
        !isConfirmationOpen
      ) {
        e.preventDefault();
        onPanelOpen();
        return;
      }

      const numImages = filteredImages.length;
      if (numImages === 0) return;

      if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (selectedImages.length > 1) return;
        const columns = getGridColumnCount();
        const currentIndex =
          selectedImages.length === 1
            ? filteredImages.findIndex(
                (img) => img.filename === selectedImages[0]
              )
            : -1;
        let newIndex = currentIndex;
        switch (e.key) {
          case "ArrowDown":
            newIndex = Math.min(currentIndex + columns, numImages - 1);
            break;
          case "ArrowUp":
            newIndex = Math.max(currentIndex - columns, 0);
            break;
          case "ArrowLeft":
            newIndex = Math.max(currentIndex - 1, 0);
            break;
          case "ArrowRight":
            newIndex = Math.min(currentIndex + 1, numImages - 1);
            break;
        }
        if (newIndex >= 0 && newIndex !== currentIndex) {
          promptAction(() =>
            setSelectedImages([filteredImages[newIndex].filename])
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedImages,
    filteredImages,
    promptAction,
    setSelectedImages,
    isConfirmationOpen,
    onPanelOpen,
  ]);

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <FilterPanel filterState={filterState} onFilterChange={setFilterState} />

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading images...</Typography>
        </Box>
      )}

      {!isLoading && imageData.files.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <Typography>No images loaded. Select a folder to begin.</Typography>
        </Box>
      )}

      {!isLoading &&
        imageData.files.length > 0 &&
        filteredImages.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <Typography>No images match the current filter.</Typography>
          </Box>
        )}

      <Box
        className="image-grid"
        onClick={handleBackgroundClickWithPrompt}
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          alignContent: "flex-start",
          p: 1,
        }}
      >
        <ImageGrid
          images={filteredImages}
          folderPath={imageData.folder}
          selectedImages={selectedImages}
          healthReportsMap={healthReportsMap}
          onImageClick={(e, name, idx) => {
            // The index for shift-click must come from the original, unfiltered list.
            const originalIndex = imageData.files.findIndex(
              (img) => img.filename === name
            );
            promptAction(() => handleSelectImage(e, name, originalIndex));
          }}
          onImageDoubleClick={onImageDoubleClick}
        />
      </Box>
    </Box>
  );
};

export default ImageGallery;
