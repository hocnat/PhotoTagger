import { useState, useEffect } from "react";
import { Autocomplete, TextField, Typography } from "@mui/material";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";

interface RequiredFieldsEditorProps {
  requiredFields: string[];
  onChange: (fields: string[]) => void;
}

export const RequiredFieldsEditor: React.FC<RequiredFieldsEditorProps> = ({
  requiredFields,
  onChange,
}) => {
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    apiService
      .getMetadataFields()
      .then((data) => {
        setAvailableFields(data);
      })
      .catch((err) => {
        console.error("Failed to fetch metadata fields:", err);
        showNotification("Failed to load available metadata fields.", "error");
        setAvailableFields([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [showNotification]);

  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Required Fields
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select which metadata fields should be considered mandatory. The health
        check will flag images that are missing any of these fields.
      </Typography>
      <Autocomplete
        multiple
        loading={isLoading}
        options={availableFields}
        value={requiredFields}
        onChange={(event, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Required Fields"
            placeholder={isLoading ? "Loading fields..." : "Select fields"}
          />
        )}
      />
    </>
  );
};
