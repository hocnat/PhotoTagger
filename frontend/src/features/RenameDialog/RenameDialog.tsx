import { RenamePreviewItem } from "types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";

interface RenameDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  previewData: RenamePreviewItem[];
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  isOpen,
  onConfirm,
  onClose,
  previewData,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm File Renaming</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Please review the following file name changes. This action cannot be
          undone.
        </DialogContentText>
        <List dense>
          {previewData.map((item) => {
            const hasError = item.new.startsWith("(Error:");
            const isSkipped = item.original === item.new;
            return (
              <ListItem key={item.original} divider>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "100%",
                    gap: 2,
                  }}
                >
                  <Typography
                    sx={{
                      flex: 1,
                      wordBreak: "break-all",
                      color: "text.secondary",
                    }}
                  >
                    {item.original}
                  </Typography>
                  <AppIcons.CHANGE_FROM_TO sx={{ flexShrink: 0 }} />
                  <Typography
                    sx={{
                      flex: 1,
                      wordBreak: "break-all",
                      color: hasError
                        ? "error.main"
                        : isSkipped
                        ? "text.disabled"
                        : "text.primary",
                      fontWeight: hasError || !isSkipped ? "bold" : "normal",
                    }}
                  >
                    {item.new}
                  </Typography>
                </Box>
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          Confirm Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
};
