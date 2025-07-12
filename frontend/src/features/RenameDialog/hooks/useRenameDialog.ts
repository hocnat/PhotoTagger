import { useState, useRef } from "react";
import { ApiError, RenamePreviewItem, RenameFileResult } from "types";
import * as apiService from "api/apiService";
import { useNotification } from "hooks/useNotification";
import { useImageLoaderContext } from "context/ImageLoaderContext";

/**
 * A hook to manage the entire workflow for the file renaming dialog.
 * It is self-sufficient, consuming contexts to get the data it needs and to
 * trigger a data refresh upon completion. It encapsulates the dialog's
 * open/closed state, loading states, and the logic for fetching a preview
 * and confirming the final rename operation.
 */
export const useRenameDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<RenamePreviewItem[]>([]);
  // We use a ref to store the list of files to rename. This is because
  // this data is needed by the `handleConfirm` function, but we don't want
  // the component to re-render if the list changes. It's set once when the
  // dialog is opened.
  const filesToRenameRef = useRef<string[]>([]);
  const { showNotification } = useNotification();
  const { imageData, loadImages } = useImageLoaderContext();

  /**
   * Opens the rename dialog. This function first fetches a preview of the
   * proposed name changes from the backend before showing the dialog to the user.
   * @param filePaths - An array of full, absolute paths to the image files to be renamed.
   */
  const openRenameDialog = (filePaths: string[]) => {
    if (filePaths.length === 0) return;
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

  /**
   * Handles the confirmation of the rename operation. It sends the list of
   * files to the backend to be renamed and then triggers a refresh of the
   * image grid by calling `loadImages` from the context.
   */
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
        loadImages(imageData.folder);
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
    // The `dialogProps` object is a convenient way to bundle all the props
    // that the `RenameDialog` component will need, allowing for a clean spread
    // in the JSX: `<RenameDialog {...dialogProps} />`
    dialogProps: {
      isOpen,
      onConfirm: handleConfirm,
      onClose: handleClose,
      previewData,
    },
  };
};
