import { useState, useCallback, useEffect } from "react";

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
  IconButton,
  Drawer,
  CssBaseline,
  Tooltip,
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import LabelOutlinedIcon from "@mui/icons-material/LabelOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";

import { MetadataPanel } from "./features/MetadataPanel";
import { RenameDialog } from "./features/RenameDialog";
import { SettingsDialog } from "./features/SettingsDialog";
import { UnsavedChangesDialog } from "./components/UnsavedChangesDialog";
import {
  UnsavedChangesProvider,
  useUnsavedChangesContext,
} from "./context/UnsavedChangesContext";
import {
  ImageSelectionProvider,
  useImageSelectionContext,
} from "./context/ImageSelectionContext";
import {
  ImageLoaderProvider,
  useImageLoaderContext,
} from "./context/ImageLoaderContext";

import { useRenameDialog } from "./features/RenameDialog";

import "./App.css";

const drawerWidth = 960;

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

const AppContent: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const {
    imageData,
    folderInput,
    setFolderInput,
    isLoading,
    error,
    loadImages,
  } = useImageLoaderContext();
  const {
    selectedImages,
    setSelectedImages,
    handleSelectImage,
    selectSingleImage,
    clearSelection,
  } = useImageSelectionContext();
  const {
    setIsDirty,
    promptAction,
    isConfirmationOpen,
    handleConfirm: handleUnsavedChangesConfirm,
    handleClose: handleUnsavedChangesClose,
  } = useUnsavedChangesContext();

  const {
    openRenameDialog,
    isRenamePreviewLoading,
    dialogProps: renameDialogProps,
  } = useRenameDialog();

  const handleFetchImages = useCallback(() => {
    promptAction(() => {
      setIsPanelOpen(false);
      setSelectedImages([]);
      loadImages(folderInput, () => setIsDirty(false));
    });
  }, [promptAction, loadImages, folderInput, setSelectedImages, setIsDirty]);

  useEffect(() => {
    if (folderInput && !isLoading && !initialLoadDone) {
      handleFetchImages();
      setInitialLoadDone(true);
    }
  }, [folderInput, isLoading, initialLoadDone, handleFetchImages]);

  const handlePanelOpen = useCallback(() => {
    if (selectedImages.length > 0) {
      setIsPanelOpen(true);
    }
  }, [selectedImages.length]);

  const handlePanelClose = () => {
    promptAction(() => setIsPanelOpen(false));
  };

  const handleSaveSuccess = () => {
    setIsPanelOpen(false);
  };

  const handleImageDoubleClick = (imageName: string) => {
    promptAction(() => {
      selectSingleImage(imageName);
      setIsDirty(false);
      setIsPanelOpen(true);
    });
  };

  const handleBackgroundClickWithPrompt = () => {
    promptAction(clearSelection);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        promptAction(() => setSelectedImages([...imageData.files]));
        return;
      }
      if (
        e.key === "Enter" &&
        selectedImages.length > 0 &&
        !isPanelOpen &&
        !isConfirmationOpen
      ) {
        e.preventDefault();
        handlePanelOpen();
        return;
      }
      if (document.activeElement !== document.body || isPanelOpen) return;
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
          promptAction(() => setSelectedImages([imageData.files[newIndex]]));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedImages,
    imageData.files,
    promptAction,
    setSelectedImages,
    isPanelOpen,
    isConfirmationOpen,
    handlePanelOpen,
  ]);

  useEffect(() => {
    if (selectedImages.length === 0 && isPanelOpen) {
      setIsPanelOpen(false);
    }
  }, [selectedImages.length, isPanelOpen]);

  const getImageUrl = (imageName: string): string => {
    if (!imageData.folder || !imageName) return "";
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <PhotoLibraryIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            PhotoTagger
          </Typography>

          <Tooltip title="Edit metadata for selected files">
            <span>
              <IconButton
                color="inherit"
                aria-label="edit metadata"
                onClick={handlePanelOpen}
                disabled={selectedImages.length === 0}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Rename selected files">
            <span>
              <IconButton
                color="inherit"
                disabled={
                  isLoading ||
                  isRenamePreviewLoading ||
                  selectedImages.length === 0
                }
                onClick={() => {
                  const fullPaths = selectedImages.map(
                    (name) => `${imageData.folder}\\${name}`
                  );
                  openRenameDialog(fullPaths);
                }}
              >
                {isRenamePreviewLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <LabelOutlinedIcon />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={() => setIsSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
        }}
      >
        <Toolbar />
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
            flexShrink: 0,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Image Folder Path"
            variant="outlined"
            size="small"
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleFetchImages();
            }}
            sx={{ flex: "1 1 300px" }}
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
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
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
          {imageData.files.map((imageName, index) => {
            const isSelected = selectedImages.includes(imageName);
            return (
              <Paper
                elevation={isSelected ? 8 : 2}
                key={imageName}
                className={`image-card ${isSelected ? "selected" : ""}`.trim()}
                id={`image-card-${index}`}
                onClick={(e) =>
                  promptAction(() => handleSelectImage(e, imageName, index))
                }
                onDoubleClick={() => handleImageDoubleClick(imageName)}
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

      <Drawer
        variant="temporary"
        anchor="right"
        open={isPanelOpen}
        onClose={handlePanelClose}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {selectedImages.length > 0 && (
          <MetadataPanel
            key={selectedImages.join("-")}
            folderPath={imageData.folder}
            getImageUrl={getImageUrl}
            onClose={handlePanelClose}
            onSaveSuccess={handleSaveSuccess}
          />
        )}
      </Drawer>

      <UnsavedChangesDialog
        isOpen={isConfirmationOpen}
        onConfirm={handleUnsavedChangesConfirm}
        onClose={handleUnsavedChangesClose}
      />
      <RenameDialog {...renameDialogProps} />
      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </Box>
  );
};

const App: React.FC = () => {
  return (
    <UnsavedChangesProvider>
      <ImageLoaderProvider>
        <ImageSelectionProvider>
          <AppContent />
        </ImageSelectionProvider>
      </ImageLoaderProvider>
    </UnsavedChangesProvider>
  );
};

export default App;
