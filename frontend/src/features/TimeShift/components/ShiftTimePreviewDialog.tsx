import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import { TimeShiftPreviewItem } from "types";
import { AppIcons } from "config/AppIcons";

interface ShiftTimePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onBack: () => void;
  previewData: TimeShiftPreviewItem[];
  isSaving: boolean;
}

export const ShiftTimePreviewDialog: React.FC<ShiftTimePreviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onBack,
  previewData,
  isSaving,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Confirm Time Shift</DialogTitle>
      <DialogContent>
        <List dense>
          {previewData.map((item) => (
            <ListItem key={item.filename} divider>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  gap: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: "bold", wordBreak: "break-all" }}
                >
                  {item.filename}
                </Typography>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 2, pl: 2 }}
                >
                  <Typography sx={{ color: "text.secondary" }}>
                    {item.original}
                  </Typography>
                  <AppIcons.CHANGE_FROM_TO sx={{ color: "text.secondary" }} />
                  <Typography sx={{ fontWeight: "bold" }}>
                    {item.new}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onBack} disabled={isSaving}>
          Back
        </Button>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" disabled={isSaving}>
          {isSaving ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Confirm & Save"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
