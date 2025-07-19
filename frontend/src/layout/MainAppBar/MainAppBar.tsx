import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { useAppContext } from "context/AppContext";

export const MainAppBar: React.FC = () => {
  const {
    folderPath,
    isLoading,
    isHealthChecking,
    onOpenFolder,
    onAnalyze,
    onKeywords,
    onLocations,
    onSettings,
  } = useAppContext();

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.appBar }}>
      <Toolbar>
        <AppIcons.APP sx={{ mr: 2 }} />
        <Typography variant="h6" component="div">
          PhotoTagger
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 1 }} />
        <Typography variant="body2" sx={{ flexGrow: 1, opacity: 0.7 }} noWrap>
          {folderPath || "No Folder Selected"}
        </Typography>

        <Tooltip title="Open Folder">
          <IconButton
            color="inherit"
            onClick={onOpenFolder}
            disabled={isLoading}
          >
            <AppIcons.LOAD />
          </IconButton>
        </Tooltip>
        <Tooltip title="Run Health Check">
          <IconButton
            color="inherit"
            onClick={onAnalyze}
            disabled={!folderPath || isHealthChecking}
          >
            {isHealthChecking ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <AppIcons.HEALTH_CHECK />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Manage Keywords">
          <IconButton color="inherit" onClick={onKeywords}>
            <AppIcons.KEYWORDS />
          </IconButton>
        </Tooltip>
        <Tooltip title="Manage Location Presets">
          <IconButton color="inherit" onClick={onLocations}>
            <AppIcons.LOCATION />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton color="inherit" onClick={onSettings}>
            <AppIcons.SETTINGS />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};
