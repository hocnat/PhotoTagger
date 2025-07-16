import React from "react";
import { Box, Paper, Typography } from "@mui/material";
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
        // Construct the full path dynamically for the API call.
        const fullPath = `${folderPath}\\${imageName}`;
        const imageUrl = `http://localhost:5000/api/image_data?path=${encodeURIComponent(
          fullPath
        )}`;

        return (
          <Paper
            elevation={isSelected ? 8 : 2}
            key={imageName}
            className={`image-card ${isSelected ? "selected" : ""}`.trim()}
            id={`image-card-${index}`}
            onClick={(e) => onImageClick(e, imageName, index)}
            onDoubleClick={() => onImageDoubleClick(imageName)}
            sx={{ position: "relative" }}
          >
            <img src={imageUrl} alt={imageName} className="thumbnail" />
            {reportChecks && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "rgba(255, 255, 255, 0.8)",
                  p: 0.5,
                  borderRadius: 1,
                  display: "flex",
                }}
              >
                <HealthIndicatorIcons checks={reportChecks} />
              </Box>
            )}
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                p: 0.5,
                display: "block",
                wordWrap: "break-word",
              }}
            >
              {imageName}
            </Typography>
          </Paper>
        );
      })}
    </>
  );
};

export default ImageGrid;
