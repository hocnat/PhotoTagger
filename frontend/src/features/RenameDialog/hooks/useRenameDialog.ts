import { useState, useCallback } from "react";
import { useNotification } from "hooks/useNotification";
import * as apiService from "api/apiService";
import { RenamePreviewItem, RenameFileResult } from "types";

interface UseRenameDialogProps {
  onRenameSuccess?: (results: RenameFileResult[]) => void;
}

/**
 * A hook to manage the entire workflow for the file renaming dialog.
 * It is self-sufficient, consuming contexts to get the data it needs and to
 * trigger a data refresh upon completion. It encapsulates the dialog's
 * open/closed state, loading states, and the logic for fetching a preview
 * and confirming the final rename operation.
 */
export const useRenameDialog = ({
  onRenameSuccess,
}: UseRenameDialogProps = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filesToRename, setFilesToRename] = useState<string[]>([]);
  const [preview, setPreview] = useState<RenamePreviewItem[]>([]);
  const [isRenamePreviewLoading, setIsRenamePreviewLoading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const { showNotification } = useNotification();

  const openRenameDialog = useCallback(
    async (filePaths: string[]) => {
      if (filePaths.length === 0) return;
      setFilesToRename(filePaths);
      setIsOpen(true);
      setIsRenamePreviewLoading(true);
      try {
        const previewData = await apiService.getRenamePreview(filePaths);
        setPreview(previewData);
      } catch (error) {
        showNotification("Failed to generate rename preview.", "error");
      } finally {
        setIsRenamePreviewLoading(false);
      }
    },
    [showNotification]
  );

  const handleClose = () => {
    setIsOpen(false);
    setFilesToRename([]);
    setPreview([]);
  };

  const handleConfirm = async () => {
    setIsRenaming(true);
    try {
      const results = await apiService.renameFiles(filesToRename);
      const successCount = results.filter((r) => r.status === "Renamed").length;
      showNotification(
        `Successfully renamed ${successCount} file(s).`,
        "success"
      );

      if (onRenameSuccess) {
        onRenameSuccess(results);
      }
    } catch (error) {
      showNotification("An error occurred during renaming.", "error");
    } finally {
      setIsRenaming(false);
      handleClose();
    }
  };

  return {
    openRenameDialog,
    isRenamePreviewLoading,
    dialogProps: {
      isOpen,
      previewData: preview,
      isRenaming,
      onClose: handleClose,
      onConfirm: handleConfirm,
    },
  };
};
