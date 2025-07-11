import { createContext, useContext } from "react";
import { useMetadataEditor } from "../hooks/useMetadataEditor";

type MetadataEditorContextType = ReturnType<typeof useMetadataEditor>;

const MetadataEditorContext = createContext<
  MetadataEditorContextType | undefined
>(undefined);

/**
 * A custom hook to easily access the MetadataEditorContext.
 * This abstracts the `useContext` call and adds a check to ensure
 * the context is being used within a provider.
 *
 * @returns The context value.
 */
export const useMetadata = (): MetadataEditorContextType => {
  const context = useContext(MetadataEditorContext);
  if (!context) {
    throw new Error("useMetadata must be used within a MetadataEditorProvider");
  }
  return context;
};

export const MetadataEditorProvider = MetadataEditorContext.Provider;
