import { useMemo } from "react";
import { Autocomplete, Chip, TextField, Typography } from "@mui/material";
import { useSchemaContext } from "context/SchemaContext";

interface RequiredFieldsEditorProps {
  requiredFields: string[];
  onChange: (fields: string[]) => void;
}

export const RequiredFieldsEditor: React.FC<RequiredFieldsEditorProps> = ({
  requiredFields,
  onChange,
}) => {
  const { schema, isLoading } = useSchemaContext();

  const availableFields = useMemo(() => {
    if (!schema) return [];
    return schema.flatMap((group) =>
      group.fields.map((field) => ({
        key: field.key,
        label: field.label,
        group: group.groupName,
      }))
    );
  }, [schema]);

  const value = useMemo(
    () => availableFields.filter((field) => requiredFields.includes(field.key)),
    [availableFields, requiredFields]
  );

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
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.label}
        value={value}
        onChange={(event, newValue) => {
          onChange(newValue.map((v) => v.key));
        }}
        isOptionEqualToValue={(option, value) => option.key === value.key}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => (
            <Chip
              label={`${option.group} > ${option.label}`}
              {...getTagProps({ index })}
            />
          ))
        }
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
