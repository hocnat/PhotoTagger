import { Stack, Tooltip } from "@mui/material";
import { HealthReport } from "types";
import { AppIcons } from "config/AppIcons";

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
          <AppIcons.CONSOLIDATION
            fontSize="small"
            sx={{ color: "action.active" }}
          />
        </Tooltip>
      )}

      {checks.requiredFields.status === "error" && (
        <Tooltip title={checks.requiredFields.message} placement="top">
          <AppIcons.REQUIRED_FIELDS
            fontSize="small"
            sx={{ color: "action.active" }}
          />
        </Tooltip>
      )}

      {checks.filename.status === "error" && (
        <Tooltip title={checks.filename.message} placement="top">
          <AppIcons.FILENAME fontSize="small" sx={{ color: "action.active" }} />
        </Tooltip>
      )}
    </Stack>
  );
};
