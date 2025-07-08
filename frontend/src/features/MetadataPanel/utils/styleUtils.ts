import { SxProps, Theme } from "@mui/material/styles";

const DIRTY_BACKGROUND_COLOR = "rgba(255, 236, 179, 0.3)"; // A light yellow/amber

/**
 * Returns an SX prop object for styling a field based on its dirty state.
 * @param isDirty - A boolean indicating if the field has unsaved changes.
 * @returns An SxProps object with conditional background color and transition.
 */
export const getDirtyFieldSx = (isDirty: boolean): SxProps<Theme> => ({
  backgroundColor: isDirty ? DIRTY_BACKGROUND_COLOR : "transparent",
  transition: "background-color 0.3s ease-in-out",
  borderRadius: 1, // Add a slight radius to match the text field's curve
});
