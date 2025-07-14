import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PublicIcon from "@mui/icons-material/Public";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";

import { LocationPreset, LocationPresetData } from "types";
import { LocationImporterDialog } from "../LocationImporter";
import PresetList from "./PresetList";
import PresetForm from "./PresetForm";
import { useLocationPresets } from "features/MetadataPanel/hooks/useLocationPresets";

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

  const { presets, fetchPresets, addPreset, updatePreset, deletePreset } =
    useLocationPresets();

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
      <Toolbar />
      <AppBar
        position="static"
        color="default"
        sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar>
          <PublicIcon sx={{ mr: 2 }} />
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
            startIcon={<CloudUploadOutlinedIcon />}
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
            <CloseIcon />
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
        {view === "LIST" && (
          <PresetList
            presets={presets}
            onEdit={handleShowForm}
            onDelete={handleDeletePreset}
          />
        )}
        {view === "FORM" && (
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
