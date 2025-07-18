import { useState, useCallback, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  Drawer,
  CssBaseline,
  Toolbar,
} from "@mui/material";
import { HealthReport, RenameFileResult } from "types";
import { MetadataPanel } from "./features/MetadataPanel";
import { RenameDialog } from "./features/RenameDialog";
import { SettingsDialog } from "./features/SettingsDialog";
import { LocationPresetManager } from "./features/LocationPresetManager";
import { KeywordManager } from "./features/KeywordManager";
import { HealthCheckDrawer } from "./features/HealthCheck/HealthCheckDrawer";
import { InfoPanel } from "./features/InfoPanel/InfoPanel";
import { ImageGallery } from "./features/ImageGallery";
import { ShiftTimeInputDialog } from "./features/TimeShift/components/ShiftTimeInputDialog";
import { ShiftTimePreviewDialog } from "./features/TimeShift/components/ShiftTimePreviewDialog";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
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
import { useRenameDialog } from "./features/RenameDialog";
import { useHealthCheck } from "./features/HealthCheck/hooks/useHealthCheck";
import { useTimeShift } from "./features/TimeShift/hooks/useTimeShift";
import { AppIcons } from "./config/AppIcons";

import "./App.css";

const AppContent: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isKeywordManagerOpen, setIsKeywordManagerOpen] = useState(false);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
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

  const _fetchAndReload = useCallback(async () => {
    setIsPanelOpen(false);
    setSelectedImages([]);
    setHealthReportsMap({});

    const loadedFiles = await loadImages(folderInput, () => setIsDirty(false));

    if (loadedFiles && loadedFiles.length > 0) {
      const fullPaths = loadedFiles.map(
        (file) => `${folderInput}\\${file.filename}`
      );
      runHealthCheck(fullPaths, { isManualTrigger: false });
    }
  }, [loadImages, folderInput, runHealthCheck, setIsDirty, setSelectedImages]);

  const handleLoadFolder = useCallback(() => {
    promptAction(_fetchAndReload);
  }, [promptAction, _fetchAndReload]);

  useEffect(() => {
    if (folderInput && !isLoading && !initialLoadDone) {
      _fetchAndReload();
      setInitialLoadDone(true);
    }
  }, [folderInput, isLoading, initialLoadDone, _fetchAndReload]);

  const handleGenericSuccess = (updatedFilePaths: string[]) => {
    _fetchAndReload();
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
    if (selectedImages.length > 0 && imageData.folder) {
      const fullPaths = selectedImages.map(
        (name) => `${imageData.folder}\\${name}`
      );
      runHealthCheck(fullPaths, { isManualTrigger: true });
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
      setIsInfoPanelOpen(false);
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
      setIsInfoPanelOpen(false);
      setIsPresetManagerOpen(true);
    });
  };

  const handleKeywordManagerOpen = () => {
    promptAction(() => {
      setIsPanelOpen(false);
      setIsPresetManagerOpen(false);
      setIsInfoPanelOpen(false);
      setIsKeywordManagerOpen(true);
    });
  };

  const handleImageDoubleClick = (imageName: string) => {
    promptAction(() => {
      setIsPresetManagerOpen(false);
      setIsKeywordManagerOpen(false);
      setIsInfoPanelOpen(false);
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
    selectionCount: selectedImages.length,
    isLoading,
    isRenamePreviewLoading,
    isHealthChecking,
    onOpenFolder: handleLoadFolder,
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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            marginRight: "32px",
          }}
        >
          {/* A Toolbar component is needed here to offset the content below the fixed AppBar */}
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
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLoadFolder();
              }}
              sx={{ flex: "1 1 300px" }}
            />
            <Button
              variant="outlined"
              onClick={handleLoadFolder}
              disabled={isLoading || !folderInput}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <AppIcons.LOAD />
                )
              }
            >
              {isLoading ? "Loading..." : "Load"}
            </Button>
          </Box>

          <ImageGallery
            healthReportsMap={healthReportsMap}
            onPanelOpen={handlePanelOpen}
            onImageDoubleClick={handleImageDoubleClick}
          />
        </Box>

        <InfoPanel
          folderPath={imageData.folder}
          selectedImage={selectedImages.length === 1 ? selectedImages[0] : null}
          isOpen={isInfoPanelOpen}
          onToggle={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
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
            width: "100%",
            flexShrink: 0,
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
        <HealthCheckDrawer
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
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
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
