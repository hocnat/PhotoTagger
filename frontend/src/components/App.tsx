import React, { useState, useEffect, useCallback } from "react";
import MetadataPanel from "./MetadataPanel";
import { RenameFileResult, ApiError, RenamePreviewItem } from "../types";
import { useImageSelection } from "../hooks/useImageSelection";
import { useImageLoader } from "../hooks/useImageLoader";
import { useNotification } from "../hooks/useNotification";
import * as apiService from "../services/apiService";
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const App: React.FC = () => {
  const [isDirty, setIsDirty] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, onConfirm: () => {} });

  const [isRenameConfirmOpen, setIsRenameConfirmOpen] = useState(false);
  const [isRenamePreviewLoading, setIsRenamePreviewLoading] = useState(false);
  const [renamePreviewData, setRenamePreviewData] = useState<
    RenamePreviewItem[]
  >([]);

  const { showNotification } = useNotification();

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

  const proceedWithLoad = useCallback(() => {
    setSelectedImages([]);
    loadImages(folderInput, () => {
      setIsDirty(false);
    });
  }, [loadImages, folderInput, setSelectedImages]);

  const handleFetchImages = useCallback(() => {
    if (isDirty) {
      setConfirmationState({ isOpen: true, onConfirm: proceedWithLoad });
    } else {
      proceedWithLoad();
    }
  }, [isDirty, proceedWithLoad]);

  const promptAndHandleImageClick = (
    e: React.MouseEvent,
    imageName: string,
    index: number
  ) => {
    if (isDirty) {
      setConfirmationState({
        isOpen: true,
        onConfirm: () => handleImageClick(e, imageName, index),
      });
    } else {
      handleImageClick(e, imageName, index);
    }
  };

  const promptAndHandleBackgroundClick = (e: React.MouseEvent) => {
    if (isDirty) {
      setConfirmationState({
        isOpen: true,
        onConfirm: () => handleBackgroundClick(),
      });
    } else {
      handleBackgroundClick();
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const getImageUrl = (imageName: string): string => {
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  const handleOpenRenameDialog = () => {
    const filesToPreview = selectedImages.map(
      (name) => `${imageData.folder}\\${name}`
    );
    setIsRenamePreviewLoading(true);
    apiService
      .getRenamePreview(filesToPreview)
      .then((data) => {
        setRenamePreviewData(data);
        setIsRenameConfirmOpen(true);
      })
      .catch((err: ApiError) => {
        showNotification(
          `Error fetching rename preview: ${err.message}`,
          "error"
        );
      })
      .finally(() => {
        setIsRenamePreviewLoading(false);
      });
  };

  const handleConfirmRename = () => {
    const filesToRename = selectedImages.map(
      (name) => `${imageData.folder}\\${name}`
    );
    setIsRenameConfirmOpen(false);
    apiService
      .renameFiles(filesToRename)
      .then((results: RenameFileResult[]) => {
        const successCount = results.filter(
          (r) => r.status === "Renamed"
        ).length;
        if (successCount > 0) {
          showNotification(
            `${successCount} file(s) successfully renamed.`,
            "success"
          );
        }
        loadImages(imageData.folder);
      })
      .catch((err: ApiError) => {
        showNotification(
          `An error occurred during renaming: ${err.message}`,
          "error"
        );
      });
  };

  const handleUnsavedChangesConfirmationClose = () => {
    setConfirmationState({ isOpen: false, onConfirm: () => {} });
  };

  const handleUnsavedChangesConfirmationConfirm = () => {
    confirmationState.onConfirm();
    handleUnsavedChangesConfirmationClose();
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
                if (e.key === "Enter") {
                  handleFetchImages();
                }
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
              onClick={handleOpenRenameDialog}
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

          <Box className="image-grid" onClick={promptAndHandleBackgroundClick}>
            {imageData.files.map((imageName, index) => {
              const isSelected = selectedImages.includes(imageName);
              return (
                <Paper
                  elevation={isSelected ? 8 : 2}
                  key={imageName}
                  className={`image-card ${isSelected ? "selected" : ""}`}
                  onClick={(e) =>
                    promptAndHandleImageClick(e, imageName, index)
                  }
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

      {/* Unsaved Changes Dialog */}
      <Dialog
        open={confirmationState.isOpen}
        onClose={handleUnsavedChangesConfirmationClose}
      >
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to proceed without
            saving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUnsavedChangesConfirmationClose}>
            Cancel
          </Button>
          <Button
            onClick={handleUnsavedChangesConfirmationConfirm}
            color="primary"
            autoFocus
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Confirmation Dialog */}
      <Dialog
        open={isRenameConfirmOpen}
        onClose={() => setIsRenameConfirmOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Confirm File Renaming</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please review the following file name changes. This action cannot be
            undone.
          </DialogContentText>
          <List dense>
            {renamePreviewData.map((item) => {
              const hasError = item.new.startsWith("(Error:");
              const isSkipped = item.original === item.new;
              return (
                <ListItem key={item.original} divider>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                      gap: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        flex: 1,
                        wordBreak: "break-all",
                        color: "text.secondary",
                      }}
                    >
                      {item.original}
                    </Typography>
                    <ArrowForwardIcon sx={{ flexShrink: 0 }} />
                    <Typography
                      sx={{
                        flex: 1,
                        wordBreak: "break-all",
                        color: hasError
                          ? "error.main"
                          : isSkipped
                          ? "text.disabled"
                          : "text.primary",
                        fontWeight: hasError || !isSkipped ? "bold" : "normal",
                      }}
                    >
                      {item.new}
                    </Typography>
                  </Box>
                </ListItem>
              );
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRenameConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmRename}
            color="primary"
            variant="contained"
          >
            Confirm Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
