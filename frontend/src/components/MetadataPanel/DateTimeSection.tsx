import React from "react";
import { SectionProps } from "../../types";
import FormSection from "./FormSection";
import ConsolidatedTextField from "./ConsolidatedTextField";
import { getFieldData } from "../../utils/metadataUtils";
import { Box, Tooltip } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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

  const dateTimeOriginalLabel = (
    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
      Create Date
      {!dateData.isConsolidated && (
        <Tooltip title="This value is not fully consolidated. Saving will fix this.">
          <InfoOutlinedIcon
            color="warning"
            sx={{ ml: 0.5, fontSize: "1rem" }}
          />
        </Tooltip>
      )}
    </Box>
  );

  return (
    <FormSection title="Date & Time">
      <Box sx={{ display: "flex", gap: 2 }}>
        <DateTimePicker
          label={dateTimeOriginalLabel}
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
        <ConsolidatedTextField
          baseLabel="Offset Time Original"
          isConsolidated={offsetData.isConsolidated}
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
          sx={{ width: "100%" }}
        />
      </Box>
    </FormSection>
  );
};

export default DateTimeSection;
