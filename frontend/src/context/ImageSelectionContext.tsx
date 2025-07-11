import { createContext, useContext, ReactNode } from "react";
import { useImageSelection } from "features/ImageGrid/hooks/useImageSelection";
import { useImageLoader } from "features/ImageGrid/hooks/useImageLoader";

type ImageSelectionContextType = ReturnType<typeof useImageSelection>;

const ImageSelectionContext = createContext<
  ImageSelectionContextType | undefined
>(undefined);

/**
 * A custom hook to easily access the ImageSelectionContext.
 */
export const useImageSelectionContext = (): ImageSelectionContextType => {
  const context = useContext(ImageSelectionContext);
  if (context === undefined) {
    throw new Error(
      "useImageSelectionContext must be used within an ImageSelectionProvider"
    );
  }
  return context;
};

/**
 * The provider component that will wrap the application. It initializes the
 * `useImageSelection` hook and provides its return value to the context.
 */
export const ImageSelectionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  // We need image data to initialize the selection hook.
  // This is a good example of co-locating related hooks.
  const { imageData } = useImageLoader();
  const imageSelection = useImageSelection(imageData.files);

  return (
    <ImageSelectionContext.Provider value={imageSelection}>
      {children}
    </ImageSelectionContext.Provider>
  );
};
