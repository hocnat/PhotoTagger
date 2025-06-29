import { useState, useEffect, useCallback } from "react";
import * as apiService from "../services/apiService";
import { LocationPreset, LocationPresetData, ApiError } from "../types";
import { useNotification } from "./useNotification";

export const useLocationPresets = () => {
  const [presets, setPresets] = useState<LocationPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  const fetchPresets = useCallback(() => {
    setIsLoading(true);
    apiService
      .getLocationPresets()
      .then(setPresets)
      .catch((err: ApiError) => {
        showNotification(
          `Failed to load location presets: ${err.message}`,
          "error"
        );
      })
      .finally(() => setIsLoading(false));
  }, [showNotification]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  const addPreset = async (name: string, data: LocationPresetData) => {
    try {
      const newPreset = await apiService.saveLocationPreset(name, data);
      setPresets((currentPresets) =>
        [...currentPresets, newPreset].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      showNotification(`Location preset "${name}" saved.`, "success");
    } catch (err) {
      const apiErr = err as ApiError;
      showNotification(`Failed to save preset: ${apiErr.message}`, "error");
      throw err;
    }
  };

  return { presets, isLoading, addPreset };
};
