import { ChipData } from "types";
import { TextField, Autocomplete, Chip, Box, Stack } from "@mui/material";

import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import WarningIndicator from "./WarningIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";

const ContentSection: React.FC = () => {
  const {
    formState,
    handleFieldChange,
    keywordSuggestions,
    handleKeywordInputChange,
    isFieldDirty,
  } = useMetadata();

  if (!formState.Content) return null;

  const { Title: titleField, Keywords: keywordsField } = formState.Content;
  const areKeywordsDirty = isFieldDirty("Content", "Keywords");

  return (
    <FormSection title="Content">
      <TextField
        label="Title"
        variant="outlined"
        size="small"
        fullWidth
        value={getDisplayValue(titleField)}
        placeholder={getPlaceholder(titleField)}
        onChange={(e) => handleFieldChange("Content", "Title", e.target.value)}
        sx={getDirtyFieldSx(isFieldDirty("Content", "Title"))}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  titleField.status === "unique" && !titleField.isConsolidated
                }
              />
            ),
          },
        }}
      />
      <Stack direction="row" spacing={1} alignItems="center">
        <Autocomplete
          sx={{ flexGrow: 1 }}
          freeSolo
          options={keywordSuggestions}
          filterOptions={(x) => x}
          value={null}
          onInputChange={handleKeywordInputChange}
          onChange={(event, newValue) => {
            if (typeof newValue === "string" && newValue.trim() !== "") {
              const newKeyword: ChipData = {
                name: newValue.trim(),
                status: "common",
              };
              if (
                keywordsField.status === "unique" &&
                !keywordsField.value.some((kw) => kw.name === newKeyword.name)
              ) {
                handleFieldChange("Content", "Keywords", [
                  ...keywordsField.value,
                  newKeyword,
                ]);
              }
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              label="Keywords"
              placeholder="Add keyword..."
            />
          )}
        />
        {keywordsField.status === "unique" && !keywordsField.isConsolidated && (
          <WarningIndicator />
        )}
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          mt: 1,
          p: areKeywordsDirty ? 0.5 : 0,
          ...getDirtyFieldSx(areKeywordsDirty),
        }}
      >
        {keywordsField.status === "unique" &&
          keywordsField.value.map((keyword) => (
            <Chip
              key={keyword.name}
              label={keyword.name}
              size="small"
              variant={keyword.status === "common" ? "filled" : "outlined"}
              sx={
                keyword.status === "partial"
                  ? { fontStyle: "italic", opacity: 0.8 }
                  : {}
              }
              onDelete={() => {
                if (keywordsField.status === "unique") {
                  const updatedKeywords = keywordsField.value.filter(
                    (kw) => kw.name !== keyword.name
                  );
                  handleFieldChange("Content", "Keywords", updatedKeywords);
                }
              }}
            />
          ))}
      </Box>
    </FormSection>
  );
};

export default ContentSection;
