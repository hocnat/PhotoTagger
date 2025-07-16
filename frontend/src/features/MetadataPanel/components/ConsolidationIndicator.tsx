import { Tooltip, IconButton } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";

const ConsolidationIndicator: React.FC = () => {
  return (
    <Tooltip title="This value is not fully consolidated. Saving will fix this.">
      <IconButton size="small" edge="end" tabIndex={-1}>
        <SyncIcon fontSize="small" sx={{ color: "action.active" }} />
      </IconButton>
    </Tooltip>
  );
};

export default ConsolidationIndicator;
