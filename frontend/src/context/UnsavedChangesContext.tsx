import { createContext, useContext, ReactNode } from "react";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";

type UnsavedChangesContextType = ReturnType<typeof useUnsavedChanges>;

const UnsavedChangesContext = createContext<
  UnsavedChangesContextType | undefined
>(undefined);

/**
 * A custom hook to provide easy access to the UnsavedChangesContext.
 * It abstracts away the useContext call and includes a check to ensure
 * it's used within a provider, which is a best practice.
 */
export const useUnsavedChangesContext = (): UnsavedChangesContextType => {
  const context = useContext(UnsavedChangesContext);
  if (context === undefined) {
    throw new Error(
      "useUnsavedChangesContext must be used within an UnsavedChangesProvider"
    );
  }
  return context;
};

/**
 * The provider component that will wrap parts of the application
 * that need access to the unsaved changes state. It initializes the
 * `useUnsavedChanges` hook and provides its return value to the context.
 */
export const UnsavedChangesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const unsavedChanges = useUnsavedChanges();

  return (
    <UnsavedChangesContext.Provider value={unsavedChanges}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};
