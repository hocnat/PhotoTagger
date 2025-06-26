import React, { useState, useEffect, useCallback, useRef } from "react";
import MetadataPanel from "./MetadataPanel";
import { NotificationState } from "./types";
import "./App.css";

// MUI Imports
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
} from "@mui/material";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";

// --- Custom Hook ---
const useImageSelection = (images: string[]) => {
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

// --- Main App Component ---
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
    setSelectedImages([]);

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
  }, [folderInput, setSelectedImages]);

  const getImageUrl = (imageName: string): string => {
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  const isDisplayable = (imageName: string): boolean =>
    !imageName.toLowerCase().endsWith(".cr2");

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
      .catch((err) =>
        setNotification({
          message: `An error occurred during renaming: ${err.message}`,
          type: "error",
        })
      );
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
    if (folderInput) {
      handleFetchImages();
    }
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
                <Box
                  key={imageName}
                  className={`image-card ${isSelected ? "selected" : ""}`}
                  onClick={(e) => handleImageClick(e, imageName, index)}
                >
                  {isDisplayable(imageName) ? (
                    <img
                      src={getImageUrl(imageName)}
                      alt={imageName}
                      className="thumbnail"
                    />
                  ) : (
                    <div className="file-placeholder">
                      <span>{imageName.split(".").pop()?.toUpperCase()}</span>
                    </div>
                  )}
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: "block", wordWrap: "break-word" }}
                  >
                    {imageName}
                  </Typography>
                </Box>
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
          >
            {notification.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
};

export default App;
