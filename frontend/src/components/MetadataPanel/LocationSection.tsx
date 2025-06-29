import React, { useState } from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import CountryInput from "../CountryInput";
import MapModal from "../MapModal";
import { Box, Button, TextField } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";

interface LocationSectionProps extends SectionProps {
  onLocationSet: (latlng: { lat: number; lng: number }) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  formState,
  handleFormChange,
  onLocationSet,
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <FormSection title="Where">
      <Box sx={{ display: "flex", gap: 2 }}>
        <TextField
          fullWidth
          label="GPS Latitude"
          variant="outlined"
          size="small"
          value={
            typeof formState.DecimalLatitude === "number"
              ? formState.DecimalLatitude
              : ""
          }
          placeholder={
            formState.DecimalLatitude === "(Mixed Values)"
              ? "(Mixed Values)"
              : ""
          }
          onChange={(e) => handleFormChange("DecimalLatitude", e.target.value)}
        />
        <TextField
          fullWidth
          label="GPS Longitude"
          variant="outlined"
          size="small"
          value={
            typeof formState.DecimalLongitude === "number"
              ? formState.DecimalLongitude
              : ""
          }
          placeholder={
            formState.DecimalLongitude === "(Mixed Values)"
              ? "(Mixed Values)"
              : ""
          }
          onChange={(e) => handleFormChange("DecimalLongitude", e.target.value)}
        />
      </Box>
      <Button
        variant="outlined"
        startIcon={<MapIcon />}
        onClick={() => setIsMapOpen(true)}
        fullWidth
        sx={{ mt: 1 }}
      >
        Select on Map
      </Button>
      <TextField
        fullWidth
        label="Sublocation"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:Location"] === "string" &&
          formState["XMP:Location"] !== "(Mixed Values)"
            ? formState["XMP:Location"]
            : ""
        }
        placeholder={
          formState["XMP:Location"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:Location", e.target.value)}
      />
      <TextField
        fullWidth
        label="City"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:City"] === "string" &&
          formState["XMP:City"] !== "(Mixed Values)"
            ? formState["XMP:City"]
            : ""
        }
        placeholder={
          formState["XMP:City"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:City", e.target.value)}
      />
      <TextField
        fullWidth
        label="State/Province"
        variant="outlined"
        size="small"
        value={
          typeof formState["XMP:State"] === "string" &&
          formState["XMP:State"] !== "(Mixed Values)"
            ? formState["XMP:State"]
            : ""
        }
        placeholder={
          formState["XMP:State"] === "(Mixed Values)" ? "(Mixed Values)" : ""
        }
        onChange={(e) => handleFormChange("XMP:State", e.target.value)}
      />
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        <CountryInput
          label="Country"
          countryValue={
            typeof formState["XMP:Country"] === "string" &&
            formState["XMP:Country"] !== "(Mixed Values)"
              ? formState["XMP:Country"]
              : ""
          }
          onCountryChange={(val) => handleFormChange("XMP:Country", val)}
          onCodeChange={(val) => handleFormChange("XMP:CountryCode", val)}
        />
        <TextField
          label="Code"
          variant="outlined"
          size="small"
          value={
            typeof formState["XMP:CountryCode"] === "string" &&
            formState["XMP:CountryCode"] !== "(Mixed Values)"
              ? formState["XMP:CountryCode"]
              : ""
          }
          placeholder={
            formState["XMP:CountryCode"] === "(Mixed Values)" ? "(Mixed)" : ""
          }
          onChange={(e) => handleFormChange("XMP:CountryCode", e.target.value)}
          sx={{ width: 100, flexShrink: 0 }}
        />
      </Box>

      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onLocationSet={onLocationSet}
        initialCoords={
          typeof formState.DecimalLatitude === "number" &&
          typeof formState.DecimalLongitude === "number"
            ? {
                lat: formState.DecimalLatitude,
                lng: formState.DecimalLongitude,
              }
            : null
        }
      />
    </FormSection>
  );
};

export default LocationSection;
