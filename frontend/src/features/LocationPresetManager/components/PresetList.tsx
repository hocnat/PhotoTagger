import { useState } from "react";
import {
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { format, parseISO } from "date-fns";

import { LocationPreset } from "types";

interface PresetListProps {
  presets: LocationPreset[];
  onEdit: (preset: LocationPreset) => void;
  onDelete: (id: string) => void;
}

const PresetList: React.FC<PresetListProps> = ({
  presets,
  onEdit,
  onDelete,
}) => {
  const [toDelete, setToDelete] = useState<LocationPreset | null>(null);

  const handleDeleteClick = (preset: LocationPreset) => {
    setToDelete(preset);
  };

  const handleConfirmDelete = () => {
    if (toDelete) {
      onDelete(toDelete.id);
      setToDelete(null);
    }
  };

  const formatLastUsed = (dateString: string | null) => {
    if (!dateString) return "Never";
    return format(parseISO(dateString), "yyyy-MM-dd HH:mm");
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="location presets table">
          <TableHead>
            <TableRow>
              <TableCell>Preset Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="right">Usage Count</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {presets.map((preset) => (
              <TableRow
                key={preset.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="body1" fontWeight="bold">
                    {preset.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  {[
                    preset.data.Location,
                    preset.data.City,
                    preset.data.State,
                    preset.data.Country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </TableCell>
                <TableCell align="right">{preset.useCount}</TableCell>
                <TableCell>{formatLastUsed(preset.lastUsed)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(preset)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(preset)}
                    aria-label="delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Delete Preset?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the preset "
            <strong>{toDelete?.name}</strong>"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PresetList;
