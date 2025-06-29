import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import { Box, TextField } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

interface DateTimeSectionProps extends SectionProps {
  getDateTimeObject: () => Date | null;
}

const DateTimeSection: React.FC<DateTimeSectionProps> = ({
  formState,
  handleFormChange,
  getDateTimeObject,
}) => {
  return (
    <FormSection title="When">
      <Box sx={{ display: "flex", gap: 2 }}>
        <DateTimePicker
          label="Date Taken"
          value={getDateTimeObject()}
          onChange={(date) =>
            handleFormChange(
              "EXIF:DateTimeOriginal",
              date
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
                : ""
            )
          }
          ampm={false}
          format="yyyy-MM-dd HH:mm:ss"
          views={["year", "month", "day", "hours", "minutes", "seconds"]}
          timeSteps={{ minutes: 1, seconds: 1 }}
          slotProps={{
            textField: { size: "small", variant: "outlined" },
          }}
        />
        <TextField
          label="Time Zone"
          variant="outlined"
          size="small"
          value={
            typeof formState["EXIF:OffsetTimeOriginal"] === "string" &&
            formState["EXIF:OffsetTimeOriginal"] !== "(Mixed Values)"
              ? formState["EXIF:OffsetTimeOriginal"]
              : ""
          }
          placeholder={
            formState["EXIF:OffsetTimeOriginal"] === "(Mixed Values)"
              ? "Mixed"
              : "+01:00"
          }
          onChange={(e) =>
            handleFormChange("EXIF:OffsetTimeOriginal", e.target.value)
          }
          sx={{ width: 120, flexShrink: 0 }}
        />
      </Box>
    </FormSection>
  );
};

export default DateTimeSection;
