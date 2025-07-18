import { createContext, useContext, ReactNode } from "react";

// Define the shape of the context data. This includes all the state and handlers
// that child components like the AppBar might need.
interface AppContextType {
  selectionCount: number;
  isLoading: boolean;
  isRenamePreviewLoading: boolean;
  isHealthChecking: boolean;
  onOpenFolder: () => void;
  onEdit: () => void;
  onTimeShift: () => void;
  onRename: () => void;
  onAnalyze: () => void;
  onKeywords: () => void;
  onLocations: () => void;
  onSettings: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * A custom hook to provide easy access to the AppContext.
 */
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

/**
 * The provider component for the main application context.
 */
export const AppProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: AppContextType;
}) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
