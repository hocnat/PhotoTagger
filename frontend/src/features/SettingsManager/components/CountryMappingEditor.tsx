import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
} from "@mui/material";
import { CountryMapping } from "types";
import { AppIcons } from "config/AppIcons";

interface CountryMappingEditorProps {
  mappings: CountryMapping[];
  onChange: (newMappings: CountryMapping[]) => void;
}

export const CountryMappingEditor: React.FC<CountryMappingEditorProps> = ({
  mappings,
  onChange,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (justAdded && lastInputRef.current) {
      lastInputRef.current.focus();
      setJustAdded(false);
    }
  }, [justAdded]);

  const handleAddMapping = () => {
    if (mappings.some((m) => m.code === "" && m.name === "")) {
      return;
    }
    onChange([...mappings, { code: "", name: "" }]);
    setJustAdded(true);
  };

  const handleMappingChange = (
    index: number,
    field: keyof CountryMapping,
    value: string
  ) => {
    const newMappings = [...mappings];
    const newMapping = { ...newMappings[index] };
    if (field === "code") {
      value = value.toUpperCase();
    }
    newMapping[field] = value;
    newMappings[index] = newMapping;
    onChange(newMappings);
  };

  const handleDeleteMapping = (index: number) => {
    const newMappings = mappings.filter((_, i) => i !== index);
    onChange(newMappings);
  };

  const sortedMappings = [...mappings].sort((a, b) => {
    const isANew = a.name.trim() === "" && a.code.trim() === "";
    const isBNew = b.name.trim() === "" && b.code.trim() === "";
    if (isANew) return 1;
    if (isBNew) return -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Country Mappings
      </Typography>
      <List dense sx={{ mb: 1 }}>
        {sortedMappings.map((mapping, index) => {
          const originalIndex = mappings.findIndex(
            (m) => m.code === mapping.code && m.name === mapping.name
          );
          const isNewRow = mapping.code === "" && mapping.name === "";
          return (
            <ListItem
              key={originalIndex}
              sx={{ display: "flex", gap: 2, p: 0, mb: 1 }}
            >
              <TextField
                label="Country Name"
                fullWidth
                value={mapping.name}
                onChange={(e) =>
                  handleMappingChange(originalIndex, "name", e.target.value)
                }
                error={!mapping.name.trim()}
                sx={{ maxWidth: 400 }}
                inputRef={isNewRow ? lastInputRef : null}
              />
              <TextField
                label="Code"
                value={mapping.code}
                onChange={(e) =>
                  handleMappingChange(originalIndex, "code", e.target.value)
                }
                sx={{ width: 150 }}
                slotProps={{ htmlInput: { maxLength: 2 } }}
                error={mapping.code.trim().length !== 2}
              />
              <IconButton onClick={() => handleDeleteMapping(originalIndex)}>
                <AppIcons.DELETE />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
      <Button
        startIcon={<AppIcons.ADD />}
        onClick={handleAddMapping}
        variant="outlined"
      >
        Add Mapping
      </Button>
    </Box>
  );
};
