import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Grid,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SaveIcon from "@mui/icons-material/Save";

import { useMetadataEditor } from "./hooks/useMetadataEditor";
import { MetadataEditorProvider } from "./context/MetadataEditorContext";
import { useImageSelectionContext } from "context/ImageSelectionContext";
import ImageModal from "./components/ImageModal";
import ContentSection from "./components/ContentSection";
import LocationSection from "./components/LocationSection";
import DateTimeSection from "./components/DateTimeSection";
import CreatorSection from "./components/CreatorSection";
import ImageCarousel from "./components/ImageCarousel";

interface MetadataPanelProps {
  folderPath: string;
  getImageUrl: (imageName: string) => string;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1, 0, 2),
  justifyContent: "space-between",
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));

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

  const { error, isMetadataLoading, isSaving, isSaveable, handleSave } =
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
    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">Failed to load metadata: {error}</Alert>
        </Box>
      );
    }

    if (isMetadataLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <ContentSection />
            <DateTimeSection />
            <CreatorSection />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <LocationSection
              title="Location Created"
              dataBlockName="LocationCreated"
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
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
        <DrawerHeader>
          <Box>
            <Typography variant="h6" component="h2">
              Metadata
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedImages.length} item(s) selected
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="close metadata panel">
            <ChevronRightIcon />
          </IconButton>
        </DrawerHeader>

        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <ImageCarousel
            imageNames={selectedImages}
            getImageUrl={getImageUrl}
            onImageClick={(imageName) => setModalImageName(imageName)}
          />
        </Box>

        {modalImageName && (
          <ImageModal
            isOpen={!!modalImageName}
            onClose={() => setModalImageName(null)}
            imageUrl={getImageUrl(modalImageName)}
            imageName={modalImageName}
          />
        )}

        <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
          {renderContent()}
        </Box>

        <Box
          sx={{
            p: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving || !isSaveable}
              startIcon={
                isSaving ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <SaveIcon />
                )
              }
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Box>
      </Box>
    </MetadataEditorProvider>
  );
};

export default MetadataPanel;
