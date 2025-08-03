import { useState, useEffect, useCallback, useRef } from "react";
import { Box, Drawer, CssBaseline, Toolbar } from "@mui/material";
import { HealthReport, ImageFile, RenameFileResult } from "types";
import { GeotaggingManager } from "./features/Geotagging/GeotaggingManager";
import { MetadataPanel } from "./features/MetadataPanel";
import { RenameDialog } from "./features/RenameDialog";
import { SettingsManager } from "./features/SettingsManager/SettingsManager";
import { LocationPresetManager } from "./features/LocationPresetManager";
import { KeywordManager } from "./features/KeywordManager";
import { HealthCheckReport } from "./features/HealthCheck/HealthCheckReport";
import { InfoPanel } from "./features/InfoPanel/InfoPanel";
import { ImageGallery } from "./features/ImageGallery";
import { ShiftTimeInputDialog } from "./features/TimeShift/components/ShiftTimeInputDialog";
import { ShiftTimePreviewDialog } from "./features/TimeShift/components/ShiftTimePreviewDialog";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { PromptDialog } from "./components/PromptDialog";
import {
  useUnsavedChangesContext,
  UnsavedChangesProvider,
} from "./context/UnsavedChangesContext";
import {
  useImageSelectionContext,
  ImageSelectionProvider,
} from "./context/ImageSelectionContext";
import {
  useImageLoaderContext,
  ImageLoaderProvider,
} from "./context/ImageLoaderContext";
import { LocationPresetsProvider } from "./context/LocationPresetsContext";
import { SchemaProvider } from "./context/SchemaContext";
import { AppProvider } from "./context/AppContext";
import { MainAppBar } from "./layout/MainAppBar/MainAppBar";
import { SelectionToolbar } from "./layout/SelectionToolbar/SelectionToolbar";
import { useRenameDialog } from "./features/RenameDialog";
import { useHealthCheck } from "./features/HealthCheck/hooks/useHealthCheck";
import { useTimeShift } from "./features/TimeShift/hooks/useTimeShift";
import { useNotification } from "./hooks/useNotification";

import "./App.css";

type ActivePanel =
  | "keywords"
  | "locations"
  | "settings"
  | "metadata"
  | "healthReport"
  | "geotagging"
  | null;

const useGpxFilePicker = ({
  onFileRead,
}: {
  onFileRead: (content: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gpx";
    input.style.display = "none";
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            onFileRead(content);
          } else {
            showNotification("Could not read the GPX file.", "error");
          }
        };
        reader.onerror = () => {
          showNotification(
            `Error reading file: ${reader.error?.message}`,
            "error"
          );
        };
        reader.readAsText(file);
      }
    };
    (inputRef as React.MutableRefObject<HTMLInputElement>).current = input;
  }, [onFileRead, showNotification]);

  const openGpxPicker = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  return { openGpxPicker };
};

const AppContent: React.FC = () => {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isFolderPromptOpen, setFolderPromptOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const [gpxFileContent, setGpxFileContent] = useState<string | null>(null);
  const [imagesForGeotagging, setImagesForGeotagging] = useState<ImageFile[]>(
    []
  );

  const { imageData, folderInput, setFolderInput, isLoading, loadImages } =
    useImageLoaderContext();
  const { selectedImages, setSelectedImages, selectSingleImage } =
    useImageSelectionContext();
  const {
    setIsDirty,
    promptAction,
    isConfirmationOpen,
    handleConfirm: handleUnsavedChangesConfirm,
    handleClose: handleUnsavedChangesClose,
  } = useUnsavedChangesContext();

  const {
    runCheck: runHealthCheck,
    reports: healthCheckReports,
    isChecking: isHealthChecking,
  } = useHealthCheck();

  const [healthReportsMap, setHealthReportsMap] = useState<
    Record<string, HealthReport["checks"]>
  >({});

  useEffect(() => {
    const newMap: Record<string, HealthReport["checks"]> = {};
    healthCheckReports.forEach((report) => {
      newMap[report.filename] = report.checks;
    });
    setHealthReportsMap(newMap);
  }, [healthCheckReports]);

  useEffect(() => {
    if (folderInput && (!initialLoadDone || imageData.folder !== folderInput)) {
      const fetchAndReload = async () => {
        setActivePanel(null);
        setSelectedImages([]);
        setHealthReportsMap({});

        const loadedFiles = await loadImages(folderInput, () =>
          setIsDirty(false)
        );

        if (loadedFiles && loadedFiles.length > 0) {
          const fullPaths = loadedFiles.map(
            (file) => `${folderInput}\\${file.filename}`
          );
          runHealthCheck(fullPaths, { isManualTrigger: false });
        }
      };
      fetchAndReload();
      if (!initialLoadDone) setInitialLoadDone(true);
    }
  }, [
    folderInput,
    initialLoadDone,
    imageData.folder,
    loadImages,
    runHealthCheck,
    setIsDirty,
    setSelectedImages,
  ]);

  const handleGenericSuccess = (updatedFilePaths: string[]) => {
    setFolderInput((current) => current + "");
    if (updatedFilePaths.length > 0) {
      runHealthCheck(updatedFilePaths, { isManualTrigger: false });
    }
  };

  const { openGpxPicker } = useGpxFilePicker({
    onFileRead: (content) => {
      const selectedImageFiles = imageData.files.filter((f) =>
        selectedImages.includes(f.filename)
      );
      setGpxFileContent(content);
      setImagesForGeotagging(selectedImageFiles);
      setActivePanel("geotagging");
    },
  });

  const {
    openRenameDialog,
    isRenamePreviewLoading,
    dialogProps: renameDialogProps,
  } = useRenameDialog({
    onRenameSuccess: (results: RenameFileResult[]) => {
      const renamedPaths = results
        .filter((r) => r.status === "Renamed")
        .map((r) => `${imageData.folder}\\${r.new}`);
      handleGenericSuccess(renamedPaths);
    },
  });

  const {
    openTimeShiftDialog,
    inputDialogProps: timeShiftInputDialogProps,
    previewDialogProps: timeShiftPreviewDialogProps,
  } = useTimeShift({ onSuccess: handleGenericSuccess });

  const handleRunHealthCheck = () => {
    if (imageData.files.length > 0 && imageData.folder) {
      const allFilePaths = imageData.files.map(
        (file) => `${imageData.folder}\\${file.filename}`
      );
      runHealthCheck(allFilePaths, { isManualTrigger: true });
      setActivePanel("healthReport");
    }
  };

  const handleSaveSuccess = (updatedFilePaths: string[]) => {
    setActivePanel(null);
    handleGenericSuccess(updatedFilePaths);
  };

  const handlePanelOpen = (panel: ActivePanel) => {
    promptAction(() => {
      if (panel === "metadata" && selectedImages.length === 0) return;
      setActivePanel(panel);
    });
  };

  const handleImageDoubleClick = (imageName: string) => {
    promptAction(() => {
      selectSingleImage(imageName);
      setIsDirty(false);
      setActivePanel("metadata");
    });
  };

  useEffect(() => {
    if (selectedImages.length === 0 && activePanel === "metadata") {
      setActivePanel(null);
    }
  }, [selectedImages.length, activePanel]);

  const getImageUrl = (imageName: string): string => {
    if (!imageData.folder || !imageName) return "";
    const fullPath = `${imageData.folder}\\${imageName}`;
    return `http://localhost:5000/api/image_data?path=${encodeURIComponent(
      fullPath
    )}`;
  };

  const appContextValue = {
    folderPath: imageData.folder,
    selectionCount: selectedImages.length,
    isLoading,
    isRenamePreviewLoading,
    isHealthChecking,
    onOpenFolder: () => promptAction(() => setFolderPromptOpen(true)),
    onEdit: () => handlePanelOpen("metadata"),
    onGeotagFromGpx: openGpxPicker,
    onTimeShift: () =>
      openTimeShiftDialog(
        selectedImages.map((f) => `${imageData.folder}\\${f}`)
      ),
    onRename: () =>
      openRenameDialog(selectedImages.map((f) => `${imageData.folder}\\${f}`)),
    onAnalyze: handleRunHealthCheck,
    onKeywords: () => handlePanelOpen("keywords"),
    onLocations: () => handlePanelOpen("locations"),
    onSettings: () => handlePanelOpen("settings"),
  };

  return (
    <AppProvider value={appContextValue}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <MainAppBar />
        <SelectionToolbar />
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
          <Toolbar />

          <ImageGallery
            healthReportsMap={healthReportsMap}
            onPanelOpen={() => handlePanelOpen("metadata")}
            onImageDoubleClick={handleImageDoubleClick}
          />
        </Box>

        <InfoPanel
          folderPath={imageData.folder}
          selectedImage={selectedImages.length === 1 ? selectedImages[0] : null}
        />
        <Drawer
          variant="temporary"
          anchor="left"
          open={activePanel === "keywords"}
          onClose={() => setActivePanel(null)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {activePanel === "keywords" && (
            <KeywordManager onClose={() => setActivePanel(null)} />
          )}
        </Drawer>
        <Drawer
          variant="temporary"
          anchor="left"
          open={activePanel === "locations"}
          onClose={() => setActivePanel(null)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {activePanel === "locations" && (
            <LocationPresetManager onClose={() => setActivePanel(null)} />
          )}
        </Drawer>
        <Drawer
          variant="temporary"
          anchor="right"
          open={activePanel === "metadata"}
          sx={{
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {activePanel === "metadata" && selectedImages.length > 0 && (
            <MetadataPanel
              key={selectedImages.join("-")}
              folderPath={imageData.folder}
              getImageUrl={getImageUrl}
              onClose={() => setActivePanel(null)}
              onSaveSuccess={handleSaveSuccess}
            />
          )}
        </Drawer>
        <Drawer
          variant="temporary"
          anchor="right"
          open={activePanel === "geotagging"}
          sx={{
            "& .MuiDrawer-paper": {
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {activePanel === "geotagging" &&
            gpxFileContent &&
            imagesForGeotagging.length > 0 && (
              <GeotaggingManager
                gpxContent={gpxFileContent}
                images={imagesForGeotagging}
                onClose={() => setActivePanel(null)}
                onSaveSuccess={handleSaveSuccess}
                folderPath={imageData.folder!}
                getImageUrl={getImageUrl}
              />
            )}
        </Drawer>
        <HealthCheckReport
          isOpen={activePanel === "healthReport"}
          onClose={() => setActivePanel(null)}
          reports={healthCheckReports}
          isLoading={isHealthChecking}
        />
        <ShiftTimeInputDialog {...timeShiftInputDialogProps} />
        <ShiftTimePreviewDialog {...timeShiftPreviewDialogProps} />
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to proceed without saving?"
          onConfirm={handleUnsavedChangesConfirm}
          onClose={handleUnsavedChangesClose}
          confirmButtonText="Proceed"
        />
        <RenameDialog {...renameDialogProps} />
        <Drawer
          variant="temporary"
          anchor="left"
          open={activePanel === "settings"}
          onClose={() => setActivePanel(null)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {activePanel === "settings" && (
            <SettingsManager onClose={() => setActivePanel(null)} />
          )}
        </Drawer>
        <PromptDialog
          isOpen={isFolderPromptOpen}
          onClose={() => setFolderPromptOpen(false)}
          onSave={(path) => {
            setFolderInput(path);
            setFolderPromptOpen(false);
          }}
          title="Open Folder"
          message="Please enter the full path to the folder containing your images."
          label="Image Folder Path"
        />
      </Box>
    </AppProvider>
  );
};

const App: React.FC = () => {
  return (
    <UnsavedChangesProvider>
      <ImageLoaderProvider>
        <ImageSelectionProvider>
          <LocationPresetsProvider>
            <SchemaProvider>
              <AppContent />
            </SchemaProvider>
          </LocationPresetsProvider>
        </ImageSelectionProvider>
      </ImageLoaderProvider>
    </UnsavedChangesProvider>
  );
};

export default App;
