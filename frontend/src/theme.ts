import { createTheme } from "@mui/material/styles";

/**
 * The central theme for the PhotoTagger application. This acts as the single
 * source of truth for the design system, including colors, typography, and
 * default component properties.
 */
const theme = createTheme({
  palette: {
    mode: "light",
  },

  components: {
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiToggleButtonGroup: {
      defaultProps: {
        size: "small",
      },
    },
    MuiChip: {
      defaultProps: {
        size: "small",
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: "small",
      },
    },
  },
});

export default theme;
