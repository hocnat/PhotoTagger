import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useContext,
} from "react";
import * as apiService from "../services/apiService";
import { AppSettings } from "../types";

interface SettingsContextType {
  settings: AppSettings | null;
  isLoading: boolean;
  saveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  updateLastOpenedFolder: (path: string) => Promise<void>;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(() => {
    apiService
      .getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (newSettings: Partial<AppSettings>) => {
      if (!settings) return;
      const updatedSettings = { ...settings, ...newSettings };
      const saved = await apiService.updateSettings(updatedSettings);
      setSettings(saved);
    },
    [settings]
  );

  const updateLastOpenedFolder = useCallback(async (path: string) => {
    await apiService.updateLastOpenedFolder(path);
    setSettings((prev) =>
      prev
        ? {
            ...prev,
            appBehavior: { ...prev.appBehavior, lastOpenedFolder: path },
          }
        : null
    );
  }, []);

  const value = { settings, isLoading, saveSettings, updateLastOpenedFolder };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
