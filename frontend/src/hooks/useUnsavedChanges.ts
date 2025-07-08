import { useState, useCallback, useEffect } from "react";

export const useUnsavedChanges = () => {
  const [isDirty, setIsDirty] = useState(false);
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
