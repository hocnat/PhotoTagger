import React, { useState, useEffect, useRef, useCallback } from "react";
import MetadataPanel from "./MetadataPanel";
import Notification from "./Notification";
import { NotificationState } from "./types";
import "./App.css";

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
      .then((data: string[]) => {
        setImageData({ folder: folderInput, files: data });
      })
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
      .catch((err) => {
        setNotification({
          message: `An error occurred during renaming: ${err.message}`,
          type: "error",
        });
        console.error("Rename error:", err);
      });
  };

  useEffect(() => {
    if (folderInput) {
      handleFetchImages();
    }
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>PhotoTagger</h1>
      </header>
      <div className="main-container">
        <main className="App-main">
          <div className="folder-input-container">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="Enter full path to image folder"
              className="folder-input"
            />
            <button
              className="button-primary"
              onClick={handleFetchImages}
              disabled={isLoading || !folderInput}
            >
              {isLoading ? "Loading..." : "Load Images"}
            </button>
            <button
              className="button-warning"
              disabled={selectedImages.length === 0}
              onClick={() => {
                const filesToRename = selectedImages.map(
                  (name) => `${imageData.folder}\\${name}`
                );
                handleRename(filesToRename);
              }}
            >
              Rename Selected
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="image-grid" onClick={handleBackgroundClick}>
            {imageData.files.map((imageName, index) => {
              const isSelected = selectedImages.includes(imageName);
              return (
                <div
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
                  <p className="image-name">{imageName}</p>
                </div>
              );
            })}
          </div>
        </main>
        <aside className="sidebar">
          <MetadataPanel
            selectedImageNames={selectedImages}
            folderPath={imageData.folder}
            getImageUrl={getImageUrl}
            onRename={handleRename}
          />
        </aside>
      </div>
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: "", type: "" })}
      />
    </div>
  );
};

export default App;
