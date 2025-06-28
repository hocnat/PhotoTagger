import React from "react";
import iso from "iso-3166-1";

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
    if (typeof newValue === "string") {
      onCountryChange(newValue);
    } else if (newValue) {
      const alpha2Code = newValue.code;
      const countryInfo = iso.whereAlpha2(alpha2Code);
      const alpha3Code = countryInfo ? countryInfo.alpha3 : "";

      onCountryChange(newValue.name);
      onCodeChange(alpha3Code);
    } else {
      onCountryChange("");
      onCodeChange("");
    }
  };

  const selectedCountryObject =
    countryData.find((c: Country) => c.name === countryValue) || null;

  return (
    <Autocomplete
      value={selectedCountryObject}
      onChange={handleAutocompleteChange}
      freeSolo
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.name
      }
      options={countryData}
      sx={{ width: "100%" }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          variant="outlined"
          size="small"
          onChange={(e) => onCountryChange(e.target.value)}
        />
      )}
    />
  );
};

export default CountryInput;
