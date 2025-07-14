import { useState, useEffect, useCallback } from "react";
import { LocationPreset, LocationPresetData, ApiError } from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";

/**
 * A hook to manage the state and interactions for location presets.
 * It encapsulates all logic for fetching, creating, updating, and deleting presets,
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

  /**
   * Updates an existing location preset.
   * On success, it triggers a re-fetch to update the UI.
   * @param id The ID of the preset to update.
   * @param name The new name for the preset.
   * @param data The new data for the preset.
   */
  const updatePreset = async (
    id: string,
    name: string,
    data: LocationPresetData
  ) => {
    try {
      await apiService.updateLocationPreset(id, name, data);
      showNotification(`Location preset "${name}" updated.`, "success");
      fetchPresets();
    } catch (err) {
      const apiErr = err as ApiError;
      showNotification(`Failed to update preset: ${apiErr.message}`, "error");
      throw err;
    }
  };

  /**
   * Deletes a location preset from the backend.
   * On success, it optimistically updates the local state for a faster UI response,
   * but also re-fetches to ensure consistency.
   * @param id The ID of the preset to delete.
   */
  const deletePreset = async (id: string) => {
    try {
      await apiService.deleteLocationPreset(id);
      showNotification(`Location preset deleted.`, "success");
      // Optimistically update the UI for a faster perceived response.
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const apiErr = err as ApiError;
      showNotification(`Failed to delete preset: ${apiErr.message}`, "error");
      // If the delete fails, re-fetch to get the correct state from the server.
      fetchPresets();
      throw err;
    }
  };

  return {
    presets,
    isLoading,
    fetchPresets,
    addPreset,
    updatePreset,
    deletePreset,
    trackUsage,
  };
};
