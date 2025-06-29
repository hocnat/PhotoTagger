import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import { TextField } from "@mui/material";

const CreatorSection: React.FC<SectionProps> = ({
  formState,
  handleFormChange,
}) => {
  return (
    <FormSection title="Who">
      <TextField
        label="Author / By-line"
        variant="outlined"
        size="small"
        fullWidth
        value={
          typeof formState.Author === "string" &&
          formState.Author !== "(Mixed Values)"
            ? formState.Author
            : ""
        }
        placeholder={
          formState.Author === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Author", e.target.value)}
      />
    </FormSection>
  );
};

export default CreatorSection;
