import { SectionProps, Keyword, FormState } from "types";
import { TextField, Autocomplete, Chip, Box, Stack } from "@mui/material";

import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import WarningIndicator from "./WarningIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";

interface ContentSectionProps extends SectionProps {
  keywordSuggestions: string[];
  onKeywordInputChange: (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => void;
  isFieldDirty: (fieldName: keyof FormState) => boolean;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  formState,
  handleFormChange,
  keywordSuggestions,
  onKeywordInputChange,
  isFieldDirty,
}) => {
  const titleField = formState.Title;
  const keywordsField = formState.Keywords;

  return (
    <FormSection title="Content">
      <TextField
        label="Title"
        variant="outlined"
        size="small"
        fullWidth
        value={titleField?.status === "unique" ? titleField.value : ""}
        placeholder={titleField?.status === "mixed" ? "(Mixed Values)" : ""}
        onChange={(e) => handleFormChange("Title", e.target.value)}
        sx={getDirtyFieldSx(isFieldDirty("Title"))}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment
                show={
                  titleField?.status === "unique" && !titleField.isConsolidated
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
          onInputChange={onKeywordInputChange}
          onChange={(event, newValue) => {
            if (typeof newValue === "string" && newValue.trim() !== "") {
              const newKeyword: Keyword = {
                name: newValue.trim(),
                status: "common",
              };
              if (
                keywordsField?.status === "unique" &&
                !keywordsField.value.some((kw) => kw.name === newKeyword.name)
              ) {
                handleFormChange("Keywords", [
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
        {keywordsField?.status === "unique" &&
          !keywordsField.isConsolidated && <WarningIndicator />}
      </Stack>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          mt: 1,
          p: isFieldDirty("Keywords") ? 0.5 : 0,
          ...getDirtyFieldSx(isFieldDirty("Keywords")),
        }}
      >
        {keywordsField?.status === "unique" &&
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
                if (keywordsField?.status === "unique") {
                  const updatedKeywords = keywordsField.value.filter(
                    (kw) => kw.name !== keyword.name
                  );
                  handleFormChange("Keywords", updatedKeywords);
                }
              }}
            />
          ))}
      </Box>
    </FormSection>
  );
};

export default ContentSection;
