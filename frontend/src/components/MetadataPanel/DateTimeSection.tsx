import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import { getFieldData } from "../../utils/metadataUtils";
import { Box, Stack, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import ConsolidationAdornment from "./ConsolidationAdornment";
import WarningIndicator from "./WarningIndicator";

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
      <Box sx={{ display: "flex", gap: 2 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flex: "1 1 0", minWidth: 0 }}
        >
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
          sx={{ width: 110, flexShrink: 0 }}
          slotProps={{
            input: {
              endAdornment: (
                <ConsolidationAdornment show={!offsetData.isConsolidated} />
              ),
            },
          }}
        />
      </Box>
    </FormSection>
  );
};

export default DateTimeSection;
