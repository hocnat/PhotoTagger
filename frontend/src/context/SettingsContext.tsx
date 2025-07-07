import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AppSettings } from "types";
import * as apiService from "api/apiService";

export interface SettingsContextType {
  settings: AppSettings | null;
  saveSettings: (newSettings: AppSettings) => Promise<void>;
  isLoading: boolean;
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

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedSettings = await apiService.getSettings();
      setSettings(fetchedSettings);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      const updatedSettings = await apiService.updateSettings(newSettings);
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Failed to save settings:", error);
      throw error;
    }
  };

  const value = { settings, saveSettings, isLoading };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
