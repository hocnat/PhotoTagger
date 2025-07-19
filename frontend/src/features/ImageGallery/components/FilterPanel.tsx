import React, { useState, useEffect } from "react";
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  ListSubheader,
} from "@mui/material";
import { FilterState } from "../hooks/useImageFiltering";
import SearchInput from "components/SearchInput";
import { AppIcons } from "config/AppIcons";
import { useSchemaContext } from "context/SchemaContext";
import { MetadataSchemaGroup } from "types";

interface FilterPanelProps {
  filterState: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filterState,
  onFilterChange,
}) => {
  const { schema } = useSchemaContext();
  const [groupedMetadataFields, setGroupedMetadataFields] = useState<
    MetadataSchemaGroup[]
  >([]);

  useEffect(() => {
    if (schema) {
      setGroupedMetadataFields(schema);
    }
  }, [schema]);

  const handleStatusChange = (
    event: React.MouseEvent<HTMLElement>,
    newStatus: string | null
  ) => {
    if (newStatus) {
      onFilterChange((prev) => ({
        ...prev,
        status: newStatus as FilterState["status"],
      }));
    }
  };

  const handleMissingFieldChange = (event: SelectChangeEvent<string>) => {
    onFilterChange((prev) => ({ ...prev, missingField: event.target.value }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange((prev) => ({ ...prev, searchTerm: event.target.value }));
  };

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        p: 2,
        alignItems: "center",
        borderBottom: 1,
        borderColor: "divider",
        flexWrap: "wrap",
      }}
    >
      <SearchInput
        placeholder="Search in filename or metadata..."
        value={filterState.searchTerm}
        onChange={handleSearchChange}
        sx={{ flex: "1 1 300px" }}
      />
      <ToggleButtonGroup
        value={filterState.status}
        exclusive
        onChange={handleStatusChange}
        aria-label="health status filter"
      >
        <ToggleButton value="all" aria-label="all images">
          All
        </ToggleButton>
        <Tooltip title="Filter by: Not Consolidated">
          <ToggleButton value="not-consolidated" aria-label="not consolidated">
            <AppIcons.CONSOLIDATION fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Filter by: Missing Required Fields">
          <ToggleButton
            value="missing-required"
            aria-label="missing required fields"
          >
            <AppIcons.REQUIRED_FIELDS fontSize="small" />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Filter by: Incorrect Filename">
          <ToggleButton
            value="incorrect-filename"
            aria-label="incorrect filename"
          >
            <AppIcons.FILENAME fontSize="small" />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
      <FormControl sx={{ m: 1, minWidth: 200 }} size="small">
        <InputLabel id="missing-field-select-label">
          Is Missing Field...
        </InputLabel>
        <Select
          labelId="missing-field-select-label"
          value={filterState.missingField}
          label="Is Missing Field..."
          onChange={handleMissingFieldChange}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {groupedMetadataFields.map((group) => {
            const items = [
              <ListSubheader key={group.groupName}>
                {group.groupName}
              </ListSubheader>,
              ...group.fields.map((field) => (
                <MenuItem key={field.key} value={field.key}>
                  {field.label}
                </MenuItem>
              )),
            ];
            return items;
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export default FilterPanel;
