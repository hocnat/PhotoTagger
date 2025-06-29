import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import App from "./components/App";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import "./index.css";

const theme = createTheme({ palette: { mode: "light" } });

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <NotificationProvider>
            <SettingsProvider>
              {" "}
              <CssBaseline />
              <App />
            </SettingsProvider>
          </NotificationProvider>
        </LocalizationProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
