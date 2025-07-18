import { createContext, useContext, ReactNode } from "react";
import { useLocationPresets } from "hooks/useLocationPresets";

type LocationPresetsContextType = ReturnType<typeof useLocationPresets>;

const LocationPresetsContext = createContext<
  LocationPresetsContextType | undefined
>(undefined);

/**
 * A custom hook to provide easy access to the LocationPresetsContext.
 */
export const useLocationPresetsContext = (): LocationPresetsContextType => {
  const context = useContext(LocationPresetsContext);
  if (context === undefined) {
    throw new Error(
      "useLocationPresetsContext must be used within a LocationPresetsProvider"
    );
  }
  return context;
};

/**
 * The provider component that will wrap the application. It initializes the
 * `useLocationPresets` hook once and provides its return value to the context,
 * creating a single source of truth for location preset data.
 */
export const LocationPresetsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const locationPresets = useLocationPresets();

  return (
    <LocationPresetsContext.Provider value={locationPresets}>
      {children}
    </LocationPresetsContext.Provider>
  );
};
