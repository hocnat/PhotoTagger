import { TextField, Autocomplete } from "@mui/material";

const countryData = require("country-list/data.json");

interface Country {
  code: string;
  name: string;
}

interface CountryInputProps {
  label: string;
  value: string;
  onChange: (countryName: string, countryCode: string) => void;
  sx?: object;
}

const CountryInput: React.FC<CountryInputProps> = ({
  label,
  value,
  onChange,
  sx,
}) => {
  const handleAutocompleteChange = (
    event: any,
    newValue: Country | string | null
  ) => {
    if (!newValue) {
      onChange("", ""); // On clear, send back empty strings
      return;
    }

    if (typeof newValue === "string") {
      const matchedCountry = countryData.find(
        (c: Country) => c.name.toLowerCase() === newValue.toLowerCase()
      );
      if (matchedCountry) {
        onChange(matchedCountry.name, matchedCountry.code);
      } else {
        onChange(newValue, ""); // User typed a new/unknown country
      }
      return;
    }

    // User selected a country object from the list
    onChange(newValue.name, newValue.code);
  };

  const autocompleteValue =
    countryData.find((c: Country) => c.name === value) || value || null;

  return (
    <Autocomplete
      value={autocompleteValue}
      onChange={handleAutocompleteChange}
      freeSolo
      getOptionLabel={(option) => {
        if (typeof option === "string") {
          return option;
        }
        if (option && option.name) {
          return option.name;
        }
        return "";
      }}
      options={countryData}
      sx={{ width: "100%", ...sx }}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" size="small" />
      )}
    />
  );
};

export default CountryInput;
