import {
  Box,
  Drawer,
  Typography,
  CircularProgress,
  Alert,
  Fab,
  Divider,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useSingleImageReader } from "./hooks/useSingleImageReader";

const INFO_PANEL_WIDTH = 500;

interface InfoPanelProps {
  folderPath: string;
  selectedImage: string | null;
  isOpen: boolean;
  onToggle: () => void;
}

const SECTIONS = [
  {
    title: "Content",
    fields: [
      { key: "Title", label: "Title" },
      { key: "Keywords", label: "Keywords" },
    ],
  },
  {
    title: "Date & Time",
    fields: [
      { key: "DateTimeOriginal", label: "Date/Time" },
      { key: "OffsetTimeOriginal", label: "Offset" },
    ],
  },
  {
    title: "Creator & Copyright",
    fields: [
      { key: "Creator", label: "Creator" },
      { key: "Copyright", label: "Copyright" },
    ],
  },
  {
    title: "Location Created",
    fields: [
      { key: "GPSPositionCreated", label: "GPS" },
      { key: "LocationCreated", label: "Location" },
      { key: "CityCreated", label: "City" },
      { key: "StateCreated", label: "State" },
      { key: "CountryCreated", label: "Country" },
      { key: "CountryCodeCreated", label: "Code" },
    ],
  },
  {
    title: "Location Shown",
    fields: [
      { key: "GPSPositionShown", label: "GPS" },
      { key: "LocationShown", label: "Location" },
      { key: "CityShown", label: "City" },
      { key: "StateShown", label: "State" },
      { key: "CountryShown", label: "Country" },
      { key: "CountryCodeShown", label: "Code" },
    ],
  },
];

export const InfoPanel: React.FC<InfoPanelProps> = ({
  folderPath,
  selectedImage,
  isOpen,
  onToggle,
}) => {
  const { metadata, isLoading, error } = useSingleImageReader(
    folderPath,
    selectedImage,
    isOpen
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (!selectedImage) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ p: 2, textAlign: "center" }}
        >
          Select a single image to view its details.
        </Typography>
      );
    }
    if (!metadata) {
      return null;
    }

    return (
      <Box>
        {SECTIONS.map((section, sectionIndex) => (
          <Box key={section.title} sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ display: "block", lineHeight: 1.5 }}
            >
              {section.title}
            </Typography>
            <Divider />
            <Box sx={{ pt: 0.5 }}>
              {section.fields.map((field) => {
                let displayValue: string | null = null;

                if (field.key === "GPSPositionCreated") {
                  const lat = metadata.LatitudeCreated?.value;
                  const lon = metadata.LongitudeCreated?.value;
                  if (lat && lon) displayValue = `${lat}, ${lon}`;
                } else if (field.key === "GPSPositionShown") {
                  const lat = metadata.LatitudeShown?.value;
                  const lon = metadata.LongitudeShown?.value;
                  if (lat && lon) displayValue = `${lat}, ${lon}`;
                } else {
                  const fieldData = metadata[field.key];
                  const value = fieldData?.value;
                  if (value !== undefined && value !== null) {
                    displayValue = Array.isArray(value)
                      ? value.join(", ")
                      : String(value);
                  }
                }

                const isFieldEmpty =
                  !displayValue || displayValue.trim().length === 0;

                return (
                  <Box
                    key={field.key}
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      my: 0.25,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, flexBasis: "40%", flexShrink: 0 }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isFieldEmpty ? "text.disabled" : "text.primary",
                        wordBreak: "break-all",
                        flexGrow: 1,
                      }}
                    >
                      {isFieldEmpty ? "—" : displayValue}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Fab
        size="small"
        onClick={onToggle}
        sx={{
          position: "fixed",
          top: "50%",
          transform: "translateY(-50%)",
          right: isOpen ? INFO_PANEL_WIDTH + 4 : 4,
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) =>
            theme.transitions.create("right", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        {isOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </Fab>
      (
      {isOpen && (
        <Drawer
          sx={{
            width: INFO_PANEL_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: INFO_PANEL_WIDTH,
              boxSizing: "border-box",
              mt: "64px",
              height: "calc(100% - 64px)",
            },
          }}
          variant="persistent"
          anchor="right"
          open={isOpen}
        >
          <Box sx={{ overflowY: "auto", p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Info Panel
            </Typography>
            {renderContent()}
          </Box>
        </Drawer>
      )}
      )
    </>
  );
};
