import { TextField } from "@mui/material";
import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";

const CreatorSection: React.FC = () => {
  const { formState, handleFieldChange, isFieldDirty } = useMetadata();
  if (!formState.Creator) return null;

  const { Creator: creatorField, Copyright: copyrightField } =
    formState.Creator;

  return (
    <FormSection title="Creator">
      <TextField
        label="Creator"
        variant="outlined"
        size="small"
        fullWidth
        value={getDisplayValue(creatorField)}
        placeholder={getPlaceholder(creatorField)}
        onChange={(e) =>
          handleFieldChange("Creator", "Creator", e.target.value)
        }
        sx={getDirtyFieldSx(isFieldDirty("Creator", "Creator"))}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  creatorField.status === "unique" &&
                  !creatorField.isConsolidated
                }
              />
            ),
          },
        }}
      />
      <TextField
        label="Copyright"
        variant="outlined"
        size="small"
        fullWidth
        value={getDisplayValue(copyrightField)}
        placeholder={getPlaceholder(copyrightField)}
        onChange={(e) =>
          handleFieldChange("Creator", "Copyright", e.target.value)
        }
        sx={{
          mt: 2,
          ...getDirtyFieldSx(isFieldDirty("Creator", "Copyright")),
        }}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  copyrightField.status === "unique" &&
                  !copyrightField.isConsolidated
                }
              />
            ),
          },
        }}
      />
    </FormSection>
  );
};

export default CreatorSection;
