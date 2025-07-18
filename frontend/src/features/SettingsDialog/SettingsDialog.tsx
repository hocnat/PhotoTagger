import { useState, useEffect } from "react";
import { AppSettings, ExtensionRule, CountryMapping } from "types";
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
  Tabs,
  Tab,
} from "@mui/material";

import { useSettings } from "./hooks/useSettings";
import { ExtensionRuleEditor } from "./components/ExtensionRuleEditor";
import { CountryMappingEditor } from "./components/CountryMappingEditor";
import { RequiredFieldsEditor } from "./components/RequiredFieldsEditor";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TabPanel = (props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

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
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (settings && isOpen) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings, isOpen]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
      // Filter out any empty/invalid rules before saving
      const finalSettings = {
        ...localSettings,
        renameSettings: {
          ...localSettings.renameSettings,
          extensionRules: localSettings.renameSettings.extensionRules.filter(
            (rule) => rule.extension.trim()
          ),
        },
        countryMappings: localSettings.countryMappings.filter(
          (mapping) => mapping.code.trim().length === 2 && mapping.name.trim()
        ),
      };

      await saveSettings(finalSettings);
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

  const handleCountryMappingsChange = (mappings: CountryMapping[]) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, countryMappings: mappings });
  };

  const handleRequiredFieldsChange = (fields: string[]) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      appBehavior: {
        ...localSettings.appBehavior,
        requiredFields: fields,
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
      <DialogTitle>Settings</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
          >
            <Tab label="General" />
            <Tab label="Locations" />
            <Tab label="Renaming" />
            <Tab label="Analysis" />
          </Tabs>
        </Box>
        <TabPanel value={currentTab} index={0}>
          <Typography variant="subtitle2" gutterBottom>
            Startup
          </Typography>
          <FormControl fullWidth margin="normal" size="small">
            <InputLabel>On startup, open...</InputLabel>
            <Select
              value={localSettings.appBehavior.startupMode}
              label="On startup, open..."
              onChange={(e) =>
                handleFieldChange("appBehavior", "startupMode", e.target.value)
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
              value={localSettings.appBehavior.fixedPath}
              onChange={(e) =>
                handleFieldChange("appBehavior", "fixedPath", e.target.value)
              }
              helperText="If empty, the application will start with no folder loaded."
            />
          )}
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <CountryMappingEditor
            mappings={localSettings.countryMappings || []}
            onChange={handleCountryMappingsChange}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <Typography variant="subtitle2" gutterBottom>
            Rename Pattern
          </Typography>
          <TextField
            fullWidth
            label="Pattern"
            value={localSettings.renameSettings.pattern}
            onChange={(e) =>
              handleFieldChange("renameSettings", "pattern", e.target.value)
            }
            helperText={`Example: \${DateTimeOriginal:%Y%m%d_%H%M%S}_\${Title}. Valid tags: DateTimeOriginal, Title, etc.`}
            sx={{ mb: 2 }}
          />
          <Divider sx={{ my: 2 }} />
          <ExtensionRuleEditor
            rules={localSettings.renameSettings.extensionRules}
            onChange={handleExtensionRulesChange}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
          <RequiredFieldsEditor
            requiredFields={localSettings.appBehavior.requiredFields || []}
            onChange={handleRequiredFieldsChange}
          />
        </TabPanel>
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
