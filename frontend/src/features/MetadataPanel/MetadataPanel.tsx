import { useState, useEffect } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { useMetadataEditor } from "./hooks/useMetadataEditor";
import ImageModal from "./components/ImageModal";
import ContentSection from "./components/ContentSection";
import LocationSection from "./components/LocationSection";
import DateTimeSection from "./components/DateTimeSection";
import CreatorSection from "./components/CreatorSection";

interface MetadataPanelProps {
  selectedImageNames: string[];
  folderPath: string;
  getImageUrl: (imageName: string) => string;
  setIsDirty: (isDirty: boolean) => void;
}

const MetadataPanel: React.FC<MetadataPanelProps> = ({
  selectedImageNames,
  folderPath,
  getImageUrl,
  setIsDirty,
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
  } = useMetadataEditor({ selectedImageNames, folderPath, setIsDirty });

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

  if (selectedImageNames.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select an image to view its metadata.</Typography>
      </Box>
    );
  }

  const previewImageName =
    selectedImageNames.length === 1 ? selectedImageNames[0] : null;

  return (
    <Box
      sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6">Metadata</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedImageNames.length} item(s) selected
        </Typography>
      </Box>

      {isPreviewOpen && previewImageName && (
        <ImageModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          imageUrl={getImageUrl(previewImageName)}
          imageName={previewImageName}
        />
      )}

      {isMetadataLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box
          component="form"
          sx={{ flexGrow: 1, overflowY: "auto", pr: 1, pl: 1, ml: -1 }}
        >
          {selectedImageNames.length === 1 && (
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setIsPreviewOpen(true)}
              fullWidth
              sx={{ mb: 2 }}
            >
              Show Large Preview
            </Button>
          )}

          <ContentSection
            formState={formState}
            handleFormChange={handleFormChange}
            keywordSuggestions={keywordSuggestions}
            onKeywordInputChange={handleKeywordInputChange}
          />
          <LocationSection
            formState={formState}
            handleFormChange={handleFormChange}
            onLocationSet={handleLocationSet}
            applyLocationPreset={applyLocationPreset}
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

          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSave}
            disabled={isSaving || !isSaveable}
            startIcon={
              isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SaveIcon />
              )
            }
            sx={{ mt: 2 }}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MetadataPanel;
