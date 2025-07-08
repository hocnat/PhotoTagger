import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  Grid,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SaveIcon from "@mui/icons-material/Save";

import { useMetadataEditor } from "./hooks/useMetadataEditor";
import ImageModal from "./components/ImageModal";
import ContentSection from "./components/ContentSection";
import LocationSection from "./components/LocationSection";
import DateTimeSection from "./components/DateTimeSection";
import CreatorSection from "./components/CreatorSection";
import ImageCarousel from "./components/ImageCarousel";

interface MetadataPanelProps {
  selectedImageNames: string[];
  folderPath: string;
  getImageUrl: (imageName: string) => string;
  setIsDirty: (isDirty: boolean) => void;
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
  selectedImageNames,
  folderPath,
  getImageUrl,
  setIsDirty,
  onClose,
  onSaveSuccess,
}) => {
  const [modalImageName, setModalImageName] = useState<string | null>(null);

  const {
    isMetadataLoading,
    isSaving,
    formState,
    isSaveable,
    keywordSuggestions,
    handleFormChange,
    handleLocationSet,
    handleSave,
    handleKeywordInputChange,
    getDateTimeObject,
    applyLocationPreset,
  } = useMetadataEditor({
    selectedImageNames,
    folderPath,
    setIsDirty,
    onSaveSuccess,
  });

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
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <ContentSection
              formState={formState}
              handleFormChange={handleFormChange}
              keywordSuggestions={keywordSuggestions}
              onKeywordInputChange={handleKeywordInputChange}
            />
            <DateTimeSection
              formState={formState}
              handleFormChange={handleFormChange}
              getDateTimeObject={getDateTimeObject}
            />
            <CreatorSection
              formState={formState}
              handleFormChange={handleFormChange}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3} sx={{ height: "100%" }}>
            <LocationSection
              formState={formState}
              handleFormChange={handleFormChange}
              onLocationSet={handleLocationSet}
              applyLocationPreset={applyLocationPreset}
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              minHeight: "200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              p: 2,
              borderColor: "rgba(0, 0, 0, 0.12)",
              color: "text.disabled",
            }}
          >
            <Typography variant="body2">
              Location Shown
              <br />
              (Coming Soon)
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <DrawerHeader>
        <Box>
          <Typography variant="h6" component="h2">
            Metadata
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedImageNames.length} item(s) selected
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close metadata panel">
          <ChevronRightIcon />
        </IconButton>
      </DrawerHeader>

      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <ImageCarousel
          imageNames={selectedImageNames}
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

      <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>{renderContent()}</Box>

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
  );
};

export default MetadataPanel;
