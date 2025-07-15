import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Chip,
  Autocomplete,
  Typography,
  Paper,
} from "@mui/material";
import { Keyword } from "types";

interface KeywordFormProps {
  initialKeyword: Keyword | null;
  keywords: Keyword[];
  onSave: (
    name: string,
    synonyms: string[],
    parent: Keyword | string | null
  ) => void;
  onCancel: () => void;
}

const KeywordForm: React.FC<KeywordFormProps> = ({
  initialKeyword,
  keywords,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [parent, setParent] = useState<Keyword | string | null>(null);

  useEffect(() => {
    if (initialKeyword) {
      setName(initialKeyword.name);
      setSynonyms(initialKeyword.data.synonyms || []);
      if (initialKeyword.data.parent) {
        const parentObject = keywords.find(
          (k) => k.id === initialKeyword.data.parent
        );
        setParent(parentObject || null);
      } else {
        setParent(null);
      }
    } else {
      setName("");
      setSynonyms([]);
      setParent(null);
    }
  }, [initialKeyword, keywords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), synonyms, parent);
  };

  const getPossibleParents = () => {
    if (!initialKeyword) return keywords;
    const descendantIds = new Set<string>();
    const findDescendants = (parentId: string) => {
      keywords.forEach((kw) => {
        if (kw.data.parent === parentId) {
          descendantIds.add(kw.id);
          findDescendants(kw.id);
        }
      });
    };
    findDescendants(initialKeyword.id);
    return keywords.filter(
      (kw) => kw.id !== initialKeyword.id && !descendantIds.has(kw.id)
    );
  };

  const possibleParents = getPossibleParents();

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        {initialKeyword ? "Edit Keyword" : "Add New Keyword"}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Primary Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          margin="normal"
          variant="outlined"
          autoFocus={!initialKeyword}
        />

        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={synonyms}
          onChange={(event, newValue) => {
            setSynonyms(newValue as string[]);
          }}
          renderTags={(value: readonly string[], getTagProps) =>
            value.map((option: string, index: number) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Synonyms"
              placeholder="Type and press Enter to add synonyms"
              margin="normal"
            />
          )}
        />

        <Autocomplete
          freeSolo
          options={possibleParents}
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.name
          }
          isOptionEqualToValue={(option, value) => {
            if (typeof value === "string") return false;
            return option.id === value.id;
          }}
          value={parent}
          onChange={(event, newValue) => {
            setParent(newValue);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Parent"
              variant="outlined"
              margin="normal"
              placeholder="Type or select a parent keyword"
            />
          )}
        />

        <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} sx={{ mr: 2 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={!name.trim()}>
            Save
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default KeywordForm;
