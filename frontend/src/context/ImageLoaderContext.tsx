import { createContext, useContext, ReactNode } from "react";
import { useImageLoader } from "features/ImageGrid/hooks/useImageLoader";

type ImageLoaderContextType = ReturnType<typeof useImageLoader>;

const ImageLoaderContext = createContext<ImageLoaderContextType | undefined>(
  undefined
);

/**
 * A custom hook to provide easy access to the ImageLoaderContext.
 */
export const useImageLoaderContext = (): ImageLoaderContextType => {
  const context = useContext(ImageLoaderContext);
  if (context === undefined) {
    throw new Error(
      "useImageLoaderContext must be used within an ImageLoaderProvider"
    );
  }
  return context;
};

/**
 * The provider component that will wrap the application. It initializes the
 * `useImageLoader` hook once and provides its return value to the context.
 */
export const ImageLoaderProvider = ({ children }: { children: ReactNode }) => {
  const imageLoader = useImageLoader();

  return (
    <ImageLoaderContext.Provider value={imageLoader}>
      {children}
    </ImageLoaderContext.Provider>
  );
};
