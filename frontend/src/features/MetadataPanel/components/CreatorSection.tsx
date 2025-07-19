import { Stack, TextField } from "@mui/material";
import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";
import { useSchemaContext } from "context/SchemaContext";

const CreatorSection: React.FC = () => {
  const { formState, handleFieldChange, isFieldDirty } = useMetadata();
  const { schema } = useSchemaContext();

  if (!formState.Creator || !schema) return null;

  const { Creator: creatorField, Copyright: copyrightField } =
    formState.Creator;

  return (
    <FormSection
      title={schema.find((g) => g.groupName === "Creator")?.groupName || ""}
    >
      <Stack spacing={2}>
        <TextField
          label={
            schema.flatMap((g) => g.fields).find((f) => f.key === "Creator")
              ?.label
          }
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
          label={
            schema.flatMap((g) => g.fields).find((f) => f.key === "Copyright")
              ?.label
          }
          fullWidth
          value={getDisplayValue(copyrightField)}
          placeholder={getPlaceholder(copyrightField)}
          onChange={(e) =>
            handleFieldChange("Creator", "Copyright", e.target.value)
          }
          sx={getDirtyFieldSx(isFieldDirty("Creator", "Copyright"))}
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
      </Stack>
    </FormSection>
  );
};

export default CreatorSection;
