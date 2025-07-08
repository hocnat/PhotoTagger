import { SectionProps, FormState } from "types";
import { TextField } from "@mui/material";

import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getFieldData } from "../utils/metadataUtils";
import { getDirtyFieldSx } from "../utils/styleUtils";

interface CreatorSectionProps extends SectionProps {
  isFieldDirty: (fieldName: keyof FormState) => boolean;
}

const CreatorSection: React.FC<CreatorSectionProps> = ({
  formState,
  handleFormChange,
  isFieldDirty,
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
        sx={getDirtyFieldSx(isFieldDirty("Creator"))}
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
