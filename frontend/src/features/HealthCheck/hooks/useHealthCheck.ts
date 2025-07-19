import { useState, useCallback } from "react";
import { useSettingsContext } from "context/SettingsContext";
import { useNotification } from "hooks/useNotification";
import * as apiService from "api/apiService";
import { HealthReport } from "types";

interface RunCheckOptions {
  isManualTrigger?: boolean;
}

/**
 * A hook to manage the health check analysis. It is responsible for calling
 * the API, managing the loading state, and holding the resulting reports.
 */
export const useHealthCheck = () => {
  const { settings } = useSettingsContext();
  const { showNotification } = useNotification();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const runCheck = useCallback(
    async (filePaths: string[], options: RunCheckOptions = {}) => {
      if (!settings || filePaths.length === 0) {
        return;
      }

      const { isManualTrigger = false } = options;

      if (isManualTrigger) {
        setIsChecking(true);
      }

      try {
        const rules = {
          required_fields: settings.appBehavior.requiredFields,
          rename_pattern: settings.renameSettings.pattern,
        };
        const newReports = await apiService.runHealthCheck(filePaths, rules);

        setReports((prevReports) => {
          const reportMap = new Map(prevReports.map((r) => [r.filename, r]));
          newReports.forEach((r) => reportMap.set(r.filename, r));
          return Array.from(reportMap.values());
        });
      } catch (error) {
        console.error("Health check failed:", error);
        showNotification("Failed to run health check.", "error");
      } finally {
        if (isManualTrigger) {
          setIsChecking(false);
        }
      }
    },
    [settings, showNotification]
  );

  return {
    runCheck,
    reports,
    isChecking,
  };
};
