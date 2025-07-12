import { useState, useEffect, useCallback } from "react";
import { LocationPreset, LocationPresetData, ApiError } from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";

/**
 * A hook to manage the state and interactions for location presets.
 * It encapsulates all logic for fetching, creating, and tracking usage of presets,
 * serving as the single source of truth for this data in the application.
 */
export const useLocationPresets = () => {
  const [presets, setPresets] = useState<LocationPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showNotification } = useNotification();

  /**
   * A memoized function to fetch the list of all location presets from the backend.
   * We use useCallback to ensure this function has a stable identity, allowing it
   * to be used safely in useEffect dependency arrays.
   */
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

  // This effect triggers the initial fetch of presets when the hook is first used.
  // It runs only once on mount because its dependency, `fetchPresets`, is stable.
  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  /**
   * Tracks the usage of a preset. This is a "fire-and-forget" operation, meaning
   * we don't wait for it to complete or show a loading/success state to the user.
   * Errors are logged to the console for debugging but not shown to the user,
   * as this is a non-critical background task.
   * @param presetId The ID of the preset that was used.
   */
  const trackUsage = (presetId: string) => {
    apiService.trackLocationPresetUsage(presetId).catch(console.error);
  };

  /**
   * Saves a new location preset to the backend.
   * On success, it re-fetches the entire list of presets to ensure the UI is in sync.
   * It throws the error on failure so that the calling component can also react
   * to the error state if needed (e.g., to keep a dialog open).
   * @param name The name for the new preset.
   * @param data The location data to be saved.
   */
  const addPreset = async (name: string, data: LocationPresetData) => {
    try {
      await apiService.saveLocationPreset(name, data);
      showNotification(`Location preset "${name}" saved.`, "success");
      // Re-fetch presets to include the newly added one in the list.
      fetchPresets();
    } catch (err) {
      const apiErr = err as ApiError;
      showNotification(`Failed to save preset: ${apiErr.message}`, "error");
      // Re-throw the error so UI components can handle the failed state.
      throw err;
    }
  };

  return { presets, isLoading, addPreset, trackUsage };
};
