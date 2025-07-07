import { Tooltip, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const WarningIndicator: React.FC = () => {
  return (
    <Tooltip title="This value is not fully consolidated. Saving will fix this.">
      <IconButton size="small" edge="end" tabIndex={-1}>
        <InfoOutlinedIcon color="warning" fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default WarningIndicator;
