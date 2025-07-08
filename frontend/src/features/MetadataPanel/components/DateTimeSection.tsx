import { Stack, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import FormSection from "./FormSection";
import { getFieldData } from "../utils/metadataUtils";
import ConsolidationAdornment from "./ConsolidationAdornment";
import WarningIndicator from "./WarningIndicator";
import { SectionProps } from "types";

interface DateTimeSectionProps extends SectionProps {
  getDateTimeObject: () => Date | null;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  formState,
  handleFormChange,
  getDateTimeObject,
}) => {
  const dateData = getFieldData(formState.DateTimeOriginal, "");
  const offsetData = getFieldData(formState.OffsetTimeOriginal, "");

  return (
    <FormSection title="Date & Time">
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <DateTimePicker
            label="Date Time Original"
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
              handleFormChange("DateTimeOriginal", newDateStr);
            }}
            ampm={false}
            format="yyyy-MM-dd HH:mm:ss"
            sx={{ flexGrow: 1 }}
            slotProps={{
              textField: {
                size: "small",
                variant: "outlined",
                placeholder:
                  formState.DateTimeOriginal === "(Mixed Values)"
                    ? "(Mixed Values)"
                    : "",
              },
            }}
          />
          {!dateData.isConsolidated && <WarningIndicator />}
        </Stack>
        <TextField
          label="Offset Time Original"
          variant="outlined"
          fullWidth
          size="small"
          value={
            formState.OffsetTimeOriginal === "(Mixed Values)"
              ? ""
              : offsetData.value
          }
          placeholder={
            formState.OffsetTimeOriginal === "(Mixed Values)"
              ? "(Mixed Values)"
              : "+01:00"
          }
          onChange={(e) =>
            handleFormChange("OffsetTimeOriginal", e.target.value)
          }
          slotProps={{
            input: {
              endAdornment: (
                <ConsolidationAdornment show={!offsetData.isConsolidated} />
              ),
            },
          }}
        />
      </Stack>
    </FormSection>
  );
};

export default DateTimeSection;
