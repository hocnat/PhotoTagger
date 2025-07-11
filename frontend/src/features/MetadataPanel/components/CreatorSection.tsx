import { TextField } from "@mui/material";

import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";

const CreatorSection: React.FC = () => {
  const { formState, handleFormChange, isFieldDirty } = useMetadata();
  const field = formState.Creator;

  return (
    <FormSection title="Creator">
      <TextField
        label="Creator"
        variant="outlined"
        size="small"
        fullWidth
        value={getDisplayValue(field)}
        placeholder={getPlaceholder(field)}
        onChange={(e) => handleFormChange("Creator", e.target.value)}
        sx={getDirtyFieldSx(isFieldDirty("Creator"))}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={field?.status === "unique" && !field.isConsolidated}
              />
            ),
          },
        }}
      />
    </FormSection>
  );
};

export default CreatorSection;
