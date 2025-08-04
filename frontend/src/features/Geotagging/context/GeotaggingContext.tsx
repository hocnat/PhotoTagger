import { createContext, useContext, ReactNode } from "react";
import { ImageGpsMatch, LocationPresetData } from "types";

// This interface defines the state and actions provided by the GeotaggingContext.
interface GeotaggingContextType {
  // Selection state
  selectedFilenames: Set<string>;
  handleSelectionChange: (event: React.MouseEvent, filename: string) => void;
  handleKeyDown: (event: React.KeyboardEvent) => void;
  isAnythingSelected: boolean;
  isSelectionProtected: boolean;

  // Data state
  allMatches: ImageGpsMatch[];
  unmatchableFilenames: Set<string>;
  protectedFilenames: Set<string>;

  // Form state and actions
  isFormBusy: boolean;
  formData: LocationPresetData;
  protectedImageFormData: LocationPresetData | null;
  handleFormFieldChange: (
    field: keyof LocationPresetData,
    value: string
  ) => void;
  handleApplyToSelection: () => void;
}

const GeotaggingContext = createContext<GeotaggingContextType | undefined>(
  undefined
);

/**
 * A custom hook to provide easy access to the GeotaggingContext.
 */
export const useGeotaggingContext = (): GeotaggingContextType => {
  const context = useContext(GeotaggingContext);
  if (context === undefined) {
    throw new Error(
      "useGeotaggingContext must be used within a GeotaggingProvider"
    );
  }
  return context;
};

/**
 * The provider component for the geotagging feature context.
 */
export const GeotaggingProvider = ({
  children,
  value,
}: {
  children: ReactNode;
  value: GeotaggingContextType;
}) => {
  return (
    <GeotaggingContext.Provider value={value}>
      {children}
    </GeotaggingContext.Provider>
  );
};
