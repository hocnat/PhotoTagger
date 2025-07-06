import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import { getFieldData } from "../../utils/metadataUtils";
import { TextField } from "@mui/material";
import ConsolidationAdornment from "./ConsolidationAdornment";

const CreatorSection: React.FC<SectionProps> = ({
  formState,
  handleFormChange,
}) => {
  const fieldData = getFieldData(formState.Creator, "");

  return (
    <FormSection title="Creator">
      <TextField
        label="Creator"
        variant="outlined"
        size="small"
        fullWidth
        value={formState.Creator === "(Mixed Values)" ? "" : fieldData.value}
        placeholder={
          formState.Creator === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Creator", e.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment show={!fieldData.isConsolidated} />
            ),
          },
        }}
      />
    </FormSection>
  );
};

export default CreatorSection;
