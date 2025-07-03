import React from "react";

// MUI Imports
import { TextField, Autocomplete } from "@mui/material";

const countryData = require("country-list/data.json");

interface Country {
  code: string;
  name: string;
}

interface CountryInputProps {
  label: string;
  countryValue: string;
  onCountryChange: (newCountry: string) => void;
  onCodeChange: (newCode: string) => void;
}

const CountryInput: React.FC<CountryInputProps> = ({
  label,
  countryValue,
  onCountryChange,
  onCodeChange,
}) => {
  const handleAutocompleteChange = (
    event: any,
    newValue: Country | string | null
  ) => {
    // Case 1: The input was cleared.
    if (!newValue) {
      onCountryChange("");
      onCodeChange("");
      return;
    }

    // Case 2: User typed a custom string (freeSolo mode).
    if (typeof newValue === "string") {
      // Find if the typed string matches a known country name (case-insensitive).
      const matchedCountry = countryData.find(
        (c: Country) => c.name.toLowerCase() === newValue.toLowerCase()
      );
      if (matchedCountry) {
        // A match was found, update both name and code.
        onCountryChange(matchedCountry.name);
        onCodeChange(matchedCountry.code);
      } else {
        // No match found, update the name but clear the code.
        onCountryChange(newValue);
        onCodeChange("");
      }
      return;
    }

    // Case 3: User selected an item from the list (newValue is a Country object).
    onCountryChange(newValue.name);
    onCodeChange(newValue.code);
  };

  return (
    <Autocomplete
      value={countryValue}
      onChange={handleAutocompleteChange}
      freeSolo
      getOptionLabel={(option: string | Country) => {
        return typeof option === "string" ? option : option.name;
      }}
      options={countryData}
      sx={{ width: "100%" }}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" size="small" />
      )}
    />
  );
};

export default CountryInput;
