import React from "react";
import { Box, Paper, Tooltip, Typography } from "@mui/material";
import { HealthIndicatorIcons } from "features/HealthCheck/components/HealthIndicatorIcons";
import { HealthReport, ImageFile } from "types";

interface ImageGridProps {
  images: ImageFile[];
  folderPath: string;
  selectedImages: string[];
  healthReportsMap: Record<string, HealthReport["checks"]>;
  onImageClick: (
    event: React.MouseEvent,
    imageName: string,
    index: number
  ) => void;
  onImageDoubleClick: (imageName: string) => void;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  folderPath,
  selectedImages,
  healthReportsMap,
  onImageClick,
  onImageDoubleClick,
}) => {
  return (
    <>
      {images.map((image, index) => {
        const imageName = image.filename;
        const isSelected = selectedImages.includes(imageName);
        const reportChecks = healthReportsMap[imageName];
        const fullPath = `${folderPath}\\${imageName}`;
        const imageUrl = `http://localhost:5000/api/image_data?path=${encodeURIComponent(
          fullPath
        )}`;

        return (
          <Tooltip title={imageName} key={imageName}>
            <Paper
              elevation={isSelected ? 8 : 2}
              key={imageName}
              className={`image-card ${isSelected ? "selected" : ""}`.trim()}
              id={`image-card-${index}`}
              onClick={(e) => onImageClick(e, imageName, index)}
              onDoubleClick={() => onImageDoubleClick(imageName)}
              sx={{
                position: "relative",
                overflow: "hidden",
                aspectRatio: "1 / 1",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                  bgcolor: "grey.100",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  m: "4px",
                  borderRadius: 1,
                }}
              >
                <Box
                  component="img"
                  src={imageUrl}
                  alt={imageName}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              </Box>

              {reportChecks && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(255, 255, 255, 0.8)",
                    p: 0.5,
                    borderRadius: 1,
                    display: "flex",
                  }}
                >
                  <HealthIndicatorIcons checks={reportChecks} />
                </Box>
              )}

              <Box sx={{ flexShrink: 0, px: 1, pb: 0.5, pt: 0.5 }}>
                <Typography
                  variant="caption"
                  display="block"
                  align="center"
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {imageName}
                </Typography>
              </Box>
            </Paper>
          </Tooltip>
        );
      })}
    </>
  );
};

export default ImageGrid;
