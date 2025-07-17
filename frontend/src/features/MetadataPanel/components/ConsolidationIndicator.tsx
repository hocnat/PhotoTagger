import { Tooltip } from "@mui/material";
import { AppIcons } from "config/AppIcons";

const ConsolidationIndicator: React.FC = () => {
  return (
    <Tooltip title="This value is not fully consolidated. Saving will fix this.">
      <span>
        <AppIcons.CONSOLIDATION
          fontSize="small"
          sx={{ color: "action.active", cursor: "default" }}
        />
      </span>
    </Tooltip>
  );
};

export default ConsolidationIndicator;
