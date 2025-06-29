import React from "react";
import { SectionProps, Keyword } from "../../types";
import FormSection from "./FormSection";
import { TextField, Autocomplete, Chip, Box } from "@mui/material";

interface ContentSectionProps extends SectionProps {
  keywordSuggestions: string[];
  onKeywordInputChange: (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => void;
}

const ContentSection: React.FC<ContentSectionProps> = ({
  formState,
  handleFormChange,
  keywordSuggestions,
  onKeywordInputChange,
}) => {
  return (
    <FormSection title="Content">
      <TextField
        label="Caption / Description"
        variant="outlined"
        size="small"
        fullWidth
        value={
          typeof formState.Caption === "string" &&
          formState.Caption !== "(Mixed Values)"
            ? formState.Caption
            : ""
        }
        placeholder={
          formState.Caption === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Caption", e.target.value)}
      />
      <Autocomplete
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
            const currentKeywords = Array.isArray(formState.Keywords)
              ? formState.Keywords
              : [];
            if (!currentKeywords.some((kw) => kw.name === newKeyword.name)) {
              handleFormChange("Keywords", [...currentKeywords, newKeyword]);
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            label="Add Keyword"
            placeholder="Type and press Enter..."
          />
        )}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
        {Array.isArray(formState.Keywords) &&
          formState.Keywords.map((keyword) => (
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
                const updatedKeywords = (formState.Keywords || []).filter(
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
