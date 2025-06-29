import { useState, useCallback, useEffect } from "react";

/**
 * A hook to manage the "warn on unsaved changes" workflow.
 * @param isDirty A boolean indicating if there are unsaved changes.
 */
export const useUnsavedChanges = (isDirty: boolean) => {
  const [isConfirmationOpen, setConfirmationOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(
    null
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  const promptAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        setActionToConfirm(() => action);
        setConfirmationOpen(true);
      } else {
        action();
      }
    },
    [isDirty]
  );

  const handleClose = () => {
    setConfirmationOpen(false);
    setActionToConfirm(null);
  };

  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm();
    }
    handleClose();
  };

  return {
    promptAction,
    isConfirmationOpen,
    handleConfirm,
    handleClose,
  };
};
