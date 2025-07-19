import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Stack,
} from "@mui/material";
import { AppIcons } from "config/AppIcons";
import { useAppContext } from "context/AppContext";

export const SelectionToolbar: React.FC = () => {
  const {
    selectionCount,
    isLoading,
    isRenamePreviewLoading,
    onEdit,
    onTimeShift,
    onRename,
  } = useAppContext();

  const hasSelection = selectionCount > 0;

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={1}
      sx={{
        top: 64,
        zIndex: (theme) => theme.zIndex.appBar,
        backgroundColor: "background.paper",
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Toolbar>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ width: "100%" }}
        >
          <Typography variant="subtitle1" color="text.secondary">
            {hasSelection
              ? `${selectionCount} item(s) selected`
              : "No selection"}
          </Typography>

          <Box>
            <Tooltip title="Edit metadata">
              <span>
                <IconButton onClick={onEdit} disabled={!hasSelection}>
                  <AppIcons.EDIT />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Shift date/time">
              <span>
                <IconButton onClick={onTimeShift} disabled={!hasSelection}>
                  <AppIcons.TIME_SHIFT />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Rename files">
              <span>
                <IconButton
                  disabled={
                    isLoading || isRenamePreviewLoading || !hasSelection
                  }
                  onClick={onRename}
                >
                  {isRenamePreviewLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <AppIcons.FILENAME />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
