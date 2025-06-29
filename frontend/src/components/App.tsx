import React, { useState, useCallback, useEffect } from "react";
import MetadataPanel from "./MetadataPanel";
import { UnsavedChangesDialog } from "./UnsavedChangesDialog";
import { RenameDialog } from "./RenameDialog";
import { useImageSelection } from "../hooks/useImageSelection";
import { useImageLoader } from "../hooks/useImageLoader";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { useRenameDialog } from "../hooks/useRenameDialog";
import "../App.css";

import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

/**
 * Calculates the number of columns in the image grid by inspecting the
 * rendered positions of the image cards. This is a robust way to determine
 * the layout without relying on hardcoded CSS values.
 * @returns The number of columns in the grid.
 */
const getGridColumnCount = (): number => {
  const gridElement = document.querySelector(".image-grid");
  if (!gridElement) return 4;

  const cards = gridElement.querySelectorAll(".image-card");
  if (cards.length <= 1) return 1;

  const firstCardTop = cards[0].getBoundingClientRect().top;
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].getBoundingClientRect().top !== firstCardTop) {
      return i;
    }
  }

  return cards.length;
};

const App: React.FC = () => {
  const [isDirty, setIsDirty] = useState(false);

  const {
    imageData,
    folderInput,
    setFolderInput,
    isLoading,
    error,
    loadImages,
  } = useImageLoader();
  const {
    selectedImages,
    setSelectedImages,
    handleImageClick,
    handleBackgroundClick,
  } = useImageSelection(imageData.files);

  const {
    promptAction,
    isConfirmationOpen,
    handleConfirm: handleUnsavedChangesConfirm,
    handleClose: handleUnsavedChangesClose,
  } = useUnsavedChanges(isDirty);
  const {
    openRenameDialog,
    isRenamePreviewLoading,
    dialogProps: renameDialogProps,
  } = useRenameDialog({ onRenameComplete: () => loadImages(imageData.folder) });

  const handleFetchImages = useCallback(() => {
    promptAction(() => {
      setSelectedImages([]);
      loadImages(folderInput, () => setIsDirty(false));
    });
  }, [promptAction, loadImages, folderInput, setSelectedImages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        promptAction(() => setSelectedImages([...imageData.files]));
        return;
      }

      if (document.activeElement !== document.body) return;

      const numImages = imageData.files.length;
      if (numImages === 0) return;

      if (["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();

        if (selectedImages.length > 1) return;

        const columns = getGridColumnCount();

        const currentIndex =
          selectedImages.length === 1
            ? imageData.files.indexOf(selectedImages[0])
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
          const newSelectedImage = imageData.files[newIndex];
          promptAction(() => setSelectedImages([newSelectedImage]));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImages, imageData.files, promptAction, setSelectedImages]);

  const getImageUrl = (imageName: string): string => {
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "grey.100",
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <PhotoLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PhotoTagger
          </Typography>
        </Toolbar>
      </AppBar>
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 2, overflowY: "auto" }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 2,
              alignItems: "center",
              p: 2,
              bgcolor: "background.paper",
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <TextField
              fullWidth
              label="Image Folder Path"
              variant="outlined"
              size="small"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFetchImages();
              }}
            />
            <Button
              variant="contained"
              onClick={handleFetchImages}
              disabled={isLoading || !folderInput}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <FolderOpenIcon />
                )
              }
            >
              {isLoading ? "Loading..." : "Load"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={
                isLoading ||
                isRenamePreviewLoading ||
                selectedImages.length === 0
              }
              onClick={() =>
                openRenameDialog(
                  selectedImages.map((name) => `${imageData.folder}\\${name}`)
                )
              }
              startIcon={
                isRenamePreviewLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <DriveFileRenameOutlineIcon />
                )
              }
            >
              Rename
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box
            className="image-grid"
            onClick={() => promptAction(handleBackgroundClick)}
          >
            {imageData.files.map((imageName, index) => {
              const isSelected = selectedImages.includes(imageName);
              const cardClassName = `image-card ${
                isSelected ? "selected" : ""
              }`.trim();

              return (
                <Paper
                  elevation={isSelected ? 8 : 2}
                  key={imageName}
                  className={cardClassName}
                  id={`image-card-${index}`}
                  onClick={(e) => {
                    promptAction(() => handleImageClick(e, imageName, index));
                  }}
                >
                  <img
                    src={getImageUrl(imageName)}
                    alt={imageName}
                    className="thumbnail"
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      p: 0.5,
                      display: "block",
                      wordWrap: "break-word",
                    }}
                  >
                    {imageName}
                  </Typography>
                </Paper>
              );
            })}
          </Box>
        </Box>
        <Box
          component="aside"
          sx={{
            width: 400,
            minWidth: 350,
            borderLeft: "1px solid",
            borderColor: "divider",
            overflowY: "auto",
            bgcolor: "background.paper",
            flexShrink: 0,
          }}
        >
          <MetadataPanel
            key={selectedImages.join("-")}
            selectedImageNames={selectedImages}
            folderPath={imageData.folder}
            getImageUrl={getImageUrl}
            setIsDirty={setIsDirty}
          />
        </Box>
      </Box>
      <UnsavedChangesDialog
        isOpen={isConfirmationOpen}
        onConfirm={handleUnsavedChangesConfirm}
        onClose={handleUnsavedChangesClose}
      />
      <RenameDialog {...renameDialogProps} />
    </Box>
  );
};

export default App;
