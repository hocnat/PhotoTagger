import { InputAdornment } from "@mui/material";
import WarningIndicator from "./WarningIndicator";

interface ConsolidationAdornmentProps {
  /**
   * If true, the adornment will be rendered.
   * This is typically driven by a check like `!isConsolidated`.
   */
  show: boolean;
}

const ConsolidationAdornment: React.FC<ConsolidationAdornmentProps> = ({
  show,
}) => {
  if (!show) {
    return null;
  }

  return (
    <InputAdornment position="end">
      <WarningIndicator />
    </InputAdornment>
  );
};

export default ConsolidationAdornment;
