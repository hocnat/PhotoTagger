import { useState, useCallback, useEffect } from "react";

/**
 * A self-contained hook to manage the "warn on unsaved changes" workflow.
 * It owns the `isDirty` state and provides functions to safely wrap actions
 * that might cause data loss, prompting the user for confirmation if necessary.
 * This hook also handles the native browser "beforeunload" event.
 */
export const useUnsavedChanges = () => {
  // The core state that tracks if there are any unsaved changes.
  const [isDirty, setIsDirty] = useState(false);
  // Controls the visibility of the confirmation dialog.
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  // Stores the function that should be executed if the user confirms the action.
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
    null
  );

  // This effect adds a global event listener to the window to prevent the user
  // from accidentally closing the browser tab/window with unsaved changes.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If the form is dirty, we trigger the native browser confirmation dialog.
      if (isDirty) {
        // According to the modern HTML standard, calling preventDefault is
        // sufficient to trigger the browser's "unsaved changes" prompt.
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // The cleanup function removes the event listener when the component unmounts
    // to prevent memory leaks.
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]); // This effect re-subscribes only when the `isDirty` state changes.

  /**
   * A wrapper function for any action that should be protected by the unsaved
   * changes check (e.g., navigating away, closing a panel). If the form is not
   * dirty, it executes the action immediately. Otherwise, it opens a confirmation
   * dialog.
   */
  const promptAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        // Store the action and open the confirmation dialog.
        setActionToConfirm(() => action);
        setConfirmationOpen(true);
      } else {
        // If not dirty, perform the action without any prompt.
        action();
      }
    },
    [isDirty] // The function is memoized and only recreated if `isDirty` changes.
  );

  /**
   * Closes the confirmation dialog and clears the pending action without executing it.
   * Used for the "Cancel" button in the dialog.
   */
  const handleClose = () => {
    setConfirmationOpen(false);
    setActionToConfirm(null);
  };

  /**
   * Executes the pending action and then resets the state. Used for the "Confirm"
   * button in the dialog.
   */
  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm();
    }
    // After confirming to discard changes, the state is no longer considered dirty.
    setIsDirty(false);
    handleClose();
  };

  return {
    isDirty,
    setIsDirty,
    promptAction,
    isConfirmationOpen,
    handleConfirm,
    handleClose,
  };
};
