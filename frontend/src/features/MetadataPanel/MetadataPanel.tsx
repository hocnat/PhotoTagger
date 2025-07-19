import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Grid,
  AppBar,
  Toolbar,
} from "@mui/material";

import { useMetadataEditor } from "./hooks/useMetadataEditor";
import { MetadataEditorProvider } from "./context/MetadataEditorContext";
import { useImageSelectionContext } from "context/ImageSelectionContext";
import ImageModal from "./components/ImageModal";
import ContentSection from "./components/ContentSection";
import LocationSection from "./components/LocationSection";
import DateTimeSection from "./components/DateTimeSection";
import CreatorSection from "./components/CreatorSection";
import ImageCarousel from "./components/ImageCarousel";
import { AppIcons } from "config/AppIcons";

interface MetadataPanelProps {
  folderPath: string;
  getImageUrl: (imageName: string) => string;
  onClose: () => void;
  onSaveSuccess: (updatedFilePaths: string[]) => void;
}

const carouselWidth = 240;

const MetadataPanel: React.FC<MetadataPanelProps> = ({
  folderPath,
  getImageUrl,
  onClose,
  onSaveSuccess,
}) => {
  const [modalImageName, setModalImageName] = useState<string | null>(null);
  const { selectedImages } = useImageSelectionContext();

  const metadataEditor = useMetadataEditor({
    folderPath,
    onSaveSuccess,
  });

  const { isMetadataLoading, isSaving, isSaveable, handleSave } =
    metadataEditor;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        if (isSaveable && !isSaving) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaveable, isSaving, handleSave]);

  const renderContent = () => {
    if (isMetadataLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack spacing={3}>
            <DateTimeSection />
            <CreatorSection />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack spacing={3}>
            <LocationSection
              title="Location Created"
              dataBlockName="LocationCreated"
            />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Stack spacing={3}>
            <LocationSection
              title="Location Shown"
              dataBlockName="LocationShown"
            />
          </Stack>
        </Grid>
      </Grid>
    );
  };

  return (
    <MetadataEditorProvider value={metadataEditor}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <AppIcons.EDIT sx={{ mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h2">
                Metadata
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedImages.length} item(s) selected
              </Typography>
            </Box>
            <IconButton
              edge="end"
              color="inherit"
              onClick={onClose}
              aria-label="close metadata panel"
            >
              <AppIcons.CLOSE />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
          <Box
            sx={{
              width: carouselWidth,
              flexShrink: 0,
              borderRight: 1,
              borderColor: "divider",
              overflowY: "auto",
              bgcolor: "background.paper", // Use paper for a slight contrast
            }}
          >
            <ImageCarousel
              imageNames={selectedImages}
              getImageUrl={getImageUrl}
              onImageClick={(imageName) => setModalImageName(imageName)}
            />
          </Box>

          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                flexGrow: 1,
                overflowY: "auto",
                p: 3,
                bgcolor: "background.default",
              }}
            >
              {isMetadataLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Stack spacing={3}>
                  <ContentSection />
                  {renderContent()}
                </Stack>
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                bgcolor: "background.paper",
              }}
            >
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={onClose} variant="text">
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={isSaving || !isSaveable}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>

        {modalImageName && (
          <ImageModal
            isOpen={!!modalImageName}
            onClose={() => setModalImageName(null)}
            imageUrl={getImageUrl(modalImageName)}
            imageName={modalImageName}
          />
        )}
      </Box>
    </MetadataEditorProvider>
  );
};

export default MetadataPanel;
