import { TextField, Autocomplete, Stack } from "@mui/material";
import WarningIndicator from "./WarningIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";

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
  isConsolidated: boolean;
  isDirty: boolean;
}

const CountryInput: React.FC<CountryInputProps> = ({
  label,
  countryValue,
  onCountryChange,
  onCodeChange,
  isConsolidated,
  isDirty,
}) => {
  const handleAutocompleteChange = (
    event: any,
    newValue: Country | string | null
  ) => {
    if (!newValue) {
      onCountryChange("");
      onCodeChange("");
      return;
    }

    if (typeof newValue === "string") {
      const matchedCountry = countryData.find(
        (c: Country) => c.name.toLowerCase() === newValue.toLowerCase()
      );
      if (matchedCountry) {
        onCountryChange(matchedCountry.name);
        onCodeChange(matchedCountry.code);
      } else {
        onCountryChange(newValue);
        onCodeChange("");
      }
      return;
    }
    onCountryChange(newValue.name);
    onCodeChange(newValue.code);
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1 }}>
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
          <TextField
            {...params}
            label={label}
            variant="outlined"
            size="small"
            sx={getDirtyFieldSx(isDirty)}
          />
        )}
      />
      {!isConsolidated && <WarningIndicator />}
    </Stack>
  );
};

export default CountryInput;
