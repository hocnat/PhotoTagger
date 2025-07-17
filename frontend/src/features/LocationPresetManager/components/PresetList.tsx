import { useState } from "react";
import {
  Box,
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
import { format, parseISO } from "date-fns";
import { LocationPreset } from "types";
import SearchInput from "components/SearchInput";
import { AppIcons } from "config/AppIcons";

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
  const [filterText, setFilterText] = useState("");

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

  // Filter the presets based on the user's search text.
  const filteredPresets = presets.filter((preset) => {
    const searchText = filterText.toLowerCase();
    if (!searchText) return true;

    // Check against multiple relevant fields for a comprehensive search.
    return (
      preset.name.toLowerCase().includes(searchText) ||
      preset.data.Location?.toLowerCase().includes(searchText) ||
      preset.data.City?.toLowerCase().includes(searchText) ||
      preset.data.State?.toLowerCase().includes(searchText) ||
      preset.data.Country?.toLowerCase().includes(searchText)
    );
  });

  return (
    <>
      <Box sx={{ mb: 2, maxWidth: "500px" }}>
        <SearchInput
          fullWidth
          placeholder="Search by name, city, country..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </Box>

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
            {filteredPresets.map((preset) => (
              <TableRow
                key={preset.id}
                hover
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
                    <AppIcons.EDIT />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(preset)}
                    aria-label="delete"
                  >
                    <AppIcons.DELETE />
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
