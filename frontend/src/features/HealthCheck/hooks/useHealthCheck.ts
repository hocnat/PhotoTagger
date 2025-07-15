import { useState } from "react";
import { HealthReport } from "types";
import * as apiService from "api/apiService";
import { useSettings } from "features/SettingsDialog/hooks/useSettings";
import { useNotification } from "hooks/useNotification";

interface RunCheckOptions {
  isManualTrigger?: boolean;
}

export const useHealthCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { settings } = useSettings();
  const { showNotification } = useNotification();

  const runCheck = async (
    filePaths: string[],
    options: RunCheckOptions = {}
  ) => {
    if (!settings || filePaths.length === 0) {
      return;
    }

    setIsChecking(true);

    // The fix: Open the drawer if the check was manually triggered by the user,
    // regardless of the number of files.
    if (options.isManualTrigger) {
      setIsDrawerOpen(true);
    }

    const rules = {
      required_fields: settings.appBehavior.requiredFields,
      rename_pattern: settings.renameSettings.pattern,
    };

    try {
      const data = await apiService.runHealthCheck(filePaths, rules);
      setReports((prevReports) => {
        const newReportsMap = new Map(prevReports.map((r) => [r.filename, r]));
        data.forEach((newReport) => {
          newReportsMap.set(newReport.filename, newReport);
        });
        return Array.from(newReportsMap.values());
      });
    } catch (error) {
      showNotification("Failed to run health check.", "error");
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  return {
    isChecking,
    reports,
    isDrawerOpen,
    runCheck,
    closeDrawer,
  };
};
