import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import { TextField } from "@mui/material";

const CreatorSection: React.FC<SectionProps> = ({
  formState,
  handleFormChange,
}) => {
  return (
    <FormSection title="Creator">
      <TextField
        label="Creator"
        variant="outlined"
        size="small"
        fullWidth
        value={
          typeof formState.Creator === "string" &&
          formState.Creator !== "(Mixed Values)"
            ? formState.Creator
            : ""
        }
        placeholder={
          formState.Creator === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Creator", e.target.value)}
      />
    </FormSection>
  );
};

export default CreatorSection;
