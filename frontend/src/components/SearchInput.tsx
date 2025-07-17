import React from "react";
import { TextField, InputAdornment, TextFieldProps } from "@mui/material";
import { AppIcons } from "config/AppIcons";

/**
 * A reusable search input component that standardizes the look and feel of
 * search text fields across the application. It automatically includes a
 * search icon as a start adornment and defaults to the 'small' size.
 */
const SearchInput: React.FC<TextFieldProps> = (props) => {
  return (
    <TextField
      {...props}
      size={props.size || "small"}
      variant={props.variant || "outlined"}
      slotProps={{
        ...props.slotProps,
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <AppIcons.SEARCH />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default SearchInput;
