import { useState, useCallback, useEffect } from "react";
import { Box, Drawer, CssBaseline, Toolbar } from "@mui/material";
import { HealthReport, RenameFileResult } from "types";
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
import { AppProvider } from "./context/AppContext";
import { MainAppBar } from "./layout/MainAppBar/MainAppBar";
import { SelectionToolbar } from "./layout/SelectionToolbar/SelectionToolbar";
import { useRenameDialog } from "./features/RenameDialog";
import { useHealthCheck } from "./features/HealthCheck/hooks/useHealthCheck";
import { useTimeShift } from "./features/TimeShift/hooks/useTimeShift";

import "./App.css";

const AppContent: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isKeywordManagerOpen, setIsKeywordManagerOpen] = useState(false);
  const [isFolderPromptOpen, setFolderPromptOpen] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

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
    isDrawerOpen: isHealthDrawerOpen,
    closeDrawer: closeHealthDrawer,
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
        setIsPanelOpen(false);
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
    }
  };

  const handleSaveSuccess = (updatedFilePaths: string[]) => {
    setIsPanelOpen(false);
    handleGenericSuccess(updatedFilePaths);
  };

  const handlePanelOpen = useCallback(() => {
    if (selectedImages.length > 0) {
      setIsPresetManagerOpen(false);
      setIsKeywordManagerOpen(false);
      setIsPanelOpen(true);
    }
  }, [selectedImages.length]);

  const handlePanelClose = () => {
    promptAction(() => setIsPanelOpen(false));
  };

  const handlePresetManagerOpen = () => {
    promptAction(() => {
      setIsPanelOpen(false);
      setIsKeywordManagerOpen(false);
      setIsPresetManagerOpen(true);
    });
  };

  const handleKeywordManagerOpen = () => {
    promptAction(() => {
      setIsPanelOpen(false);
      setIsPresetManagerOpen(false);
      setIsKeywordManagerOpen(true);
    });
  };

  const handleImageDoubleClick = (imageName: string) => {
    promptAction(() => {
      setIsPresetManagerOpen(false);
      setIsKeywordManagerOpen(false);
      selectSingleImage(imageName);
      setIsDirty(false);
      setIsPanelOpen(true);
    });
  };

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

  const appContextValue = {
    folderPath: imageData.folder,
    selectionCount: selectedImages.length,
    isLoading,
    isRenamePreviewLoading,
    isHealthChecking,
    onOpenFolder: () => promptAction(() => setFolderPromptOpen(true)),
    onEdit: handlePanelOpen,
    onTimeShift: () =>
      openTimeShiftDialog(
        selectedImages.map((f) => `${imageData.folder}\\${f}`)
      ),
    onRename: () =>
      openRenameDialog(selectedImages.map((f) => `${imageData.folder}\\${f}`)),
    onAnalyze: handleRunHealthCheck,
    onKeywords: handleKeywordManagerOpen,
    onLocations: handlePresetManagerOpen,
    onSettings: () => setIsSettingsOpen(true),
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
            onPanelOpen={handlePanelOpen}
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
          open={isKeywordManagerOpen}
          onClose={() => setIsKeywordManagerOpen(false)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          <KeywordManager onClose={() => setIsKeywordManagerOpen(false)} />
        </Drawer>
        <Drawer
          variant="temporary"
          anchor="left"
          open={isPresetManagerOpen}
          onClose={() => setIsPresetManagerOpen(false)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          <LocationPresetManager
            onClose={() => setIsPresetManagerOpen(false)}
          />
        </Drawer>
        <Drawer
          variant="temporary"
          anchor="right"
          open={isPanelOpen}
          sx={{
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {isPanelOpen && selectedImages.length > 0 && (
            <MetadataPanel
              key={selectedImages.join("-")}
              folderPath={imageData.folder}
              getImageUrl={getImageUrl}
              onClose={handlePanelClose}
              onSaveSuccess={handleSaveSuccess}
            />
          )}
        </Drawer>
        <HealthCheckReport
          isOpen={isHealthDrawerOpen}
          onClose={closeHealthDrawer}
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
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          sx={{
            width: "100%",
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: "100%",
              boxSizing: "border-box",
            },
          }}
        >
          {isSettingsOpen && (
            <SettingsManager onClose={() => setIsSettingsOpen(false)} />
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
            <AppContent />
          </LocationPresetsProvider>
        </ImageSelectionProvider>
      </ImageLoaderProvider>
    </UnsavedChangesProvider>
  );
};

export default App;
