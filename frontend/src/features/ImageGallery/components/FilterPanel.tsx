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
import * as apiService from "api/apiService";
import SearchInput from "components/SearchInput";
import { AppIcons } from "config/AppIcons";

interface GroupedField {
  groupName: string;
  fields: string[];
}

const groupMetadataFields = (fields: string[]): GroupedField[] => {
  const groups: Record<string, string[]> = {
    Content: [],
    "Date & Time": [],
    Creator: [],
    "Location Created": [],
    "Location Shown": [],
    Other: [],
  };

  const fieldToGroupMap: { [key: string]: keyof typeof groups } = {
    Title: "Content",
    Keywords: "Content",
    DateTimeOriginal: "Date & Time",
    OffsetTimeOriginal: "Date & Time",
    Creator: "Creator",
    Copyright: "Creator",
  };

  fields.forEach((field) => {
    if (fieldToGroupMap[field]) {
      groups[fieldToGroupMap[field]].push(field);
    } else if (field.endsWith("Created")) {
      groups["Location Created"].push(field);
    } else if (field.endsWith("Shown")) {
      groups["Location Shown"].push(field);
    } else {
      groups.Other.push(field);
    }
  });

  return Object.entries(groups)
    .map(([groupName, fields]) => ({ groupName, fields }))
    .filter((group) => group.fields.length > 0);
};

interface FilterPanelProps {
  filterState: FilterState;
  onFilterChange: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filterState,
  onFilterChange,
}) => {
  const [groupedMetadataFields, setGroupedMetadataFields] = useState<
    GroupedField[]
  >([]);

  useEffect(() => {
    const fetchAndGroupFields = async () => {
      try {
        const flatFields = await apiService.getMetadataFields();
        const groupedFields = groupMetadataFields(flatFields);
        setGroupedMetadataFields(groupedFields);
      } catch (error) {
        console.error("Failed to fetch or group metadata fields:", error);
      }
    };
    fetchAndGroupFields();
  }, []);

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
        size="small"
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
                <MenuItem key={field} value={field}>
                  {field}
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
