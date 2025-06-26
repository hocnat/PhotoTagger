import React, { useState } from "react";
import iso from "iso-3166-1";
import countryData from "country-list/data.json";

interface CountryInputProps {
  label: string;
  countryValue: string;
  onCountryChange: (newCountry: string) => void;
  onCodeChange: (newCode: string) => void;
}

interface Country {
  code: string;
  name: string;
}

const CountryInput: React.FC<CountryInputProps> = ({
  label,
  countryValue,
  onCountryChange,
  onCodeChange,
}) => {
  const [suggestions, setSuggestions] = useState<Country[]>([]);

  const handleCountryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    onCountryChange(input);

    if (input.trim()) {
      const filtered = countryData
        .filter((country) =>
          country.name.toLowerCase().includes(input.toLowerCase())
        )
        .slice(0, 7);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (country: Country) => {
    const alpha2Code = country.code;
    const countryInfo = iso.whereAlpha2(alpha2Code);
    const alpha3Code = countryInfo ? countryInfo.alpha3 : "";

    onCountryChange(country.name);
    onCodeChange(alpha3Code);
    setSuggestions([]);
  };

  return (
    <div className="editable-field" style={{ position: "relative" }}>
      <label className="editable-field-label">{label}</label>
      <input
        type="text"
        value={countryValue}
        onChange={handleCountryInputChange}
        className="editable-field-input"
        placeholder="Enter country name..."
        onBlur={() => setTimeout(() => setSuggestions([]), 150)}
      />
      {suggestions.length > 0 && (
        <ul
          className="suggestions-list"
          style={{
            position: "absolute",
            width: "100%",
            top: "100%",
            zIndex: 11,
          }}
        >
          {suggestions.map((country) => (
            <li
              key={country.code}
              onMouseDown={() => selectSuggestion(country)}
            >
              {country.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CountryInput;
