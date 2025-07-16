import { InputAdornment } from "@mui/material";
import ConsolidationIndicator from "./ConsolidationIndicator";

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
      <ConsolidationIndicator />
    </InputAdornment>
  );
};

export default ConsolidationAdornment;
