import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { useAppContext } from "context/AppContext";

export const MainAppBar: React.FC = () => {
  const {
    folderPath,
    selectionCount,
    isLoading,
    isRenamePreviewLoading,
    isHealthChecking,
    onOpenFolder,
    onEdit,
    onTimeShift,
    onRename,
    onAnalyze,
    onKeywords,
    onLocations,
    onSettings,
  } = useAppContext();

  const globalActions = (
    <>
      <Tooltip title="Open Folder">
        <IconButton color="inherit" onClick={onOpenFolder} disabled={isLoading}>
          <AppIcons.LOAD />
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
    </>
  );

  const contextualActions = (
    <>
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
          disabled={isLoading || isRenamePreviewLoading || selectionCount === 0}
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
    </>
  );

  return (
    <AppBar
      position="fixed"
      sx={{ zIndex: (theme) => theme.zIndex.drawer + 3 }}
    >
      <Toolbar>
        <AppIcons.APP sx={{ mr: 2 }} />
        <Typography variant="h6" component="div">
          PhotoTagger
        </Typography>
        <Divider orientation="vertical" flexItem sx={{ mx: 2, my: 1 }} />
        <Typography variant="body2" sx={{ flexGrow: 1, opacity: 0.7 }}>
          {folderPath || "No Folder Selected"}
        </Typography>
        {globalActions}
        {contextualActions}
      </Toolbar>
    </AppBar>
  );
};
