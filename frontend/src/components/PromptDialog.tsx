import { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  label: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

/**
 * A reusable dialog for prompting the user for a single string value.
 * It provides a text field and handles the save/cancel actions.
 */
export const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  title,
  message,
  label,
  onSave,
  onClose,
}) => {
  const [value, setValue] = useState("");

  // Reset the input value whenever the dialog is opened
  useEffect(() => {
    if (isOpen) {
      setValue("");
    }
  }, [isOpen]);

  const handleSaveClick = () => {
    if (value.trim()) {
      onSave(value.trim());
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label={label}
          type="text"
          fullWidth
          variant="outlined"
          size="small"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && value.trim()) {
              e.preventDefault();
              handleSaveClick();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSaveClick}
          disabled={!value.trim()}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
