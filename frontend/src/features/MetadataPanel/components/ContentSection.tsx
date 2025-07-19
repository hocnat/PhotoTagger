import { ChipData, KeywordSuggestion } from "types";
import {
  TextField,
  Autocomplete,
  Chip,
  Box,
  Stack,
  Typography,
  Divider,
} from "@mui/material";
import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import ConsolidationIndicator from "./ConsolidationIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getDisplayValue, getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";
import { useSchemaContext } from "context/SchemaContext";

const ContentSection: React.FC = () => {
  const {
    formState,
    handleFieldChange,
    keywordSuggestions,
    handleKeywordInputChange,
    isFieldDirty,
  } = useMetadata();
  const { schema } = useSchemaContext();

  if (!formState.Content || !schema) return null;

  const { Title: titleField, Keywords: keywordsField } = formState.Content;
  const areKeywordsDirty = isFieldDirty("Content", "Keywords");

  const addKeywordsToState = (keywordsToAdd: string[]) => {
    if (keywordsField.status !== "unique") return;
    const existingKeywordNames = new Set(
      keywordsField.value.map((kw) => kw.name)
    );
    const newKeywords: ChipData[] = keywordsToAdd
      .filter((name) => !existingKeywordNames.has(name))
      .map((name) => ({ name, status: "common" }));
    if (newKeywords.length > 0) {
      handleFieldChange("Content", "Keywords", [
        ...keywordsField.value,
        ...newKeywords,
      ]);
    }
  };

  return (
    <FormSection
      title={schema.find((g) => g.groupName === "Content")?.groupName || ""}
    >
      <TextField
        label={
          schema.flatMap((g) => g.fields).find((f) => f.key === "Title")?.label
        }
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
          getOptionLabel={(option) => {
            if (typeof option === "string") return option;
            return option.matchedTerm;
          }}
          value={null}
          onInputChange={handleKeywordInputChange}
          onChange={(event, newValue) => {
            if (!newValue) return;
            if (typeof newValue === "object" && "allTermsToAdd" in newValue) {
              addKeywordsToState(newValue.allTermsToAdd);
            } else if (typeof newValue === "string" && newValue.trim() !== "") {
              addKeywordsToState([newValue.trim()]);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                schema
                  .flatMap((g) => g.fields)
                  .find((f) => f.key === "Keywords")?.label
              }
              placeholder="Add keyword..."
            />
          )}
          renderOption={(props, option: KeywordSuggestion) => {
            // Separate the matched term from the other terms that will be added.
            const otherTerms = option.allTermsToAdd.filter(
              (term) => term !== option.matchedTerm
            );
            return (
              <Box
                component="li"
                {...props}
                sx={{ display: "flex", alignItems: "center", py: 1.5, gap: 2 }}
              >
                {/* Left Side: The term that matched the search query. */}
                <Box sx={{ minWidth: 150, flexShrink: 0 }}>
                  <Typography variant="body1">{option.matchedTerm}</Typography>
                </Box>

                {/* Right Side: All other related terms that will be added. */}
                {otherTerms.length > 0 && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {otherTerms.map((term) => (
                        <Chip key={term} label={term} />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            );
          }}
        />
        {keywordsField.status === "unique" && !keywordsField.isConsolidated && (
          <ConsolidationIndicator />
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
