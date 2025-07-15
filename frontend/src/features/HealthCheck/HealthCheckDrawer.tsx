import React from "react";
import {
  AppBar,
  Box,
  CircularProgress,
  IconButton,
  Toolbar,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import SyncIcon from "@mui/icons-material/Sync";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AbcIcon from "@mui/icons-material/Abc";
import { HealthReport } from "types";

const metadataDrawerWidth = 960;

interface HealthCheckDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  reports: HealthReport[];
  isLoading: boolean;
}

const getOverallStatus = (report: HealthReport) => {
  const hasError = Object.values(report.checks).some(
    (check) => check.status === "error"
  );
  return hasError ? "error" : "ok";
};

const checkOrder: (keyof HealthReport["checks"])[] = [
  "consolidation",
  "requiredFields",
  "filename",
];

export const HealthCheckDrawer: React.FC<HealthCheckDrawerProps> = ({
  isOpen,
  onClose,
  reports,
  isLoading,
}) => {
  const checkIcons = {
    consolidation: <SyncIcon />,
    requiredFields: <ChecklistIcon />,
    filename: <AbcIcon />,
  };

  return (
    <Drawer
      variant="temporary"
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        width: metadataDrawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: metadataDrawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <HealthAndSafetyIcon sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Image Health Report
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 2, overflowY: "auto" }}>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {!isLoading &&
          reports.map((report) => (
            <Accordion
              key={report.filename}
              defaultExpanded={getOverallStatus(report) === "error"}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {getOverallStatus(report) === "ok" ? (
                  <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                ) : (
                  <ErrorIcon color="error" sx={{ mr: 1 }} />
                )}
                <Typography sx={{ wordBreak: "break-all" }}>
                  {report.filename}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {checkOrder.map((key) => {
                    const check = report.checks[key];
                    return (
                      <ListItem key={key}>
                        <ListItemIcon>
                          {React.cloneElement(checkIcons[key], {
                            color: check.status === "ok" ? "success" : "error",
                          })}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2">
                              {check.message}
                            </Typography>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
      </Box>
    </Drawer>
  );
};
