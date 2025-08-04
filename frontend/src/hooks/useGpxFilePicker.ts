import { useEffect, useRef, useCallback } from "react";
import { useNotification } from "./useNotification";

interface UseGpxFilePickerProps {
  onFileRead: (content: string) => void;
}

/**
 * A hook to manage the logic for a hidden file input element,
 * specifically for picking and reading GPX files.
 * @param onFileRead - A callback function that receives the string content of the read file.
 * @returns An object containing a function to programmatically open the file picker.
 */
export const useGpxFilePicker = ({ onFileRead }: UseGpxFilePickerProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    // This effect creates and configures the hidden file input element.
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".gpx";
    input.style.display = "none";
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content) {
            onFileRead(content);
          } else {
            showNotification("Could not read the GPX file.", "error");
          }
        };
        reader.onerror = () => {
          showNotification(
            `Error reading file: ${reader.error?.message}`,
            "error"
          );
        };
        reader.readAsText(file);
      }
    };
    // Assign the created element to the ref for later access.
    (inputRef as React.MutableRefObject<HTMLInputElement>).current = input;
  }, [onFileRead, showNotification]);

  const openGpxPicker = useCallback(() => {
    // This function programmatically clicks the hidden input to open the file dialog.
    if (inputRef.current) {
      inputRef.current.click();
    }
  }, []);

  return { openGpxPicker };
};
