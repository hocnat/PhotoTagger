import { useState, useEffect } from "react";
import { AppSettings, ExtensionRule, CountryMapping } from "types";
import { useNotification } from "hooks/useNotification";
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { useSettingsContext } from "context/SettingsContext";
import { ExtensionRuleEditor } from "./components/ExtensionRuleEditor";
import { CountryMappingEditor } from "./components/CountryMappingEditor";
import { RequiredFieldsEditor } from "./components/RequiredFieldsEditor";
import { AppIcons } from "config/AppIcons";

interface SettingsManagerProps {
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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  onClose,
}) => {
  const {
    settings,
    saveSettings,
    isLoading: isSettingsLoading,
  } = useSettingsContext();
  const { showNotification } = useNotification();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    if (settings) {
      setLocalSettings(JSON.parse(JSON.stringify(settings)));
    }
  }, [settings]);

  const handleSave = async () => {
    if (!localSettings) return;
    setIsSaving(true);
    try {
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <AppIcons.SETTINGS sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
          <Button onClick={onClose} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
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
        sx={{ flexGrow: 1, overflowY: "auto", bgcolor: "background.default" }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{ px: 2 }}
          >
            <Tab label="General" />
            <Tab label="Geotagging" />
            <Tab label="Locations" />
            <Tab label="Renaming" />
            <Tab label="Analysis" />
          </Tabs>
        </Box>
        <TabPanel value={currentTab} index={0}>
          <Typography variant="subtitle2" gutterBottom>
            Startup
          </Typography>
          <FormControl fullWidth margin="normal">
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
          <Typography variant="subtitle2" gutterBottom>
            GPX Track Matching
          </Typography>
          <TextField
            fullWidth
            type="number"
            label="Time Threshold (seconds)"
            value={localSettings.geotaggingSettings.gpxTimeThreshold}
            onChange={(e) =>
              handleFieldChange(
                "geotaggingSettings",
                "gpxTimeThreshold",
                Number(e.target.value)
              )
            }
            helperText="Only match a photo to the track if the time difference is less than this value."
            margin="normal"
            slotProps={{
              input: {
                inputProps: {
                  min: 0,
                  step: 1,
                },
              },
            }}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <CountryMappingEditor
            mappings={localSettings.countryMappings || []}
            onChange={handleCountryMappingsChange}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={3}>
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
        <TabPanel value={currentTab} index={4}>
          <RequiredFieldsEditor
            requiredFields={localSettings.appBehavior.requiredFields || []}
            onChange={handleRequiredFieldsChange}
          />
        </TabPanel>
      </Box>
    </Box>
  );
};
