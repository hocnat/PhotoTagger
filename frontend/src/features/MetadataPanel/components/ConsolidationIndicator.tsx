import { Tooltip, IconButton } from "@mui/material";
import { AppIcons } from "config/AppIcons";

const ConsolidationIndicator: React.FC = () => {
  return (
    <Tooltip title="This value is not fully consolidated. Saving will fix this.">
      <IconButton size="small" edge="end" tabIndex={-1}>
        <AppIcons.CONSOLIDATION
          fontSize="small"
          sx={{ color: "action.active" }}
        />
      </IconButton>
    </Tooltip>
  );
};

export default ConsolidationIndicator;
