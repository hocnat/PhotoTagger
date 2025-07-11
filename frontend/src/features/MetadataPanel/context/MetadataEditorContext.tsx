import { createContext, useContext } from "react";
import { useMetadataEditor } from "../hooks/useMetadataEditor";

// The type of the context value will be the return type of our hook.
// This ensures that the context and the hook are always in sync.
type MetadataEditorContextType = ReturnType<typeof useMetadataEditor>;

// Create the context with an initial undefined value.
// The provider will always supply a value, but this helps catch bugs
// where a component tries to consume the context outside of a provider.
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
