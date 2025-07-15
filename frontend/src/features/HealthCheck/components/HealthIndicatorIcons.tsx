import { Stack, Tooltip } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AbcIcon from "@mui/icons-material/Abc";
import { HealthReport } from "types";

interface HealthIndicatorIconsProps {
  checks: HealthReport["checks"];
}

export const HealthIndicatorIcons: React.FC<HealthIndicatorIconsProps> = ({
  checks,
}) => {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title={checks.consolidation.message} placement="top">
        <SyncIcon
          fontSize="small"
          color={checks.consolidation.status === "ok" ? "success" : "error"}
        />
      </Tooltip>
      <Tooltip title={checks.requiredFields.message} placement="top">
        <ChecklistIcon
          fontSize="small"
          color={checks.requiredFields.status === "ok" ? "success" : "error"}
        />
      </Tooltip>
      <Tooltip title={checks.filename.message} placement="top">
        <AbcIcon
          fontSize="small"
          color={checks.filename.status === "ok" ? "success" : "error"}
        />
      </Tooltip>
    </Stack>
  );
};
