import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { useAppContext } from "context/AppContext";

export const MainAppBar: React.FC = () => {
  const {
    selectionCount,
    isLoading,
    isRenamePreviewLoading,
    isHealthChecking,
    onEdit,
    onTimeShift,
    onRename,
    onAnalyze,
    onKeywords,
    onLocations,
    onSettings,
  } = useAppContext();

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 3 }}
    >
      <Toolbar>
        <AppIcons.APP sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PhotoTagger
        </Typography>
        <Tooltip title="Edit metadata">
          <IconButton
            color="inherit"
            onClick={onEdit}
            disabled={selectionCount === 0}
          >
            <AppIcons.EDIT />
          </IconButton>
        </Tooltip>
        <Tooltip title="Shift date/time">
          <IconButton
            color="inherit"
            onClick={onTimeShift}
            disabled={selectionCount === 0}
          >
            <AppIcons.TIME_SHIFT />
          </IconButton>
        </Tooltip>
        <Tooltip title="Rename files">
          <IconButton
            color="inherit"
            disabled={
              isLoading || isRenamePreviewLoading || selectionCount === 0
            }
            onClick={onRename}
          >
            {isRenamePreviewLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <AppIcons.FILENAME />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Analyze files">
          <IconButton
            color="inherit"
            onClick={onAnalyze}
            disabled={selectionCount === 0 || isHealthChecking}
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
