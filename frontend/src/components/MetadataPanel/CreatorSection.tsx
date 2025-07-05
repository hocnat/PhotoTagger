import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import ConsolidatedTextField from "./ConsolidatedTextField";
import { getFieldData } from "../../utils/metadataUtils";

const CreatorSection: React.FC<SectionProps> = ({
  formState,
  handleFormChange,
}) => {
  const fieldData = getFieldData(formState.Creator, "");

  return (
    <FormSection title="Creator">
      <ConsolidatedTextField
        baseLabel="Creator"
        isConsolidated={fieldData.isConsolidated}
        variant="outlined"
        size="small"
        fullWidth
        value={formState.Creator === "(Mixed Values)" ? "" : fieldData.value}
        placeholder={
          formState.Creator === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Creator", e.target.value)}
      />
    </FormSection>
  );
};

export default CreatorSection;
