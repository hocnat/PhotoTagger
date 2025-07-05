import React from "react";
import { SectionProps, Keyword } from "../../types";
import FormSection from "./FormSection";
import ConsolidatedTextField from "./ConsolidatedTextField";
import { getFieldData } from "../../utils/metadataUtils";
import { Autocomplete, Chip, Box, TextField, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
  const titleData = getFieldData(formState.Title, "");
  const keywordsData = getFieldData(formState.Keywords, []);

  const keywordsLabel = (
    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
      Keywords
      {!keywordsData.isConsolidated && (
        <Tooltip title="This value is not fully consolidated. Saving will fix this.">
          <InfoOutlinedIcon
            color="warning"
            sx={{ ml: 0.5, fontSize: "1rem" }}
          />
        </Tooltip>
      )}
    </Box>
  );

  return (
    <FormSection title="Content">
      <ConsolidatedTextField
        baseLabel="Title"
        isConsolidated={titleData.isConsolidated}
        variant="outlined"
        size="small"
        fullWidth
        value={formState.Title === "(Mixed Values)" ? "" : titleData.value}
        placeholder={
          formState.Title === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("Title", e.target.value)}
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
            if (!keywordsData.value.some((kw) => kw.name === newKeyword.name)) {
              handleFormChange("Keywords", [...keywordsData.value, newKeyword]);
            }
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            size="small"
            label={keywordsLabel}
            placeholder="Add keyword and press Enter..."
          />
        )}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>
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
