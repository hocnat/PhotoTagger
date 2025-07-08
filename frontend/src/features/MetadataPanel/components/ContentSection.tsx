import { SectionProps, Keyword, FormState } from "types";
import { TextField, Autocomplete, Chip, Box, Stack } from "@mui/material";

import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import WarningIndicator from "./WarningIndicator";
import { getFieldData } from "../utils/metadataUtils";
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
  const titleData = getFieldData(formState.Title, "");
  const keywordsData = getFieldData(formState.Keywords, []);

  const areKeywordsDirty = isFieldDirty("Keywords");

  return (
    <FormSection title="Content">
      <TextField
        label="Title"
        variant="outlined"
        size="small"
        fullWidth
        value={formState.Title === "(Mixed Values)" ? "" : titleData.value}
        placeholder={
          formState.Title === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Title", e.target.value)}
        sx={getDirtyFieldSx(isFieldDirty("Title"))}
        slotProps={{
          input: {
            endAdornment: (
              <ConsolidationAdornment show={!titleData.isConsolidated} />
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
                !keywordsData.value.some((kw) => kw.name === newKeyword.name)
              ) {
                handleFormChange("Keywords", [
                  ...keywordsData.value,
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
        {!keywordsData.isConsolidated && <WarningIndicator />}
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
        {Array.isArray(keywordsData.value) &&
          keywordsData.value.map((keyword) => (
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
                const updatedKeywords = keywordsData.value.filter(
                  (kw) => kw.name !== keyword.name
                );
                handleFormChange("Keywords", updatedKeywords);
              }}
            />
          ))}
      </Box>
    </FormSection>
  );
};

export default ContentSection;
