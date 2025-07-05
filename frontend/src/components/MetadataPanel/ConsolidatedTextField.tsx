import React from "react";
import { TextField, Tooltip, Box, TextFieldProps } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ConsolidatedTextFieldProps extends Omit<TextFieldProps, "label"> {
  baseLabel: string;
  isConsolidated: boolean;
}

const ConsolidatedTextField: React.FC<ConsolidatedTextFieldProps> = ({
  baseLabel,
  isConsolidated,
  ...props
}) => {
  const labelWithIcon = (
    <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
      {baseLabel}
      {!isConsolidated && (
        <Tooltip title="This value is not fully consolidated. Saving will fix this.">
          <InfoOutlinedIcon
            color="warning"
            sx={{ ml: 0.5, fontSize: "1rem" }}
          />
        </Tooltip>
      )}
    </Box>
  );

  return <TextField label={labelWithIcon} {...props} />;
};

export default ConsolidatedTextField;
