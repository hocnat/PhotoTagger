import { Stack, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import FormSection from "./FormSection";
import ConsolidationAdornment from "./ConsolidationAdornment";
import ConsolidationIndicator from "./ConsolidationIndicator";
import { getDirtyFieldSx } from "../utils/styleUtils";
import { getPlaceholder } from "../utils/metadataUtils";
import { useMetadata } from "../context/MetadataEditorContext";
import { useSchemaContext } from "context/SchemaContext";

const DateTimeSection: React.FC = () => {
  const { formState, handleFieldChange, getDateTimeObject, isFieldDirty } =
    useMetadata();
  const { schema } = useSchemaContext();

  if (!formState.DateTime || !schema) return null;

  const { DateTimeOriginal: dateField, OffsetTimeOriginal: offsetField } =
    formState.DateTime;

  return (
    <FormSection
      title={schema.find((g) => g.groupName === "Date & Time")?.groupName || ""}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <DateTimePicker
            label={
              schema
                .flatMap((g) => g.fields)
                .find((f) => f.key === "DateTimeOriginal")?.label
            }
            value={getDateTimeObject()}
            onChange={(date) => {
              const newDateStr = date
                ? `${date.getFullYear()}:${(date.getMonth() + 1)
                    .toString()
                    .padStart(2, "0")}:${date
                    .getDate()
                    .toString()
                    .padStart(2, "0")} ${date
                    .getHours()
                    .toString()
                    .padStart(2, "0")}:${date
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}:${date
                    .getSeconds()
                    .toString()
                    .padStart(2, "0")}`
                : "";
              handleFieldChange("DateTime", "DateTimeOriginal", newDateStr);
            }}
            ampm={false}
            format="yyyy-MM-dd HH:mm:ss"
            views={["year", "month", "day", "hours", "minutes", "seconds"]}
            timeSteps={{ minutes: 1, seconds: 1 }}
            sx={{
              flexGrow: 1,
              ...getDirtyFieldSx(isFieldDirty("DateTime", "DateTimeOriginal")),
            }}
            slotProps={{
              textField: {
                placeholder: getPlaceholder(dateField),
              },
            }}
          />
          {dateField.status === "unique" && !dateField.isConsolidated && (
            <ConsolidationIndicator />
          )}
        </Stack>
        <TextField
          label={
            schema
              .flatMap((g) => g.fields)
              .find((f) => f.key === "OffsetTimeOriginal")?.label
          }
          fullWidth
          value={offsetField.status === "unique" ? offsetField.value || "" : ""}
          placeholder={getPlaceholder(offsetField) || "+01:00"}
          onChange={(e) =>
            handleFieldChange("DateTime", "OffsetTimeOriginal", e.target.value)
          }
          sx={getDirtyFieldSx(isFieldDirty("DateTime", "OffsetTimeOriginal"))}
          slotProps={{
            input: {
              endAdornment: (
                <ConsolidationAdornment
                  show={
                    offsetField.status === "unique" &&
                    !offsetField.isConsolidated
                  }
                />
              ),
            },
          }}
        />
      </Stack>
    </FormSection>
  );
};

export default DateTimeSection;
