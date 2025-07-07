import { useState, useEffect } from "react";
import { AppSettings, ExtensionRule } from "types";
import { useNotification } from "hooks/useNotification";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";

import { useSettings } from "./hooks/useSettings";
import { ExtensionRuleEditor } from "./components/ExtensionRuleEditor";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    saveSettings,
    isLoading: isSettingsLoading,
  } = useSettings();
  const { showNotification } = useNotification();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings, isOpen]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      await saveSettings(localSettings);
      showNotification("Settings saved successfully.", "success");
      onClose();
    } catch (error) {
      showNotification("Failed to save settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (
    section: keyof AppSettings,
    field: string,
    value: any
  ) => {
    setLocalSettings((prev) =>
      prev ? { ...prev, [section]: { ...prev[section], [field]: value } } : null
    );
  };

  const handleExtensionRulesChange = (rules: ExtensionRule[]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      renameSettings: {
        ...localSettings.renameSettings,
        extensionRules: rules,
      },
    });
  };

  if (isSettingsLoading || !localSettings) {
    return (
      <Dialog open={isOpen} onClose={onClose}>
        <DialogContent>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Application Settings</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box>
            <Typography variant="h6">Startup</Typography>
            <Divider sx={{ my: 1 }} />
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel>On startup, open...</InputLabel>
              <Select
                value={localSettings.appBehavior.startupMode}
                label="On startup, open..."
                onChange={(e) =>
                  handleFieldChange(
                    "appBehavior",
                    "startupMode",
                    e.target.value
                  )
                }
              >
                <MenuItem value="last">The last used folder</MenuItem>
                <MenuItem value="fixed">A specific folder</MenuItem>
              </Select>
            </FormControl>
            {localSettings.appBehavior.startupMode === "fixed" && (
              <TextField
                fullWidth
                label="Specific Folder Path"
                size="small"
                value={localSettings.appBehavior.fixedPath}
                onChange={(e) =>
                  handleFieldChange("appBehavior", "fixedPath", e.target.value)
                }
                helperText="If empty, the application will start with no folder loaded."
              />
            )}
          </Box>
          <Box>
            <Typography variant="h6">File Renaming</Typography>
            <Divider sx={{ my: 1 }} />
            <TextField
              fullWidth
              label="Rename Pattern"
              margin="normal"
              size="small"
              value={localSettings.renameSettings.pattern}
              onChange={(e) =>
                handleFieldChange("renameSettings", "pattern", e.target.value)
              }
              helperText="Example: ${DateTimeOriginal:%Y%m%d_%H%M%S}_${Title}. Valid tags: DateTimeOriginal, Title, etc."
            />
            <ExtensionRuleEditor
              rules={localSettings.renameSettings.extensionRules}
              onChange={handleExtensionRulesChange}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
