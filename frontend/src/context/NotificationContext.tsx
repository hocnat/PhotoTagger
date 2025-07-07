import React, { createContext, useState, useCallback, ReactNode } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<AlertColor>("info");

  const showNotification = useCallback(
    (msg: string, sev: AlertColor = "info") => {
      setMessage(msg);
      setSeverity(sev);
      setOpen(true);
    },
    []
  );

  const handleClose = (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  const contextValue = {
    showNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={severity === "error" ? null : 6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
