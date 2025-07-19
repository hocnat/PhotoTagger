import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  CircularProgress,
} from "@mui/material";
import { LocationPreset, LocationPresetData } from "types";
import { LocationImporterDialog } from "../LocationImporter";
import PresetList from "./components/PresetList";
import PresetForm from "./components/PresetForm";
import { useLocationPresets } from "hooks/useLocationPresets";
import { AppIcons } from "config/AppIcons";

interface LocationPresetManagerProps {
  onClose: () => void;
}

type View = "LIST" | "FORM";

export const LocationPresetManager: React.FC<LocationPresetManagerProps> = ({
  onClose,
}) => {
  const [view, setView] = useState<View>("LIST");
  const [editingPreset, setEditingPreset] = useState<LocationPreset | null>(
    null
  );
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  const {
    presets,
    isLoading,
    fetchPresets,
    addPreset,
    updatePreset,
    deletePreset,
  } = useLocationPresets();

  const handleShowForm = (preset: LocationPreset | null = null) => {
    setEditingPreset(preset);
    setView("FORM");
  };

  const handleShowList = () => {
    setEditingPreset(null);
    setView("LIST");
  };

  const handleImportSuccess = () => {
    setIsImporterOpen(false);
    fetchPresets();
  };

  const handleSavePreset = async (name: string, data: LocationPresetData) => {
    if (editingPreset) {
      await updatePreset(editingPreset.id, name, data);
    } else {
      await addPreset(name, data);
    }
    handleShowList();
  };

  const handleDeletePreset = async (id: string) => {
    await deletePreset(id);
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AppIcons.LOCATION sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Location Preset Manager
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleShowForm()}
            sx={{ mr: 2 }}
          >
            Add New Preset
          </Button>
          <Button
            variant="outlined"
            onClick={() => setIsImporterOpen(true)}
            startIcon={<AppIcons.IMPORT />}
            sx={{ mr: 2 }}
          >
            Import
          </Button>
          <IconButton
            edge="end"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <AppIcons.CLOSE />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: "auto",
          bgcolor: "background.default",
        }}
      >
        {isLoading && <CircularProgress />}
        {!isLoading && view === "LIST" && (
          <PresetList
            presets={presets}
            onEdit={handleShowForm}
            onDelete={handleDeletePreset}
          />
        )}
        {!isLoading && view === "FORM" && (
          <PresetForm
            initialPreset={editingPreset}
            onCancel={handleShowList}
            onSave={handleSavePreset}
          />
        )}
      </Box>
      <LocationImporterDialog
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </Box>
  );
};
