import { useMemo } from "react";
import {
  Box,
  Drawer,
  Typography,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { useSingleImageReader } from "./hooks/useSingleImageReader";
import { useSchemaContext } from "context/SchemaContext";

const INFO_PANEL_WIDTH = 360;

interface InfoPanelProps {
  folderPath: string;
  selectedImage: string | null;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  folderPath,
  selectedImage,
}) => {
  const { metadata, isLoading, error } = useSingleImageReader(
    folderPath,
    selectedImage,
    true
  );
  const { schema } = useSchemaContext();

  const SECTIONS = useMemo(() => {
    if (!schema) {
      return [];
    }

    const gpsCreatedKey = "GPSPositionCreated";
    const gpsShownKey = "GPSPositionShown";

    const flatSchema = schema.flatMap((g) => g.fields);
    const latCreatedLabel = flatSchema.find(
      (f) => f.key === "LatitudeCreated"
    )?.label;
    const lonCreatedLabel = flatSchema.find(
      (f) => f.key === "LongitudeCreated"
    )?.label;
    const latShownLabel = flatSchema.find(
      (f) => f.key === "LatitudeShown"
    )?.label;
    const lonShownLabel = flatSchema.find(
      (f) => f.key === "LongitudeShown"
    )?.label;

    const gpsCreatedLabel =
      latCreatedLabel && lonCreatedLabel
        ? `${latCreatedLabel}, ${lonCreatedLabel}`
        : "";
    const gpsShownLabel =
      latShownLabel && lonShownLabel
        ? `${latShownLabel}, ${lonShownLabel}`
        : "";

    return schema.map((group) => {
      const newFields: { key: string; label: string }[] = [];
      let hasAddedGpsCreated = false;
      let hasAddedGpsShown = false;

      group.fields.forEach((field) => {
        if (field.key === "LatitudeCreated" && !hasAddedGpsCreated) {
          newFields.push({ key: gpsCreatedKey, label: gpsCreatedLabel });
          hasAddedGpsCreated = true;
        } else if (field.key === "LongitudeCreated") {
          // Skip
        } else if (field.key === "LatitudeShown" && !hasAddedGpsShown) {
          newFields.push({ key: gpsShownKey, label: gpsShownLabel });
          hasAddedGpsShown = true;
        } else if (field.key === "LongitudeShown") {
          // Skip
        } else {
          newFields.push(field);
        }
      });
      return { title: group.groupName, fields: newFields };
    });
  }, [schema]);

  const mainAppBarHeight = 64;
  const selectionToolbarHeight = 64;
  const totalToolbarHeight = mainAppBarHeight + selectionToolbarHeight + 4;

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
        {SECTIONS.map((section) => (
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
    <Drawer
      variant="permanent"
      anchor="right"
      open
      sx={{
        width: INFO_PANEL_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: INFO_PANEL_WIDTH,
          boxSizing: "border-box",
          mt: `${totalToolbarHeight}px`,
          height: `calc(100% - ${totalToolbarHeight}px)`,
          borderLeft: 1,
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ overflowY: "auto", p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Info Panel
        </Typography>
        {renderContent()}
      </Box>
    </Drawer>
  );
};
