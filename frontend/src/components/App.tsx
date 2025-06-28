import React, { useState, useEffect, useCallback } from "react";
import MetadataPanel from "./MetadataPanel";
import { NotificationState } from "../types";
import { useImageSelection } from "../hooks/useImageSelection";
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
  Snackbar,
  Paper,
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

const App: React.FC = () => {
  const [imageData, setImageData] = useState<{
    folder: string;
    files: string[];
  }>({ folder: "", files: [] });
  const [folderInput, setFolderInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [notification, setNotification] = useState<NotificationState>({
    message: "",
    type: "",
  });

  const {
    selectedImages,
    setSelectedImages,
    handleImageClick,
    handleBackgroundClick,
  } = useImageSelection(imageData.files);

  const handleFetchImages = useCallback(() => {
    setIsLoading(true);
    setError("");

    fetch(
      `http://localhost:5000/api/images?folder=${encodeURIComponent(
        folderInput
      )}`
    )
      .then((response) =>
        response.ok
          ? response.json()
          : response.json().then((err) => Promise.reject(err))
      )
      .then((data: string[]) =>
        setImageData({ folder: folderInput, files: data })
      )
      .catch((err) => {
        setError(err.message || "An error occurred while fetching images.");
        setImageData({ folder: "", files: [] });
      })
      .finally(() => setIsLoading(false));
  }, [folderInput]);

  const getImageUrl = (imageName: string): string => {
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  const handleRename = (filesToRename: string[]) => {
    fetch("http://localhost:5000/api/rename_files", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: filesToRename }),
    })
      .then((res) => res.json())
      .then((results: { original: string; new: string; status: string }[]) => {
        const successCount = results.filter(
          (r) => r.status === "Renamed"
        ).length;
        if (successCount > 0) {
          setNotification({
            message: `${successCount} file(s) successfully renamed.`,
            type: "success",
          });
        }

        const renameMap: { [key: string]: string } = {};
        results.forEach((result) => {
          if (result.status === "Renamed") {
            renameMap[result.original] = result.new;
          }
        });

        setImageData((ci) => ({
          ...ci,
          files: ci.files.map((f) => renameMap[f] || f),
        }));
        setSelectedImages((cs) => cs.map((f) => renameMap[f] || f));
      })
      .catch((err) => {
        setNotification({
          message: `An error occurred during renaming: ${err.message}`,
          type: "error",
        });
      });
  };

  const handleNotificationClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setNotification({ message: "", type: "" });
  };

  useEffect(() => {
    // This effect is intended to run once on mount if a folder path might be
    // persisted in the future, but currently it does nothing unless folderInput
    // has a default value.
  }, []);

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
              disabled={selectedImages.length === 0}
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

          <Box className="image-grid" onClick={handleBackgroundClick}>
            {imageData.files.map((imageName, index) => {
              const isSelected = selectedImages.includes(imageName);
              return (
                <Paper
                  elevation={isSelected ? 8 : 2}
                  key={imageName}
                  className={`image-card ${isSelected ? "selected" : ""}`}
                  onClick={(e) => handleImageClick(e, imageName, index)}
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
            selectedImageNames={selectedImages}
            folderPath={imageData.folder}
            getImageUrl={getImageUrl}
          />
        </Box>
      </Box>

      {!!notification.message && (
        <Snackbar
          open={true}
          autoHideDuration={notification.type === "success" ? 4000 : null}
          onClose={handleNotificationClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={notification.type || "info"}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default App;
