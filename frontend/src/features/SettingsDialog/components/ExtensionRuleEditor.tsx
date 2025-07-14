import { useState, useRef, useEffect } from "react";
import { ExtensionRule } from "types";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  List,
  ListItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";

interface ExtensionRuleEditorProps {
  rules: ExtensionRule[];
  onChange: (newRules: ExtensionRule[]) => void;
}

export const ExtensionRuleEditor: React.FC<ExtensionRuleEditorProps> = ({
  rules,
  onChange,
}) => {
  const [justAdded, setJustAdded] = useState(false);
  const lastInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If a new row was just added, focus the corresponding input field.
    if (justAdded && lastInputRef.current) {
      lastInputRef.current.focus();
      setJustAdded(false); // Reset the flag
    }
  }, [justAdded]);

  const handleAddRule = () => {
    if (rules.some((r) => r.extension.trim() === "")) {
      return;
    }
    onChange([...rules, { extension: "", casing: "lowercase" }]);
    setJustAdded(true); // Set the flag to trigger the focus effect
  };

  const handleRuleChange = (
    index: number,
    field: keyof ExtensionRule,
    value: string
  ) => {
    const newRules = [...rules];
    if (field === "extension" && value && !value.startsWith(".")) {
      value = "." + value.toLowerCase();
    }
    newRules[index] = { ...newRules[index], [field]: value };
    onChange(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onChange(newRules);
  };

  const sortedRules = [...rules].sort((a, b) => {
    const isANew = a.extension.trim() === "";
    const isBNew = b.extension.trim() === "";
    if (isANew) return 1;
    if (isBNew) return -1;
    return a.extension.localeCompare(b.extension);
  });

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Extension Casing Rules
      </Typography>
      <List dense>
        {sortedRules.map((rule, index) => {
          const originalIndex = rules.findIndex(
            (r) => r.extension === rule.extension
          );
          const isNewRow = rule.extension.trim() === "";
          return (
            <ListItem
              key={originalIndex}
              sx={{ display: "flex", gap: 2, p: 0, mb: 1 }}
            >
              <TextField
                label="Extension"
                size="small"
                value={rule.extension}
                onChange={(e) =>
                  handleRuleChange(originalIndex, "extension", e.target.value)
                }
                placeholder=".jpg"
                error={!rule.extension.trim()}
                inputRef={isNewRow ? lastInputRef : null}
              />
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Casing</InputLabel>
                <Select
                  value={rule.casing}
                  label="Casing"
                  onChange={(e) =>
                    handleRuleChange(originalIndex, "casing", e.target.value)
                  }
                >
                  <MenuItem value="lowercase">lowercase</MenuItem>
                  <MenuItem value="uppercase">uppercase</MenuItem>
                </Select>
              </FormControl>
              <IconButton
                onClick={() => handleRemoveRule(originalIndex)}
                color="error"
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            </ListItem>
          );
        })}
      </List>
      <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddRule}>
        Add Rule
      </Button>
    </Box>
  );
};
