import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { ImageGpsMatch } from "types";

interface ImageListItemProps {
  filename: string;
  imageUrl: string;
  isSelected: boolean;
  isUnmatchable: boolean;
  match: ImageGpsMatch | undefined;
  onClick: (event: React.MouseEvent) => void;
}

export const ImageListItem: React.FC<ImageListItemProps> = ({
  filename,
  imageUrl,
  isSelected,
  isUnmatchable,
  match,
  onClick,
}) => {
  const hasCoordinates = !!match?.coordinates;

  return (
    <ListItem
      disablePadding
      onClick={onClick}
      sx={{ opacity: isUnmatchable ? 0.6 : 1 }}
    >
      <ListItemButton selected={isSelected} disabled={isUnmatchable}>
        <ListItemIcon sx={{ minWidth: 112, mr: 2 }}>
          <Box
            component="img"
            src={imageUrl}
            alt={filename}
            sx={{
              width: 96,
              height: 96,
              objectFit: "cover",
              borderRadius: 1,
              bgcolor: "grey.200",
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography
              variant="body2"
              component="span"
              sx={{
                wordBreak: "break-all",
              }}
            >
              {filename}
            </Typography>
          }
        />
        <ListItemIcon sx={{ minWidth: 32, justifyContent: "flex-end" }}>
          {isUnmatchable ? (
            <Tooltip title="Cannot be matched. Missing DateTimeOriginal or OffsetTimeOriginal.">
              <AppIcons.SUMMARY_WARNING color="warning" fontSize="small" />
            </Tooltip>
          ) : hasCoordinates ? (
            <AppIcons.MARKER color="primary" fontSize="small" />
          ) : (
            <AppIcons.MARKER color="disabled" fontSize="small" />
          )}
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};
