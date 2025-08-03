import { List, Box } from "@mui/material";
import { ImageFile } from "types";
import { useGeotaggingContext } from "../context/GeotaggingContext";
import { ImageListItem } from "./ImageListItem";

interface ImageListPanelProps {
  images: ImageFile[];
  getImageUrl: (filename: string) => string;
}

export const ImageListPanel: React.FC<ImageListPanelProps> = ({
  images,
  getImageUrl,
}) => {
  const {
    selectedFilenames,
    handleSelectionChange,
    allMatches,
    unmatchableFilenames,
  } = useGeotaggingContext();

  const matchesMap = new Map(
    allMatches.map((match) => [match.filename, match])
  );

  return (
    <Box>
      <List dense sx={{ py: 0 }}>
        {images.map((image) => (
          <ImageListItem
            key={image.filename}
            filename={image.filename}
            imageUrl={getImageUrl(image.filename)}
            isSelected={selectedFilenames.has(image.filename)}
            isUnmatchable={unmatchableFilenames.has(image.filename)}
            match={matchesMap.get(image.filename)}
            onClick={(event) => handleSelectionChange(event, image.filename)}
          />
        ))}
      </List>
    </Box>
  );
};
