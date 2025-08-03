import { TextField, Autocomplete } from "@mui/material";
import { useSettings } from "features/SettingsManager/hooks/useSettings";
import { CountryMapping } from "types";

interface CountryInputProps {
  label: string;
  value: string;
  onChange: (countryName: string, countryCode: string) => void;
  sx?: object;
  disabled?: boolean;
}

const CountryInput: React.FC<CountryInputProps> = ({
  label,
  value,
  onChange,
  sx,
  disabled,
}) => {
  const { settings } = useSettings();
  const countryMappings = settings?.countryMappings || [];

  const handleAutocompleteChange = (
    event: any,
    newValue: CountryMapping | string | null
  ) => {
    if (!newValue) {
      onChange("", ""); // On clear, send back empty strings
      return;
    }

    if (typeof newValue === "string") {
      const matchedCountry = countryMappings.find(
        (c) => c.name.toLowerCase() === newValue.toLowerCase()
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
    countryMappings.find((c) => c.name === value) || value || null;

  return (
    <Autocomplete
      key={value}
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
      options={countryMappings}
      sx={{ width: "100%", ...sx }}
      disabled={disabled}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
};

export default CountryInput;
