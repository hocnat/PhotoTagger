import React from "react";
import { ExtensionRule } from "../../types";
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
  const handleAddRule = () => {
    onChange([...rules, { extension: "", casing: "lowercase" }]);
  };

  const handleRuleChange = (
    index: number,
    field: keyof ExtensionRule,
    value: string
  ) => {
    const newRules = [...rules];
    if (field === "extension" && value && !value.startsWith(".")) {
      value = "." + value;
    }
    newRules[index] = { ...newRules[index], [field]: value };
    onChange(newRules);
  };

  const handleRemoveRule = (index: number) => {
    const newRules = rules.filter((_, i) => i !== index);
    onChange(newRules);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Extension Casing Rules
      </Typography>
      <List dense>
        {rules.map((rule, index) => (
          <ListItem key={index} sx={{ display: "flex", gap: 2, p: 0, mb: 1 }}>
            <TextField
              label="Extension"
              size="small"
              value={rule.extension}
              onChange={(e) =>
                handleRuleChange(index, "extension", e.target.value)
              }
              placeholder=".jpg"
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Casing</InputLabel>
              <Select
                value={rule.casing}
                label="Casing"
                onChange={(e) =>
                  handleRuleChange(index, "casing", e.target.value)
                }
              >
                <MenuItem value="lowercase">lowercase</MenuItem>
                <MenuItem value="uppercase">uppercase</MenuItem>
              </Select>
            </FormControl>
            <IconButton onClick={() => handleRemoveRule(index)} color="error">
              <RemoveCircleOutlineIcon />
            </IconButton>
          </ListItem>
        ))}
      </List>
      <Button startIcon={<AddCircleOutlineIcon />} onClick={handleAddRule}>
        Add Rule
      </Button>
    </Box>
  );
};
