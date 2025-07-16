import { Stack, Tooltip } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SpellcheckIcon from "@mui/icons-material/Spellcheck"; // IMPORT the new icon
import { HealthReport } from "types";

/**
 * A component that displays icons ONLY for the health checks that have failed.
 * The icons use a muted color to act as subtle, non-distracting indicators.
 */
export const HealthIndicatorIcons: React.FC<{
  checks: HealthReport["checks"];
}> = ({ checks }) => {
  return (
    <Stack direction="row" spacing={0.5}>
      {checks.consolidation.status === "error" && (
        <Tooltip title={checks.consolidation.message} placement="top">
          <SyncIcon fontSize="small" sx={{ color: "action.active" }} />
        </Tooltip>
      )}

      {checks.requiredFields.status === "error" && (
        <Tooltip title={checks.requiredFields.message} placement="top">
          <ChecklistIcon fontSize="small" sx={{ color: "action.active" }} />
        </Tooltip>
      )}

      {checks.filename.status === "error" && (
        <Tooltip title={checks.filename.message} placement="top">
          <SpellcheckIcon fontSize="small" sx={{ color: "action.active" }} />
        </Tooltip>
      )}
    </Stack>
  );
};
