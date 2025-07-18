import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Chip,
  Autocomplete,
  Typography,
  Paper,
  Stack,
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
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Primary Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
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
                label="Synonyms"
                placeholder="Type and press Enter to add synonyms"
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
                placeholder="Type or select a parent keyword"
              />
            )}
          />

          <Stack
            direction="row"
            spacing={2}
            justifyContent="flex-end"
            sx={{ mt: 1 }}
          >
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!name.trim()}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Paper>
  );
};

export default KeywordForm;
