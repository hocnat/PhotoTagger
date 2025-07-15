import { useState, useCallback } from "react";
import { TimeShiftData, TimeShiftPreviewItem } from "types";
import { useNotification } from "hooks/useNotification";
import * as apiService from "api/apiService";

interface UseTimeShiftProps {
  onSuccess: (updatedFilePaths: string[]) => void;
}

export const useTimeShift = ({ onSuccess }: UseTimeShiftProps) => {
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filesToShift, setFilesToShift] = useState<string[]>([]);
  const [shiftData, setShiftData] = useState<TimeShiftData | null>(null);
  const [previewData, setPreviewData] = useState<TimeShiftPreviewItem[]>([]);
  const { showNotification } = useNotification();

  const openTimeShiftDialog = useCallback((files: string[]) => {
    if (files.length > 0) {
      setFilesToShift(files);
      setIsInputOpen(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsInputOpen(false);
    setIsPreviewOpen(false);
    setFilesToShift([]);
    setShiftData(null);
    setPreviewData([]);
  }, []);

  const handlePreview = useCallback(
    async (data: TimeShiftData) => {
      setIsLoading(true);
      setShiftData(data);
      try {
        const preview = await apiService.getShiftTimePreview(
          filesToShift,
          data
        );
        setPreviewData(preview);
        setIsInputOpen(false);
        setIsPreviewOpen(true);
      } catch (error) {
        showNotification("Failed to generate time shift preview.", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [filesToShift, showNotification]
  );

  const handleBackToInput = useCallback(() => {
    setIsPreviewOpen(false);
    setIsInputOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!shiftData || filesToShift.length === 0) return;
    setIsSaving(true);
    try {
      await apiService.applyTimeShift(filesToShift, shiftData);
      showNotification("Time shift applied successfully.", "success");
      onSuccess(filesToShift);
      handleClose();
    } catch (error) {
      showNotification(
        "An error occurred while applying the time shift.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  }, [filesToShift, shiftData, onSuccess, handleClose, showNotification]);

  return {
    openTimeShiftDialog,
    inputDialogProps: {
      isOpen: isInputOpen,
      onClose: handleClose,
      onPreview: handlePreview,
      isLoading,
    },
    previewDialogProps: {
      isOpen: isPreviewOpen,
      onClose: handleClose,
      onConfirm: handleConfirm,
      onBack: handleBackToInput,
      previewData,
      isSaving,
    },
  };
};
