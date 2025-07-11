import { useState, useRef } from "react";
import { ApiError, RenamePreviewItem, RenameFileResult } from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { useImageSelectionContext } from "context/ImageSelectionContext";

interface UseRenameDialogProps {
  onRenameComplete: () => void;
}

export const useRenameDialog = ({ onRenameComplete }: UseRenameDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<RenamePreviewItem[]>([]);
  const filesToRenameRef = useRef<string[]>([]);
  const { showNotification } = useNotification();
  const { selectedImages } = useImageSelectionContext();

  const openRenameDialog = () => {
    if (selectedImages.length === 0) return;
    const filePaths = selectedImages.map((name) => `${name}`);
    filesToRenameRef.current = filePaths;
    setIsLoading(true);
    apiService
      .getRenamePreview(filePaths)
      .then((data) => {
        setPreviewData(data);
        setIsOpen(true);
      })
      .catch((err: ApiError) => {
        showNotification(
          `Error fetching rename preview: ${err.message}`,
          "error"
        );
      })
      .finally(() => setIsLoading(false));
  };

  const handleConfirm = () => {
    setIsLoading(true);
    apiService
      .renameFiles(filesToRenameRef.current)
      .then((results: RenameFileResult[]) => {
        const successCount = results.filter(
          (r) => r.status === "Renamed"
        ).length;
        if (successCount > 0) {
          showNotification(
            `${successCount} file(s) successfully renamed.`,
            "success"
          );
        }
        onRenameComplete();
      })
      .catch((err: ApiError) => {
        showNotification(
          `An error occurred during renaming: ${err.message}`,
          "error"
        );
      })
      .finally(() => {
        setIsOpen(false);
        setIsLoading(false);
      });
  };

  const handleClose = () => setIsOpen(false);

  return {
    openRenameDialog,
    isRenamePreviewLoading: isLoading,
    dialogProps: {
      isOpen,
      onConfirm: handleConfirm,
      onClose: handleClose,
      previewData,
    },
  };
};
