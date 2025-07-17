import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: "primary" | "secondary" | "error";
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "primary",
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelButtonText}</Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          variant="contained"
          autoFocus
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
