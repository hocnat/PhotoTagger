import React, { useState, useEffect, useCallback } from "react";
import MetadataPanel from "./MetadataPanel";
import { RenameFileResult, ApiError } from "../types";
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
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

const App: React.FC = () => {
  const [isDirty, setIsDirty] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, onConfirm: () => {} });

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
      setConfirmationState({
        isOpen: true,
        onConfirm: proceedWithLoad,
      });
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

  const handleRename = (filesToRename: string[]) => {
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

  const handleConfirmationClose = () => {
    setConfirmationState({ isOpen: false, onConfirm: () => {} });
  };

  const handleConfirmationConfirm = () => {
    confirmationState.onConfirm();
    handleConfirmationClose();
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
              color="secondary"
              disabled={isLoading || selectedImages.length === 0}
              onClick={() =>
                handleRename(
                  selectedImages.map((name) => `${imageData.folder}\\${name}`)
                )
              }
              startIcon={<DriveFileRenameOutlineIcon />}
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

      <Dialog open={confirmationState.isOpen} onClose={handleConfirmationClose}>
        <DialogTitle>Unsaved Changes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You have unsaved changes. Are you sure you want to proceed without
            saving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmationClose}>Cancel</Button>
          <Button onClick={handleConfirmationConfirm} color="primary" autoFocus>
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default App;
