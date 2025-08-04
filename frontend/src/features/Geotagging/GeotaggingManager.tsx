import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
  Stack,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { ImageFile } from "types";
import { useGeotagger } from "./hooks/useGeotagger";
import {
  GeotaggingProvider,
  useGeotaggingContext,
} from "./context/GeotaggingContext";
import { ImageListPanel } from "./components/ImageListPanel";
import { GeotaggingMap } from "./components/GeotaggingMap";
import { LocationFormPanel } from "./components/LocationFormPanel";

interface GeotaggingManagerProps {
  gpxContent: string;
  images: ImageFile[];
  folderPath: string;
  getImageUrl: (filename: string) => string;
  onClose: () => void;
  onSaveSuccess: (updatedFilePaths: string[]) => void;
}

interface GeotaggingManagerContentProps {
  images: ImageFile[];
  track: GeoJSON.LineString | null;
  getImageUrl: (filename: string) => string;
}

const GeotaggingManagerContent: React.FC<GeotaggingManagerContentProps> = ({
  images,
  track,
  getImageUrl,
}) => {
  useGeotaggingContext();

  return (
    <>
      {/* Column 1: Image List */}
      <Box
        sx={{
          width: "300px",
          flexShrink: 0,
          borderRight: 1,
          borderColor: "divider",
          overflowY: "auto",
        }}
      >
        <ImageListPanel images={images} getImageUrl={getImageUrl} />
      </Box>

      {/* Column 2: Map (Flexible) */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          position: "relative",
        }}
      >
        <GeotaggingMap track={track} images={images} />
      </Box>

      {/* Column 3: Location Form */}
      <Box
        sx={{
          width: "350px",
          flexShrink: 0,
          borderLeft: 1,
          borderColor: "divider",
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        <LocationFormPanel />
      </Box>
    </>
  );
};

/**
 * The main container component for the geotagging feature.
 * It orchestrates the UI based on the state from the `useGeotagger` hook.
 */
export const GeotaggingManager: React.FC<GeotaggingManagerProps> = ({
  gpxContent,
  images,
  folderPath,
  getImageUrl,
  onClose,
  onSaveSuccess,
}) => {
  const {
    isLoading,
    isSaving,
    error,
    contextValue,
    handleSave,
    hasChanges,
    matchResult,
  } = useGeotagger({
    gpxContent,
    images,
    folderPath,
    onSaveSuccess,
    onClose,
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AppIcons.GEOTAG_GPX sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="h2">
              Geotag from GPX Track
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {images.length} item(s) selected
            </Typography>
          </Box>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close geotagging panel"
          >
            <AppIcons.CLOSE />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        {isLoading ? (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Matching images to track...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, margin: "auto", textAlign: "center" }}>
            <Typography variant="h6" color="error" gutterBottom>
              Failed to Load Geotagging Session
            </Typography>
            <Typography color="error.dark">{error}</Typography>
          </Box>
        ) : (
          <GeotaggingProvider value={contextValue}>
            <GeotaggingManagerContent
              images={images}
              track={matchResult?.track || null}
              getImageUrl={getImageUrl}
            />
          </GeotaggingProvider>
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
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
