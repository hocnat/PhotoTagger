import { useState, useEffect, useMemo } from "react";
import { FormState, ImageFile } from "types";
import { set } from "lodash";
import { FORM_STATE_MAP } from "../utils/dataMapper";

/**
 * A hook responsible for taking a list of selected image files and transforming
 * their raw, flat metadata into the hierarchical, aggregated `FormState` used
 * by the editing UI. This hook is driven by the declarative `FORM_STATE_MAP`,
 * making it a central point for data shaping in the application.
 *
 * @param imageFiles The array of currently selected image files.
 * @returns An object containing the `formState` for the UI, a pristine
 * `originalFormState` for dirty checking, the `setFormState` updater,
 * and a boolean `hasChanges` flag.
 */
export const useAggregatedMetadata = (imageFiles: ImageFile[]) => {
  const [formState, setFormState] = useState<Partial<FormState>>({});
  // A snapshot of the form state when data was first loaded, used for dirty checking.
  const [originalFormState, setOriginalFormState] = useState<
    Partial<FormState>
  >({});

  // This is the core effect of the hook. It runs whenever the user's
  // selection of images changes, rebuilding the entire form state from scratch.
  useEffect(() => {
    // If there are no images selected, reset to an empty state.
    if (imageFiles.length === 0) {
      setFormState({});
      setOriginalFormState({});
      return;
    }

    // Build the new hierarchical state object by iterating over our declarative data mapper.
    // This makes the aggregation process data-driven and easy to maintain. Adding a new
    // field to the UI state is as simple as adding a new entry to FORM_STATE_MAP.
    const newAggregatedState = {};
    for (const mapping of Object.values(FORM_STATE_MAP)) {
      const aggregatedField = mapping.aggregator(imageFiles);
      // Use lodash.set to safely create the nested structure, e.g., state['Content']['Title']
      set(newAggregatedState, mapping.formPath, aggregatedField);
    }

    setFormState(newAggregatedState as FormState);
    setOriginalFormState(newAggregatedState as FormState);
  }, [imageFiles]);

  // A memoized calculation to efficiently determine if any changes have been made
  // by comparing the current state to the original. This prevents unnecessary re-renders.
  const hasChanges = useMemo(() => {
    return JSON.stringify(formState) !== JSON.stringify(originalFormState);
  }, [formState, originalFormState]);

  return { formState, setFormState, hasChanges, originalFormState };
};
