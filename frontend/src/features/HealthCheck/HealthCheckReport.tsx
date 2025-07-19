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
import { HealthReport } from "types";
import { AppIcons } from "config/AppIcons";

interface HealthCheckReportProps {
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

const checkDetailsMap = {
  consolidation: {
    icon: <AppIcons.CONSOLIDATION />,
    label: "Metadata Consolidation",
  },
  requiredFields: {
    icon: <AppIcons.REQUIRED_FIELDS />,
    label: "Required Fields Check",
  },
  filename: {
    icon: <AppIcons.FILENAME />,
    label: "Filename Convention",
  },
};

export const HealthCheckReport: React.FC<HealthCheckReportProps> = ({
  isOpen,
  onClose,
  reports,
  isLoading,
}) => {
  return (
    <Drawer
      variant="temporary"
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{
        width: "100%",
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: "100%",
          boxSizing: "border-box",
        },
      }}
    >
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <AppIcons.HEALTH_CHECK sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Health Check Report
            </Typography>
            <IconButton edge="end" color="inherit" onClick={onClose}>
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
                <AccordionSummary expandIcon={<AppIcons.MOVE_DOWN />}>
                  {getOverallStatus(report) === "ok" ? (
                    <AppIcons.SUMMARY_SUCCESS color="action" sx={{ mr: 1 }} />
                  ) : (
                    <AppIcons.SUMMARY_WARNING color="warning" sx={{ mr: 1 }} />
                  )}
                  <Typography sx={{ wordBreak: "break-all" }}>
                    {report.filename}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {checkOrder.map((key) => {
                      const check = report.checks[key];
                      const details = checkDetailsMap[key];
                      return (
                        <ListItem key={key}>
                          <ListItemIcon sx={{ minWidth: 32, mr: 1 }}>
                            {check.status === "ok" ? (
                              <AppIcons.STATUS_SUCCESS color="success" />
                            ) : (
                              <AppIcons.STATUS_ERROR color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemIcon
                            sx={{ minWidth: 40, color: "text.secondary" }}
                          >
                            {details.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={details.label}
                            secondary={check.message}
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
        </Box>
      </Box>
    </Drawer>
  );
};
