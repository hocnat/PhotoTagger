import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { TimeShiftData } from "types";

interface ShiftTimeInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPreview: (shiftData: TimeShiftData) => void;
  isLoading: boolean;
}

export const ShiftTimeInputDialog: React.FC<ShiftTimeInputDialogProps> = ({
  isOpen,
  onClose,
  onPreview,
  isLoading,
}) => {
  const [direction, setDirection] = useState<"add" | "subtract">("add");
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setDirection("add");
      setDays(0);
      setHours(0);
      setMinutes(0);
      setSeconds(0);
    }
  }, [isOpen]);

  const handleDirectionChange = (
    event: React.MouseEvent<HTMLElement>,
    newDirection: "add" | "subtract" | null
  ) => {
    if (newDirection !== null) {
      setDirection(newDirection);
    }
  };

  const handlePreviewClick = () => {
    onPreview({ direction, days, hours, minutes, seconds });
  };

  const isShiftZero = !days && !hours && !minutes && !seconds;

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Shift Time</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter the amount of time to add to or subtract from the original
          timestamp of the selected images.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={direction}
            exclusive
            onChange={handleDirectionChange}
            color="primary"
          >
            <ToggleButton value="add" aria-label="add time">
              <AddIcon />
              Add
            </ToggleButton>
            <ToggleButton value="subtract" aria-label="subtract time">
              <RemoveIcon />
              Subtract
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Days"
              type="number"
              value={days}
              onChange={(e) => setDays(Math.max(0, Number(e.target.value)))}
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: 0,
                  },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Hours"
              type="number"
              value={hours}
              onChange={(e) =>
                setHours(Math.max(0, Math.min(Number(e.target.value), 23)))
              }
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: 0,
                    max: 23,
                  },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Minutes"
              type="number"
              value={minutes}
              onChange={(e) =>
                setMinutes(Math.max(0, Math.min(Number(e.target.value), 59)))
              }
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: 0,
                    max: 59,
                  },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              label="Seconds"
              type="number"
              value={seconds}
              onChange={(e) =>
                setSeconds(Math.max(0, Math.min(Number(e.target.value), 59)))
              }
              fullWidth
              slotProps={{
                input: {
                  inputProps: {
                    min: 0,
                    max: 59,
                  },
                },
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handlePreviewClick}
          variant="contained"
          disabled={isLoading || isShiftZero}
        >
          {isLoading ? "Loading..." : "Preview Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
